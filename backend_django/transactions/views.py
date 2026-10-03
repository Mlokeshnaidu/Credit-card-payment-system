import uuid
import requests
import csv
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from .models import Transaction
from .serializers import TransactionSerializer, TransactionCreateSerializer
from .filters import TransactionFilter
from cards.models import Card
from accounts.models import AdminLog


def log_action(user, action, description='', ip=None):
    AdminLog.objects.create(user=user, action=action, description=description, ip_address=ip)


def get_ip(request):
    x_forward = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forward.split(',')[0] if x_forward else request.META.get('REMOTE_ADDR')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_list(request):
    """View transaction history with filters - Module 4"""
    transactions = Transaction.objects.filter(user=request.user)

    # Apply filters manually
    status_filter = request.query_params.get('status')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    amount_min = request.query_params.get('amount_min')
    amount_max = request.query_params.get('amount_max')

    if status_filter:
        transactions = transactions.filter(status=status_filter.upper())
    if date_from:
        transactions = transactions.filter(created_at__date__gte=date_from)
    if date_to:
        transactions = transactions.filter(created_at__date__lte=date_to)
    if amount_min:
        transactions = transactions.filter(amount__gte=amount_min)
    if amount_max:
        transactions = transactions.filter(amount__lte=amount_max)

    # Pagination
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
        'total_pages': (total + page_size - 1) // page_size,
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
    """Initiate a payment - calls FastAPI for processing - Module 3 interface"""
    serializer = TransactionCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    card = get_object_or_404(Card, id=data['card_id'], user=request.user)

    # Create transaction with PENDING status
    transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    transaction = Transaction.objects.create(
        user=request.user,
        card=card,
        amount=data['amount'],
        currency=data.get('currency', 'INR'),
        description=data.get('description', ''),
        merchant_name=data.get('merchant_name', ''),
        status='PENDING',
        transaction_id=transaction_id,
    )

    # Call FastAPI payment service
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
        # FastAPI not running - simulate payment for demo
        import random
        transaction.status = 'SUCCESS' if random.random() > 0.3 else 'FAILED'
        if transaction.status == 'FAILED':
            transaction.failure_reason = 'Simulated payment failure'
        else:
            transaction.failure_reason = ''
    except Exception as e:
        transaction.status = 'FAILED'
        transaction.failure_reason = str(e)

    transaction.failure_reason = transaction.failure_reason or ''
    transaction.description = transaction.description or ''
    transaction.merchant_name = transaction.merchant_name or ''
    transaction.save()
    log_action(request.user, 'PAYMENT',
               f'Payment {transaction.transaction_id}: {transaction.amount} {transaction.currency} - {transaction.status}',
               get_ip(request))

    return Response({
        'message': f'Payment {transaction.status.lower()}',
        'transaction': TransactionSerializer(transaction).data
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
        return Response({'message': 'Transaction status updated', 'status': new_status})
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
