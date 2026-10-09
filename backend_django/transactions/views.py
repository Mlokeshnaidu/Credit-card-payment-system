import uuid
import requests
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta, datetime

from .models import Transaction, FraudLog
from .serializers import (
    TransactionSerializer,
    TransactionCreateSerializer,
    FraudLogSerializer,
    FraudLogReviewSerializer
)
from cards.models import Card
from accounts.models import AdminLog
from notifications.services import (
    send_high_value_transaction_alert,
    send_low_credit_limit_alert,
    send_fraud_alert
)
from .fraud_service import evaluate_transaction_fraud, record_fraud_evaluation
from .statement_pdf import build_monthly_statement_pdf


def log_action(user, action, description='', ip=None, target_type='Transaction', target_id=None):
    actor_role = getattr(user, 'role', 'CUSTOMER') if user else 'ANONYMOUS'
    AdminLog.objects.create(
        user=user,
        actor_role=actor_role,
        action=action,
        description=description,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        ip_address=ip
    )


def get_ip(request):
    x_forward = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forward.split(',')[0].strip() if x_forward else request.META.get('REMOTE_ADDR')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_list(request):
    """
    Advanced Transaction Search & History with Server-Side Pagination and Sorting
    Supports: date range, amount range, status, fraud_status, category, masked card search
    """
    transactions = Transaction.objects.filter(user=request.user).select_related('card')

    # Status filter
    status_filter = request.query_params.get('status')
    if status_filter:
        transactions = transactions.filter(status=status_filter.upper())

    # Fraud status filter
    fraud_status_filter = request.query_params.get('fraud_status')
    if fraud_status_filter:
        transactions = transactions.filter(fraud_status=fraud_status_filter.upper())

    # Category filter
    category_filter = request.query_params.get('category')
    if category_filter:
        transactions = transactions.filter(category=category_filter.upper())

    # Date range filters
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    if date_from:
        transactions = transactions.filter(created_at__date__gte=date_from)
    if date_to:
        transactions = transactions.filter(created_at__date__lte=date_to)

    # Amount range filters
    amount_min = request.query_params.get('amount_min')
    amount_max = request.query_params.get('amount_max')
    if amount_min:
        transactions = transactions.filter(amount__gte=amount_min)
    if amount_max:
        transactions = transactions.filter(amount__lte=amount_max)

    # Masked card number search
    card_search = request.query_params.get('card_search') or request.query_params.get('masked_card')
    if card_search:
        clean_search = card_search.strip()
        transactions = transactions.filter(
            Q(card__masked_card_number__icontains=clean_search) |
            Q(card__last_four_digits__icontains=clean_search)
        )

    # General search query (merchant, description, transaction_id)
    search_query = request.query_params.get('search')
    if search_query:
        sq = search_query.strip()
        transactions = transactions.filter(
            Q(merchant_name__icontains=sq) |
            Q(description__icontains=sq) |
            Q(transaction_id__icontains=sq) |
            Q(card__masked_card_number__icontains=sq) |
            Q(card__last_four_digits__icontains=sq)
        )

    # Server-side sorting
    ordering = request.query_params.get('ordering') or request.query_params.get('sort_by') or '-created_at'
    allowed_orderings = [
        'created_at', '-created_at',
        'amount', '-amount',
        'status', '-status',
        'merchant_name', '-merchant_name',
        'category', '-category',
        'fraud_status', '-fraud_status'
    ]
    if ordering in allowed_orderings:
        transactions = transactions.order_by(ordering)
    else:
        transactions = transactions.order_by('-created_at')

    # Server-side pagination
    page_size = int(request.query_params.get('page_size', 10))
    page = int(request.query_params.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size
    total = transactions.count()
    paginated = transactions[start:end]

    serializer = TransactionSerializer(paginated, many=True)
    return Response({
        'results': serializer.data,
        'count': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size if page_size > 0 else 1,
        'ordering': ordering,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_detail(request, transaction_id):
    """Get single transaction detail"""
    transaction = get_object_or_404(Transaction, id=transaction_id, user=request.user)
    return Response(TransactionSerializer(transaction).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def make_payment(request):
    """
    Initiate a payment - integrates Fraud Detection Engine & Role validation
    """
    # RBAC check: Read-Only users cannot make payments
    if getattr(request.user, 'role', None) == 'READ_ONLY':
        return Response(
            {'error': 'Read-Only users are not permitted to initiate transactions.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = TransactionCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    card = get_object_or_404(Card, id=data['card_id'], user=request.user)

    # Security Check: Reject if card is blocked
    if card.is_blocked:
        return Response({
            'error': 'Card is blocked. Payment cannot be processed.',
            'is_blocked': True
        }, status=status.HTTP_400_BAD_REQUEST)

    ip_addr = get_ip(request)
    device_info = data.get('device_info') or request.META.get('HTTP_USER_AGENT', 'Browser')[:255]
    location = data.get('location') or 'Local / Online'
    category = data.get('category', 'OTHER')

    # Run Real-Time Rule-Based Fraud Detection Engine
    fraud_eval = evaluate_transaction_fraud(
        user=request.user,
        card=card,
        amount=data['amount'],
        ip_address=ip_addr,
        device_info=device_info,
        location=location
    )

    # If severe risk, block payment before hitting gateway
    is_blocked_by_fraud = fraud_eval['risk_score'] >= 85

    # Create transaction record
    transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    transaction = Transaction.objects.create(
        user=request.user,
        card=card,
        amount=data['amount'],
        currency=data.get('currency', 'INR'),
        category=category,
        description=data.get('description', ''),
        merchant_name=data.get('merchant_name', ''),
        status='FAILED' if is_blocked_by_fraud else 'PENDING',
        fraud_status=fraud_eval['fraud_status'],
        fraud_reason=fraud_eval['details'][:255] if fraud_eval['is_fraud'] else '',
        ip_address=ip_addr,
        device_info=device_info,
        location=location,
        transaction_id=transaction_id,
        failure_reason='Declined: High-risk fraud pattern detected' if is_blocked_by_fraud else ''
    )

    # Persist Fraud Log if flagged or suspicious
    fraud_log = None
    if fraud_eval['is_fraud']:
        fraud_log = record_fraud_evaluation(transaction, fraud_eval)
        # Trigger automated Fraud Alert Email
        send_fraud_alert(
            user=request.user,
            transaction=transaction,
            rule_triggered=fraud_eval['rule_triggered'],
            risk_score=fraud_eval['risk_score'],
            details=fraud_eval['details']
        )

    # If not blocked by fraud, proceed to payment processor
    if not is_blocked_by_fraud:
        try:
            fastapi_url = f"{settings.FASTAPI_BASE_URL}/api/payments/process"
            payload = {
                'transaction_id': transaction_id,
                'amount': float(data['amount']),
                'currency': data.get('currency', 'INR'),
                'card_last_four': card.last_four_digits,
                'card_type': card.card_type,
                'user_id': request.user.id,
            }
            resp = requests.post(fastapi_url, json=payload, timeout=10)
            if resp.status_code == 200:
                result = resp.json()
                transaction.status = result.get('status', 'FAILED')
                transaction.failure_reason = result.get('failure_reason') or ''
            else:
                transaction.status = 'FAILED'
                transaction.failure_reason = 'Payment service error'
        except requests.exceptions.ConnectionError:
            import random
            transaction.status = 'SUCCESS' if random.random() > 0.3 else 'FAILED'
            transaction.failure_reason = 'Simulated payment failure' if transaction.status == 'FAILED' else ''
        except Exception as e:
            transaction.status = 'FAILED'
            transaction.failure_reason = str(e)

        transaction.save()

    # Log payment action
    log_action(
        request.user, 'PAYMENT',
        f'Payment {transaction.transaction_id}: {transaction.amount} {transaction.currency} - {transaction.status} [Fraud: {transaction.fraud_status}]',
        ip_addr,
        target_type='Transaction',
        target_id=transaction.transaction_id
    )

    # Notifications
    if float(transaction.amount) > 5000 and not fraud_eval['is_fraud']:
        send_high_value_transaction_alert(request.user, transaction)

    if transaction.status == 'SUCCESS' and card.card_type == 'CREDIT':
        if card.is_limit_below_threshold(10.0):
            send_low_credit_limit_alert(request.user, card)

    return Response({
        'message': f'Payment {transaction.status.lower()}',
        'transaction': TransactionSerializer(transaction).data,
        'fraud_alert': fraud_eval['is_fraud'],
        'fraud_status': transaction.fraud_status
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_transaction_status(request, transaction_id):
    """Update transaction status (called by FastAPI callback)"""
    try:
        transaction = Transaction.objects.get(transaction_id=transaction_id)
        new_status = request.data.get('status', '').upper()
        if new_status not in ['SUCCESS', 'FAILED']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        transaction.status = new_status
        transaction.failure_reason = request.data.get('failure_reason', '')
        transaction.save()

        if new_status == 'SUCCESS':
            if float(transaction.amount) > 5000:
                send_high_value_transaction_alert(transaction.user, transaction)
            if transaction.card and transaction.card.card_type == 'CREDIT':
                if transaction.card.is_limit_below_threshold(10.0):
                    send_low_credit_limit_alert(transaction.user, transaction.card)

        return Response({'message': 'Transaction status updated', 'status': new_status})
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)


# =========================================================================
# CARD USAGE ANALYTICS APIS
# =========================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_summary(request):
    """
    Card Usage Analytics: High-level KPI summary
    - Total spending
    - Current month spending
    - Total credit limit & available credit
    - Overall credit utilization percentage
    """
    user_txns = Transaction.objects.filter(user=request.user)
    user_cards = Card.objects.filter(user=request.user)

    total_spent = user_txns.filter(status='SUCCESS').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_month_spent = user_txns.filter(
        status='SUCCESS',
        created_at__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    total_credit_limit = user_cards.filter(card_type='CREDIT').aggregate(total=Sum('credit_limit'))['total'] or Decimal('0.00')
    available_credit = max(Decimal('0.00'), total_credit_limit - current_month_spent)

    utilization_pct = 0.0
    if total_credit_limit > 0:
        utilization_pct = round(float((current_month_spent / total_credit_limit) * 100), 2)

    return Response({
        'total_spent': float(total_spent),
        'current_month_spent': float(current_month_spent),
        'total_credit_limit': float(total_credit_limit),
        'available_credit': float(available_credit),
        'credit_utilization_percentage': min(utilization_pct, 100.0),
        'total_transactions': user_txns.count(),
        'successful_transactions': user_txns.filter(status='SUCCESS').count(),
        'active_cards_count': user_cards.filter(is_blocked=False).count(),
        'blocked_cards_count': user_cards.filter(is_blocked=True).count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_monthly(request):
    """
    Card Usage Analytics: Monthly spending summary for Line / Bar charts
    Returns array of last 6 or 12 months with total amount and count
    """
    months_count = int(request.query_params.get('months', 6))
    now = timezone.now()
    monthly_data = []

    for i in range(months_count - 1, -1, -1):
        target_month_date = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        next_month_date = (target_month_date + timedelta(days=32)).replace(day=1)

        txns = Transaction.objects.filter(
            user=request.user,
            status='SUCCESS',
            created_at__gte=target_month_date,
            created_at__lt=next_month_date
        )
        total = txns.aggregate(total=Sum('amount'))['total'] or 0.0
        count = txns.count()

        monthly_data.append({
            'month': target_month_date.strftime('%b %Y'),
            'month_short': target_month_date.strftime('%b'),
            'total_amount': float(total),
            'transaction_count': count,
            'year': target_month_date.year,
            'month_num': target_month_date.month
        })

    return Response({'monthly_summary': monthly_data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_categories(request):
    """
    Card Usage Analytics: Category-wise expense data for Pie / Donut charts
    """
    success_txns = Transaction.objects.filter(user=request.user, status='SUCCESS')
    total_spent = float(success_txns.aggregate(total=Sum('amount'))['total'] or 0.0)

    category_labels = dict(Transaction.CATEGORY_CHOICES)
    grouped = success_txns.values('category').annotate(
        amount=Sum('amount'),
        count=Count('id')
    ).order_by('-amount')

    category_data = []
    for g in grouped:
        cat_key = g['category'] or 'OTHER'
        amount = float(g['amount'] or 0.0)
        pct = round((amount / total_spent * 100), 2) if total_spent > 0 else 0.0
        category_data.append({
            'category': cat_key,
            'label': category_labels.get(cat_key, cat_key.title()),
            'amount': amount,
            'count': g['count'],
            'percentage': pct,
        })

    # If no transactions yet, provide empty category distribution
    if not category_data:
        category_data = [{
            'category': 'OTHER',
            'label': 'General / Other',
            'amount': 0.0,
            'count': 0,
            'percentage': 0.0
        }]

    return Response({
        'categories': category_data,
        'total_spent': total_spent
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_utilization(request):
    """
    Card Usage Analytics: Credit utilization breakdown per card
    """
    cards = Card.objects.filter(user=request.user, card_type='CREDIT')
    card_utilization = []
    total_limit = 0.0
    total_spent = 0.0

    for card in cards:
        limit = float(card.credit_limit)
        spent = card.get_total_spent()
        available = card.get_available_limit()
        util_pct = round((spent / limit * 100.0), 2) if limit > 0 else 0.0

        total_limit += limit
        total_spent += spent

        card_utilization.append({
            'card_id': card.id,
            'card_holder_name': card.card_holder_name,
            'masked_card_number': card.masked_card_number,
            'last_four_digits': card.last_four_digits,
            'bank_name': card.bank_name,
            'credit_limit': limit,
            'total_spent': spent,
            'available_limit': available,
            'utilization_percentage': min(util_pct, 100.0),
            'is_blocked': card.is_blocked
        })

    overall_pct = round((total_spent / total_limit * 100.0), 2) if total_limit > 0 else 0.0

    return Response({
        'overall_utilization_percentage': min(overall_pct, 100.0),
        'total_credit_limit': total_limit,
        'total_spent': total_spent,
        'cards': card_utilization
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statement_pdf(request):
    """Download monthly statement PDF"""
    now = datetime.now()
    try:
        year = int(request.query_params.get('year', now.year))
    except (ValueError, TypeError):
        year = now.year

    try:
        month = int(request.query_params.get('month', now.month))
    except (ValueError, TypeError):
        month = now.month

    card_id = request.query_params.get('card_id')
    if card_id:
        try:
            card_id = int(card_id)
        except (ValueError, TypeError):
            card_id = None

    buf = build_monthly_statement_pdf(request.user, year, month, card_id=card_id)
    response = HttpResponse(buf.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="statement_{year}_{month:02d}.pdf"'
    return response
