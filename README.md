# Learning Management System (LMS)

A comprehensive Learning Management System designed to support programming education and certification training for approximately 500 users.

## 🚀 Quick Start with Docker

### Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/d-nishikido/learning-management-system.git
   cd learning-management-system
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file to configure your environment settings.

3. **Start the development environment**
   ```bash
   docker compose up -d
   ```

4. **Verify the setup**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/v1
   - PostgreSQL: localhost:15432
   - Redis: localhost:6379

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | React Router v7 application |
| backend | 5000 | Node.js/Express API server |
| postgres | 15432 (dev) / 15433 (test) | PostgreSQL database |
| redis | 6379 | Redis cache server |

### Useful Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Rebuild containers
docker compose up -d --build

# Remove all containers and volumes
docker compose down -v

# Execute commands in running containers
docker compose exec backend npm run migrate
docker compose exec postgres psql -U lms_user -d lms_db
```

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: React Router v7 with TypeScript
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Infrastructure**: Docker environment

### Architecture Pattern
```
[Frontend (React Router v7)] ↔ HTTP/REST API ↔ [Backend API (Node.js/Express)] ↔ SQL ↔ [Database (PostgreSQL)]
                                                            ↕
                                                     [Redis Cache]
```

## 📁 Project Structure

```
lms-system/
├── frontend/              # React Router v7 application
├── backend/               # Node.js/Express API server
├── docker/                # Docker configuration files
│   ├── frontend/
│   ├── backend/
│   └── postgres/
├── docs/                  # Project documentation
├── docker-compose.yml     # Docker services configuration
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🚧 Development Status

This project is currently in the foundation phase (Phase 1):

- [x] Docker environment setup
- [ ] Basic authentication system
- [ ] Database design and implementation
- [ ] Basic UI framework

## 📚 Core Features (Planned)

- **Learning Management**: Course creation, enrollment, progress tracking
- **Assessment System**: Tests, quizzes, programming assignments
- **Gamification**: Points, badges, rankings, achievements
- **Q&A System**: Community-driven knowledge sharing
- **Progress Analytics**: Visual learning progress and skill assessments

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Secure file upload handling
- CORS configuration

## 📋 Requirements

- Support for 500+ concurrent users
- Response time under 3 seconds
- 99.5% uptime target
- Comprehensive testing coverage

## 🛠️ Development Guidelines

- TypeScript mandatory for type safety
- ESLint/Prettier for code consistency
- Comprehensive documentation required
- Security-first approach

## 📖 Documentation

- [System Design](docs/lms_system_design.md) - Detailed system architecture
- [API Specification](docs/lms_api_specification.md) - API endpoints and schemas
- [Database Schema](docs/lms_table_definitions.md) - Database table definitions

## 🤝 Contributing

This project is designed for a 3-person development team. Please refer to the development guidelines in CLAUDE.md for coding standards and practices.

## 📄 License

[License information to be added]