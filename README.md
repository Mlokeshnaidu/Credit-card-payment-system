# 💳 Credit Card Payment System

A full-stack fintech application built with **React + Tailwind CSS**, **Django REST API**, **FastAPI Payment Service**, and **MySQL**.

---

## 🏗️ Project Structure

```
Credit Card Payment System/
├── django_app/          # Django project settings
├── accounts/            # Module 1: User Authentication
├── cards/               # Module 2: Card Management
├── transactions/        # Module 3 & 4: Payments & Transactions
├── admin_panel/         # Module 5: Admin Panel
├── fastapi_app/         # Module 3: FastAPI Payment Service
│   ├── core/            # Config & Database
│   ├── models/          # SQLAlchemy models
│   ├── routes/          # API routes (payments, auth, users, admin)
│   └── main.py          # FastAPI entry point
├── frontend/            # Module 6: React + Tailwind UI
│   └── src/
│       ├── api/         # Axios clients & services
│       ├── components/  # Navbar, ProtectedRoute
│       ├── context/     # AuthContext (JWT)
│       └── pages/       # Login, Register, Dashboard, Cards, Payment, Transactions, Admin
├── database_schema.sql  # Module 7: MySQL Schema
├── docker-compose.yml   # Module 10: Docker orchestration
├── Dockerfile.django    # Django container
├── Dockerfile.fastapi   # FastAPI container
└── .env                 # Environment variables
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0 (running locally)

### 1. Database Setup

```sql
-- Run in MySQL
CREATE DATABASE credit_card_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or run the full schema:
```bash
mysql -u root -p < database_schema.sql
```

### 2. Backend (Django) Setup

```bash
# Install dependencies
pip install -r requirements.django.txt

# Set up .env (edit as needed)
copy .env.example .env

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# OR run the setup script
python manage.py shell -c "
from accounts.models import User
if not User.objects.filter(email='admin@ccpay.com').exists():
    User.objects.create_superuser('admin@ccpay.com', 'admin', 'Admin@123456', full_name='System Admin', is_admin=True)
    print('Admin created: admin@ccpay.com / Admin@123456')
"

# Start Django server
python manage.py runserver 8000
```

### 3. FastAPI Setup

```bash
# Install dependencies
pip install -r requirements.fastapi.txt

# Start FastAPI server
uvicorn fastapi_app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 🐳 Docker Setup (Recommended)

```bash
docker-compose up --build
```

Services:
- MySQL: `localhost:3306`
- Django API: `http://localhost:8000`
- FastAPI: `http://localhost:8001`
- React App: `http://localhost:3000`

---

## 🔑 Admin Credentials

| Field    | Value              |
|----------|--------------------|
| Email    | `admin@ccpay.com`  |
| Password | `Admin@123456`     |
| Role     | Super Admin        |

---

## 📡 API Documentation

### Django REST API — `http://localhost:8000`

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | User Registration |
| POST | `/api/auth/login/` | User Login (returns JWT) |
| POST | `/api/auth/logout/` | Logout (blacklists token) |
| GET/PUT | `/api/auth/profile/` | Get/Update Profile |
| POST | `/api/auth/change-password/` | Change Password |
| POST | `/api/auth/token/refresh/` | Refresh JWT Token |

#### Card Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards/` | List user's cards |
| POST | `/api/cards/` | Add new card |
| GET | `/api/cards/{id}/` | Get card detail |
| DELETE | `/api/cards/{id}/` | Delete card |
| POST | `/api/cards/{id}/set-default/` | Set default card |

#### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/` | Transaction history (with filters) |
| POST | `/api/transactions/pay/` | Make a payment |
| GET | `/api/transactions/{id}/` | Transaction detail |

**Filter parameters:** `status`, `date_from`, `date_to`, `amount_min`, `amount_max`, `page`, `page_size`

#### Admin Panel
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin-panel/dashboard/` | Dashboard stats |
| GET | `/api/admin-panel/users/` | All users |
| PATCH | `/api/admin-panel/users/{id}/toggle/` | Activate/Deactivate user |
| GET | `/api/admin-panel/cards/` | All cards |
| GET | `/api/admin-panel/transactions/` | All transactions |
| GET | `/api/admin-panel/transactions/export/` | Export CSV |
| GET | `/api/admin-panel/daily-summary/` | Daily summary |
| GET | `/api/admin-panel/logs/` | Admin audit logs |

### FastAPI Payment Service — `http://localhost:8001`

Swagger UI: **`http://localhost:8001/docs`**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/process` | Process Payment |
| GET | `/api/payments/status/{id}` | Payment Status |
| GET | `/api/payments/logs` | Payment Logs |
| POST | `/api/auth/verify-token` | Verify JWT Token |

---

## 🗃️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with hashed passwords |
| `cards` | Masked card details (last 4 digits only) |
| `transactions` | Payment transactions with PENDING/SUCCESS/FAILED |
| `admin_logs` | Audit trail of all user actions |
| `payment_logs` | FastAPI payment processing logs |

---

## 🔒 Security Implementation

| Requirement | Implementation |
|-------------|----------------|
| No CVV storage | CVV field absent from Card model |
| Encrypted Passwords | Django's PBKDF2 + bcrypt hashing |
| JWT Authentication | `djangorestframework-simplejwt` with token blacklisting |
| Input Validation | Serializer validation + Luhn algorithm for card numbers |
| SQL Injection Protection | Django ORM (parameterized queries) |
| Protected Routes | JWT required for all non-auth endpoints |

---

## 🧪 Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test cards
python manage.py test transactions

# Run with coverage (install coverage first: pip install coverage)
coverage run manage.py test
coverage report
```

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| Login Page | JWT-authenticated login with demo credentials |
| Register Page | User registration with validation |
| Dashboard | Stats overview with recent transactions |
| Cards Page | Visual card management |
| Payment Page | Make payment with card selection |
| Transactions | Filterable transaction history |
| Admin Dashboard | User management, stats, CSV export |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS |
| Backend (Auth/Cards/Transactions/Admin) | Django 6 + DRF |
| Backend (Payments) | FastAPI |
| Database | MySQL 8.0 |
| Auth | JWT (djangorestframework-simplejwt) |
| Containers | Docker + Docker Compose |

---

## 🎯 Modules Implemented

- [x] Module 1: User Authentication (Django) - Register, Login, Logout, JWT, Protected Routes
- [x] Module 2: Card Management (Django) - Add, View, Delete, Masked Storage
- [x] Module 3: Payment Processing (FastAPI) - Simulate Success/Failure, PENDING → SUCCESS/FAILED
- [x] Module 4: Transaction Management (Django) - History, Filter by Date/Amount/Status, CSV Export
- [x] Module 5: Admin Panel (Django) - User Management, Cards, Transactions, Daily Summary
- [x] Module 6: Frontend (React + Tailwind) - All 7 pages
- [x] Module 7: Database (MySQL) - All 5 tables
- [x] Module 8: Security - No CVV, Encrypted Passwords, JWT, Input Validation, SQL Injection Protection
- [x] Module 9: API Docs - FastAPI Swagger at `/docs`, Django REST API documented
- [x] Module 10: Docker - Dockerfiles for all 4 services + docker-compose
- [x] Module 11: Testing - Unit tests for Auth, Cards, Payments (>50% coverage)
- [x] Module 12: Git & Documentation - This README with setup, API docs, DB schema
