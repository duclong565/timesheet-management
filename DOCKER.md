# 🐳 Docker Setup for Timesheet Management System

This document provides comprehensive instructions for running the Timesheet Management System using Docker.

## 📋 Prerequisites

- Docker Desktop (macOS/Windows) or Docker Engine (Linux)
- Docker Compose v3.8+
- At least 4GB of available RAM
- 10GB of free disk space

## 🚀 Quick Start

### Development Environment

```bash
# Start development environment with hot reload
./docker-scripts.sh dev

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

### Production Environment

```bash
# Start production environment
./docker-scripts.sh prod

# Or manually
docker-compose up --build -d
```

## 📊 Services Overview

| Service           | Port | Purpose             | URL                   |
| ----------------- | ---- | ------------------- | --------------------- |
| **app**           | 3000 | NestJS Application  | http://localhost:3000 |
| **postgre_db**    | 5432 | PostgreSQL Database | localhost:5432        |
| **redis_db**      | 6379 | Redis Cache         | localhost:6379        |
| **pgadmin**       | 5050 | Database Management | http://localhost:5050 |
| **redis-insight** | 8001 | Redis Management    | http://localhost:8001 |

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:duclong@postgre_db:5432/timesheet_management?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="1d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/time-management/auth/google/callback"

# Redis
REDIS_URL="redis://redis_db:6379"

# Application
NODE_ENV="development"
PORT=3000
```

## 🛠 Available Commands

### Using Helper Script

```bash
# Start development environment
./docker-scripts.sh dev

# Start production environment
./docker-scripts.sh prod

# Stop all services
./docker-scripts.sh stop

# View logs
./docker-scripts.sh logs
./docker-scripts.sh logs app  # specific service

# Database operations
./docker-scripts.sh db-migrate
./docker-scripts.sh db-seed

# Health check
./docker-scripts.sh health

# Clean up everything
./docker-scripts.sh clean
```

### Manual Docker Commands

```bash
# Build and start all services
docker-compose up --build -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
docker-compose logs -f app

# Execute commands in running container
docker-compose exec app npm run start:dev
docker-compose exec postgre_db psql -U postgres -d timesheet_management

# Database migrations
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

## 🏥 Health Checks

All services include health checks:

- **Application**: `GET /time-management/health`
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping`

Check service health:

```bash
# All services
docker-compose ps

# Application health endpoint
curl http://localhost:3000/time-management/health

# Database health endpoint
curl http://localhost:3000/time-management/health/database
```

## 📚 Database Management

### pgAdmin Access

- **URL**: http://localhost:5050
- **Email**: admin@timesheet.com
- **Password**: admin123

### Database Connection in pgAdmin

- **Host**: `postgre_db` (or `localhost` from host machine)
- **Port**: `5432`
- **Database**: `timesheet_management`
- **Username**: `postgres`
- **Password**: `duclong`

### Redis Insight Access

- **URL**: http://localhost:8001
- **Redis Host**: `redis_db:6379`

## 🔍 Debugging

### View Application Logs

```bash
docker-compose logs -f app
```

### Access Application Container

```bash
docker-compose exec app sh
```

### Database Shell Access

```bash
docker-compose exec postgre_db psql -U postgres -d timesheet_management
```

### Redis CLI Access

```bash
docker-compose exec redis_db redis-cli
```

## 📁 Data Persistence

Data is persisted using Docker volumes:

- **PostgreSQL Data**: `postgres_data` volume
- **Redis Data**: `redis_data` volume
- **pgAdmin Config**: `./docker/pgadmin/`
- **Redis Insight Config**: `./docker/redis-insight/`

## 🛡 Security Notes

### Production Considerations

1. **Change default passwords** in production
2. **Use secrets management** for sensitive data
3. **Enable SSL/TLS** for database connections
4. **Restrict network access** to databases
5. **Regular security updates** for base images

### Environment Isolation

- Development and production use separate configurations
- Database credentials should be different per environment
- Use Docker secrets in production for sensitive data

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :5432

# Stop conflicting services
./docker-scripts.sh stop
```

#### Database Connection Issues

```bash
# Check database health
docker-compose exec postgre_db pg_isready -U postgres

# View database logs
docker-compose logs postgre_db

# Restart database
docker-compose restart postgre_db
```

#### Application Won't Start

```bash
# Check application logs
docker-compose logs app

# Rebuild application
./docker-scripts.sh build

# Clean restart
./docker-scripts.sh clean
./docker-scripts.sh dev
```

#### Permission Issues (Linux/macOS)

```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./docker/

# Or use rootless Docker
```

### Reset Everything

```bash
# Nuclear option - removes all data
./docker-scripts.sh clean
docker volume prune -f
```

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
# Rebuild with latest dependencies
./docker-scripts.sh build

# Update base images
docker-compose pull
./docker-scripts.sh build
```

### Database Migrations

```bash
# Run pending migrations
./docker-scripts.sh db-migrate

# Create new migration
docker-compose exec app npx prisma migrate dev --name your_migration_name
```

## 📈 Performance Monitoring

### Resource Usage

```bash
# View resource usage
docker stats

# Service-specific stats
docker stats timesheet-management-app
```

### Database Performance

```bash
# PostgreSQL stats
docker-compose exec postgre_db psql -U postgres -d timesheet_management -c "SELECT * FROM pg_stat_activity;"

# Redis stats
docker-compose exec redis_db redis-cli info
```

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs: `./docker-scripts.sh logs`
3. Verify environment configuration
4. Ensure all required ports are available
5. Check Docker resource limits

For additional help, ensure Docker Desktop has sufficient memory allocation (recommended: 4GB+).
