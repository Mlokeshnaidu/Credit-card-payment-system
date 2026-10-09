from django.urls import path
from . import views

urlpatterns = [
    path('', views.transaction_list, name='transaction-list'),
    path('statement/pdf/', views.statement_pdf, name='statement-pdf'),
    path('analytics/summary/', views.analytics_summary, name='analytics-summary'),
    path('analytics/monthly/', views.analytics_monthly, name='analytics-monthly'),
    path('analytics/categories/', views.analytics_categories, name='analytics-categories'),
    path('analytics/utilization/', views.analytics_utilization, name='analytics-utilization'),
    path('<int:transaction_id>/', views.transaction_detail, name='transaction-detail'),
    path('pay/', views.make_payment, name='make-payment'),
    path('<str:transaction_id>/update-status/', views.update_transaction_status, name='update-status'),
]
