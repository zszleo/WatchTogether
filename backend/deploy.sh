#!/bin/bash

# WatchTogether Backend Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== WatchTogether Backend Deployment ===${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Determine docker-compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Parse arguments
ACTION=${1:-start}
PROFILE=${2:-full}

case $ACTION in
    start)
        echo -e "${GREEN}Starting WatchTogether backend...${NC}"
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml up -d
        echo -e "${GREEN}Backend started successfully!${NC}"
        echo "  - API: http://localhost:18080"
        echo "  - Socket.IO: ws://localhost:19090"
        ;;
    stop)
        echo -e "${YELLOW}Stopping WatchTogether backend...${NC}"
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml down
        echo -e "${GREEN}Backend stopped.${NC}"
        ;;
    restart)
        echo -e "${YELLOW}Restarting WatchTogether backend...${NC}"
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml up -d --build
        echo -e "${GREEN}Backend restarted with rebuild!${NC}"
        ;;
    rebuild)
        echo -e "${YELLOW}Rebuilding WatchTogether backend...${NC}"
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml down
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml build --no-cache
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml up -d
        echo -e "${GREEN}Backend rebuilt and started!${NC}"
        ;;
    logs)
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml logs -f
        ;;
    build)
        echo -e "${GREEN}Building Docker images...${NC}"
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml build --no-cache
        echo -e "${GREEN}Build completed.${NC}"
        ;;
    clean)
        echo -e "${YELLOW}Cleaning up containers and volumes...${NC}"
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml down -v
        echo -e "${GREEN}Cleanup completed.${NC}"
        ;;
    status)
        $DOCKER_COMPOSE -f docker-compose.$PROFILE.yml ps
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|build|clean|status} [profile]"
        echo "  profile: full (default), dev"
        echo ""
        echo "Examples:"
        echo "  $0 start full    # Start full stack (app + mysql + redis)"
        echo "  $0 start dev     # Start dev environment (mysql + redis only)"
        echo "  $0 logs          # View logs"
        echo "  $0 clean         # Remove all containers and volumes"
        exit 1
        ;;
esac
