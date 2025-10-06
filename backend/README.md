# LMS Backend API

Learning Management System Backend API built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Features

- **RESTful API** - Clean and well-documented API endpoints
- **TypeScript** - Full type safety and better developer experience
- **Prisma ORM** - Type-safe database access with PostgreSQL
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin and user role permissions
- **Rate Limiting** - API rate limiting for security
- **Validation** - Request validation using Joi
- **Error Handling** - Comprehensive error handling middleware
- **Security** - Helmet, CORS, and other security best practices
- **File Upload** - Secure file upload handling
- **Logging** - Structured logging with Winston
- **Health Checks** - System health monitoring endpoints

## 📋 Prerequisites

- Node.js (v20 or higher)
- npm (v10 or higher)
- PostgreSQL (v16 or higher)
- Redis (v7 or higher)

## 🛠️ Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Or run migrations (for production)
   npm run db:migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🚦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

### Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database (development)
- `npm run db:migrate` - Run database migrations (production)
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/        # Route controllers
│   ├── services/          # Business logic services  
│   ├── models/            # Database models and types
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── app.ts            # Express app configuration
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding script
├── dist/                 # Compiled JavaScript (production)
├── coverage/             # Test coverage reports
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .env.example
└── README.md
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for full list):

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:15432/lms_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

### Database Configuration

The application uses PostgreSQL with Prisma ORM. The database schema is defined in `prisma/schema.prisma` and includes:

- User management (users, roles, authentication)
- Course management (courses, lessons, materials)
- Progress tracking 
- Q&A system
- Gamification (points, badges, skills)
- Communication (forums, notifications)
- System management (settings, audit logs)

## 🔐 API Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Login**: POST `/api/v1/auth/login` - Returns JWT token
2. **Protected routes**: Include `Authorization: Bearer <token>` header
3. **Token refresh**: POST `/api/v1/auth/refresh` - Get new token

### Role-based Access

- **User**: Basic access to courses, learning materials, Q&A
- **Admin**: Full access including user management, course creation

## 📊 API Endpoints

### Health & System
- `GET /` - API information
- `GET /api/v1/health` - Health check

### Authentication (Planned)
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout  
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/forgot-password` - Password reset

### Courses (Planned)
- `GET /api/v1/courses` - List courses
- `GET /api/v1/courses/:id` - Get course details
- `POST /api/v1/courses` - Create course (admin)
- `PUT /api/v1/courses/:id` - Update course (admin)

### Users (Planned)
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/:id/progress` - Get user progress

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔍 Code Quality

The project enforces code quality through:

- **ESLint** - Code linting with TypeScript rules
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Husky** - Git hooks for pre-commit checks (planned)

## 🐳 Docker Support

The backend is designed to run in Docker containers. See the main project's `docker-compose.yml` for configuration.

## 📝 Logging

The application uses structured logging:
- Development: Console output with colors
- Production: JSON format for log aggregation
- Log levels: error, warn, info, debug

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Considerations
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper CORS origins
- Set up proper logging
- Use connection pooling for database
- Set up monitoring and health checks

## 🤝 Contributing

1. Follow TypeScript and ESLint rules
2. Write tests for new features
3. Update documentation
4. Use conventional commit messages

## 📄 License

MIT License - see LICENSE file for details