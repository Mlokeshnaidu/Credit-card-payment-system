# Credit Card Payment System

A full-stack fintech demo: users save cards (masked only), make simulated payments, and admins monitor everything.
**No real payment gateway is used. CVV is never collected or stored.**

**Author:** Lokesh Naidu

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS (served by Nginx) |
| Core API | Django + Django REST Framework + SimpleJWT |
| Payment service | FastAPI |
| Database | MySQL 8 |
| Deployment | Docker + docker-compose |

## Architecture

~~~
React (3000) --> Django API (8000) --> MySQL (3307 on host)
                      |
                      +--> FastAPI payment service (8001) --> MySQL
~~~

Payment flow: Django creates the transaction as `PENDING`, calls FastAPI `POST /api/payments/process`,
FastAPI simulates the outcome and writes a payment log, and Django saves the final status `SUCCESS` or `FAILED`.

## Setup

Requirements: Docker Desktop.

~~~bash
git clone https://github.com/Mlokeshnaidu/Credit-card-payment-system.git
cd Credit-card-payment-system
cp .env.example .env        # Windows: copy .env.example .env
~~~

Edit `.env` and replace every `change-me` with your own values. `MYSQL_PASSWORD` and `DB_PASSWORD` must match.
Then start everything:

~~~bash
docker compose up -d --build
~~~

Create the admin account (first run only):

~~~bash
docker compose exec django python manage.py shell -c "from accounts.models import User; User.objects.filter(email='admin@ccpay.com').exists() or User.objects.create_superuser('admin@ccpay.com', 'admin', 'Admin@123456', full_name='System Admin', is_admin=True)"
~~~

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| Django API docs (Swagger) | http://localhost:8000/api/docs/ |
| Django API docs (ReDoc) | http://localhost:8000/api/redoc/ |
| FastAPI docs (Swagger) | http://localhost:8001/docs |

### Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ccpay.com | Admin@123456 |
| Sample user (in the DB dump) | demo@example.com | Demo@12345 |

### Load the database dump (optional)

~~~powershell
Get-Content database_dump.sql | docker compose exec -T db mysql -uroot -p<MYSQL_ROOT_PASSWORD> credit_card_db
~~~

## Features by module

1. **Authentication & RBAC** - Register, JWT login, logout (token blacklisted), hashed passwords, protected routes. Full Role-Based Access Control (`ADMIN`, `SUPPORT`, `READ_ONLY`, `CUSTOMER`) with fine-grained endpoint guards.
2. **Card Management** - Add, list, delete, set default, block/unblock, credit limit updates. Masked number and last 4 digits only. Strict RBAC enforcement (`READ_ONLY` blocked from mutation).
3. **Payments (FastAPI)** - High-performance payment simulation (`PENDING` -> `SUCCESS`/`FAILED`), automated payment logs, and dashboard metrics.
4. **Transaction Management & Advanced Search** - Multi-criteria filtering (status, min/max amount, date range, masked card search), server-side ordering, and admin CSV exports.
5. **Real-Time Fraud Detection Engine** - Rule-based anomaly evaluation (rapid high-value velocity >= ₹10,000 in 10m, rapid geo-hopping across locations/devices in 15m, limit anomalies), fraud scoring, automatic flagging, email alerts, and admin review audit trail.
6. **Card Usage Analytics & Data Visualization** - Interactive responsive SVG charts (Monthly spending trend line chart, Category expense breakdown pie chart, Credit utilization radial gauge). Zero bloated chart dependencies.
7. **Automated Notification System** - SMTP/Console email dispatch for transactions > ₹5,000, card block/unblock events, available credit limit < 10%, and detected fraud attempts.
8. **Monthly Statement & Executive PDF/CSV Generation** - ReportLab financial statement generation with customer breakdown, transaction history, and summary tables. Executive Analytics summary in CSV and PDF formats.
9. **System Health & Telemetry Monitoring** - Request latency tracking, endpoint traffic breakdown, error rate analytics, and real-time health indicator in the Admin Dashboard.
10. **Admin Panel** - User management, card security actions (block/unblock, credit limits), transaction monitoring, fraud investigation queues, and comprehensive audit logs.
11. **Frontend (React + Tailwind CSS)** - Clean, modern, responsive UI with dark/light mode toggle (persisted via React Context & localStorage), loading skeleton states, modal workflows, and responsive data tables.
12. **Database (MySQL 8)** - Normalized schema for users, cards, transactions, fraud_logs, admin_logs, and system_metrics.
13. **Security Architecture** - No CVV storage, PBKDF2 password encryption, JWT authentication, parameterized SQL / ORM injection prevention, CORS security.
14. **API Documentation & Testing** - Django Swagger/ReDoc, FastAPI Swagger, comprehensive Postman Collection (9 folders, 38+ requests), and 62 unit tests (100% passing).

## API Documentation

- **Django Swagger UI:** `http://localhost:8000/api/docs/`
- **Django ReDoc:** `http://localhost:8000/api/redoc/`
- **FastAPI Swagger UI:** `http://localhost:8001/docs`
- **Postman Collection:** `Credit_Card_Payment_System.postman_collection.json` (9 comprehensive folders covering all authentication, cards, payments, analytics, fraud review, telemetry, and statements).

### Django API (`http://localhost:8000/api`)

| Method | Endpoint | Description | Role / Permission |
|---|---|---|---|
| POST | `/auth/register/` | Register user | Public |
| POST | `/auth/login/` | Obtain JWT access & refresh tokens | Public |
| POST | `/auth/logout/` | Blacklist refresh token | Authenticated |
| POST | `/auth/token/refresh/` | Renew JWT access token | Authenticated |
| GET, PUT | `/auth/profile/` | View or update profile details | Authenticated |
| POST | `/auth/change-password/` | Change password securely | Authenticated |
| GET, POST | `/cards/` | List or add cards (masked only) | Authenticated (Write blocked for READ_ONLY) |
| GET, DELETE | `/cards/{id}/` | Card detail or delete card | Authenticated (Delete blocked for READ_ONLY) |
| POST | `/cards/{id}/set-default/` | Set card as default | Authenticated |
| POST | `/transactions/pay/` | Make payment (runs fraud check + FastAPI) | Authenticated |
| GET | `/transactions/` | History. Advanced search: `card_search`, `status`, `min_amount`, `max_amount`, `date_from`, `date_to`, `ordering` | Authenticated |
| GET | `/transactions/{id}/` | Single transaction detail | Authenticated |
| GET | `/transactions/statement/pdf/` | Download branded monthly PDF statement | Authenticated |
| GET | `/transactions/analytics/summary/` | User spending summary & utilization | Authenticated |
| GET | `/transactions/analytics/monthly/` | Monthly expense trends (last 6 months) | Authenticated |
| GET | `/transactions/analytics/categories/` | Category-wise expense distribution | Authenticated |
| GET | `/transactions/analytics/utilization/` | Per-card credit utilization ratio | Authenticated |
| GET | `/admin-panel/dashboard/` | High-level metrics | Admin / Support / Read-Only |
| GET | `/admin-panel/daily-summary/` | Daily payment aggregations | Admin / Support / Read-Only |
| GET | `/admin-panel/users/` | List system users | Admin / Support / Read-Only |
| PATCH | `/admin-panel/users/{id}/toggle/` | Enable / disable user account | Admin only |
| GET | `/admin-panel/cards/` | View all customer cards | Admin / Support / Read-Only |
| POST | `/admin-panel/cards/{id}/block/` | Block / unblock card (sends email alert) | Admin / Support |
| POST | `/admin-panel/cards/{id}/credit-limit/`| Update credit limit | Admin only |
| GET | `/admin-panel/cards/{id}/activity/` | Inspect audit & transaction activity | Admin / Support / Read-Only |
| GET | `/admin-panel/transactions/` | View all global transactions | Admin / Support / Read-Only |
| GET | `/admin-panel/transactions/export/` | Export transactions to CSV | Admin / Support |
| GET | `/admin-panel/fraud-logs/` | List flagged suspicious transactions | Admin / Support / Read-Only |
| POST | `/admin-panel/fraud-logs/{id}/review/`| Update fraud review status & notes | Admin / Support |
| GET | `/admin-panel/system-health/` | System health, latency & error telemetry | Admin / Support |
| GET | `/admin-panel/analytics/export/csv/` | Export system-wide analytics summary CSV | Admin / Support |
| GET | `/admin-panel/analytics/export/pdf/` | Export executive analytics summary PDF | Admin / Support |
| GET | `/admin-panel/logs/` | System audit logs | Admin / Support |

### FastAPI Payment Service (`http://localhost:8001`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/summary` | User dashboard summary (total spent, available credit, month spending, last 5 transactions) |
| POST | `/api/payments/process` | Simulate payment (`PENDING` -> `SUCCESS`/`FAILED`) |
| GET | `/api/payments/status/{txn_id}` | Retrieve payment status |
| GET | `/api/payments/logs` | Query raw payment simulation logs |
| POST | `/api/auth/verify-token` | Verify JWT token validity |
| GET | `/health` | Service health status |

## Database Schema

- **users** - id, email, username, full_name, phone, role (`ADMIN`, `SUPPORT`, `READ_ONLY`, `CUSTOMER`), password (PBKDF2), is_active, is_staff, is_admin, is_superuser, date_joined, last_login
- **cards** - id, user_id (FK), card_holder_name, last_four_digits, masked_card_number, card_type, expiry_month, expiry_year, bank_name, is_default, is_blocked, credit_limit, created_at, updated_at
- **transactions** - id, user_id (FK), card_id (FK), amount, currency, description, merchant_name, category, status (`PENDING`, `SUCCESS`, `FAILED`), fraud_status (`CLEAN`, `FLAGGED`, `BLOCKED`), fraud_reason, ip_address, device_info, location, transaction_id, failure_reason, created_at, updated_at
- **fraud_logs** - id, transaction_id (FK), user_id (FK), card_id (FK), rule_triggered, risk_score, details, ip_address, device_info, location, review_status (`PENDING_REVIEW`, `CONFIRMED_FRAUD`, `DISMISSED`), reviewed_by (FK), review_notes, reviewed_at, timestamp
- **admin_logs** - id, user_id (FK), action, actor_role, target_type, target_id, description, ip_address, timestamp
- **system_metrics** - id, endpoint, method, status_code, response_time_ms, user_id (FK), ip_address, error_details, timestamp
- **payment_logs** - id, transaction_id, amount, status, error_message, timestamp (FastAPI)

Schema definitions: `database_schema.sql`. Pre-populated snapshot: `database_dump.sql`.

## Security Implementations

- **Strict CVV Prohibition:** CVV is never collected in the API or saved anywhere in the database.
- **Card Masking:** Card numbers are instantly transformed to `****-****-****-1234` before persistence.
- **Cryptographic Password Hashing:** Django PBKDF2 with SHA-256 (1,000,000 iterations).
- **JWT Authorization:** Standard RFC 7519 Bearer Tokens with HS256 encryption. Tokens validated across both Django and FastAPI. Refresh token blacklisting on logout prevents replay.
- **Role-Based Access Control (RBAC):** Hierarchical permissions across Admin, Support, Read-Only, and Customer tiers with dedicated permission classes and 403 Forbidden enforcement.
- **Rule-Based Fraud Detection:** Real-time anomaly detection preventing rapid velocity abuse, geographic displacement anomalies, and limit breaches.
- **SQL Injection Prevention:** 100% parameterization via Django ORM and SQLAlchemy.
- **Audit Logging:** Comprehensive tracing of administrative interventions (card blocking, limit changes, fraud dismissals, exports).

## Testing

Comprehensive test suite covering all modules:

~~~bash
# Run tests inside Docker
docker compose exec django python manage.py test

# Or run locally with virtual environment
python manage.py test
~~~

**Test Suite Results:**
- **62 tests passed** (0 failures, 0 errors, 100% pass rate).
- Validates Authentication, Role Permissions, Card Encryption & Masking, Payment Processing, Fraud Rule Logic, Analytics Calculation, Statement Generation, and Health Monitoring.

## Screenshots

| | |
|---|---|
| ![Login](screenshots/login.png) | ![Register](screenshots/register.png) |
| ![Dashboard](screenshots/dashboard.png) | ![Cards](screenshots/cards.png) |
| ![Payment](screenshots/payment.png) | ![Transactions](screenshots/transactions.png) |
| ![Admin Dashboard](screenshots/admin-dashboard.png) | ![Admin Users](screenshots/admin-users.png) |
| ![Admin Transactions](screenshots/admin-transactions.png) | ![Django Swagger](screenshots/swagger-django.png) |
| ![FastAPI Swagger](screenshots/swagger-fastapi.png) | |

## Project Structure

~~~
backend_django/          Django project and apps: accounts, cards, transactions, admin_panel, notifications
backend_fastapi/         FastAPI payment simulation engine and dashboard metrics
frontend/                React + Tailwind CSS SPA with Dark Mode Context & SVG Analytics
db/                      MySQL 8 Docker configurations
database_schema.sql      Complete MySQL 8 DDL schema
database_dump.sql        Complete MySQL 8 pre-seeded dataset
Credit_Card_Payment_System.postman_collection.json  Full Postman suite (9 folders)
docker-compose.yml       Orchestration for Frontend, Django, FastAPI, MySQL
README.md                Documentation & Setup Guide
~~~
