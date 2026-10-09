"""
Fraud Detection Engine - Rule-Based Suspicious Activity Evaluation Service
Rules:
1. Multiple high-value transactions in short time window
2. Rapid transactions from different locations / devices (Velocity / Geolocation anomaly)
3. Abnormal single transaction value relative to card limits
"""

from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Transaction, FraudLog
from accounts.models import AdminLog


HIGH_VALUE_THRESHOLD = Decimal('10000.00')
SHORT_TIME_WINDOW_MINUTES = 10
RAPID_LOCATION_WINDOW_MINUTES = 15


def evaluate_transaction_fraud(user, card, amount, ip_address=None, device_info='', location=''):
    """
    Evaluates an incoming payment attempt against real-time fraud rules.
    Returns:
        {
            'is_fraud': bool,
            'fraud_status': 'CLEAN' | 'SUSPICIOUS' | 'FLAGGED' | 'BLOCKED',
            'rule_triggered': str,
            'risk_score': int (0-100),
            'reasons': list[str],
            'details': str
        }
    """
    now = timezone.now()
    amount_dec = Decimal(str(amount))
    rules_triggered = []
    risk_score = 0
    details = []

    # -------------------------------------------------------------
    # RULE 1: Multiple High-Value Transactions in Short Time
    # -------------------------------------------------------------
    time_threshold = now - timedelta(minutes=SHORT_TIME_WINDOW_MINUTES)
    recent_high_value = Transaction.objects.filter(
        user=user,
        amount__gte=HIGH_VALUE_THRESHOLD,
        created_at__gte=time_threshold
    )
    recent_count = recent_high_value.count()

    if amount_dec >= HIGH_VALUE_THRESHOLD and recent_count >= 1:
        # 2nd or more high-value transaction within 10 minutes
        risk_score += 45
        rule_name = 'MULTIPLE_HIGH_VALUE_TXNS_SHORT_TIME'
        rules_triggered.append(rule_name)
        details.append(
            f"User initiated {recent_count + 1} high-value transactions (>= ₹{HIGH_VALUE_THRESHOLD:,.2f}) within {SHORT_TIME_WINDOW_MINUTES} minutes."
        )

    # -------------------------------------------------------------
    # RULE 2: Rapid Transactions from Different Locations / Devices
    # -------------------------------------------------------------
    loc_threshold = now - timedelta(minutes=RAPID_LOCATION_WINDOW_MINUTES)
    recent_txns = Transaction.objects.filter(
        user=user,
        created_at__gte=loc_threshold
    ).order_by('-created_at')

    if recent_txns.exists():
        last_txn = recent_txns.first()
        # Check location divergence
        if location and last_txn.location and location.strip().lower() != last_txn.location.strip().lower():
            risk_score += 40
            rule_name = 'RAPID_DIFFERENT_LOCATION_VELOCITY'
            rules_triggered.append(rule_name)
            details.append(
                f"Rapid transactions across different locations: current='{location}' vs previous='{last_txn.location}' within {RAPID_LOCATION_WINDOW_MINUTES} minutes."
            )

        # Check device / IP divergence within short window
        if ip_address and last_txn.ip_address and ip_address != last_txn.ip_address:
            risk_score += 25
            rule_name = 'RAPID_DIFFERENT_IP_OR_DEVICE'
            if rule_name not in rules_triggered:
                rules_triggered.append(rule_name)
            details.append(
                f"Rapid switch in IP address: current='{ip_address}' vs previous='{last_txn.ip_address}' within {RAPID_LOCATION_WINDOW_MINUTES} minutes."
            )

    # -------------------------------------------------------------
    # RULE 3: Excessive Value / Critical Limit Anomaly
    # -------------------------------------------------------------
    if amount_dec >= Decimal('50000.00'):
        risk_score += 20
        details.append(f"Single transaction amount ₹{amount_dec:,.2f} exceeds standard safety threshold ₹50,000.")

    if card and card.credit_limit:
        limit_dec = Decimal(str(card.credit_limit))
        if limit_dec > 0 and (amount_dec / limit_dec) >= Decimal('0.85'):
            risk_score += 25
            rule_name = 'EXCESSIVE_CREDIT_UTILIZATION_BURST'
            if rule_name not in rules_triggered:
                rules_triggered.append(rule_name)
            details.append(f"Transaction utilizes over 85% of total card limit (₹{limit_dec:,.2f}) in a single charge.")

    # -------------------------------------------------------------
    # Classify Fraud Status & Risk
    # -------------------------------------------------------------
    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        fraud_status = 'FLAGGED'
        is_fraud = True
    elif risk_score >= 35:
        fraud_status = 'SUSPICIOUS'
        is_fraud = True
    else:
        fraud_status = 'CLEAN'
        is_fraud = False

    primary_rule = rules_triggered[0] if rules_triggered else ('HIGH_RISK_ANOMALY' if is_fraud else 'NONE')

    return {
        'is_fraud': is_fraud,
        'fraud_status': fraud_status,
        'rule_triggered': primary_rule,
        'all_rules': rules_triggered,
        'risk_score': risk_score,
        'reasons': rules_triggered,
        'details': " | ".join(details) if details else "Normal transaction behavior"
    }


def record_fraud_evaluation(transaction, evaluation_result):
    """
    Saves fraud evaluation results to Transaction and creates a FraudLog if suspicious or flagged.
    """
    transaction.fraud_status = evaluation_result['fraud_status']
    transaction.fraud_reason = evaluation_result['details'][:255] if evaluation_result['is_fraud'] else ''
    transaction.save(update_fields=['fraud_status', 'fraud_reason'])

    if evaluation_result['is_fraud']:
        fraud_log = FraudLog.objects.create(
            transaction=transaction,
            user=transaction.user,
            card=transaction.card,
            rule_triggered=evaluation_result['rule_triggered'],
            risk_score=evaluation_result['risk_score'],
            details=evaluation_result['details'],
            ip_address=transaction.ip_address,
            device_info=transaction.device_info or '',
            location=transaction.location or '',
            review_status='PENDING_REVIEW'
        )

        AdminLog.objects.create(
            user=transaction.user,
            actor_role=getattr(transaction.user, 'role', 'CUSTOMER'),
            action='FRAUD_FLAG',
            target_type='Transaction',
            target_id=transaction.transaction_id,
            description=f"Fraud alert triggered [{evaluation_result['rule_triggered']}] Risk={evaluation_result['risk_score']} for {transaction.transaction_id}",
            ip_address=transaction.ip_address
        )
        return fraud_log
    return None
