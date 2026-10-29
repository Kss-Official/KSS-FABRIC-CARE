import os
import sys
import django
from datetime import datetime, date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.utils import timezone
from apps.core.models import ComplaintReport, Order
from apps.users.models import User

def seed_complaints():
    print("Seeding Complaint Reports...")
    ComplaintReport.objects.all().delete()

    delivery_driver = User.objects.filter(role=User.Role.DELIVERY_STAFF).first()
    customer = User.objects.filter(role=User.Role.CUSTOMER).first()

    complaints_data = [
        # Page 1 (Visible in reference image)
        {
            "order_id_display": "#FC1024",
            "customer_name": "Rahul Sharma",
            "customer_phone": "+91 98765 43210",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 16, 10, 24, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2025, 10, 18),
            "rescheduled_date": None,
            "rescheduled_time_slot": "10:00 AM–12:00 PM",
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Customer did not answer door phone. Security guard stated resident is out of town until 18th Oct."
        },
        {
            "order_id_display": "#FC1023",
            "customer_name": "Priya Patel",
            "customer_phone": "+91 99887 76655",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2025, 10, 16, 9, 45, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2025, 10, 19),
            "rescheduled_date": date(2025, 10, 19),
            "rescheduled_time_slot": "12:00 PM–2:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Attempted 3 phone calls. Customer sent SMS requesting delivery on 19th Oct."
        },
        {
            "order_id_display": "#FC1022",
            "customer_name": "Neha Gupta",
            "customer_phone": "+91 91234 56789",
            "failure_reason": "Address Issue",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2025, 10, 15, 17, 32, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.UNDER_REVIEW,
            "notes": "House number 42B does not exist on 3rd Main. Landmark unclear."
        },
        {
            "order_id_display": "#FC1021",
            "customer_name": "Amit Verma",
            "customer_phone": "+91 98111 22334",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 15, 14, 18, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 17),
            "rescheduled_time_slot": "2:00 PM–4:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Customer requested redelivery on 17th Oct afternoon."
        },
        {
            "order_id_display": "#FC1020",
            "customer_name": "Sneha Reddy",
            "customer_phone": "+91 97654 32190",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Pooja Singh (Delivery Staff)",
            "report_date": datetime(2025, 10, 14, 11, 7, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.UNDER_REVIEW,
            "notes": "Doorbell out of order, phone unreachable."
        },
        {
            "order_id_display": "#FC1019",
            "customer_name": "Vikas Mehta",
            "customer_phone": "+91 93456 78901",
            "failure_reason": "Location Not Found",
            "reported_by_name": "Amit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 14, 9, 55, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 16),
            "rescheduled_time_slot": "10:00 AM–12:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Building name incorrect in app. Corrected with customer."
        },
        {
            "order_id_display": "#FC1018",
            "customer_name": "Anjali Singh",
            "customer_phone": "+91 98712 34567",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2025, 10, 13, 16, 24, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Flat locked. Need customer reschedule confirmation."
        },
        {
            "order_id_display": "#FC1017",
            "customer_name": "Karan Malhotra",
            "customer_phone": "+91 99001 12233",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 13, 13, 12, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 15),
            "rescheduled_time_slot": "4:00 PM–6:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Customer called back to reschedule."
        },

        # Page 2 items
        {
            "order_id_display": "#FC1016",
            "customer_name": "Deepak Joshi",
            "customer_phone": "+91 98450 12345",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2025, 10, 13, 10, 15, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2025, 10, 17),
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Waiting for admin confirmation."
        },
        {
            "order_id_display": "#FC1015",
            "customer_name": "Shweta Tiwari",
            "customer_phone": "+91 97412 88990",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Pooja Singh (Delivery Staff)",
            "report_date": datetime(2025, 10, 12, 16, 40, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 14),
            "rescheduled_time_slot": "10:00 AM–12:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Delivered successfully on reschedule."
        },
        {
            "order_id_display": "#FC1014",
            "customer_name": "Manoj Bajpayee",
            "customer_phone": "+91 98123 45678",
            "failure_reason": "Address Issue",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 12, 14, 20, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Gate entry denied by security guard."
        },
        {
            "order_id_display": "#FC1013",
            "customer_name": "Ayesha Khan",
            "customer_phone": "+91 99012 34567",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Amit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 11, 15, 30, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 13),
            "rescheduled_time_slot": "2:00 PM–4:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Customer confirmed new slot via app."
        },
        {
            "order_id_display": "#FC1012",
            "customer_name": "Rajesh Khanna",
            "customer_phone": "+91 98888 77665",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2025, 10, 11, 11, 10, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Customer travelling out of city."
        },
        {
            "order_id_display": "#FC1011",
            "customer_name": "Sunita Rao",
            "customer_phone": "+91 97777 66554",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Pooja Singh (Delivery Staff)",
            "report_date": datetime(2025, 10, 10, 16, 50, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 12),
            "rescheduled_time_slot": "12:00 PM–2:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Delivered successfully on 12th Oct."
        },
        {
            "order_id_display": "#FC1010",
            "customer_name": "Gaurav Kapoor",
            "customer_phone": "+91 96666 55443",
            "failure_reason": "Location Not Found",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2025, 10, 10, 12, 15, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Incorrect pin code."
        },
        {
            "order_id_display": "#FC1009",
            "customer_name": "Divya Prakash",
            "customer_phone": "+91 95555 44332",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 9, 14, 0, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 11),
            "rescheduled_time_slot": "10:00 AM–12:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Slot confirmed."
        },

        # Page 3 items
        {
            "order_id_display": "#FC1008",
            "customer_name": "Sanjay Dutt",
            "customer_phone": "+91 94444 33221",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2025, 10, 9, 9, 30, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Office closed on Saturday."
        },
        {
            "order_id_display": "#FC1007",
            "customer_name": "Ananya Roy",
            "customer_phone": "+91 93333 22110",
            "failure_reason": "Address Issue",
            "reported_by_name": "Amit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 8, 17, 10, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 10),
            "rescheduled_time_slot": "4:00 PM–6:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Address verified by support."
        },
        {
            "order_id_display": "#FC1006",
            "customer_name": "Aditya Roy",
            "customer_phone": "+91 92222 11009",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Pooja Singh (Delivery Staff)",
            "report_date": datetime(2025, 10, 8, 11, 45, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Left card at doorstep."
        },
        {
            "order_id_display": "#FC1005",
            "customer_name": "Meera Nambiar",
            "customer_phone": "+91 91111 00998",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 7, 15, 20, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 9),
            "rescheduled_time_slot": "2:00 PM–4:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Delivered successfully."
        },
        {
            "order_id_display": "#FC1004",
            "customer_name": "Farhan Akhtar",
            "customer_phone": "+91 90000 99887",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2025, 10, 7, 10, 10, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 8),
            "rescheduled_time_slot": "10:00 AM–12:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "Resolved with neighbor pickup."
        },
        {
            "order_id_display": "#FC1003",
            "customer_name": "Kavita Krishnamurthy",
            "customer_phone": "+91 89999 88776",
            "failure_reason": "Location Not Found",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2025, 10, 6, 16, 0, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 7),
            "rescheduled_time_slot": "12:00 PM–2:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "GPS pin updated."
        },
        {
            "order_id_display": "#FC1002",
            "customer_name": "Ramesh Sippy",
            "customer_phone": "+91 88888 77665",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 6, 11, 30, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 7),
            "rescheduled_time_slot": "2:00 PM–4:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "Delivered."
        },
        {
            "order_id_display": "#FC1001",
            "customer_name": "Tarun Mansukhani",
            "customer_phone": "+91 87777 66554",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Amit Kumar (Delivery Staff)",
            "report_date": datetime(2025, 10, 5, 14, 15, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": date(2025, 10, 6),
            "rescheduled_time_slot": "10:00 AM–12:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "Completed successfully."
        }
    ]

    # Link existing orders if any match or create real orders for #FC1024 so complete flow works
    order1024, _ = Order.objects.get_or_create(
        order_id="#FC1024",
        defaults={
            "customer": customer or User.objects.first(),
            "status": Order.Status.FAILED_DELIVERY,
            "pickup_full_name": "Rahul Sharma",
            "pickup_phone": "+91 98765 43210",
            "pickup_address": "Flat 402, Sunshine Residency, Indiranagar, Bengaluru - 560038",
            "pickup_date": date(2025, 10, 14),
            "pickup_time_slot": "09:00 AM - 11:00 AM",
            "delivery_address": "Flat 402, Sunshine Residency, Indiranagar, Bengaluru - 560038",
            "delivery_date": date(2025, 10, 18),
            "delivery_time_slot": "10:00 AM–12:00 PM",
            "total_amount": 540.00
        }
    )

    for item in complaints_data:
        linked_order = order1024 if item["order_id_display"] == "#FC1024" else None
        ComplaintReport.objects.create(
            order=linked_order,
            order_id_display=item["order_id_display"],
            customer_name=item["customer_name"],
            customer_phone=item["customer_phone"],
            failure_reason=item["failure_reason"],
            reported_by=delivery_driver,
            reported_by_name=item["reported_by_name"],
            report_date=item["report_date"],
            requested_reschedule_date=item["requested_reschedule_date"],
            rescheduled_date=item["rescheduled_date"],
            rescheduled_time_slot=item["rescheduled_time_slot"],
            status=item["status"],
            notes=item["notes"]
        )

    counts = {
        "total": ComplaintReport.objects.count(),
        "pending": ComplaintReport.objects.filter(status=ComplaintReport.Status.PENDING_RESCHEDULE).count(),
        "rescheduled": ComplaintReport.objects.filter(status=ComplaintReport.Status.RESCHEDULED).count(),
        "resolved": ComplaintReport.objects.filter(status__in=[ComplaintReport.Status.RESOLVED, ComplaintReport.Status.DELIVERED]).count(),
        "under_review": ComplaintReport.objects.filter(status=ComplaintReport.Status.UNDER_REVIEW).count(),
    }
    print("Seed complete! Counts:", counts)

if __name__ == '__main__':
    seed_complaints()
