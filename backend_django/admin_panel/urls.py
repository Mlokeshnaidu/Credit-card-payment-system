from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('users/', views.admin_users, name='admin-users'),
    path('users/<int:user_id>/toggle/', views.admin_toggle_user, name='admin-toggle-user'),
    path('users/<int:user_id>/role/', views.admin_update_user_role, name='admin-update-user-role'),
    path('cards/', views.admin_cards, name='admin-cards'),
    path('cards/<int:card_id>/toggle-block/', views.admin_toggle_card_block, name='admin-toggle-card-block'),
    path('cards/<int:card_id>/block/', views.admin_toggle_card_block, name='admin-block-card-alias'),
    path('cards/<int:card_id>/update-limit/', views.admin_update_card_credit_limit, name='admin-update-card-limit'),
    path('cards/<int:card_id>/credit-limit/', views.admin_update_card_credit_limit, name='admin-credit-limit-alias'),
    path('cards/<int:card_id>/activity/', views.admin_card_activity, name='admin-card-activity'),
    path('transactions/', views.admin_transactions, name='admin-transactions'),
    path('transactions/export/', views.admin_export_csv, name='admin-export-csv'),
    path('daily-summary/', views.admin_daily_summary, name='admin-daily-summary'),
    path('logs/', views.admin_logs, name='admin-logs'),
    path('fraud-logs/', views.admin_fraud_logs, name='admin-fraud-logs'),
    path('fraud-logs/<int:log_id>/review/', views.admin_review_fraud_log, name='admin-review-fraud-log'),
    path('system-health/', views.admin_system_health, name='admin-system-health'),
    path('analytics/export/csv/', views.admin_export_analytics_csv, name='admin-export-analytics-csv'),
    path('analytics/export/pdf/', views.admin_export_analytics_pdf, name='admin-export-analytics-pdf'),
]
