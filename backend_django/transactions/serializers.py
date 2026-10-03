from rest_framework import serializers
from .models import Transaction
from cards.serializers import CardSerializer


class TransactionSerializer(serializers.ModelSerializer):
    card_details = CardSerializer(source='card', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'amount', 'currency', 'description',
            'merchant_name', 'status', 'failure_reason',
            'card_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'transaction_id', 'status', 'failure_reason', 'created_at', 'updated_at']


class TransactionCreateSerializer(serializers.Serializer):
    card_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    currency = serializers.CharField(max_length=3, default='INR')
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    merchant_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
