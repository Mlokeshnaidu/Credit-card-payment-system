import csv
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta, date
from accounts.models import User, AdminLog
from cards.models import Card
from transactions.models import Transaction
from accounts.serializers import UserSerializer
from cards.serializers import CardSerializer
from transactions.serializers import TransactionSerializer
from notifications.services import send_card_blocked_alert



def is_admin_user(user):
    return user.is_admin or user.is_staff or user.is_superuser


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """Admin Dashboard Summary - Module 5"""
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    today = timezone.now().date()
    week_ago = today - timedelta(days=7)

    total_users = User.objects.filter(is_active=True).count()
    total_cards = Card.objects.count()
    total_transactions = Transaction.objects.count()
    today_transactions = Transaction.objects.filter(created_at__date=today)
    today_success = today_transactions.filter(status='SUCCESS')
    today_failed = today_transactions.filter(status='FAILED')
    today_total_amount = today_success.aggregate(total=Sum('amount'))['total'] or 0

    weekly_summary = []
    for i in range(7):
        d = today - timedelta(days=i)
        day_txn = Transaction.objects.filter(created_at__date=d, status='SUCCESS')
        weekly_summary.append({
            'date': str(d),
            'transactions': day_txn.count(),
            'total_amount': float(day_txn.aggregate(total=Sum('amount'))['total'] or 0),
        })

    return Response({
        'summary': {
            'total_users': total_users,
            'total_cards': total_cards,
            'total_transactions': total_transactions,
            'today': {
                'date': str(today),
                'total_transactions': today_transactions.count(),
                'successful': today_success.count(),
                'failed': today_failed.count(),
                'total_amount': float(today_total_amount),
            }
        },
        'weekly_summary': weekly_summary,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    """Manage Users - Module 5"""
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.all().order_by('-date_joined')
    search = request.query_params.get('search', '')
    if search:
        users = users.filter(Q(email__icontains=search) | Q(username__icontains=search) | Q(full_name__icontains=search))

    page_size = int(request.query_params.get('page_size', 10))
    page = int(request.query_params.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size
    total = users.count()

    serializer = UserSerializer(users[start:end], many=True)
    return Response({'users': serializer.data, 'count': total})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_toggle_user(request, user_id):
    """Toggle user active status"""
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        action = 'activated' if user.is_active else 'deactivated'
        return Response({'message': f'User {user.email} {action}', 'is_active': user.is_active})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_cards(request):
    """View all cards - Module 5 & Sprint Item 4"""
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    cards = Card.objects.all().select_related('user').order_by('-created_at')
    user_id = request.query_params.get('user_id')
    if user_id:
        cards = cards.filter(user_id=user_id)

    status_filter = request.query_params.get('status')
    if status_filter:
        if status_filter.lower() == 'blocked':
            cards = cards.filter(is_blocked=True)
        elif status_filter.lower() == 'active':
            cards = cards.filter(is_blocked=False)

    search = request.query_params.get('search', '').strip()
    if search:
        cards = cards.filter(
            Q(card_holder_name__icontains=search) |
            Q(last_four_digits__icontains=search) |
            Q(masked_card_number__icontains=search) |
            Q(bank_name__icontains=search) |
            Q(user__email__icontains=search) |
            Q(user__username__icontains=search)
        )

    page_size = int(request.query_params.get('page_size', 10))
    page = int(request.query_params.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size
    total = cards.count()

    serializer = CardSerializer(cards[start:end], many=True)
    return Response({'cards': serializer.data, 'count': total, 'page': page, 'page_size': page_size})


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def admin_toggle_card_block(request, card_id):
    """
    Sprint Item 4: Block / Unblock cards with proper admin access controls
    Triggers automated email alert on block!
    """
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    try:
        card = Card.objects.select_related('user').get(id=card_id)
    except Card.DoesNotExist:
        return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)

    # Allow explicit target state or toggle
    if 'is_blocked' in request.data:
        card.is_blocked = bool(request.data['is_blocked'])
    else:
        card.is_blocked = not card.is_blocked
    card.save()

    action_label = "blocked" if card.is_blocked else "unblocked"
    reason = request.data.get('reason', 'Administrative action by security officer')

    AdminLog.objects.create(
        user=request.user,
        action='CARD_BLOCK' if card.is_blocked else 'CARD_UNBLOCK',
        description=f"Card {card.masked_card_number} (Owner: {card.user.email}) {action_label}. Reason: {reason}",
        ip_address=request.META.get('REMOTE_ADDR')
    )

    # Sprint Item 1: Trigger email notification if blocked
    if card.is_blocked:
        send_card_blocked_alert(card.user, card, reason=reason)

    return Response({
        'message': f"Card ending in {card.last_four_digits} has been {action_label}.",
        'is_blocked': card.is_blocked,
        'card': CardSerializer(card).data
    })


@api_view(['PATCH', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
def admin_update_card_credit_limit(request, card_id):
    """
    Sprint Item 4: Update credit limits with proper admin access controls and validation
    """
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    try:
        card = Card.objects.select_related('user').get(id=card_id)
    except Card.DoesNotExist:
        return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)

    new_limit = request.data.get('credit_limit')
    if new_limit is None:
        return Response({'error': 'credit_limit field is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        limit_val = float(new_limit)
        if limit_val <= 0:
            return Response({'error': 'Credit limit must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
        if limit_val > 10000000:
            return Response({'error': 'Credit limit cannot exceed ₹10,000,000'}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid numeric credit limit format'}, status=status.HTTP_400_BAD_REQUEST)

    old_limit = float(card.credit_limit)
    card.credit_limit = limit_val
    card.save()

    AdminLog.objects.create(
        user=request.user,
        action='CREDIT_LIMIT_UPDATE',
        description=f"Updated credit limit for card {card.masked_card_number} from ₹{old_limit:,.2f} to ₹{limit_val:,.2f}",
        ip_address=request.META.get('REMOTE_ADDR')
    )

    return Response({
        'message': f"Credit limit for card ending in {card.last_four_digits} updated to ₹{limit_val:,.2f}",
        'credit_limit': float(card.credit_limit),
        'available_limit': card.get_available_limit(),
        'card': CardSerializer(card).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_card_activity(request, card_id):
    """
    Sprint Item 4: Monitor card activity with proper access controls
    Returns transaction ledger and audit logs for the specified card
    """
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    try:
        card = Card.objects.select_related('user').get(id=card_id)
    except Card.DoesNotExist:
        return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)

    txns = Transaction.objects.filter(card=card).order_by('-created_at')
    total_txns = txns.count()
    success_count = txns.filter(status='SUCCESS').count()
    failed_count = txns.filter(status='FAILED').count()
    pending_count = txns.filter(status='PENDING').count()
    total_spent = txns.filter(status='SUCCESS').aggregate(total=Sum('amount'))['total'] or 0

    # Get recent 25 transactions
    recent_transactions = TransactionSerializer(txns[:25], many=True).data

    # Related logs
    logs = AdminLog.objects.filter(
        Q(description__icontains=card.masked_card_number) |
        Q(description__icontains=card.last_four_digits)
    ).order_by('-timestamp')[:20]

    log_data = [{
        'id': l.id,
        'action': l.action,
        'description': l.description,
        'timestamp': l.timestamp,
        'ip_address': l.ip_address,
    } for l in logs]

    return Response({
        'card': CardSerializer(card).data,
        'user': {
            'id': card.user.id,
            'email': card.user.email,
            'username': card.user.username,
            'full_name': card.user.full_name,
        },
        'metrics': {
            'total_transactions': total_txns,
            'success_count': success_count,
            'failed_count': failed_count,
            'pending_count': pending_count,
            'total_spent': float(total_spent),
            'credit_limit': float(card.credit_limit),
            'available_credit_limit': card.get_available_limit(),
            'is_blocked': card.is_blocked,
        },
        'recent_transactions': recent_transactions,
        'audit_logs': log_data
    })



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_transactions(request):
    """View all transactions - Module 5"""
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    transactions = Transaction.objects.all().select_related('user', 'card')
    status_filter = request.query_params.get('status')
    user_id = request.query_params.get('user_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    if status_filter:
        transactions = transactions.filter(status=status_filter.upper())
    if user_id:
        transactions = transactions.filter(user_id=user_id)
    if date_from:
        transactions = transactions.filter(created_at__date__gte=date_from)
    if date_to:
        transactions = transactions.filter(created_at__date__lte=date_to)

    page_size = int(request.query_params.get('page_size', 10))
    page = int(request.query_params.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size
    total = transactions.count()

    serializer = TransactionSerializer(transactions[start:end], many=True)
    return Response({'transactions': serializer.data, 'count': total})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_export_csv(request):
    """Export transactions to CSV - Module 4 Admin Export"""
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    transactions = Transaction.objects.all().select_related('user', 'card')

    # Apply filters
    status_filter = request.query_params.get('status')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    if status_filter:
        transactions = transactions.filter(status=status_filter.upper())
    if date_from:
        transactions = transactions.filter(created_at__date__gte=date_from)
    if date_to:
        transactions = transactions.filter(created_at__date__lte=date_to)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="transactions.csv"'

    writer = csv.writer(response)
    writer.writerow(['Transaction ID', 'User Email', 'Amount', 'Currency',
                     'Status', 'Card (Last 4)', 'Merchant', 'Description', 'Date'])

    for t in transactions:
        writer.writerow([
            t.transaction_id,
            t.user.email if t.user else 'N/A',
            t.amount,
            t.currency,
            t.status,
            t.card.last_four_digits if t.card else 'N/A',
            t.merchant_name,
            t.description,
            t.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        ])

    # Log export action
    AdminLog.objects.create(
        user=request.user,
        action='EXPORT',
        description=f'Admin exported {transactions.count()} transactions to CSV',
    )

    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_daily_summary(request):
    """Daily Payment Summary - Module 5"""
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    target_date = request.query_params.get('date', str(timezone.now().date()))

    day_transactions = Transaction.objects.filter(created_at__date=target_date)
    success = day_transactions.filter(status='SUCCESS')
    failed = day_transactions.filter(status='FAILED')
    pending = day_transactions.filter(status='PENDING')

    return Response({
        'date': target_date,
        'total_transactions': day_transactions.count(),
        'successful': success.count(),
        'failed': failed.count(),
        'pending': pending.count(),
        'total_success_amount': float(success.aggregate(total=Sum('amount'))['total'] or 0),
        'total_failed_amount': float(failed.aggregate(total=Sum('amount'))['total'] or 0),
        'currencies_breakdown': list(
            success.values('currency').annotate(
                count=Count('id'), total=Sum('amount')
            )
        ),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_logs(request):
    """View admin logs"""
    if not is_admin_user(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    logs = AdminLog.objects.all().select_related('user').order_by('-timestamp')
    page_size = int(request.query_params.get('page_size', 20))
    page = int(request.query_params.get('page', 1))
    start = (page - 1) * page_size
    total = logs.count()

    log_data = [{
        'id': log.id,
        'user': log.user.email if log.user else 'System',
        'action': log.action,
        'description': log.description,
        'ip_address': log.ip_address,
        'timestamp': log.timestamp,
    } for log in logs[start:start + page_size]]

    return Response({'logs': log_data, 'count': total})
