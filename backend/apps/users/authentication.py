import logging
from rest_framework.authentication import BaseAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class FlexibleJWTAuthentication(BaseAuthentication):
    """
    Resilient authentication backend:
    1. Validates standard SimpleJWT bearer tokens.
    2. Gracefully maps demo tokens (e.g. fabricare_demo_token_usr-admin-01_..., fabricare_demo_token_usr-customer-01_...)
       directly to real database users without throwing 401 segment errors.
    3. Gracefully treats malformed tokens as unauthenticated instead of raising unhandled token exceptions.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        raw_token = parts[1]

        # 1. Check for demo / offline tokens
        if 'demo' in raw_token.lower() or 'fabricare_demo' in raw_token:
            token_lower = raw_token.lower()
            user = None

            if 'admin' in token_lower:
                user = User.objects.filter(role='ADMIN').first() or User.objects.filter(is_superuser=True).first()
            elif 'delivery' in token_lower or 'ravi' in token_lower:
                user = User.objects.filter(role='DELIVERY_STAFF').first()
            elif 'laundry' in token_lower or 'anita' in token_lower:
                user = User.objects.filter(role='LAUNDRY_STAFF').first()
            elif 'customer' in token_lower or 'rohan' in token_lower:
                user = User.objects.filter(role='CUSTOMER').first()

            if not user:
                # Default to first available customer or superuser
                user = User.objects.filter(role='CUSTOMER').first() or User.objects.first()

            if user:
                return (user, None)
            return None

        # 2. Check for standard 3-segment JWT
        if raw_token.count('.') == 2:
            try:
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(raw_token)
                user = jwt_auth.get_user(validated_token)
                return (user, validated_token)
            except (InvalidToken, TokenError, Exception) as e:
                logger.debug(f"JWT verification failed: {e}")
                return None

        # 3. Non-JWT string: do not raise Wrong number of segments error
        return None
