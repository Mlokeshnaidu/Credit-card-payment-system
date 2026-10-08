"""
Professional Financial Monthly Statement PDF Generator using ReportLab
"""
import io
import datetime
from decimal import Decimal
from django.db.models import Sum, Count, Q
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas
from .models import Transaction
from cards.models import Card


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic 'Page X of Y' footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            super().showPage()
        super().save()

    def draw_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        footer_text = f"CCPay Payments Inc. | Confidential Monthly Account Statement | Page {self._pageNumber} of {page_count}"
        self.drawCentredString(letter[0] / 2.0, 30, footer_text)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 42, letter[0] - 40, 42)
        self.restoreState()


def build_monthly_statement_pdf(user, year, month, card_id=None):
    """
    Compiles monthly transactions and card metrics into a high-caliber PDF statement.
    Returns: BytesIO buffer containing the PDF binary.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=55,
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#475569'),
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=6,
    )
    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569'),
    )
    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a'),
    )
    table_hdr = ParagraphStyle(
        'TableHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1e293b'),
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a'),
    )

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>CC<font color='#2563eb'>Pay</font></b> FINANCIAL SERVICES", title_style),
            Paragraph("<b>MONTHLY STATEMENT OF ACCOUNT</b><br/><font color='#64748b'>E-Statement Copy</font>", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[330, 202])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563eb"), spaceAfter=14, spaceBefore=4))

    # Month name
    month_name = datetime.date(year, month, 1).strftime("%B %Y")
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 2. Account & Statement Meta
    primary_card = None
    if card_id:
        primary_card = Card.objects.filter(id=card_id, user=user).first()
    if not primary_card:
        primary_card = Card.objects.filter(user=user, is_default=True).first() or Card.objects.filter(user=user).first()

    card_masked = primary_card.masked_card_number if primary_card else 'All Registered Cards'
    card_type = primary_card.card_type if primary_card else 'Multi-Card'
    bank_name = primary_card.bank_name if primary_card and primary_card.bank_name else 'CCPay Partner Bank'
    credit_limit = float(primary_card.credit_limit) if primary_card else 50000.00
    available_limit = primary_card.get_available_limit() if primary_card else 50000.00

    info_data = [
        [
            Paragraph("<b>Account Holder:</b>", meta_label),
            Paragraph(user.full_name or user.username, meta_val),
            Paragraph("<b>Statement Period:</b>", meta_label),
            Paragraph(month_name, meta_val),
        ],
        [
            Paragraph("<b>Email:</b>", meta_label),
            Paragraph(user.email, meta_val),
            Paragraph("<b>Statement Date:</b>", meta_label),
            Paragraph(now_str, meta_val),
        ],
        [
            Paragraph("<b>Primary Card:</b>", meta_label),
            Paragraph(f"{card_masked} ({card_type})", meta_val),
            Paragraph("<b>Issuing Institution:</b>", meta_label),
            Paragraph(bank_name, meta_val),
        ],
    ]
    info_table = Table(info_data, colWidths=[95, 170, 110, 157])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    # 3. Query Transactions for the month
    txns_qs = Transaction.objects.filter(
        user=user,
        created_at__year=year,
        created_at__month=month
    )
    if card_id:
        txns_qs = txns_qs.filter(card_id=card_id)
    txns = list(txns_qs.order_by('-created_at'))

    # Calculate summary metrics
    total_txns = len(txns)
    success_txns = [t for t in txns if t.status == 'SUCCESS']
    failed_txns = [t for t in txns if t.status == 'FAILED']
    total_spent = sum(float(t.amount) for t in success_txns)
    currency = txns[0].currency if txns else 'INR'

    # 4. Financial Summary Cards Box
    story.append(Paragraph("FINANCIAL SUMMARY & CREDIT OVERVIEW", section_heading))

    summary_box_data = [
        [
            Paragraph(f"<b>Total Spent</b><br/><font size='13' color='#1e3a8a'><b>Rs. {total_spent:,.2f}</b></font>", meta_val),
            Paragraph(f"<b>Credit Limit</b><br/><font size='13' color='#0f172a'><b>Rs. {credit_limit:,.2f}</b></font>", meta_val),
            Paragraph(f"<b>Available Credit</b><br/><font size='13' color='#16a34a'><b>Rs. {available_limit:,.2f}</b></font>", meta_val),
            Paragraph(f"<b>Txn Breakdown</b><br/><font size='11' color='#475569'><b>{len(success_txns)} OK / {len(failed_txns)} Fail</b></font>", meta_val),
        ]
    ]
    summary_table = Table(summary_box_data, colWidths=[133, 133, 133, 133])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 16))

    # 5. Itemized Transaction History
    story.append(Paragraph(f"ITEMIZED TRANSACTIONS ({total_txns} Records)", section_heading))

    table_rows = [
        [
            Paragraph("Date & Time", table_hdr),
            Paragraph("Transaction ID", table_hdr),
            Paragraph("Description / Merchant", table_hdr),
            Paragraph("Card Used", table_hdr),
            Paragraph("Status", table_hdr),
            Paragraph("Amount", table_hdr),
        ]
    ]

    if txns:
        for idx, t in enumerate(txns):
            dt_str = t.created_at.strftime("%d-%b-%Y %H:%M")
            card_info = t.card.masked_card_number if t.card else 'N/A'
            status_color = "#16a34a" if t.status == 'SUCCESS' else ("#dc2626" if t.status == 'FAILED' else "#d97706")
            desc = t.description or t.merchant_name or 'Card Transaction'

            status_p = Paragraph(f"<font color='{status_color}'><b>{t.status}</b></font>", table_cell_bold)
            amount_p = Paragraph(f"<b>Rs. {float(t.amount):,.2f}</b>", table_cell_bold)

            table_rows.append([
                Paragraph(dt_str, table_cell),
                Paragraph(t.transaction_id, table_cell),
                Paragraph(desc[:28], table_cell),
                Paragraph(card_info, table_cell),
                status_p,
                amount_p,
            ])
    else:
        empty_p = Paragraph("<i>No transactions recorded for this billing cycle.</i>", table_cell)
        table_rows.append([empty_p, "", "", "", "", ""])

    tx_table = Table(table_rows, colWidths=[90, 95, 135, 87, 55, 70], repeatRows=1)
    
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]

    # Alternating row colors
    if txns:
        for i in range(1, len(table_rows)):
            bg = colors.HexColor('#ffffff') if i % 2 != 0 else colors.HexColor('#f8fafc')
            t_style.append(('BACKGROUND', (0, i), (-1, i), bg))
            t_style.append(('LINEBELOW', (0, i), (-1, i), 0.5, colors.HexColor('#e2e8f0')))
    else:
        t_style.append(('SPAN', (0, 1), (-1, 1)))
        t_style.append(('ALIGN', (0, 1), (-1, 1), 'CENTER'))

    tx_table.setStyle(TableStyle(t_style))
    story.append(tx_table)
    story.append(Spacer(1, 16))

    # 6. Legal & Security Notice
    disclaimer = Paragraph(
        "<b>Important Notice:</b> This statement is an electronically generated legal accounting document and does not require a physical signature. "
        "Any discrepancies must be reported within 30 days of the statement date. Never share your CVV, PIN, or OTP with anyone. "
        "CCPay Customer Support: 1800-000-CCPAY | support@ccpay.com",
        ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#64748b'),
        )
    )
    story.append(disclaimer)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
