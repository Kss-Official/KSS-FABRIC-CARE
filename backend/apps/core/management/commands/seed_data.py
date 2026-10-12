import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.core.models import (
    ServiceCategory, Service, Order, OrderItem,
    ContentFAQ, ContentPolicy, Invoice
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial services, categories, users, and orders for FabriCare'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding initial FabriCare database...'))

        # 1. Create Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@fabricare.com',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': User.Role.ADMIN,
                'avatar': 'AD',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        customer_user, _ = User.objects.get_or_create(
            username='rohan',
            defaults={
                'email': 'rohan.mehta@gmail.com',
                'first_name': 'Rohan',
                'last_name': 'Mehta',
                'phone': '+91 98765 43210',
                'role': User.Role.CUSTOMER,
                'avatar': 'RM',
                'address': 'House #12, 3rd Cross, HRBR Layout, Banaswadi',
                'city': 'Bengaluru',
                'pincode': '560043'
            }
        )
        customer_user.set_password('customer123')
        customer_user.save()

        delivery_user, _ = User.objects.get_or_create(
            username='delivery_ravi',
            defaults={
                'email': 'ravi.kumar@fabricare.com',
                'first_name': 'Ravi',
                'last_name': 'Kumar',
                'phone': '+91 98765 43210',
                'role': User.Role.DELIVERY_STAFF,
                'avatar': 'RK',
                'is_active_staff': True
            }
        )
        delivery_user.set_password('delivery123')
        delivery_user.save()

        laundry_user, _ = User.objects.get_or_create(
            username='laundry_anita',
            defaults={
                'email': 'anita.sharma@fabricare.com',
                'first_name': 'Anita',
                'last_name': 'Sharma',
                'phone': '+91 91234 56789',
                'role': User.Role.LAUNDRY_STAFF,
                'avatar': 'AS',
                'is_active_staff': True
            }
        )
        laundry_user.set_password('laundry123')
        laundry_user.save()

        self.stdout.write(self.style.SUCCESS('Users created: admin, rohan (customer), delivery_ravi, laundry_anita'))

        # 2. Create Categories
        cat_wash, _ = ServiceCategory.objects.get_or_create(
            name='Wash & Fold',
            defaults={'slug': 'wash-fold', 'description': 'Everyday laundry washed, dried and folded.', 'display_order': 1}
        )
        cat_dry, _ = ServiceCategory.objects.get_or_create(
            name='Dry Cleaning',
            defaults={'slug': 'dry-cleaning', 'description': 'Gentle eco-solvent cleaning for premium and delicate fabrics.', 'display_order': 2}
        )
        cat_iron, _ = ServiceCategory.objects.get_or_create(
            name='Steam Ironing',
            defaults={'slug': 'steam-ironing', 'description': 'Crisp steam press and hanger packaging.', 'display_order': 3}
        )
        cat_special, _ = ServiceCategory.objects.get_or_create(
            name='Special Care',
            defaults={'slug': 'special-care', 'description': 'Curtains, shoes, blankets and deep care.', 'display_order': 4}
        )

        # 3. Create Services
        services_data = [
            {'name': 'Shirt (Wash & Fold)', 'category': cat_wash, 'price': 80.00, 'unit': 'per piece', 'description': 'Regular shirt cleaning and pressing', 'icon': 'Shirt', 'image_url': '/assets/service-wash.jpg'},
            {'name': 'Jeans (Wash & Fold)', 'category': cat_wash, 'price': 120.00, 'unit': 'per piece', 'description': 'Denim washing and fiber protection', 'icon': 'Layers', 'image_url': '/assets/service-wash.jpg'},
            {'name': 'T-Shirt (Wash & Fold)', 'category': cat_wash, 'price': 70.00, 'unit': 'per piece', 'description': 'Gentle wash and crisp fold', 'icon': 'Shirt', 'image_url': '/assets/service-wash.jpg'},
            {'name': 'Formal Suit (2-Piece)', 'category': cat_dry, 'price': 250.00, 'unit': 'per piece', 'description': 'Professional eco dry cleaning and contour pressing', 'icon': 'Sparkles', 'image_url': '/assets/service-dryclean.jpg'},
            {'name': 'Silk Saree / Lehenga', 'category': cat_dry, 'price': 220.00, 'unit': 'per piece', 'description': 'Delicate fabric care with organic solvents', 'icon': 'Sparkles', 'image_url': '/assets/service-dryclean.jpg'},
            {'name': 'Bedsheet (Single / Double)', 'category': cat_iron, 'price': 90.00, 'unit': 'per item', 'description': 'Sanitized wash, dry and steam iron', 'icon': 'Flame', 'image_url': '/assets/service-iron.jpg'},
            {'name': 'Blanket / Heavy Quilt', 'category': cat_special, 'price': 300.00, 'unit': 'per item', 'description': 'Deep sanitization and anti-allergen treatment', 'icon': 'BedDouble', 'image_url': '/assets/service-curtain.jpg'},
            {'name': 'Shoe Laundry', 'category': cat_special, 'price': 250.00, 'unit': 'per pair', 'description': 'Deep sole cleaning, deodorizing and protection', 'icon': 'Footprints', 'image_url': '/assets/service-shoe.jpg'},
        ]

        for s_data in services_data:
            Service.objects.update_or_create(
                name=s_data['name'],
                defaults=s_data
            )

        self.stdout.write(self.style.SUCCESS(f'Services seeded: {len(services_data)} items'))

        # 4. Create Initial Orders
        if Order.objects.count() == 0:
            today = datetime.date.today()
            tomorrow = today + datetime.timedelta(days=1)

            # Order 1: Pending Review
            o1 = Order.objects.create(
                order_id='#FC10284',
                customer=customer_user,
                pickup_full_name='Rohan Mehta',
                pickup_phone='+91 98765 43210',
                pickup_address='House #12, 3rd Cross, HRBR Layout, Banaswadi, Bengaluru - 560043',
                pickup_city='Bengaluru',
                pickup_pincode='560043',
                pickup_date=tomorrow,
                pickup_time_slot='9:00 AM – 11:00 AM',
                special_instructions='Handle silk shirts with extra care.',
                status=Order.Status.PENDING_REVIEW,
                subtotal=300.00,
                total_amount=300.00,
                payment_status=Order.PaymentStatus.PAID,
                payment_method=Order.PaymentMethod.UPI
            )
            OrderItem.objects.create(order=o1, service_name='Formal Suit (2-Piece)', category_name='Dry Cleaning', quantity=1, unit_price=250.00, total_price=250.00)
            OrderItem.objects.create(order=o1, service_name='Shirt (Wash & Fold)', category_name='Wash & Fold', quantity=1, unit_price=50.00, total_price=50.00)
            Invoice.objects.create(order=o1, subtotal=300.00, total_payable=300.00, payment_status=Order.PaymentStatus.PAID, payment_method=Order.PaymentMethod.UPI)

            # Order 2: Accepted & Pickup Assigned
            o2 = Order.objects.create(
                order_id='#FC10285',
                customer=customer_user,
                pickup_full_name='Priya Sharma',
                pickup_phone='+91 99876 54321',
                pickup_address='House #45, 3rd Cross, Indiranagar, Bengaluru - 560038',
                pickup_city='Bengaluru',
                pickup_pincode='560038',
                pickup_date=today,
                pickup_time_slot='10:00 AM – 12:00 PM',
                status=Order.Status.PICKUP_ASSIGNED,
                assigned_pickup_driver=delivery_user,
                subtotal=440.00,
                total_amount=440.00,
                payment_status=Order.PaymentStatus.PAID,
                payment_method=Order.PaymentMethod.CARD
            )
            OrderItem.objects.create(order=o2, service_name='Silk Saree / Lehenga', category_name='Dry Cleaning', quantity=2, unit_price=220.00, total_price=440.00)
            Invoice.objects.create(order=o2, subtotal=440.00, total_payable=440.00, payment_status=Order.PaymentStatus.PAID, payment_method=Order.PaymentMethod.CARD)

            # Order 3: Laundry Processing
            o3 = Order.objects.create(
                order_id='#FC10286',
                customer=customer_user,
                pickup_full_name='Arjun Nair',
                pickup_phone='+91 91234 56789',
                pickup_address='Whitefield, Bengaluru - 560066',
                pickup_city='Bengaluru',
                pickup_pincode='560066',
                pickup_date=today,
                pickup_time_slot='11:00 AM – 01:00 PM',
                status=Order.Status.WASHING,
                assigned_pickup_driver=delivery_user,
                assigned_laundry_staff=laundry_user,
                subtotal=520.00,
                total_amount=520.00,
                payment_status=Order.PaymentStatus.PAID,
                payment_method=Order.PaymentMethod.UPI
            )
            OrderItem.objects.create(order=o3, service_name='Jeans (Wash & Fold)', category_name='Wash & Fold', quantity=3, unit_price=120.00, total_price=360.00)
            OrderItem.objects.create(order=o3, service_name='Bedsheet (Single / Double)', category_name='Steam Ironing', quantity=1, unit_price=90.00, total_price=90.00)
            OrderItem.objects.create(order=o3, service_name='T-Shirt (Wash & Fold)', category_name='Wash & Fold', quantity=1, unit_price=70.00, total_price=70.00)
            Invoice.objects.create(order=o3, subtotal=520.00, total_payable=520.00, payment_status=Order.PaymentStatus.PAID, payment_method=Order.PaymentMethod.UPI)

            # Order 4: Ready for Delivery
            o4 = Order.objects.create(
                order_id='#FC10287',
                customer=customer_user,
                pickup_full_name='Sneha Reddy',
                pickup_phone='+91 99887 66554',
                pickup_address='Koramangala, Bengaluru - 560034',
                pickup_city='Bengaluru',
                pickup_pincode='560034',
                pickup_date=today,
                pickup_time_slot='02:00 PM – 04:00 PM',
                status=Order.Status.READY_FOR_DELIVERY,
                assigned_pickup_driver=delivery_user,
                assigned_delivery_driver=delivery_user,
                assigned_laundry_staff=laundry_user,
                subtotal=600.00,
                total_amount=600.00,
                payment_status=Order.PaymentStatus.PAID,
                payment_method=Order.PaymentMethod.CASH_ON_DELIVERY
            )
            OrderItem.objects.create(order=o4, service_name='Blanket / Heavy Quilt', category_name='Special Care', quantity=2, unit_price=300.00, total_price=600.00)
            Invoice.objects.create(order=o4, subtotal=600.00, total_payable=600.00, payment_status=Order.PaymentStatus.PENDING, payment_method=Order.PaymentMethod.CASH_ON_DELIVERY)

            self.stdout.write(self.style.SUCCESS('Sample workflow orders initialized.'))

        # 5. FAQs & Policies
        ContentFAQ.objects.get_or_create(
            question='How does FabriCare pickup and delivery work?',
            defaults={'answer': 'Schedule a pickup online. Our delivery agent collects your clothes at your scheduled time and delivers them freshly cleaned within 24-48 hours.', 'display_order': 1}
        )
        ContentFAQ.objects.get_or_create(
            question='What areas do you service?',
            defaults={'answer': 'We service all major zones in Bengaluru including Banaswadi, Indiranagar, Koramangala, Whitefield, and HSR Layout.', 'display_order': 2}
        )

        ContentPolicy.objects.get_or_create(
            slug='terms',
            defaults={
                'title': 'Terms & Conditions',
                'content': 'Welcome to FabriCare. By placing an order with us, you agree to our standard garment handling, pickup and delivery policies.'
            }
        )

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
