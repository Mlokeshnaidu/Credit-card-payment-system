from rest_framework import serializers
from .models import Card


class CardCreateSerializer(serializers.Serializer):
    """Serializer for adding a card - accepts full card number but only stores masked version"""
    card_number = serializers.CharField(min_length=16, max_length=19, write_only=True)
    card_holder_name = serializers.CharField(max_length=255)
    card_type = serializers.ChoiceField(choices=['CREDIT', 'DEBIT'])
    expiry_month = serializers.IntegerField(min_value=1, max_value=12)
    expiry_year = serializers.IntegerField(min_value=2024, max_value=2040)
    bank_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    is_default = serializers.BooleanField(default=False)

    def validate_card_number(self, value):
        # Remove spaces/dashes
        clean = value.replace(' ', '').replace('-', '')
        if not clean.isdigit():
            raise serializers.ValidationError("Card number must contain only digits.")
        if len(clean) < 13 or len(clean) > 19:
            raise serializers.ValidationError("Invalid card number length.")
        return clean

    def create(self, validated_data):
        card_number = validated_data.pop('card_number')
        last_four = card_number[-4:]
        # Create masked version: ****-****-****-1234
        masked = f"****-****-****-{last_four}"
        user = self.context['request'].user
        card = Card.objects.create(
            user=user,
            last_four_digits=last_four,
            masked_card_number=masked,
            **validated_data
        )
        return card


class CardSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    available_credit_limit = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = Card
        fields = [
            'id', 'card_holder_name', 'masked_card_number', 'last_four_digits',
            'card_type', 'expiry_month', 'expiry_year', 'bank_name',
            'is_default', 'is_blocked', 'credit_limit', 'available_credit_limit',
            'total_spent', 'user_email', 'user_full_name', 'created_at'
        ]
        read_only_fields = [
            'id', 'masked_card_number', 'last_four_digits', 'created_at',
            'available_credit_limit', 'total_spent', 'user_email', 'user_full_name'
        ]

    def get_available_limit(self, obj):
        return obj.get_available_limit()

    def get_available_credit_limit(self, obj):
        return obj.get_available_limit()

    def get_total_spent(self, obj):
        return obj.get_total_spent()
