from django.db import models
from accounts.models import User


class SystemMetric(models.Model):
    endpoint = models.CharField(max_length=255, db_index=True)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField(db_index=True)
    response_time_ms = models.FloatField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='system_metrics')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    error_message = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'system_metrics'
        verbose_name = 'System Metric'
        verbose_name_plural = 'System Metrics'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.method} {self.endpoint} [{self.status_code}] - {self.response_time_ms:.1f}ms"
