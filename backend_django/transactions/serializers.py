from rest_framework import serializers
from .models import Transaction, FraudLog
from cards.serializers import CardSerializer
from accounts.serializers import UserSerializer


class TransactionSerializer(serializers.ModelSerializer):
    card_details = CardSerializer(source='card', read_only=True)
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'amount', 'currency', 'description',
            'merchant_name', 'category', 'status', 'fraud_status', 'fraud_reason',
            'location', 'device_info', 'ip_address', 'failure_reason',
            'card_details', 'user_email', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'status', 'fraud_status', 'fraud_reason',
            'failure_reason', 'created_at', 'updated_at'
        ]


class TransactionCreateSerializer(serializers.Serializer):
    card_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    currency = serializers.CharField(max_length=3, default='INR')
    category = serializers.ChoiceField(choices=Transaction.CATEGORY_CHOICES, default='OTHER', required=False)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    merchant_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    location = serializers.CharField(max_length=100, required=False, allow_blank=True)
    device_info = serializers.CharField(max_length=255, required=False, allow_blank=True)


class FraudLogSerializer(serializers.ModelSerializer):
    transaction_id = serializers.ReadOnlyField(source='transaction.transaction_id')
    user_email = serializers.ReadOnlyField(source='user.email')
    masked_card_number = serializers.ReadOnlyField(source='card.masked_card_number')
    reviewed_by_email = serializers.ReadOnlyField(source='reviewed_by.email')

    class Meta:
        model = FraudLog
        fields = [
            'id', 'transaction_id', 'user_email', 'masked_card_number',
            'rule_triggered', 'risk_score', 'details', 'ip_address',
            'device_info', 'location', 'review_status', 'reviewed_by_email',
            'review_notes', 'reviewed_at', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class FraudLogReviewSerializer(serializers.Serializer):
    review_status = serializers.ChoiceField(choices=FraudLog.REVIEW_STATUS_CHOICES)
    review_notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    block_card = serializers.BooleanField(default=False, required=False)
