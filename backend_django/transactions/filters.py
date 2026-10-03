import django_filters
from .models import Transaction


class TransactionFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    amount_min = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_max = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    status = django_filters.ChoiceFilter(choices=Transaction.STATUS_CHOICES)

    class Meta:
        model = Transaction
        fields = ['status', 'date_from', 'date_to', 'amount_min', 'amount_max', 'currency']
