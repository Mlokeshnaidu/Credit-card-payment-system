"""
Module 11: Unit Tests for Payments and Transactions
"""
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User
from cards.models import Card
from transactions.models import Transaction
import uuid


def get_token(client, email, password):
    resp = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
    return resp.data['tokens']['access']


class TransactionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='txtest@example.com', username='txtestuser',
            full_name='TX Test', password='TXTest@123'
        )
        self.card = Card.objects.create(
            user=self.user, card_holder_name='TX User',
            last_four_digits='5678', masked_card_number='****-5678',
            card_type='CREDIT', expiry_month=6, expiry_year=2027
        )

    def test_transaction_initial_status_pending(self):
        txn = Transaction.objects.create(
            user=self.user, card=self.card,
            amount=500.00, transaction_id=f'TXN-{uuid.uuid4().hex[:8].upper()}'
        )
        self.assertEqual(txn.status, 'PENDING')

    def test_transaction_success_update(self):
        txn = Transaction.objects.create(
            user=self.user, card=self.card,
            amount=1000.00, transaction_id=f'TXN-{uuid.uuid4().hex[:8].upper()}'
        )
        txn.status = 'SUCCESS'
        txn.save()
        self.assertEqual(Transaction.objects.get(pk=txn.pk).status, 'SUCCESS')

    def test_transaction_unique_id(self):
        tid = f'TXN-{uuid.uuid4().hex[:8].upper()}'
        Transaction.objects.create(
            user=self.user, card=self.card,
            amount=100.00, transaction_id=tid
        )
        from django.db import IntegrityError
        with self.assertRaises(Exception):
            Transaction.objects.create(
                user=self.user, card=self.card,
                amount=200.00, transaction_id=tid
            )


class PaymentAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='paytest@example.com', username='paytestuser',
            full_name='Pay Test', password='PayTest@123'
        )
        token = get_token(self.client, 'paytest@example.com', 'PayTest@123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.card = Card.objects.create(
            user=self.user, card_holder_name='Pay User',
            last_four_digits='1234', masked_card_number='****-****-****-1234',
            card_type='CREDIT', expiry_month=12, expiry_year=2026
        )

    def test_make_payment_success(self):
        resp = self.client.post('/api/transactions/pay/', {
            'card_id': self.card.id,
            'amount': '500.00',
            'currency': 'INR',
            'merchant_name': 'Test Store',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('transaction', resp.data)
        self.assertIn(resp.data['transaction']['status'], ['SUCCESS', 'FAILED'])

    def test_payment_creates_transaction_record(self):
        initial_count = Transaction.objects.filter(user=self.user).count()
        self.client.post('/api/transactions/pay/', {
            'card_id': self.card.id,
            'amount': '250.00',
        }, format='json')
        self.assertEqual(Transaction.objects.filter(user=self.user).count(), initial_count + 1)

    def test_payment_invalid_card(self):
        resp = self.client.post('/api/transactions/pay/', {
            'card_id': 99999,
            'amount': '100.00',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_payment_negative_amount(self):
        resp = self.client.post('/api/transactions/pay/', {
            'card_id': self.card.id,
            'amount': '-100.00',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transaction_history(self):
        resp = self.client.get('/api/transactions/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('results', resp.data)

    def test_transaction_filter_by_status(self):
        resp = self.client.get('/api/transactions/?status=SUCCESS')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_unauthorized_payment(self):
        self.client.credentials()
        resp = self.client.post('/api/transactions/pay/', {
            'card_id': self.card.id, 'amount': '100.00'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
