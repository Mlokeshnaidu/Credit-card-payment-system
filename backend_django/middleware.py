"""
System Health & Performance Monitoring Middleware
Tracks:
- API response times (ms)
- Request path, method, status codes
- Failure & error logs with user context
"""

import time
import traceback
from admin_panel.models import SystemMetric


class SystemMonitoringMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        error_msg = ''
        status_code = 500

        try:
            response = self.get_response(request)
            status_code = response.status_code
            return response
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()[:500]}"
            raise
        finally:
            duration_ms = (time.time() - start_time) * 1000.0

            # Exclude static/media and internal noise
            path = request.path
            if not path.startswith('/static/') and not path.startswith('/media/'):
                try:
                    user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
                    x_forward = request.META.get('HTTP_X_FORWARDED_FOR')
                    ip = x_forward.split(',')[0].strip() if x_forward else request.META.get('REMOTE_ADDR')

                    # If response generated a 4xx/5xx without raising unhandled exception
                    if status_code >= 400 and not error_msg:
                        error_msg = f"HTTP {status_code} Error on {request.method} {path}"

                    SystemMetric.objects.create(
                        endpoint=path[:255],
                        method=request.method[:10],
                        status_code=status_code,
                        response_time_ms=round(duration_ms, 2),
                        user=user,
                        ip_address=ip,
                        error_message=error_msg[:1000]
                    )
                except Exception:
                    # Fail silently to guarantee application stability
                    pass
