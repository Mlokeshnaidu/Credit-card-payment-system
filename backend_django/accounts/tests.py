"""
Module 11: Unit Tests for Authentication (accounts app)
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from accounts.models import User, AdminLog


class UserModelTest(TestCase):
    """Test User model"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            full_name='Test User',
            password='TestPass@123'
        )

    def test_user_created(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_admin)

    def test_password_is_hashed(self):
        """Passwords must never be stored in plain text"""
        self.assertNotEqual(self.user.password, 'TestPass@123')
        self.assertTrue(self.user.check_password('TestPass@123'))

    def test_superuser_creation(self):
        admin = User.objects.create_superuser(
            email='admin@example.com',
            username='adminuser',
            password='Admin@123456'
        )
        self.assertTrue(admin.is_admin)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_str_representation(self):
        self.assertIn('test@example.com', str(self.user))


class RegisterAPITest(APITestCase):
    """Test user registration endpoint"""

    def setUp(self):
        self.url = '/api/auth/register/'
        self.valid_data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'full_name': 'New User',
            'password': 'NewPass@123',
            'confirm_password': 'NewPass@123',
        }

    def test_register_success(self):
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])

    def test_register_password_mismatch(self):
        data = self.valid_data.copy()
        data['confirm_password'] = 'WrongPass@123'
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        self.client.post(self.url, self.valid_data, format='json')
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        data = self.valid_data.copy()
        data['password'] = '123'
        data['confirm_password'] = '123'
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_email(self):
        data = self.valid_data.copy()
        del data['email']
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(APITestCase):
    """Test user login endpoint"""

    def setUp(self):
        self.url = '/api/auth/login/'
        self.user = User.objects.create_user(
            email='login@example.com',
            username='loginuser',
            full_name='Login User',
            password='LoginPass@123'
        )

    def test_login_success(self):
        response = self.client.post(self.url, {
            'email': 'login@example.com',
            'password': 'LoginPass@123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

    def test_login_wrong_password(self):
        response = self.client.post(self.url, {
            'email': 'login@example.com',
            'password': 'WrongPassword',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        response = self.client.post(self.url, {
            'email': 'nobody@example.com',
            'password': 'SomePass@123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_inactive_user(self):
        self.user.is_active = False
        self.user.save()
        response = self.client.post(self.url, {
            'email': 'login@example.com',
            'password': 'LoginPass@123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutAPITest(APITestCase):
    """Test logout endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='logout@example.com',
            username='logoutuser',
            full_name='Logout User',
            password='LogoutPass@123'
        )
        login_response = self.client.post('/api/auth/login/', {
            'email': 'logout@example.com',
            'password': 'LogoutPass@123',
        }, format='json')
        self.access_token = login_response.data['tokens']['access']
        self.refresh_token = login_response.data['tokens']['refresh']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_logout_success(self):
        response = self.client.post('/api/auth/logout/', {
            'refresh': self.refresh_token
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_without_token(self):
        self.client.credentials()
        response = self.client.post('/api/auth/logout/', {
            'refresh': self.refresh_token
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileAPITest(APITestCase):
    """Test profile endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='profile@example.com',
            username='profileuser',
            full_name='Profile User',
            password='ProfilePass@123'
        )
        login_response = self.client.post('/api/auth/login/', {
            'email': 'profile@example.com',
            'password': 'ProfilePass@123',
        }, format='json')
        token = login_response.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_get_profile(self):
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'profile@example.com')

    def test_update_profile(self):
        response = self.client.put('/api/auth/profile/', {
            'full_name': 'Updated Name',
            'phone': '9876543210',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['full_name'], 'Updated Name')

    def test_protected_route_without_token(self):
        self.client.credentials()
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
