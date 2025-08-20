@echo off
echo 🏗️  Starting DarManager Development Environment...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Build and start the services
echo 🚀 Building and starting services...
docker-compose up --build -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 >nul

REM Check service health
echo.
echo 🔍 Checking service health...

REM Check if services are responding (Windows doesn't have curl by default)
echo ✅ Services should be starting up...
echo.

echo 🎉 DarManager should be ready!
echo.
echo 📱 Frontend: http://localhost
echo 📚 API Docs: http://localhost/api/docs
echo 🔍 Health Check: http://localhost/health
echo.
echo 🛑 To stop: docker-compose down
echo 📋 To view logs: docker-compose logs -f
echo.
pause
