"""
Role-Based Access Control (RBAC) Permissions
Roles:
- ADMIN: Full system access (User management, Credit limit changes, System Health, Logs, Exports)
- SUPPORT: Operational support (Card block/unblock, fraud review, read-only analytics, cannot change credit limits or delete users)
- READ_ONLY: Read-only access to dashboard, cards, transactions, and logs (cannot perform state mutations)
- CUSTOMER: Standard cardholder access to own resources
"""

from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """Allows access only to Admin users."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_admin_role()


class IsSupportRole(permissions.BasePermission):
    """Allows access to Admin and Support users."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_support_role()


class IsStaffOrAdminRole(permissions.BasePermission):
    """Allows access to Admin, Support, and Read-Only staff members."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['ADMIN', 'SUPPORT', 'READ_ONLY'] or request.user.is_admin or request.user.is_staff


class RBACPermission(permissions.BasePermission):
    """
    Fine-grained RBAC permission:
    - Safe methods (GET, HEAD, OPTIONS): Admin, Support, Read-Only
    - State mutations (POST, PUT, PATCH, DELETE):
        * If view requires Admin (e.g. credit limit update, user role change): Admin only
        * If view allows Support (e.g. card block/unblock, fraud review): Admin & Support
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Read-only methods are allowed for Admin, Support, and Read-Only roles
        if request.method in permissions.SAFE_METHODS:
            return request.user.role in ['ADMIN', 'SUPPORT', 'READ_ONLY'] or request.user.is_admin

        # For mutations, Read-Only role is strictly forbidden
        if request.user.role == 'READ_ONLY':
            return False

        return request.user.role in ['ADMIN', 'SUPPORT'] or request.user.is_admin


class CanBlockUnblockCardPermission(permissions.BasePermission):
    """Admin and Support staff can block/unblock cards."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_support_role()


class CanUpdateCreditLimitPermission(permissions.BasePermission):
    """Only Admin role can update card credit limits."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_admin_role()


class NotReadOnlyPermission(permissions.BasePermission):
    """Ensures user cannot perform mutations if they are in Read-Only role."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method not in permissions.SAFE_METHODS and request.user.role == 'READ_ONLY':
            return False
        return True
