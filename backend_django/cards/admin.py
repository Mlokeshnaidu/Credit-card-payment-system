from django.contrib import admin
from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ['user', 'masked_card_number', 'card_type', 'bank_name', 'is_default', 'created_at']
    list_filter = ['card_type', 'is_default']
    search_fields = ['user__email', 'card_holder_name', 'last_four_digits']
    readonly_fields = ['masked_card_number', 'last_four_digits', 'created_at', 'updated_at']
    ordering = ['-created_at']
