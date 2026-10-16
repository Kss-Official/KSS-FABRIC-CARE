import re
import os
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomerAddress

User = get_user_model()

ALLOWED_DOC_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']
ALLOWED_IMG_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=False)
    profile_picture_url = serializers.SerializerMethodField()
    aadhaar_document_url = serializers.SerializerMethodField()
    pan_document_url = serializers.SerializerMethodField()
    remove_profile_picture = serializers.CharField(write_only=True, required=False, allow_blank=True)
    dob = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'phone', 'avatar', 'profile_picture',
            'profile_picture_url', 'dob', 'driving_licence_number',
            'aadhaar_number', 'aadhaar_document', 'aadhaar_document_url',
            'pan_number', 'pan_document', 'pan_document_url',
            'address', 'city', 'pincode', 'is_active_staff', 'is_staff',
            'is_superuser', 'created_at', 'remove_profile_picture'
        )
        read_only_fields = ('id', 'created_at', 'is_staff', 'is_superuser')

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def get_aadhaar_document_url(self, obj):
        if obj.aadhaar_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.aadhaar_document.url)
            return obj.aadhaar_document.url
        return None

    def get_pan_document_url(self, obj):
        if obj.pan_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pan_document.url)
            return obj.pan_document.url
        return None

    def validate_dob(self, value):
        if not value:
            return None
        if isinstance(value, str):
            val = value.strip()
            if not val or val.lower() in ('null', 'none'):
                return None
            import datetime
            for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%d-%m-%Y'):
                try:
                    return datetime.datetime.strptime(val, fmt).date()
                except ValueError:
                    pass
            raise serializers.ValidationError("Please provide a valid date in YYYY-MM-DD or MM/DD/YYYY format.")
        return value

    def validate_aadhaar_number(self, value):
        if value:
            cleaned = str(value).replace(' ', '').replace('-', '').strip()
            if not re.match(r'^\d{12}$', cleaned):
                raise serializers.ValidationError("Aadhaar card number must contain exactly 12 digits.")
            return cleaned
        return value

    def validate_pan_number(self, value):
        if value:
            cleaned = str(value).replace(' ', '').strip().upper()
            if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', cleaned):
                raise serializers.ValidationError("PAN card number must follow standard format (e.g., ABCDE1234F).")
            return cleaned
        return value

    def validate_aadhaar_document(self, file_obj):
        if file_obj:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in ALLOWED_DOC_EXTENSIONS:
                raise serializers.ValidationError("Aadhaar document must be a JPG, JPEG, PNG, or PDF file.")
            if file_obj.size > MAX_FILE_SIZE:
                raise serializers.ValidationError("Aadhaar document exceeds maximum allowed size of 5 MB.")
        return file_obj

    def validate_pan_document(self, file_obj):
        if file_obj:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in ALLOWED_DOC_EXTENSIONS:
                raise serializers.ValidationError("PAN document must be a JPG, JPEG, PNG, or PDF file.")
            if file_obj.size > MAX_FILE_SIZE:
                raise serializers.ValidationError("PAN document exceeds maximum allowed size of 5 MB.")
        return file_obj

    def validate_profile_picture(self, file_obj):
        if file_obj:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in ALLOWED_IMG_EXTENSIONS:
                raise serializers.ValidationError("Profile image must be a JPG, JPEG, or PNG file.")
            if file_obj.size > MAX_FILE_SIZE:
                raise serializers.ValidationError("Profile image exceeds maximum allowed size of 5 MB.")
        return file_obj

    def update(self, instance, validated_data):
        full_name = validated_data.pop('full_name', None)
        if full_name is not None:
            parts = full_name.strip().split(' ', 1)
            instance.first_name = parts[0]
            instance.last_name = parts[1] if len(parts) > 1 else ''

        remove_pic = validated_data.pop('remove_profile_picture', None)
        if remove_pic and str(remove_pic).lower() in ['true', '1', 'yes']:
            if instance.profile_picture:
                try:
                    instance.profile_picture.delete(save=False)
                except Exception:
                    pass
            instance.profile_picture = None
            instance.avatar = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if instance.profile_picture:
            instance.avatar = instance.profile_picture.url
        elif remove_pic and str(remove_pic).lower() in ['true', '1', 'yes']:
            instance.avatar = None

        instance.save()
        return instance


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

    def update(self, instance, validated_data):
        addr_line = validated_data.pop('address_line', None)
        landmark = validated_data.pop('landmark', None)
        if addr_line is not None:
            instance.address_line1 = addr_line
        if landmark is not None:
            instance.address_line2 = landmark
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
