from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        if not username:
            raise ValueError('Username is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('role', 'CUSTOMER')
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)  # Bcrypt hashing via Django
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('SUPPORT', 'Support'),
        ('READ_ONLY', 'Read-Only'),
        ('CUSTOMER', 'Customer'),
    ]

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.email} ({self.username}) [{self.role}]"

    def is_admin_role(self):
        return self.role == 'ADMIN' or self.is_admin or self.is_superuser

    def is_support_role(self):
        return self.is_admin_role() or self.role == 'SUPPORT'

    def is_read_only_role(self):
        return self.role == 'READ_ONLY'

    def can_modify(self):
        """Returns True if the user is allowed to perform state mutations (not Read-Only)"""
        return self.role != 'READ_ONLY'

    def save(self, *args, **kwargs):
        # Synchronize admin flags with role
        if self.is_superuser or self.is_admin:
            if self.role == 'CUSTOMER':
                self.role = 'ADMIN'
        elif self.role == 'ADMIN':
            self.is_admin = True
            self.is_staff = True
        elif self.role in ['SUPPORT', 'READ_ONLY']:
            self.is_staff = True
        super().save(*args, **kwargs)


class AdminLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
        ('REGISTER', 'User Registration'),
        ('CARD_ADD', 'Card Added'),
        ('CARD_DELETE', 'Card Deleted'),
        ('CARD_BLOCK', 'Card Blocked'),
        ('CARD_UNBLOCK', 'Card Unblocked'),
        ('CREDIT_LIMIT_UPDATE', 'Credit Limit Updated'),
        ('ROLE_CHANGE', 'User Role Changed'),
        ('FRAUD_FLAG', 'Fraud Flagged'),
        ('FRAUD_RESOLVE', 'Fraud Resolved'),
        ('PAYMENT', 'Payment Made'),
        ('ADMIN_VIEW', 'Admin Viewed Data'),
        ('EXPORT', 'Data Exported'),
        ('SYSTEM_CONFIG', 'System Config Changed'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='logs')
    actor_role = models.CharField(max_length=20, blank=True, null=True, default='ADMIN')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=50, blank=True, null=True)
    target_id = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_logs'
        verbose_name = 'Admin Log'
        verbose_name_plural = 'Admin Logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.actor_role or 'USER'}] {self.user} - {self.action} at {self.timestamp}"
