from rest_framework import status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .models import CustomerAddress
from .serializers import UserSerializer, RegisterSerializer, CustomerAddressSerializer

User = get_user_model()

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email_or_username = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        if not email_or_username or not password:
            return Response(
                {'detail': 'Please provide both email/username and password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate by username or email
        user = authenticate(username=email_or_username, password=password)
        if not user:
            try:
                user_obj = User.objects.get(email=email_or_username)
                user = authenticate(username=user_obj.username, password=password)
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                user = None

        if user:
            if not user.is_active:
                return Response({'detail': 'This account has been disabled.'}, status=status.HTTP_403_FORBIDDEN)

            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)

        return Response(
            {'detail': 'Invalid email/username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class MeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerAddressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return CustomerAddress.objects.filter(user=self.request.user).order_by('-is_default', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StaffListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        role = request.query_params.get('role')
        queryset = User.objects.filter(is_active=True)
        if role:
            queryset = queryset.filter(role=role.upper())
        else:
            queryset = queryset.filter(role__in=[User.Role.DELIVERY_STAFF, User.Role.LAUNDRY_STAFF])
        return Response(UserSerializer(queryset, many=True).data)
