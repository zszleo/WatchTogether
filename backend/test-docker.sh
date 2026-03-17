#!/bin/bash

echo "Testing Docker Compose volumes configuration..."
echo "================================================"

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker daemon."
    exit 1
fi

echo "1. Starting MySQL and Redis services..."
docker-compose up -d

echo "2. Waiting for services to be healthy..."
sleep 10

echo "3. Checking service status..."
echo ""
echo "MySQL container:"
docker ps | grep watchtogether-mysql
echo ""
echo "Redis container:"
docker ps | grep watchtogether-redis

echo ""
echo "4. Testing MySQL connection..."
docker exec watchtogether-mysql mysql -u watchtogether -pwatchtogether -e "SHOW DATABASES;" 2>/dev/null || echo "MySQL connection failed"

echo ""
echo "5. Testing Redis connection..."
docker exec watchtogether-redis redis-cli ping 2>/dev/null || echo "Redis connection failed"

echo ""
echo "6. Checking volumes..."
echo "MySQL volume:"
docker volume ls | grep watchtogether-backend_mysql_data || echo "No MySQL volume found"
echo "Redis volume:"
docker volume ls | grep watchtogether-backend_redis_data || echo "No Redis volume found"

echo ""
echo "7. Stopping services..."
docker-compose down

echo ""
echo "Test completed. Volumes should persist data between restarts."
echo "To clean up volumes: docker-compose down -v"