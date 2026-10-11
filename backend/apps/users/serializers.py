from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomerAddress

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'phone', 'avatar', 'address', 'city',
            'pincode', 'is_active_staff', 'is_staff', 'is_superuser', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'is_staff', 'is_superuser')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'full_name', 'phone', 'role', 'city', 'address', 'pincode')

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        password = validated_data.pop('password')
        role = validated_data.get('role', User.Role.CUSTOMER)
        
        # Public registration is strictly restricted to CUSTOMER
        if role not in [User.Role.CUSTOMER]:
            role = User.Role.CUSTOMER

        user = User.objects.create(
            username=validated_data.get('username') or validated_data.get('email'),
            email=validated_data.get('email'),
            phone=validated_data.get('phone', ''),
            role=role,
            city=validated_data.get('city', 'Bengaluru'),
            address=validated_data.get('address', ''),
            pincode=validated_data.get('pincode', ''),
            avatar=(full_name or validated_data.get('username', 'CU'))[:2].upper()
        )

        if full_name:
            parts = full_name.split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]

        user.set_password(password)
        user.save()
        return user


class CustomerAddressSerializer(serializers.ModelSerializer):
    address_line1 = serializers.CharField(required=False)
    address_line = serializers.CharField(required=False)
    landmark = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = CustomerAddress
        fields = (
            'id', 'title', 'full_name', 'phone', 'address_line1', 'address_line2',
            'address_line', 'landmark', 'city', 'state', 'pincode', 'is_default', 'created_at'
        )
        read_only_fields = ('user', 'created_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['address_line'] = instance.address_line1
        data['landmark'] = instance.address_line2 or ''
        return data

    def create(self, validated_data):
        user = validated_data.pop('user', None) or self.context['request'].user
        addr_line = validated_data.pop('address_line', None)
        landmark = validated_data.pop('landmark', None)
        if addr_line and not validated_data.get('address_line1'):
            validated_data['address_line1'] = addr_line
        if landmark and not validated_data.get('address_line2'):
            validated_data['address_line2'] = landmark
        if not validated_data.get('full_name'):
            validated_data['full_name'] = getattr(user, 'full_name', '') or user.get_full_name() or user.username
        if not validated_data.get('phone'):
            validated_data['phone'] = getattr(user, 'phone', '') or '+91 98765 43210'
        return CustomerAddress.objects.create(user=user, **validated_data)
