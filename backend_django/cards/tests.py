"""
Module 11: Unit Tests for Card Management
"""
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User
from cards.models import Card


def get_token(client, email, password):
    resp = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
    return resp.data['tokens']['access']


class CardModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='cardtest@example.com', username='cardtestuser',
            full_name='Card Test', password='CardTest@123'
        )

    def test_card_creation(self):
        card = Card.objects.create(
            user=self.user,
            card_holder_name='John Doe',
            last_four_digits='1234',
            masked_card_number='****-****-****-1234',
            card_type='CREDIT',
            expiry_month=12,
            expiry_year=2026,
        )
        self.assertEqual(card.last_four_digits, '1234')
        self.assertEqual(card.masked_card_number, '****-****-****-1234')

    def test_no_cvv_stored(self):
        """CVV should never be stored"""
        card_fields = [f.name for f in Card._meta.get_fields()]
        self.assertNotIn('cvv', card_fields)
        self.assertNotIn('security_code', card_fields)

    def test_default_card_only_one(self):
        Card.objects.create(
            user=self.user, card_holder_name='Test', last_four_digits='1111',
            masked_card_number='****-1111', card_type='CREDIT',
            expiry_month=1, expiry_year=2026, is_default=True
        )
        card2 = Card.objects.create(
            user=self.user, card_holder_name='Test', last_four_digits='2222',
            masked_card_number='****-2222', card_type='DEBIT',
            expiry_month=2, expiry_year=2027, is_default=True
        )
        self.assertTrue(card2.is_default)
        self.assertFalse(Card.objects.get(last_four_digits='1111').is_default)


class CardAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='cardapi@example.com', username='cardapiuser',
            full_name='Card API User', password='CardAPI@123'
        )
        token = get_token(self.client, 'cardapi@example.com', 'CardAPI@123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_add_card_success(self):
        resp = self.client.post('/api/cards/', {
            'card_number': '4532015112830366',  # Valid Luhn test number
            'card_holder_name': 'Test User',
            'card_type': 'CREDIT',
            'expiry_month': 12,
            'expiry_year': 2026,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('card', resp.data)
        # Verify only masked number stored
        self.assertEqual(resp.data['card']['masked_card_number'], '****-****-****-0366')

    def test_add_card_invalid_length(self):
        resp = self.client.post('/api/cards/', {
            'card_number': '123',  # Invalid card number length
            'card_holder_name': 'Test User',
            'card_type': 'CREDIT',
            'expiry_month': 12,
            'expiry_year': 2026,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_cards(self):
        resp = self.client.get('/api/cards/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('cards', resp.data)

    def test_delete_card(self):
        add_resp = self.client.post('/api/cards/', {
            'card_number': '4532015112830366',
            'card_holder_name': 'Test User',
            'card_type': 'CREDIT',
            'expiry_month': 12,
            'expiry_year': 2026,
        }, format='json')
        card_id = add_resp.data['card']['id']
        del_resp = self.client.delete(f'/api/cards/{card_id}/')
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)

    def test_cannot_access_other_user_card(self):
        other_user = User.objects.create_user(
            email='other@example.com', username='otheruser',
            full_name='Other', password='Other@12345'
        )
        card = Card.objects.create(
            user=other_user, card_holder_name='Other', last_four_digits='9999',
            masked_card_number='****-9999', card_type='CREDIT',
            expiry_month=1, expiry_year=2026
        )
        resp = self.client.delete(f'/api/cards/{card.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthorized_no_token(self):
        self.client.credentials()
        resp = self.client.get('/api/cards/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
