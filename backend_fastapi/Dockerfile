FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.fastapi.txt .
RUN pip install --no-cache-dir -r requirements.fastapi.txt

COPY . .

EXPOSE 8001
