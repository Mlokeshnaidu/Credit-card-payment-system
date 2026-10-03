# Docker Setup Guide — Credit Card Payment System

## Prerequisites

Make sure Docker Desktop is running on your machine before proceeding.

---

## Step 1: Configure Environment

Edit the root `.env` file with your settings:

```
DB_NAME=credit_card_db
DB_USER=root
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=3306

SECRET_KEY=django-insecure-change-this-in-production-use-a-random-string
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
```

---

## Step 2: Build and Start All Services

Open a terminal in the project root folder and run:

```bash
docker-compose up --build
```

This command will:
1. Pull the MySQL 8.0 image
2. Build the Django image
3. Build the FastAPI image
4. Build the React frontend image
5. Start all 4 services together

First build may take 3-5 minutes.

---

## Step 3: Verify Services are Running

After the build completes, open these URLs in your browser:

| Service        | URL                        | Purpose                        |
|----------------|----------------------------|--------------------------------|
| React Frontend | http://localhost:3000      | Main user interface            |
| Django API     | http://localhost:8000      | REST API for auth, cards, txns |
| FastAPI        | http://localhost:8001/docs | Payment service + Swagger docs |
| MySQL          | localhost:3306             | Database (internal)            |

---

## Step 4: Create Admin User

On the first run, the admin user is created automatically by the Docker entrypoint.

**Admin Credentials:**
- Email: `admin@ccpay.com`
- Password: `Admin@123456`

To create a custom admin manually, run:

```bash
docker-compose exec django python manage.py createsuperuser
```

---

## Step 5: Run Database Migrations (if needed)

```bash
docker-compose exec django python manage.py migrate
```

---

## Common Docker Commands

```bash
# Start all services in background (detached mode)
docker-compose up -d --build

# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f django
docker-compose logs -f fastapi
docker-compose logs -f frontend
docker-compose logs -f db

# Stop all services
docker-compose down

# Stop and remove all data (WARNING: deletes database)
docker-compose down -v

# Restart a specific service
docker-compose restart django

# Open a shell inside a container
docker-compose exec django bash
docker-compose exec fastapi bash

# Run Django management commands
docker-compose exec django python manage.py migrate
docker-compose exec django python manage.py test
docker-compose exec django python manage.py shell
```

---

## Service Architecture

```
Browser (http://localhost:3000)
        |
        v
  React Frontend (port 3000)
        |
        |---> Django API (port 8000)
        |         |---> MySQL (port 3306)
        |
        |---> FastAPI Payment Service (port 8001)
                  |---> MySQL (port 3306)
```

---

## Troubleshooting

**Problem:** `docker-compose up` fails with database connection error  
**Fix:** Wait 10-15 seconds for MySQL to fully start, then run `docker-compose up` again. MySQL health check should handle this automatically.

**Problem:** Port already in use  
**Fix:** Change the host port in `docker-compose.yml`. Example: change `"3000:80"` to `"3001:80"` if port 3000 is busy.

**Problem:** Changes not reflected after editing code  
**Fix:** Rebuild with `docker-compose up --build`
