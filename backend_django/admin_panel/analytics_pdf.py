"""
Executive Analytics Summary PDF Generator using ReportLab
Generates PDF containing:
- Executive Summary KPIs
- Monthly Spending Trends
- Category-Wise Expense Distribution
- Fraud & Risk Detection Summary
- System Health Overview
"""

import io
import datetime
from decimal import Decimal
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas

from accounts.models import User
from cards.models import Card
from transactions.models import Transaction, FraudLog
from admin_panel.models import SystemMetric


class NumberedCanvas(canvas.Canvas):
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
        footer_text = f"CCPay Operations | Executive Analytics Summary Report | Page {self._pageNumber} of {page_count}"
        self.drawCentredString(letter[0] / 2.0, 30, footer_text)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 42, letter[0] - 40, 42)
        self.restoreState()


def build_analytics_summary_pdf(admin_user):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a")
    )
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b")
    )

    elements = []
    now = timezone.now()

    # Header
    elements.append(Paragraph("CCPAY FINANCIAL OPERATIONS", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#2563eb'), spaceAfter=4)))
    elements.append(Paragraph("Executive Analytics & Risk Summary", title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"Generated: {now.strftime('%B %d, %Y at %H:%M UTC')} | Requested by: {admin_user.email} ({admin_user.role})", meta_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=14))

    # High Level Metrics Table
    total_users = User.objects.count()
    total_cards = Card.objects.count()
    total_txns = Transaction.objects.count()
    success_txns = Transaction.objects.filter(status='SUCCESS')
    total_volume = float(success_txns.aggregate(total=Sum('amount'))['total'] or 0.0)
    avg_txn_value = float(success_txns.aggregate(avg=Avg('amount'))['avg'] or 0.0)
    fraud_alerts_count = FraudLog.objects.count()
    pending_fraud_count = FraudLog.objects.filter(review_status='PENDING_REVIEW').count()

    elements.append(Paragraph("1. Executive Platform KPIs", section_style))

    kpi_data = [
        [
            Paragraph(f"<b>Total Users:</b> {total_users}", body_style),
            Paragraph(f"<b>Active Cards:</b> {total_cards}", body_style),
            Paragraph(f"<b>Total Transactions:</b> {total_txns}", body_style)
        ],
        [
            Paragraph(f"<b>Total Volume:</b> ₹{total_volume:,.2f}", body_style),
            Paragraph(f"<b>Avg Transaction:</b> ₹{avg_txn_value:,.2f}", body_style),
            Paragraph(f"<b>Fraud Alerts:</b> {fraud_alerts_count} ({pending_fraud_count} pending)", body_style)
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[180, 180, 172])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 14))

    # Category Wise Breakdown
    elements.append(Paragraph("2. Category-Wise Expense Distribution", section_style))
    category_grouped = success_txns.values('category').annotate(
        total_amount=Sum('amount'),
        txn_count=Count('id')
    ).order_by('-total_amount')

    cat_labels = dict(Transaction.CATEGORY_CHOICES)
    cat_rows = [[
        Paragraph("<b>Category</b>", body_style),
        Paragraph("<b>Total Volume (₹)</b>", body_style),
        Paragraph("<b>Count</b>", body_style),
        Paragraph("<b>Share (%)</b>", body_style)
    ]]

    for cg in category_grouped[:8]:
        cat_key = cg['category'] or 'OTHER'
        amount = float(cg['total_amount'] or 0.0)
        share = (amount / total_volume * 100) if total_volume > 0 else 0.0
        cat_rows.append([
            Paragraph(cat_labels.get(cat_key, cat_key.title()), body_style),
            Paragraph(f"₹{amount:,.2f}", body_style),
            Paragraph(str(cg['txn_count']), body_style),
            Paragraph(f"{share:.1f}%", body_style),
        ])

    if len(cat_rows) == 1:
        cat_rows.append([Paragraph("No transactions recorded yet", body_style), "-", "-", "-"])

    cat_table = Table(cat_rows, colWidths=[172, 140, 100, 120])
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    elements.append(cat_table)
    elements.append(Spacer(1, 14))

    # Fraud & Risk Summary
    elements.append(Paragraph("3. Fraud Detection & Risk Alert Ledger", section_style))
    recent_fraud = FraudLog.objects.select_related('transaction', 'card').order_by('-timestamp')[:5]

    fraud_rows = [[
        Paragraph("<b>Transaction ID</b>", body_style),
        Paragraph("<b>Rule Triggered</b>", body_style),
        Paragraph("<b>Risk Score</b>", body_style),
        Paragraph("<b>Status</b>", body_style)
    ]]

    for fl in recent_fraud:
        fraud_rows.append([
            Paragraph(fl.transaction.transaction_id, body_style),
            Paragraph(fl.rule_triggered, body_style),
            Paragraph(f"{fl.risk_score}/100", body_style),
            Paragraph(fl.review_status, body_style)
        ])

    if len(fraud_rows) == 1:
        fraud_rows.append([Paragraph("All transactions clean - No fraud alerts detected", body_style), "-", "-", "-"])

    fraud_table = Table(fraud_rows, colWidths=[140, 180, 92, 120])
    fraud_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#fef2f2")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#fecaca")),
    ]))
    elements.append(fraud_table)

    doc.build(elements, canvasmaker=NumberedCanvas)
    return buffer
