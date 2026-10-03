from django.contrib import admin
from .models import User, AdminLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'full_name', 'is_active', 'is_admin', 'date_joined']
    list_filter = ['is_active', 'is_admin', 'is_staff']
    search_fields = ['email', 'username', 'full_name']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login']


@admin.register(AdminLog)
class AdminLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'ip_address', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__email', 'description']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']
