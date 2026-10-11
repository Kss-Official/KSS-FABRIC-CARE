from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CustomerAddress

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'full_name', 'role', 'phone', 'is_active_staff', 'is_staff')
    list_filter = ('role', 'is_active_staff', 'is_staff', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Profile Details', {'fields': ('role', 'phone', 'avatar', 'address', 'city', 'pincode', 'is_active_staff')}),
    )

@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'full_name', 'phone', 'address_line', 'city', 'pincode', 'is_default')
    list_filter = ('city', 'is_default')
