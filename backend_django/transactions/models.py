from django.db import models
from accounts.models import User
from cards.models import Card


class Transaction(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    CATEGORY_CHOICES = [
        ('SHOPPING', 'Shopping'),
        ('DINING', 'Dining & Food'),
        ('TRAVEL', 'Travel & Transport'),
        ('GROCERIES', 'Groceries & Supermarket'),
        ('ENTERTAINMENT', 'Entertainment'),
        ('UTILITIES', 'Bills & Utilities'),
        ('HEALTHCARE', 'Healthcare & Pharmacy'),
        ('EDUCATION', 'Education'),
        ('OTHER', 'General / Other'),
    ]

    FRAUD_STATUS_CHOICES = [
        ('CLEAN', 'Clean'),
        ('SUSPICIOUS', 'Suspicious'),
        ('FLAGGED', 'Flagged for Review'),
        ('BLOCKED', 'Blocked'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    card = models.ForeignKey(Card, on_delete=models.SET_NULL, null=True, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    description = models.CharField(max_length=255, blank=True, null=True, default='')
    merchant_name = models.CharField(max_length=255, blank=True, null=True, default='')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OTHER', db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    fraud_status = models.CharField(max_length=20, choices=FRAUD_STATUS_CHOICES, default='CLEAN', db_index=True)
    fraud_reason = models.CharField(max_length=255, blank=True, null=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=255, blank=True, null=True, default='')
    location = models.CharField(max_length=100, blank=True, null=True, default='')
    transaction_id = models.CharField(max_length=100, unique=True)
    failure_reason = models.CharField(max_length=255, blank=True, null=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']

    def __str__(self):
        fraud_str = f" [{self.fraud_status}]" if self.fraud_status != 'CLEAN' else ""
        return f"{self.transaction_id} - {self.user.username} - {self.amount} {self.currency} [{self.status}]{fraud_str}"


class FraudLog(models.Model):
    REVIEW_STATUS_CHOICES = [
        ('PENDING_REVIEW', 'Pending Review'),
        ('CONFIRMED_FRAUD', 'Confirmed Fraud'),
        ('DISMISSED', 'Dismissed / False Positive'),
    ]

    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='fraud_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fraud_logs')
    card = models.ForeignKey(Card, on_delete=models.SET_NULL, null=True, blank=True, related_name='fraud_logs')
    rule_triggered = models.CharField(max_length=100)
    risk_score = models.IntegerField(default=50)  # 0 to 100
    details = models.TextField(blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=255, blank=True, default='')
    location = models.CharField(max_length=100, blank=True, default='')
    review_status = models.CharField(max_length=30, choices=REVIEW_STATUS_CHOICES, default='PENDING_REVIEW')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_fraud_logs')
    review_notes = models.TextField(blank=True, default='')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fraud_logs'
        verbose_name = 'Fraud Log'
        verbose_name_plural = 'Fraud Logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"Fraud Alert #{self.id}: {self.rule_triggered} (Risk: {self.risk_score}) on {self.transaction.transaction_id}"
