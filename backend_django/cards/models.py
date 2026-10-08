from django.db import models
from accounts.models import User


class Card(models.Model):
    CARD_TYPES = [
        ('CREDIT', 'Credit Card'),
        ('DEBIT', 'Debit Card'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cards')
    card_holder_name = models.CharField(max_length=255)
    # SECURITY: Store only last 4 digits - NO full card number stored
    last_four_digits = models.CharField(max_length=4)
    # SECURITY: Masked card number like ****-****-****-1234
    masked_card_number = models.CharField(max_length=20)
    card_type = models.CharField(max_length=10, choices=CARD_TYPES, default='CREDIT')
    expiry_month = models.IntegerField()
    expiry_year = models.IntegerField()
    bank_name = models.CharField(max_length=100, blank=True)
    is_default = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=50000.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cards'
        verbose_name = 'Card'
        verbose_name_plural = 'Cards'
        ordering = ['-created_at']

    def __str__(self):
        status_str = " [BLOCKED]" if self.is_blocked else ""
        return f"{self.user.username} - {self.masked_card_number} ({self.card_type}){status_str}"

    def get_total_spent(self):
        """Calculate total successful spending on this card"""
        from transactions.models import Transaction
        from django.db.models import Sum
        result = Transaction.objects.filter(card=self, status='SUCCESS').aggregate(total=Sum('amount'))
        return float(result['total'] or 0.0)

    def get_available_limit(self):
        """Calculate remaining available credit limit"""
        spent = self.get_total_spent()
        return max(float(self.credit_limit) - spent, 0.0)

    def is_limit_below_threshold(self, threshold_percent=10.0):
        """Check if available credit is below threshold percentage of total limit"""
        limit = float(self.credit_limit)
        if limit <= 0:
            return False
        available = self.get_available_limit()
        return (available / limit) * 100.0 < threshold_percent

    def save(self, *args, **kwargs):
        # If this card is set as default, unset all others for this user
        if self.is_default:
            Card.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
