import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import Order, OrderItem

User = get_user_model()

class LaundryBookingFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='test_customer',
            email='test_customer@fabricare.com',
            password='testpassword123',
            role=User.Role.CUSTOMER,
            first_name='Ananya',
            last_name='Sharma',
            phone='+91 98765 12345',
            address='123 Indiranagar, 100ft Road',
            city='Bengaluru',
            pincode='560038'
        )
        self.client.force_authenticate(user=self.customer)

    def test_create_order_with_multiple_clothing_items(self):
        """Test creating an order with clothing items from multiple categories and subcategories"""
        items_payload = [
            {
                "item_name": "T-shirt",
                "service_category": "Wash & Fold",
                "quantity": 3,
                "unit_price": 35.0,
                "total_price": 105.0
            },
            {
                "item_name": "Jeans",
                "service_category": "Wash & Fold",
                "quantity": 2,
                "unit_price": 50.0,
                "total_price": 100.0
            },
            {
                "item_name": "Suit (2-piece)",
                "service_category": "Dry Cleaning",
                "quantity": 1,
                "unit_price": 120.0,
                "total_price": 120.0
            },
            {
                "item_name": "Formal shirt",
                "service_category": "Express Laundry",
                "quantity": 2,
                "unit_price": 90.0,
                "total_price": 180.0
            }
        ]

        total_amount = 105.0 + 100.0 + 120.0 + 180.0  # 505.0
        services_list = ["Wash & Fold", "Dry Cleaning", "Express Laundry"]

        order_data = {
            "pickup_full_name": "Ananya Sharma",
            "pickup_phone": "+91 98765 12345",
            "pickup_address": "123 Indiranagar, 100ft Road",
            "pickup_city": "Bengaluru",
            "pickup_pincode": "560038",
            "pickup_date": str(datetime.date.today() + datetime.timedelta(days=1)),
            "pickup_time_slot": "9:00 AM – 11:00 AM",
            "special_instructions": "Please handle the suit with extra care.",
            "delivery_address": "123 Indiranagar, 100ft Road",
            "total_amount": total_amount,
            "services_list": services_list,
            "items": items_payload
        }

        response = self.client.post('/api/orders/', order_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        res_data = response.data
        self.assertTrue(res_data['order_id'].startswith('#FC'))
        self.assertEqual(float(res_data['total_amount']), total_amount)
        self.assertEqual(res_data['customer_name'], "Ananya Sharma")

        # Verify OrderItem records in DB
        order = Order.objects.get(order_id=res_data['order_id'])
        order_items = order.items.all()
        self.assertEqual(order_items.count(), 4)

        tshirt = order_items.get(service_name="T-shirt")
        self.assertEqual(tshirt.quantity, 3)
        self.assertEqual(float(tshirt.unit_price), 35.0)
        self.assertEqual(float(tshirt.total_price), 105.0)
        self.assertEqual(tshirt.category_name, "Wash & Fold")

        suit = order_items.get(service_name="Suit (2-piece)")
        self.assertEqual(suit.quantity, 1)
        self.assertEqual(float(suit.unit_price), 120.0)
        self.assertEqual(suit.category_name, "Dry Cleaning")

        # Verify listing orders for customer
        list_response = self.client.get('/api/orders/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        orders = list_response.data if isinstance(list_response.data, list) else list_response.data.get('results', [])
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]['order_id'], res_data['order_id'])
        self.assertEqual(len(orders[0]['items']), 4)
        self.assertEqual(orders[0]['items'][0]['item_name'], orders[0]['items'][0]['service_name'])

    def test_unauthenticated_cannot_create_order(self):
        """Unauthenticated client cannot book pickup"""
        self.client.force_authenticate(user=None)
        order_data = {
            "pickup_address": "123 Indiranagar",
            "pickup_date": "2026-10-15",
            "pickup_time_slot": "9:00 AM – 11:00 AM"
        }
        response = self.client.post('/api/orders/', order_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cancel_order_workflow(self):
        """Test customer cancelling their booking while still in review"""
        order = Order.objects.create(
            customer=self.customer,
            pickup_full_name="Ananya Sharma",
            pickup_phone="+91 98765 12345",
            pickup_address="123 Indiranagar",
            pickup_date=datetime.date.today() + datetime.timedelta(days=1),
            pickup_time_slot="9:00 AM – 11:00 AM",
            total_amount=350.0,
            status=Order.Status.PENDING_REVIEW
        )
        response = self.client.post(f'/api/orders/{order.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)

    def test_wash_and_iron_duplicate_wash_charge_logic(self):
        """
        When the same clothing item is selected under both Wash & Fold and Wash & Iron:
        - The washing charge is applied only once (in Wash & Fold).
        - For Wash & Iron, only the ironing component is charged (50% of unit price).
        - Prevents duplicate washing charges and ensures accurate total calculation.
        """
        items_payload = [
            {
                "item_name": "T-shirt",
                "service_category": "Wash & Fold",
                "quantity": 1,
                "unit_price": 35.0,
            },
            {
                "item_name": "Jeans",
                "service_category": "Wash & Fold",
                "quantity": 1,
                "unit_price": 50.0,
            },
            {
                "item_name": "Suit (2-piece)",
                "service_category": "Wash & Fold",
                "quantity": 1,
                "unit_price": 150.0,
            },
            {
                "item_name": "T-shirt",
                "service_category": "Wash & Iron",
                "quantity": 1,
                "unit_price": 50.0,  # Base price is 50; ironing only should be 25
            }
        ]

        order_data = {
            "pickup_address": "Banaswadi, Bengaluru",
            "items": items_payload
        }

        response = self.client.post('/api/orders/', order_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        res_data = response.data
        # Subtotal: 35 (T-shirt wash) + 50 (Jeans) + 150 (Suit) + 25 (T-shirt ironing @ 50%) = 260
        expected_total = 35.0 + 50.0 + 150.0 + 25.0
        self.assertEqual(float(res_data['total_amount']), expected_total)

        order = Order.objects.get(order_id=res_data['order_id'])
        wi_tshirt = order.items.get(service_name="T-shirt", category_name="Wash & Iron")
        self.assertEqual(float(wi_tshirt.unit_price), 25.0)
        self.assertEqual(float(wi_tshirt.total_price), 25.0)
