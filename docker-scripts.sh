#!/bin/bash

# Timesheet Management Docker Helper Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to show help
show_help() {
    echo "Timesheet Management Docker Helper"
    echo ""
    echo "Usage: ./docker-scripts.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev                 Start development environment"
    echo "  prod                Start production environment"
    echo "  stop                Stop all services"
    echo "  restart             Restart all services"
    echo "  logs [service]      Show logs (optionally for specific service)"
    echo "  build               Build all images"
    echo "  clean               Clean up containers, volumes, and images"
    echo "  db-migrate          Run database migrations"
    echo "  db-seed             Seed the database"
    echo "  health              Check health of all services"
    echo "  help                Show this help message"
}

# Function to start development environment
start_dev() {
    print_color $GREEN "🚀 Starting development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
    print_color $GREEN "✅ Development environment started!"
    print_color $BLUE "📊 Available services:"
    print_color $BLUE "  - Application: http://localhost:3000"
    print_color $BLUE "  - pgAdmin: http://localhost:5050 (admin@timesheet.com / admin123)"
    print_color $BLUE "  - Redis Insight: http://localhost:8001"
}

# Function to start production environment
start_prod() {
    print_color $GREEN "🚀 Starting production environment..."
    docker-compose up --build -d
    print_color $GREEN "✅ Production environment started!"
}

# Function to stop services
stop_services() {
    print_color $YELLOW "🛑 Stopping all services..."
    docker-compose down
    print_color $GREEN "✅ All services stopped!"
}

# Function to restart services
restart_services() {
    print_color $YELLOW "🔄 Restarting services..."
    docker-compose restart
    print_color $GREEN "✅ Services restarted!"
}

# Function to show logs
show_logs() {
    if [ -n "$1" ]; then
        print_color $BLUE "📋 Showing logs for $1..."
        docker-compose logs -f "$1"
    else
        print_color $BLUE "📋 Showing logs for all services..."
        docker-compose logs -f
    fi
}

# Function to build images
build_images() {
    print_color $BLUE "🔨 Building all images..."
    docker-compose build --no-cache
    print_color $GREEN "✅ All images built!"
}

# Function to clean up
clean_up() {
    print_color $YELLOW "🧹 Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_color $GREEN "✅ Cleanup completed!"
}

# Function to run migrations
run_migrations() {
    print_color $BLUE "🗄️ Running database migrations..."
    docker-compose exec app npx prisma migrate deploy
    print_color $GREEN "✅ Migrations completed!"
}

# Function to seed database
seed_database() {
    print_color $BLUE "🌱 Seeding database..."
    docker-compose exec app npx prisma db seed
    print_color $GREEN "✅ Database seeded!"
}

# Function to check health
check_health() {
    print_color $BLUE "🏥 Checking service health..."
    docker-compose ps
    echo ""
    print_color $BLUE "Application health:"
    curl -s http://localhost:3000/time-management/health | jq . || echo "❌ Application health check failed"
}

# Main script logic
case "$1" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs "$2"
        ;;
    "build")
        build_images
        ;;
    "clean")
        clean_up
        ;;
    "db-migrate")
        run_migrations
        ;;
    "db-seed")
        seed_database
        ;;
    "health")
        check_health
        ;;
    "help"|*)
        show_help
        ;;
esac 