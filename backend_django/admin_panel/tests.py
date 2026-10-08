"""
Sprint Items Unit Tests:
1. Automated Email Notification System (> ₹5000, Card Blocked, Credit Limit < 10%)
2. Admin Card Management (View, Block/Unblock, Update Credit Limits, Monitor Activity)
3. Monthly Statement PDF Generation
4. Security & Access Controls (Non-admin 403 checks, Blocked card transaction rejection)
"""
from decimal import Decimal
from django.test import TestCase
from django.core import mail
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User, AdminLog
from cards.models import Card
from transactions.models import Transaction
from notifications.services import (
    send_high_value_transaction_alert,
    send_card_blocked_alert,
    send_low_credit_limit_alert,
)


def get_token(client, email, password):
    resp = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
    return resp.data['tokens']['access']


class SprintEmailNotificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='cardholder@test.com',
            username='cardholder',
            full_name='Test Cardholder',
            password='TestPassword@123'
        )
        self.card = Card.objects.create(
            user=self.user,
            card_holder_name='Test Cardholder',
            last_four_digits='8888',
            masked_card_number='****-****-****-8888',
            card_type='CREDIT',
            expiry_month=12,
            expiry_year=2028,
            credit_limit=Decimal('50000.00'),
            is_blocked=False,
        )

    def test_high_value_transaction_alert_triggered(self):
        """Alert sent when transaction amount exceeds ₹5000"""
        mail.outbox.clear()
        txn = Transaction.objects.create(
            user=self.user,
            card=self.card,
            amount=Decimal('7500.00'),
            status='SUCCESS',
            transaction_id='TXN-HIGH-001',
            merchant_name='Luxury Electronics',
            description='Laptop purchase'
        )
        sent = send_high_value_transaction_alert(self.user, txn)
        self.assertTrue(sent)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('High-Value Transaction', mail.outbox[0].subject)
        self.assertIn('7,500.00', mail.outbox[0].body)
        self.assertIn('****-****-****-8888', mail.outbox[0].body)
        self.assertIn(self.user.email, mail.outbox[0].to)

    def test_low_value_transaction_does_not_trigger_alert(self):
        """Transactions <= ₹5000 should NOT trigger high-value alert"""
        mail.outbox.clear()
        txn = Transaction.objects.create(
            user=self.user,
            card=self.card,
            amount=Decimal('2500.00'),
            status='SUCCESS',
            transaction_id='TXN-LOW-001'
        )
        sent = send_high_value_transaction_alert(self.user, txn)
        self.assertFalse(sent)
        self.assertEqual(len(mail.outbox), 0)

    def test_card_blocked_alert_triggered(self):
        """Alert sent when card is blocked"""
        mail.outbox.clear()
        sent = send_card_blocked_alert(self.user, self.card, reason="Fraud investigation")
        self.assertTrue(sent)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('BLOCKED', mail.outbox[0].subject)
        self.assertIn('8888', mail.outbox[0].subject)
        self.assertIn('Fraud investigation', mail.outbox[0].body)
        self.assertIn(self.user.email, mail.outbox[0].to)

    def test_low_credit_limit_alert_triggered(self):
        """Alert sent when available credit limit falls below 10%"""
        mail.outbox.clear()
        # Limit is 50,000, 10% is 5,000. Available limit of 3,000 is 6%
        sent = send_low_credit_limit_alert(self.user, self.card, available_limit=3000.00, credit_limit=50000.00)
        self.assertTrue(sent)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Below 10%', mail.outbox[0].subject)
        self.assertIn('3,000.00', mail.outbox[0].body)

    def test_normal_credit_limit_does_not_trigger_alert(self):
        """No alert sent when available credit limit is >= 10%"""
        mail.outbox.clear()
        sent = send_low_credit_limit_alert(self.user, self.card, available_limit=15000.00, credit_limit=50000.00)
        self.assertFalse(sent)
        self.assertEqual(len(mail.outbox), 0)


class AdminCardManagementAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@test.com',
            username='adminuser',
            password='AdminPassword@123',
            is_staff=True,
            is_admin=True,
        )
        self.regular_user = User.objects.create_user(
            email='regular@test.com',
            username='reguser',
            password='RegPassword@123'
        )
        self.card = Card.objects.create(
            user=self.regular_user,
            card_holder_name='Regular User',
            last_four_digits='9999',
            masked_card_number='****-****-****-9999',
            card_type='CREDIT',
            expiry_month=11,
            expiry_year=2027,
            credit_limit=Decimal('60000.00'),
            is_blocked=False,
        )
        self.admin_token = get_token(self.client, 'admin@test.com', 'AdminPassword@123')
        self.user_token = get_token(self.client, 'regular@test.com', 'RegPassword@123')

    def test_admin_can_view_all_cards(self):
        """Admin can retrieve full cards list with metrics"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.get('/api/admin-panel/cards/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('cards', resp.data)
        self.assertGreaterEqual(resp.data['count'], 1)

    def test_regular_user_cannot_access_admin_cards(self):
        """Non-admin user receives 403 Forbidden"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        resp = self.client.get('/api/admin-panel/cards/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_block_and_unblock_card(self):
        """Admin can toggle card blocking state and trigger notification"""
        mail.outbox.clear()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # 1. Block card
        resp = self.client.patch(
            f'/api/admin-panel/cards/{self.card.id}/toggle-block/',
            {'is_blocked': True, 'reason': 'Compromised card detected'},
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['is_blocked'])
        self.card.refresh_from_db()
        self.assertTrue(self.card.is_blocked)
        # Verify notification was sent
        self.assertGreaterEqual(len(mail.outbox), 1)

        # 2. Unblock card
        resp_unblock = self.client.patch(
            f'/api/admin-panel/cards/{self.card.id}/toggle-block/',
            {'is_blocked': False},
            format='json'
        )
        self.assertEqual(resp_unblock.status_code, status.HTTP_200_OK)
        self.assertFalse(resp_unblock.data['is_blocked'])
        self.card.refresh_from_db()
        self.assertFalse(self.card.is_blocked)

    def test_blocked_card_rejects_transactions(self):
        """Payment on a blocked card must fail immediately"""
        self.card.is_blocked = True
        self.card.save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        resp = self.client.post(
            '/api/transactions/pay/',
            {
                'card_id': self.card.id,
                'amount': '1500.00',
                'description': 'Test Payment',
            },
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('blocked', str(resp.data).lower())

    def test_admin_can_update_credit_limit(self):
        """Admin can update credit limit with validation"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.patch(
            f'/api/admin-panel/cards/{self.card.id}/update-limit/',
            {'credit_limit': 125000.00},
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['credit_limit'], 125000.00)
        self.card.refresh_from_db()
        self.assertEqual(float(self.card.credit_limit), 125000.00)

    def test_admin_update_credit_limit_validation(self):
        """Invalid limit (negative/zero) is rejected"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.patch(
            f'/api/admin-panel/cards/{self.card.id}/update-limit/',
            {'credit_limit': -500},
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_view_card_activity(self):
        """Admin can retrieve card activity breakdown and transactions"""
        Transaction.objects.create(
            user=self.regular_user,
            card=self.card,
            amount=Decimal('4200.00'),
            status='SUCCESS',
            transaction_id='TXN-ACT-001',
            description='Online Purchase'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.get(f'/api/admin-panel/cards/{self.card.id}/activity/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('metrics', resp.data)
        self.assertEqual(resp.data['metrics']['total_transactions'], 1)
        self.assertEqual(resp.data['metrics']['success_count'], 1)
        self.assertEqual(resp.data['metrics']['total_spent'], 4200.00)


class MonthlyStatementPDFTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='statementuser@test.com',
            username='statementuser',
            password='StmtPassword@123',
            full_name='Statement User'
        )
        self.card = Card.objects.create(
            user=self.user,
            card_holder_name='Statement User',
            last_four_digits='5555',
            masked_card_number='****-****-****-5555',
            card_type='CREDIT',
            expiry_month=8,
            expiry_year=2028,
            credit_limit=Decimal('50000.00'),
        )
        self.token = get_token(self.client, 'statementuser@test.com', 'StmtPassword@123')

        # Create transactions in current month
        Transaction.objects.create(
            user=self.user,
            card=self.card,
            amount=Decimal('2499.00'),
            status='SUCCESS',
            transaction_id='TXN-STMT-001',
            merchant_name='Tech Subscription',
            description='Cloud Storage'
        )
        Transaction.objects.create(
            user=self.user,
            card=self.card,
            amount=Decimal('850.00'),
            status='FAILED',
            transaction_id='TXN-STMT-002',
            merchant_name='Coffee Bar',
            description='Cafeteria'
        )

    def test_monthly_statement_pdf_generation(self):
        """User can download monthly statement as valid PDF"""
        import datetime
        now = datetime.datetime.now()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        resp = self.client.get(f'/api/transactions/statement/pdf/?year={now.year}&month={now.month}')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertIn(f'attachment; filename="statement_{now.year}_{now.month:02d}.pdf"', resp['Content-Disposition'])
        # Verify valid PDF signature (%PDF)
        self.assertTrue(resp.content.startswith(b'%PDF'))
        self.assertGreater(len(resp.content), 500)
