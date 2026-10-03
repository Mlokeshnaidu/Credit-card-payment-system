from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('users/', views.admin_users, name='admin-users'),
    path('users/<int:user_id>/toggle/', views.admin_toggle_user, name='admin-toggle-user'),
    path('cards/', views.admin_cards, name='admin-cards'),
    path('transactions/', views.admin_transactions, name='admin-transactions'),
    path('transactions/export/', views.admin_export_csv, name='admin-export-csv'),
    path('daily-summary/', views.admin_daily_summary, name='admin-daily-summary'),
    path('logs/', views.admin_logs, name='admin-logs'),
]
