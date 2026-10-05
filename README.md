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

1. **Authentication** - register, JWT login, logout (refresh token blacklisted), hashed passwords, protected routes
2. **Card management** - add, list, delete, set default; only the masked number and last 4 digits are stored
3. **Payments (FastAPI)** - simulated payment, `PENDING` then `SUCCESS` or `FAILED`
4. **Transactions** - history with filters (date, amount, status), admin CSV export
5. **Admin panel** - users, cards, transactions, daily payment summary, audit logs
6. **Frontend** - Register, Login, Dashboard, Add Card, Make Payment, Transaction History, Admin Dashboard
7. **Database** - users, cards, transactions, admin_logs, payment_logs
8. **Security** - see below
9. **API documentation** - Swagger for Django and FastAPI, Postman collection
10. **Docker** - Dockerfile per service plus docker-compose
11. **Testing** - 37 unit tests (auth, cards, transactions), 80% coverage
12. **Git and docs** - conventional commit messages, this README

## API documentation

Interactive docs: Django `/api/docs/`, FastAPI `/docs`.
Postman collection: `Credit_Card_Payment_System.postman_collection.json` (28 requests; run folders 1 to 5 in order).

### Django API (`http://localhost:8000/api`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register/` | Register a user |
| POST | `/auth/login/` | Login, returns access and refresh JWT |
| POST | `/auth/logout/` | Blacklist the refresh token |
| POST | `/auth/token/refresh/` | Get a new access token |
| GET, PUT | `/auth/profile/` | View or update profile |
| POST | `/auth/change-password/` | Change password |
| GET, POST | `/cards/` | List or add cards |
| GET, DELETE | `/cards/{id}/` | Card detail or delete |
| POST | `/cards/{id}/set-default/` | Set default card |
| POST | `/transactions/pay/` | Make a payment (calls FastAPI) |
| GET | `/transactions/` | History. Filters: `status`, `date_from`, `date_to`, `amount_min`, `amount_max` |
| GET | `/transactions/{transaction_id}/` | Transaction detail |
| GET | `/admin-panel/dashboard/` | Admin statistics (admin only) |
| GET | `/admin-panel/daily-summary/` | Daily payment summary |
| GET | `/admin-panel/users/` | List users |
| PATCH | `/admin-panel/users/{id}/toggle/` | Activate or deactivate a user |
| GET | `/admin-panel/cards/` | All cards |
| GET | `/admin-panel/transactions/` | All transactions |
| GET | `/admin-panel/transactions/export/` | Download CSV |
| GET | `/admin-panel/logs/` | Audit logs |

### FastAPI payment service (`http://localhost:8001`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/process` | Simulate a payment |
| GET | `/api/payments/status/{transaction_id}` | Payment status |
| GET | `/api/payments/logs` | Payment logs |
| POST | `/api/auth/verify-token` | Verify a JWT |
| GET | `/health` | Health check |

## Database schema

**users** - id, email (unique), username (unique), full_name, phone, password (hashed), is_active, is_staff, is_admin, date_joined, last_login

**cards** - id, user_id (FK users), card_holder_name, last_four_digits, masked_card_number, card_type (CREDIT/DEBIT), expiry_month, expiry_year, bank_name, is_default, created_at, updated_at

**transactions** - id, user_id (FK users), card_id (FK cards), amount (12,2), currency, description, merchant_name, status (PENDING/SUCCESS/FAILED), transaction_id (unique), failure_reason, created_at, updated_at

**admin_logs** - id, user_id (FK users), action, description, ip_address, timestamp

**payment_logs** - written by the FastAPI service for every processed payment

~~~
users 1 --- * cards
users 1 --- * transactions
cards 1 --- * transactions
users 1 --- * admin_logs
~~~

Full SQL: `database_schema.sql`. Data dump: `database_dump.sql`.

## Security

- Full card numbers and CVV are never stored. Only the masked number and last 4 digits are saved.
- Passwords are hashed (Django PBKDF2); there are no plain-text passwords.
- JWT authentication on every protected route. Access token 30 min, refresh token 7 days, blacklisted on logout.
- Admin routes return 403 for normal users.
- Input validation through DRF serializers and Pydantic models.
- SQL injection protection through the Django and SQLAlchemy ORMs (no raw SQL built from user input).
- CORS restricted to the frontend origin. Secrets live in `.env`, which is not committed.

## Testing

~~~bash
docker compose exec django sh -c "coverage run --source=accounts,cards,transactions,admin_panel manage.py test && coverage report"
~~~

37 tests pass: authentication, card management and transactions. Total coverage reported: 80%.

## Screenshots

| | |
|---|---|
| ![Login](screenshots/login.png) | ![Register](screenshots/register.png) |
| ![Dashboard](screenshots/dashboard.png) | ![Cards](screenshots/cards.png) |
| ![Payment](screenshots/payment.png) | ![Transactions](screenshots/transactions.png) |
| ![Admin dashboard](screenshots/admin-dashboard.png) | ![Admin users](screenshots/admin-users.png) |
| ![Admin transactions](screenshots/admin-transactions.png) | ![Django Swagger](screenshots/swagger-django.png) |
| ![FastAPI Swagger](screenshots/swagger-fastapi.png) | |

## Project structure

~~~
backend_django/    Django project and apps: accounts, cards, transactions, admin_panel
backend_fastapi/   FastAPI payment service
frontend/          React + Tailwind app (Nginx in Docker)
db/                MySQL Dockerfile
docker-compose.yml
database_schema.sql, database_dump.sql
Credit_Card_Payment_System.postman_collection.json
~~~
