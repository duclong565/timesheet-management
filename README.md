# Timesheet Management System

A comprehensive enterprise-grade timesheet and leave management system built with NestJS, PostgreSQL, and Prisma ORM.

## What I've Built

### Core System Architecture

- ✅ Built a modular NestJS backend with complete separation of concerns
- ✅ Implemented Prisma ORM with PostgreSQL for data management
- ✅ Designed a comprehensive database schema with proper relationships
- ✅ Migrated from Serial IDs to UUIDs for better security and scalability
- ✅ Created detailed data seeding scripts for development and testing

### Authentication & Authorization

- ✅ JWT-based authentication with secure token handling
- ✅ Google OAuth integration for social login
- ✅ Comprehensive role-based access control (ADMIN, HR, PM, USER roles)
- ✅ Global route protection using NestJS guards
- ✅ Custom user decorators for accessing authenticated user data

### Timesheet Management

- ✅ Complete timesheet creation flow with data validation
- ✅ Support for different timesheet types (NORMAL, OVERTIME, HOLIDAY)
- ✅ Approval workflow with status tracking (PENDING, APPROVED, REJECTED)
- ✅ Project and task assignment for timesheets
- ✅ Time tracking with check-in/check-out functionality
- ✅ Punishment system for late arrivals and early departures

### Leave & Request System

- ✅ Various request types (OFF, REMOTE, ONSITE)
- ✅ Multiple absence types with custom configurations
- ✅ Period-specific requests (MORNING, AFTERNOON, FULL_DAY)
- ✅ Multi-day leave request handling
- ✅ Request approval workflow with audit trails

### Project & Task Management

- ✅ Project setup with client associations
- ✅ Task tracking within projects with billable status
- ✅ User-project assignment system
- ✅ Project type classification (T&M, Fixed Price, Non-Bill)
- ✅ Special overtime settings for projects

### Organization Structure

- ✅ Branch management for multiple locations
- ✅ Position tracking and hierarchy
- ✅ Client management for project associations
- ✅ Employee capability tracking
- ✅ Working time configurations with morning/afternoon periods

### Advanced Features

- ✅ Comprehensive audit logging system for all data changes
- ✅ Timesheet complaint system for dispute resolution
- ✅ Special day configurations (offdays, holidays)
- ✅ Working time customization for individual users
- ✅ Flexible overtime factor configuration

### Data Validation & Error Handling

- ✅ Request and response DTOs with Zod validation
- ✅ Consistent error handling and responses
- ✅ Standardized API response format using interceptors
- ✅ Strong typing throughout with TypeScript

## Technical Implementation

### Database Design

- **Schema Migration**: Carefully managed database evolution using Prisma migrations
- **Entity Relationships**: Properly modeled one-to-many and many-to-many relationships
- **Data Integrity**: Enforced referential integrity with foreign key constraints
- **Indexing**: Strategic indexes for performance optimization

### API Architecture

- **RESTful Endpoints**: Consistent API design following REST principles
- **Controller/Service Pattern**: Clean separation between API endpoints and business logic
- **Repository Pattern**: Data access abstracted through Prisma service
- **DTO Validation**: Comprehensive input validation with Zod schemas

### Security Features

- **JWT Authentication**: Secure token-based user authentication
- **Role-based Access Control**: Fine-grained permission management
- **API Guards**: Route protection based on authentication and roles
- **Input Validation**: Prevention of injection and other input-based attacks

### Code Quality

- **TypeScript**: Strongly-typed codebase reducing runtime errors
- **Modular Design**: Easy maintenance through clear module boundaries
- **Clean Architecture**: Separation of concerns across controllers, services, and DTOs
- **ESLint Configuration**: Code style consistency enforcement

## Development Environment

### Prerequisites

- Node.js (v16+)
- Docker & Docker Compose
- PostgreSQL

### Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (create a `.env` file)
4. Start the database: `docker-compose up -d`
5. Run migrations: `npx prisma migrate dev`
6. Seed the database: `npm run seed`
7. Start the application: `npm run start:dev`

## Technologies Used

- **Backend Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT & Passport.js with Google OAuth
- **Validation**: Zod
- **API Documentation**: OpenAPI/Swagger (planned)
- **Containerization**: Docker

## Future Improvements

- Frontend application integration
- Enhanced reporting and analytics
- Mobile support for on-the-go timesheet entry
- Calendar integration
- Email notifications for request status changes

## Author

- Duc Long Nguyen
