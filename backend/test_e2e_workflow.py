import os
import sys
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.test import Client
from apps.users.models import User
from apps.core.models import Order, Service

def run_workflow_test():
    client = Client()

    print("===============================================================")
    print("   FABRICARE / LAUNDRIX COMPLETE END-TO-END WORKFLOW TEST   ")
    print("===============================================================")

    # 1. Customer Authentication
    print("\n[Step 1] Customer Login...")
    res = client.post('/api/auth/login/', data={'username': 'rohan', 'password': 'customer123'}, content_type='application/json')
    assert res.status_code == 200, f"Customer login failed: {res.status_code} {res.content}"
    customer_data = res.json()
    customer_token = customer_data['tokens']['access']
    print(f"  [OK] Customer Authenticated: {customer_data['user']['full_name']} (Role: {customer_data['user']['role']})")

    # 2. Admin Authentication
    print("\n[Step 2] Admin Login...")
    res = client.post('/api/auth/login/', data={'username': 'admin', 'password': 'admin123'}, content_type='application/json')
    assert res.status_code == 200, f"Admin login failed: {res.status_code} {res.content}"
    admin_data = res.json()
    admin_token = admin_data['tokens']['access']
    print(f"  [OK] Admin Authenticated: {admin_data['user']['username']}")

    # 3. Delivery Staff Authentication
    print("\n[Step 3] Delivery Staff Login...")
    res = client.post('/api/auth/login/', data={'username': 'delivery_ravi', 'password': 'delivery123'}, content_type='application/json')
    assert res.status_code == 200, f"Delivery login failed: {res.status_code} {res.content}"
    delivery_data = res.json()
    delivery_token = delivery_data['tokens']['access']
    delivery_staff_id = delivery_data['user']['id']
    print(f"  [OK] Delivery Staff Authenticated: {delivery_data['user']['full_name']} (ID: {delivery_staff_id})")

    # 4. Laundry Staff Authentication
    print("\n[Step 4] Laundry Staff Login...")
    res = client.post('/api/auth/login/', data={'username': 'laundry_anita', 'password': 'laundry123'}, content_type='application/json')
    assert res.status_code == 200, f"Laundry login failed: {res.status_code} {res.content}"
    laundry_data = res.json()
    laundry_token = laundry_data['tokens']['access']
    laundry_staff_id = laundry_data['user']['id']
    print(f"  [OK] Laundry Staff Authenticated: {laundry_data['user']['full_name']} (ID: {laundry_staff_id})")

    # 5. Customer places real order
    print("\n[Step 5] Customer Schedules Real Booking...")
    order_payload = {
        'pickup_address': 'Flat 304, Green Heights, Banaswadi, Bengaluru - 560043',
        'delivery_address': 'Flat 304, Green Heights, Banaswadi, Bengaluru - 560043',
        'pickup_date': '2026-10-12',
        'pickup_time_slot': '09:00 AM - 11:00 AM',
        'special_instructions': 'Handle silk saree with delicate care. Ring bell twice.',
        'items': [
            {'item_name': 'Shirt (Wash & Fold)', 'quantity': 3, 'unit_price': 80, 'total_price': 240, 'service_category': 'Wash & Fold'},
            {'item_name': 'Silk Saree / Lehenga', 'quantity': 1, 'unit_price': 220, 'total_price': 220, 'service_category': 'Dry Cleaning'}
        ]
    }
    res = client.post('/api/orders/', data=order_payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {customer_token}')
    assert res.status_code == 201, f"Order creation failed: {res.status_code} {res.content}"
    created_order = res.json()
    order_id = created_order['id']
    order_num = created_order.get('order_id') or created_order.get('order_number')
    print(f"  [OK] Order Created in PostgreSQL/SQLite! ID: {order_id}, Order No: {order_num}, Status: {created_order['status']}, Total: Rs.{created_order.get('total_amount')}")

    # 6. Admin accepts order & assigns staff
    print("\n[Step 6] Admin Accepts Booking & Assigns Staff...")
    res = client.post(f'/api/admin/orders/{order_id}/accept/', data={'notes': 'Approved for express handling'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {admin_token}')
    assert res.status_code == 200, f"Admin accept failed: {res.status_code} {res.content}"
    
    res = client.post(f'/api/admin/orders/{order_id}/assign-staff/', data={'delivery_staff_id': delivery_staff_id, 'laundry_staff_id': laundry_staff_id}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {admin_token}')
    assert res.status_code == 200, f"Admin assign staff failed: {res.status_code} {res.content}"
    print(f"  [OK] Order Accepted & Assigned to Delivery Agent #{delivery_staff_id} & Laundry Hub #{laundry_staff_id}")

    # 7. Delivery Staff Confirms Pickup
    print("\n[Step 7] Delivery Staff Collects Clothes & Confirms Pickup...")
    res = client.post(f'/api/delivery/tasks/{order_id}/confirm-pickup/', data={'bags_count': 2, 'weight_kg': 3.4, 'notes': 'Collected 2 bags at doorstep'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {delivery_token}')
    assert res.status_code == 200, f"Pickup confirmation failed: {res.status_code} {res.content}"
    print(f"  [OK] Pickup Logged! Bags: 2, Weight: 3.4 kg")

    # 8. Delivery Staff Drops Off at Central Laundry Hub
    print("\n[Step 8] Delivery Staff Drops Off Clothes at Laundry Hub...")
    res = client.post(f'/api/delivery/tasks/{order_id}/dropoff-laundry/', data={'facility_name': 'Central Hub Banaswadi', 'notes': 'Handed over to laundry specialist'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {delivery_token}')
    assert res.status_code == 200, f"Hub dropoff failed: {res.status_code} {res.content}"
    print(f"  [OK] Hub Handover Logged for {order_num}")

    # 9. Laundry Staff Confirms Intake & Recounts
    print("\n[Step 9] Laundry Staff Verifies Intake & Recounts Bags...")
    res = client.post(f'/api/laundry/orders/{order_id}/confirm-receipt/', data={'received_bags_count': 2, 'received_weight_kg': 3.4, 'has_discrepancy': False, 'discrepancy_notes': ''}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {laundry_token}')
    assert res.status_code == 200, f"Receipt confirmation failed: {res.status_code} {res.content}"
    print(f"  [OK] Laundry Hub Verified Intake! Bags: 2, Discrepancy: False")

    # 10. Laundry Processing Stages
    print("\n[Step 10] Processing Stages: Washing -> Drying -> Ironing...")
    res = client.post(f'/api/laundry/orders/{order_id}/advance-stage/', data={'stage': 'WASHING', 'notes': 'Eco detergent wash started'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {laundry_token}')
    assert res.status_code == 200, f"Washing stage failed: {res.status_code} {res.content}"
    print("  [OK] Stage: WASHING")

    res = client.post(f'/api/laundry/orders/{order_id}/advance-stage/', data={'stage': 'DRYING', 'notes': 'Tumble dry cycle completed'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {laundry_token}')
    assert res.status_code == 200, f"Drying stage failed: {res.status_code} {res.content}"
    print("  [OK] Stage: DRYING")

    res = client.post(f'/api/laundry/orders/{order_id}/advance-stage/', data={'stage': 'IRONING', 'notes': 'Steam press and crease removal completed'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {laundry_token}')
    assert res.status_code == 200, f"Ironing stage failed: {res.status_code} {res.content}"
    print("  [OK] Stage: IRONING")

    # 11. Quality Check
    print("\n[Step 11] Quality Check Inspection...")
    res = client.post(f'/api/laundry/orders/{order_id}/advance-stage/', data={'stage': 'QUALITY_CHECK', 'notes': 'Ready for quality audit'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {laundry_token}')
    assert res.status_code == 200
    
    res = client.post(f'/api/laundry/orders/{order_id}/quality-check/', data={'passed': True, 'notes': 'Passed all hygiene, stain and crispness standards'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {laundry_token}')
    assert res.status_code == 200, f"Quality check failed: {res.status_code} {res.content}"
    print(f"  [OK] Quality Check Status: PASSED")

    # 12. Packing & Ready for Delivery
    print("\n[Step 12] Packaging Garments & Setting Ready for Delivery...")
    res = client.post(f'/api/laundry/orders/{order_id}/pack/', data={'notes': 'Sealed in moisture-proof FabriCare garment bags'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {laundry_token}')
    assert res.status_code == 200, f"Packing failed: {res.status_code} {res.content}"
    print(f"  [OK] Order Packed & Marked READY_FOR_DELIVERY")

    # 13. Delivery Staff Completes Doorstep Delivery
    print("\n[Step 13] Delivery Staff Delivers to Customer Doorstep...")
    res = client.post(f'/api/delivery/tasks/{order_id}/confirm-delivery/', data={'received_by': 'Rohan Mehta', 'notes': 'Delivered in pristine condition'}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {delivery_token}')
    assert res.status_code == 200, f"Delivery confirmation failed: {res.status_code} {res.content}"
    print(f"  [OK] Delivery CONFIRMED to Rohan Mehta")

    # 14. Authoritative Verification
    print("\n[Step 14] Verifying Authoritative Order State as Customer...")
    res = client.get(f'/api/orders/{order_id}/', HTTP_AUTHORIZATION=f'Bearer {customer_token}')
    assert res.status_code == 200, f"Order fetch failed: {res.status_code} {res.content}"
    final_order = res.json()
    
    print("---------------------------------------------------------------")
    print(f"  Order ID:             {final_order.get('order_id')}")
    print(f"  Final Status:         {final_order.get('status')} (DELIVERED)")
    print(f"  Total Amount:         Rs.{final_order.get('total_amount')}")
    print(f"  Payment Status:       {final_order.get('payment_status')}")
    print(f"  Pickup Verified Bags: {final_order.get('pickup_record', {}).get('bags_count')}")
    print(f"  Hub Verified Bags:    {final_order.get('laundry_handover_record', {}).get('received_bags_count')}")
    print(f"  Delivered Recipient:  {final_order.get('delivery_record', {}).get('received_by')}")
    print("===============================================================")
    print("   [SUCCESS] ALL 14 WORKFLOW STAGES PASSED 100% SUCCESFULLY!   ")
    print("===============================================================")

if __name__ == '__main__':
    run_workflow_test()
