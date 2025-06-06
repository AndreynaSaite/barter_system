from django.utils.deprecation import MiddlewareMixin

class DisableCSRFForAPI(MiddlewareMixin):
    def process_request(self, request):
        if request.path.startswith(''):
            setattr(request, '_dont_enforce_csrf_checks', True)
