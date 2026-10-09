"""
Automated Email Notification System
Sends automated alerts for:
1. Transaction amount exceeding ₹5000
2. Card blocked event
3. Available credit limit falling below 10%
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from accounts.models import AdminLog

logger = logging.getLogger(__name__)


def _send_and_log(recipient_user, subject, message, action_tag, description):
    """Internal helper to dispatch email and persist an audit record."""
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'alerts@ccpay.com')
    recipient_list = [recipient_user.email]

    try:
        sent = send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        logger.info(f"Email sent to {recipient_user.email}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_user.email}: {e}")
        sent = 0

    # Persist log event
    try:
        AdminLog.objects.create(
            user=recipient_user,
            action=action_tag,
            description=f"{description} (Sent: {bool(sent)})",
            ip_address='127.0.0.1'
        )
    except Exception as e:
        logger.error(f"Failed to record AdminLog for email event: {e}")

    return bool(sent)


def send_high_value_transaction_alert(user, transaction):
    """
    Sprint Item: Automated email alert when transaction amount exceeds ₹5000
    """
    amount = float(transaction.amount)
    if amount <= 5000:
        return False

    masked = transaction.card.masked_card_number if transaction.card else 'N/A'
    subject = f"[CCPay Alert] High-Value Transaction: ₹{amount:,.2f} on Card {masked}"
    
    body = f"""Dear {user.full_name or user.username},

This is an automated alert to notify you of a high-value transaction exceeding ₹5,000.00 processed on your account.

Transaction Details:
---------------------------------------------
Transaction ID: {transaction.transaction_id}
Amount:         ₹{amount:,.2f} {transaction.currency}
Card:           {masked}
Merchant:       {transaction.merchant_name or 'Online Transaction'}
Description:    {transaction.description or 'Card Payment'}
Status:         {transaction.status}
Date/Time:      {transaction.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if transaction.created_at else 'Just now'}

SECURITY NOTICE:
If you did not make or authorize this transaction, please immediately block your card from your CCPay Dashboard or contact CCPay Fraud Protection at fraud-desk@ccpay.com.

Thank you for banking with CCPay.
CCPay Security & Fraud Prevention Team
"""
    return _send_and_log(
        recipient_user=user,
        subject=subject,
        message=body,
        action_tag='EMAIL_HIGH_TXN',
        description=f"High-value alert for {transaction.transaction_id} (₹{amount:,.2f})"
    )


def send_card_blocked_alert(user, card, reason="Security / Administrative Action"):
    """
    Sprint Item: Automated email alert when a card is blocked
    """
    subject = f"[CCPay Security Alert] Your Card Ending in {card.last_four_digits} Has Been BLOCKED"
    
    body = f"""Dear {user.full_name or user.username},

Your payment card has been BLOCKED.

Card Details:
---------------------------------------------
Cardholder:     {card.card_holder_name}
Card Number:    {card.masked_card_number}
Card Type:      {card.card_type}
Bank:           {card.bank_name or 'CCPay Partner Bank'}
Status:         BLOCKED
Reason:         {reason}

IMPORTANT:
Any pending or subsequent transaction attempts with this card will be immediately declined for security purposes.
If this block was requested by you, no further action is required. If you did not request this, please contact CCPay Support immediately.

Thank you for banking with CCPay.
CCPay Card Management Team
"""
    return _send_and_log(
        recipient_user=user,
        subject=subject,
        message=body,
        action_tag='EMAIL_CARD_BLOCKED',
        description=f"Card blocked alert sent for {card.masked_card_number} ({reason})"
    )


def send_low_credit_limit_alert(user, card, available_limit=None, credit_limit=None):
    """
    Sprint Item: Automated email alert when available credit limit falls below 10%
    """
    c_limit = float(credit_limit if credit_limit is not None else card.credit_limit)
    if c_limit <= 0:
        return False

    a_limit = float(available_limit if available_limit is not None else card.get_available_limit())
    pct = (a_limit / c_limit) * 100.0

    if pct >= 10.0:
        return False

    subject = f"[CCPay Alert] Available Credit Limit Below 10% for Card ending in {card.last_four_digits}"

    body = f"""Dear {user.full_name or user.username},

Your available credit limit on card {card.masked_card_number} has dropped below 10%.

Credit Utilization Details:
---------------------------------------------
Total Credit Limit:      ₹{c_limit:,.2f}
Available Credit Limit:  ₹{a_limit:,.2f}
Remaining Availability:  {pct:.1f}%

To avoid transaction declines or over-limit charges, please settle your outstanding dues via the CCPay app.

Thank you for choosing CCPay.
CCPay Credit Operations Team
"""
    return _send_and_log(
        recipient_user=user,
        subject=subject,
        message=body,
        action_tag='EMAIL_LOW_LIMIT',
        description=f"Low credit limit alert for {card.masked_card_number} (₹{a_limit:,.2f} / ₹{c_limit:,.2f} - {pct:.1f}%)"
    )


def send_fraud_alert(user, transaction, rule_triggered="SUSPICIOUS_ACTIVITY", risk_score=50, details=""):
    """
    Automated email alert triggered when fraud detection rules flag a transaction.
    """
    amount = float(transaction.amount)
    masked = transaction.card.masked_card_number if transaction.card else 'N/A'
    subject = f"[CCPay URGENT] Suspicious Activity Flagged on Card {masked} (Risk Score: {risk_score})"

    body = f"""URGENT SECURITY ALERT: SUSPICIOUS ACTIVITY DETECTED

Dear {user.full_name or user.username},

Our automated Fraud Detection System has flagged a recent transaction on your account as SUSPICIOUS.

Alert Details:
---------------------------------------------
Rule Triggered:    {rule_triggered}
Risk Score:        {risk_score} / 100
Transaction ID:    {transaction.transaction_id}
Amount:            ₹{amount:,.2f} {transaction.currency}
Card:              {masked}
Merchant:          {transaction.merchant_name or 'N/A'}
IP Address:        {transaction.ip_address or 'Unknown'}
Location:          {transaction.location or 'Unknown'}
Detection Reason:  {details or transaction.fraud_reason or 'Anomaly detected by automated rules'}
Fraud Status:      {transaction.fraud_status}

ACTION REQUIRED:
If this transaction was authorized by you, you can verify it in your CCPay portal.
If you did NOT recognize this transaction, please immediately BLOCK YOUR CARD in the CCPay dashboard or contact fraud-desk@ccpay.com.

CCPay Automated Fraud & Risk Prevention Team
"""
    return _send_and_log(
        recipient_user=user,
        subject=subject,
        message=body,
        action_tag='FRAUD_FLAG',
        description=f"Fraud alert sent for {transaction.transaction_id} [Rule: {rule_triggered}, Risk: {risk_score}]"
    )

