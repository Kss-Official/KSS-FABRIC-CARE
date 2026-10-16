import io
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.firebase import get_bucket
from app.repositories import invoice_repo


def generate_invoice_pdf_bytes(invoice: Dict[str, Any], order: Optional[Dict[str, Any]] = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0D9488"),
    )
    normal_style = styles["Normal"]
    bold_style = ParagraphStyle(
        "BoldStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph("<b>FabriCare Premium Laundry</b>", title_style))
    elements.append(Paragraph("Smart Fabric Care & Dry Cleaning Services", normal_style))
    elements.append(Spacer(1, 15))
    
    # Invoice Metadata
    invoice_no = invoice.get("invoice_no", "INV-UNKNOWN")
    issued_at = invoice.get("issued_at", "")[:10]
    order_code = invoice.get("order_code", "")
    status = invoice.get("status", "PAID").upper()
    
    meta_data = [
        [
            Paragraph(f"<b>Invoice No:</b> {invoice_no}", normal_style),
            Paragraph(f"<b>Date:</b> {issued_at}", normal_style),
        ],
        [
            Paragraph(f"<b>Order Code:</b> {order_code}", normal_style),
            Paragraph(f"<b>Status:</b> <font color='{'green' if status=='PAID' else 'red'}'>{status}</font>", normal_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[270, 260])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))
    
    # Items Table
    line_items = invoice.get("line_items", [])
    table_data = [
        [
            Paragraph("<b>Item Description</b>", bold_style),
            Paragraph("<b>Qty</b>", bold_style),
            Paragraph("<b>Unit Price</b>", bold_style),
            Paragraph("<b>Total</b>", bold_style),
        ]
    ]
    
    for item in line_items:
        desc = item.get("garment", "Garment")
        services = item.get("services", [])
        if services and isinstance(services, list):
            s_names = [s.get("name") if isinstance(s, dict) else str(s) for s in services]
            desc += f" ({', '.join(s_names)})"
            
        qty = item.get("quantity", 1)
        unit_paise = item.get("unit_price_paise", 0)
        item_total_paise = unit_paise * qty
        
        table_data.append([
            Paragraph(desc, normal_style),
            Paragraph(str(qty), normal_style),
            Paragraph(f"Rs. {unit_paise / 100:.2f}", normal_style),
            Paragraph(f"Rs. {item_total_paise / 100:.2f}", normal_style),
        ])
        
    # Express charge if any
    amount_paise = invoice.get("amount_paise", 0)
    subtotal_paise = sum(it.get("unit_price_paise", 0) * it.get("quantity", 1) for it in line_items)
    express_paise = max(0, amount_paise - subtotal_paise)
    if express_paise > 0:
        table_data.append([
            Paragraph("Express Service Surcharge", normal_style),
            Paragraph("1", normal_style),
            Paragraph(f"Rs. {express_paise / 100:.2f}", normal_style),
            Paragraph(f"Rs. {express_paise / 100:.2f}", normal_style),
        ])
        
    table_data.append([
        Paragraph("<b>Total Amount Paid</b>", bold_style),
        "",
        "",
        Paragraph(f"<b>Rs. {amount_paise / 100:.2f}</b>", bold_style),
    ])
    
    items_table = Table(table_data, colWidths=[280, 50, 100, 100])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F0FDFA")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0F766E")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 30))
    
    # Footer
    elements.append(Paragraph("Thank you for your business!", normal_style))
    elements.append(Paragraph("For support or inquiries, email support@fabricare.test", normal_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def upload_invoice_pdf(invoice_id: str, pdf_bytes: bytes) -> Optional[str]:
    try:
        bucket = get_bucket()
        if not bucket:
            return None
        blob = bucket.blob(f"invoices/{invoice_id}.pdf")
        blob.upload_from_string(pdf_bytes, content_type="application/pdf")
        blob.make_public()
        pdf_url = blob.public_url
        invoice_repo.update_invoice(invoice_id, {"pdf_url": pdf_url})
        return pdf_url
    except Exception:
        return None
