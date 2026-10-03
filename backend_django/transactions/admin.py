from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'user', 'amount', 'currency', 'status', 'merchant_name', 'created_at']
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['transaction_id', 'user__email', 'merchant_name', 'description']
    readonly_fields = ['transaction_id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
