#!/bin/bash

# DarManager Development Startup Script
# This script helps you get the development environment running quickly

echo "🏗️  Starting DarManager Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Build and start the services
echo "🚀 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."

# Check Nginx
if curl -s http://localhost > /dev/null; then
    echo "✅ Nginx is running on http://localhost"
else
    echo "❌ Nginx is not responding"
fi

# Check API
if curl -s http://localhost/health > /dev/null; then
    echo "✅ API is running on http://localhost/api"
else
    echo "❌ API is not responding"
fi

# Check Database
if docker-compose exec -T database pg_isready -U darmanager_user > /dev/null 2>&1; then
    echo "✅ Database is running"
else
    echo "❌ Database is not responding"
fi

echo ""
echo "🎉 DarManager is ready!"
echo ""
echo "📱 Frontend: http://localhost"
echo "📚 API Docs: http://localhost/api/docs"
echo "🔍 Health Check: http://localhost/health"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📋 To view logs: docker-compose logs -f"
echo ""
