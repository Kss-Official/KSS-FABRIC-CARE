import os
import sys
import django
from datetime import datetime, date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.utils import timezone
from apps.core.models import ComplaintReport, Order, SupportTicket
from apps.users.models import User

def seed_all():
    print("Seeding Complaints (Delivery Reports) & Support Tickets...")

    delivery_driver = User.objects.filter(role=User.Role.DELIVERY_STAFF).first()
    customer = User.objects.filter(role=User.Role.CUSTOMER).first()
    if not customer:
        customer = User.objects.first()

    # 1. SEED COMPLAINTS FOR DELIVERY REPORTS (Matching Reference Image 3)
    # Total: 28, Pending Reschedule: 7, Rescheduled: 13, Resolved: 5, Under Review: 3
    ComplaintReport.objects.all().delete()

    complaints_data = [
        # Image 3 visible rows
        {
            "order_id_display": "#FC1024",
            "customer_name": "Rohit Sharma",
            "customer_phone": "+91 98765 43210",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 16, 4, 54, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 18),
            "rescheduled_date": date(2026, 10, 18),
            "rescheduled_time_slot": "10:00 AM – 12:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Customer requested redelivery for 18 Oct morning."
        },
        {
            "order_id_display": "#FCA81CC",
            "customer_name": "Rohit Sharma",
            "customer_phone": "+91 98765 43210",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 15, 4, 15, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 19),
            "rescheduled_date": date(2026, 10, 19),
            "rescheduled_time_slot": "12:00 PM – 02:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Customer replied via SMS for 19 Oct slot."
        },
        {
            "order_id_display": "#FCEB0F4",
            "customer_name": "Rohit Sharma",
            "customer_phone": "+91 98765 43210",
            "failure_reason": "Address Issue",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2026, 10, 13, 12, 2, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.UNDER_REVIEW,
            "notes": "Gate number mismatch on address line."
        },
        {
            "order_id_display": "#FC88B84",
            "customer_name": "Rohit Sharma",
            "customer_phone": "+91 98765 43210",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 13, 8, 48, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 17),
            "rescheduled_date": date(2026, 10, 17),
            "rescheduled_time_slot": "02:00 PM – 04:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled to 17 Oct afternoon."
        },
        # Additional complaints to reach exact counts: 28 total (7 pending, 13 rescheduled, 5 resolved, 3 under review)
        {
            "order_id_display": "#FC1020",
            "customer_name": "Priya Sharma",
            "customer_phone": "+91 98712 34567",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 12, 14, 20, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Need customer to choose new slot."
        },
        {
            "order_id_display": "#FC1019",
            "customer_name": "Rahul Mehta",
            "customer_phone": "+91 99001 22334",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 12, 11, 10, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Awaiting customer callback."
        },
        {
            "order_id_display": "#FC1018",
            "customer_name": "Ananya Rao",
            "customer_phone": "+91 91234 56789",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2026, 10, 11, 16, 45, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Customer out of town."
        },
        {
            "order_id_display": "#FC1017",
            "customer_name": "Vikram Singh",
            "customer_phone": "+91 98111 44556",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 11, 15, 30, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Customer requested callback tomorrow."
        },
        {
            "order_id_display": "#FC1016",
            "customer_name": "Kavita Nair",
            "customer_phone": "+91 97654 32109",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 10, 10, 15, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Doorbell ring no response."
        },
        {
            "order_id_display": "#FC1015",
            "customer_name": "Deepak Joshi",
            "customer_phone": "+91 98222 33445",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2026, 10, 10, 9, 30, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "Resident in meeting."
        },
        {
            "order_id_display": "#FC1014",
            "customer_name": "Meera Iyer",
            "customer_phone": "+91 99123 45678",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 9, 17, 0, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.PENDING_RESCHEDULE,
            "notes": "No one at residence."
        },
        # 10 more rescheduled to make 13 rescheduled total:
        {
            "order_id_display": "#FC1013",
            "customer_name": "Arjun Kapoor",
            "customer_phone": "+91 98333 44556",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 9, 14, 10, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 17),
            "rescheduled_date": date(2026, 10, 17),
            "rescheduled_time_slot": "10:00 AM – 12:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1012",
            "customer_name": "Pooja Hegde",
            "customer_phone": "+91 98444 55667",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 8, 16, 20, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 18),
            "rescheduled_date": date(2026, 10, 18),
            "rescheduled_time_slot": "04:00 PM – 06:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1011",
            "customer_name": "Siddharth Sen",
            "customer_phone": "+91 98555 66778",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2026, 10, 8, 11, 40, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 16),
            "rescheduled_date": date(2026, 10, 16),
            "rescheduled_time_slot": "02:00 PM – 04:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1010",
            "customer_name": "Sunita Rao",
            "customer_phone": "+91 98666 77889",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 7, 15, 50, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 19),
            "rescheduled_date": date(2026, 10, 19),
            "rescheduled_time_slot": "10:00 AM – 12:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1009",
            "customer_name": "Ramesh Kumar",
            "customer_phone": "+91 98777 88990",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 7, 12, 30, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 20),
            "rescheduled_date": date(2026, 10, 20),
            "rescheduled_time_slot": "12:00 PM – 02:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1008",
            "customer_name": "Divya Prakash",
            "customer_phone": "+91 98888 99001",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2026, 10, 6, 14, 0, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 18),
            "rescheduled_date": date(2026, 10, 18),
            "rescheduled_time_slot": "02:00 PM – 04:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1007",
            "customer_name": "Manish Tiwari",
            "customer_phone": "+91 98999 00112",
            "failure_reason": "Location Not Found",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 6, 10, 45, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 17),
            "rescheduled_date": date(2026, 10, 17),
            "rescheduled_time_slot": "10:00 AM – 12:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1006",
            "customer_name": "Swati Deshmukh",
            "customer_phone": "+91 99000 11223",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 5, 16, 15, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 19),
            "rescheduled_date": date(2026, 10, 19),
            "rescheduled_time_slot": "04:00 PM – 06:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1005",
            "customer_name": "Gaurav Bhatt",
            "customer_phone": "+91 99111 22334",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2026, 10, 5, 13, 20, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 18),
            "rescheduled_date": date(2026, 10, 18),
            "rescheduled_time_slot": "12:00 PM – 02:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        {
            "order_id_display": "#FC1004",
            "customer_name": "Ritu Saxena",
            "customer_phone": "+91 99222 33445",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 4, 11, 0, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 16),
            "rescheduled_date": date(2026, 10, 16),
            "rescheduled_time_slot": "10:00 AM – 12:00 PM",
            "status": ComplaintReport.Status.RESCHEDULED,
            "notes": "Rescheduled."
        },
        # 5 Resolved:
        {
            "order_id_display": "#FC1003",
            "customer_name": "Alok Mishra",
            "customer_phone": "+91 99333 44556",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 4, 15, 30, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 12),
            "rescheduled_date": date(2026, 10, 12),
            "rescheduled_time_slot": "10:00 AM – 12:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "Delivered successfully on rescheduled date."
        },
        {
            "order_id_display": "#FC1002",
            "customer_name": "Shalini Pandey",
            "customer_phone": "+91 99444 55667",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2026, 10, 3, 16, 40, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 11),
            "rescheduled_date": date(2026, 10, 11),
            "rescheduled_time_slot": "02:00 PM – 04:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "Delivered successfully."
        },
        {
            "order_id_display": "#FC1001",
            "customer_name": "Harish Patel",
            "customer_phone": "+91 99555 66778",
            "failure_reason": "Address Issue",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 3, 10, 15, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 10),
            "rescheduled_date": date(2026, 10, 10),
            "rescheduled_time_slot": "12:00 PM – 02:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "Delivered after address correction."
        },
        {
            "order_id_display": "#FC1000",
            "customer_name": "Preeti Verma",
            "customer_phone": "+91 99666 77889",
            "failure_reason": "Customer Not Responding",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 10, 2, 14, 45, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 9),
            "rescheduled_date": date(2026, 10, 9),
            "rescheduled_time_slot": "04:00 PM – 06:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "Completed."
        },
        {
            "order_id_display": "#FC0999",
            "customer_name": "Naveen Chawla",
            "customer_phone": "+91 99777 88990",
            "failure_reason": "Customer Unavailable",
            "reported_by_name": "Suresh Yadav (Delivery Staff)",
            "report_date": datetime(2026, 10, 1, 11, 20, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": date(2026, 10, 8),
            "rescheduled_date": date(2026, 10, 8),
            "rescheduled_time_slot": "10:00 AM – 12:00 PM",
            "status": ComplaintReport.Status.RESOLVED,
            "notes": "Delivered."
        },
        # 2 more Under Review to make 3 Under Review total (4 + 7 + 12 + 5 = 28)
        {
            "order_id_display": "#FC0998",
            "customer_name": "Geeta Nambiar",
            "customer_phone": "+91 99888 99001",
            "failure_reason": "Location Not Found",
            "reported_by_name": "Amit Singh (Delivery Staff)",
            "report_date": datetime(2026, 10, 1, 16, 50, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.UNDER_REVIEW,
            "notes": "Pin location outside city bounds."
        },
        {
            "order_id_display": "#FC0997",
            "customer_name": "Sanjay Kapoor",
            "customer_phone": "+91 99999 00112",
            "failure_reason": "Address Issue",
            "reported_by_name": "Rohit Kumar (Delivery Staff)",
            "report_date": datetime(2026, 9, 30, 12, 10, tzinfo=timezone.get_current_timezone()),
            "requested_reschedule_date": None,
            "rescheduled_date": None,
            "rescheduled_time_slot": None,
            "status": ComplaintReport.Status.UNDER_REVIEW,
            "notes": "Building demolished / under construction."
        }
    ]

    for item in complaints_data:
        order = Order.objects.filter(order_id__iexact=item["order_id_display"].replace('#', '')).first()
        if not order:
            order = Order.objects.filter(order_id=item["order_id_display"]).first()
        ComplaintReport.objects.create(
            order=order,
            order_id_display=item["order_id_display"],
            customer_name=item["customer_name"],
            customer_phone=item["customer_phone"],
            failure_reason=item["failure_reason"],
            reported_by_name=item["reported_by_name"],
            reported_by=delivery_driver,
            report_date=item["report_date"],
            requested_reschedule_date=item["requested_reschedule_date"],
            rescheduled_date=item["rescheduled_date"],
            rescheduled_time_slot=item["rescheduled_time_slot"],
            status=item["status"],
            notes=item["notes"]
        )

    print(f"Complaint reports seeded: {ComplaintReport.objects.count()}")

    # 2. SEED SUPPORT TICKETS FOR HELP & SUPPORT (Matching Reference Image 4)
    # Real customer support tickets matching Firebase RTDB
    dt_poobi_yesterday = datetime(2026, 10, 24, 18, 9, 32, 495981, tzinfo=tz)
    dt_kuhu_1 = datetime(2026, 10, 23, 18, 23, 54, 630421, tzinfo=tz)
    dt_kuhu_2 = datetime(2026, 10, 23, 19, 9, 23, 27442, tzinfo=tz)

    poobi_user, _ = User.objects.get_or_create(
        email='poobi@gmail.com',
        defaults={'username': 'poobi', 'first_name': 'Poobi', 'role': User.Role.CUSTOMER}
    )
    kuhu_user, _ = User.objects.get_or_create(
        email='kuhu890@gamil.com',
        defaults={'username': 'kuhu', 'first_name': 'Kuhu', 'role': User.Role.CUSTOMER}
    )

    tickets_data = [
        {
            "customer": poobi_user,
            "ticket_number": "#SUP-5361",
            "customer_name": "Poobi",
            "customer_email": "poobi@gmail.com",
            "subject": "helooooooo",
            "priority": SupportTicket.Priority.MEDIUM,
            "status": SupportTicket.Status.OPEN,
            "message": "fghjkfd",
            "created_at": dt_poobi_yesterday,
            "admin_reply": None
        },
        {
            "customer": kuhu_user,
            "ticket_number": "#SUP-3068",
            "customer_name": "Kuhu",
            "customer_email": "kuhu890@gamil.com",
            "subject": "FC-46555 ertyui",
            "priority": SupportTicket.Priority.HIGH,
            "status": SupportTicket.Status.OPEN,
            "message": "asdfghj",
            "created_at": dt_kuhu_2,
            "admin_reply": None
        },
        {
            "customer": kuhu_user,
            "ticket_number": "#SUP-1280",
            "customer_name": "Kuhu",
            "customer_email": "kuhu890@gamil.com",
            "subject": "FC-46655 , delay",
            "priority": SupportTicket.Priority.MEDIUM,
            "status": SupportTicket.Status.OPEN,
            "message": "cvbn",
            "created_at": dt_kuhu_1,
            "admin_reply": None
        }
    ]

    for td in tickets_data:
        t = SupportTicket(
            customer=td["customer"],
            ticket_number=td["ticket_number"],
            customer_name=td["customer_name"],
            customer_email=td["customer_email"],
            subject=td["subject"],
            priority=td["priority"],
            status=td["status"],
            message=td["message"],
            admin_reply=td.get("admin_reply")
        )
        t.save()
        # Override auto_now_add
        SupportTicket.objects.filter(pk=t.pk).update(created_at=td["created_at"])

    print(f"Real support tickets in database: {SupportTicket.objects.count()}")
    print("Done!")

if __name__ == "__main__":
    seed_all()
