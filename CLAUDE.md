# CLAUDE.md - Learning Management System (LMS) Project Guide

## Project Overview

This is a comprehensive Learning Management System (LMS) designed to support programming education and certification training for approximately 500 users. The system focuses on integrated learning activity planning, implementation, evaluation, and management with strong gamification elements to enhance learning motivation.

## System Architecture

### Technology Stack
- **Frontend**: React Router v7 with TypeScript
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Infrastructure**: Docker environment
- **Development Environment**: ClaudeCode

### Architecture Pattern
```
[Frontend (React Router v7)]
    ↕ HTTP/REST API
[Backend API (Node.js/Express)]
    ↕ SQL
[Database (PostgreSQL)]
```

## Core Features

### 1. Learning Management
- **Course Management**: Create, edit, delete courses (admin), course enrollment and progress tracking (users)
- **Diverse Learning Materials**:
  - File-based materials: PDF, video, audio, presentations
  - URL-based materials: External sites, YouTube, online resources
  - Manual progress tracking: Self-reported progress for external learning
  - Supplementary resources: Related files, sites, YouTube videos
- **Learning Resource Management**: Hierarchical management of main materials and supplementary resources

### 2. Progress Management & Visualization
- **Learning Progress Dashboard**: Individual progress rates, learning time visualization, achievement display
- **Capability Assessment System**: Programming skill maps, certification proficiency levels, growth curve visualization
- **Learning History Management**: Access history, external learning progress records

### 3. Test & Assessment Management
- **Question Creation (Admin)**: Multiple choice (auto-graded), essay questions, programming assignments
- **Test Implementation**: Time limits, randomized questions, hybrid auto/manual grading

### 4. Gamification Features
- **Point System**: Points for lesson completion, test passing, Q&A participation, streak bonuses
- **Badge & Title System**: Achievement-based badges, language-specific badges, Q&A contribution badges
- **Ranking System**: Study time rankings, category-specific score rankings, Q&A contribution rankings
- **Learning Continuity Support**: Learning calendar, goal setting and tracking

### 5. Q&A & Knowledge Management
- **Question Posting**: Course/lesson-level questions with categorization and file attachments
- **Answer System**: Admin and peer responses, best answer selection, answer rating
- **Knowledge Base**: Auto-generated FAQs, search functionality, related question recommendations
- **Management Features**: Public/private settings, content moderation, knowledge organization

### 6. Communication Features
- **Forums & Discussion Boards**
- **Messaging System**
- **Announcements & Notifications**

## Database Schema Overview

### Key Tables
- **users**: User information (500+ users supported)
- **courses**: Course information (programming/certification domains)
- **lessons**: Lesson information
- **learning_materials**: Learning material management with support for file, URL, and manual progress types
- **learning_resources**: Supplementary resource management
- **user_progress**: Learning progress with auto/manual tracking
- **qa_questions**: Q&A question management with tagging and categorization
- **qa_answers**: Q&A answer management with best answer functionality
- **knowledge_base**: Knowledge base and FAQ management
- **questions**: Test question management (multiple choice, essay, programming)
- **tests**: Test definitions with flexible configuration
- **skills**: Skill definitions by programming language and technical domain
- **badges**: Badge definitions with rarity and reward systems
- **user_points**: User point history and tracking

## API Architecture

### Base Configuration
- **Base URL**: `https://api.lms.example.com/api/v1`
- **Authentication**: JWT Bearer Token
- **Data Format**: JSON
- **Protocol**: HTTPS

### Key API Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `POST /auth/forgot-password` - Password reset initiation

#### Course Management
- `GET /courses` - List courses with filtering
- `GET /courses/{id}` - Get course details
- `POST /courses` - Create course (admin only)
- `PUT /courses/{id}` - Update course (admin only)

#### Learning Progress
- `GET /progress/me` - Get user's progress
- `PUT /progress/{id}` - Update manual progress
- `POST /progress/complete` - Mark material as complete
- `GET /progress/stats` - Get learning statistics

#### Q&A Management
- `GET /qa/questions` - List questions with filtering
- `POST /qa/questions` - Post new question
- `POST /qa/questions/{id}/answers` - Post answer
- `PUT /qa/answers/{id}/best-answer` - Set best answer

#### Gamification
- `GET /users/{id}/skills` - Get user skills
- `GET /users/{id}/badges` - Get user badges
- `GET /rankings/study-time` - Get study time rankings

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Mandatory for type safety and code quality
- **ESLint/Prettier**: Enforced code style consistency
- **Comprehensive Documentation**: Function and class-level documentation required
- **Maintainability Focus**: Designed for 3-person team operation

### Testing Strategy
- **Unit Tests**: Jest for frontend and backend
- **Integration Tests**: Jest + Supertest for API testing
- **E2E Tests**: Playwright with MCP server integration
- **Test Coverage**: Comprehensive coverage of user flows

### Security Requirements
- **HTTPS Communication**: All API calls must use HTTPS
- **Password Encryption**: bcrypt for password hashing
- **Input Validation**: SQL injection and XSS protection
- **File Upload Security**: Secure handling of programming assignment uploads
- **CSRF Protection**: Cross-site request forgery prevention

### Performance Requirements
- **Response Time**: Under 3 seconds
- **Concurrent Users**: 500 simultaneous users
- **Database Optimization**: Connection pooling and query optimization
- **Uptime**: 99.5% availability target

## UI/UX Design Principles

### Design Concept
- **Intuitive Operation**: Simple UI allowing focus on learning
- **Motivation Enhancement**: Gamification elements integrated throughout
- **Progress Visualization**: Visual feedback through graphs and charts

### Key Screens
- **Dashboard**: Learning status overview
- **Course Catalog**: Available courses display and selection
- **Learning Interface**: Material display, external links, manual progress input, supplementary resources, related Q&A
- **Q&A Interface**: Question listing, search, filtering, posting forms
- **Knowledge Base**: FAQ, search functionality, related materials
- **Resource Library**: Supplementary materials, reference sites, YouTube videos
- **Progress Management**: Detailed progress and analytics
- **Admin Panel**: Course, user, material, resource, and Q&A management

## Development Phases

### Phase 1: Foundation ✅ **COMPLETED** 
- ✅ Docker environment setup
- ✅ Backend infrastructure (Node.js + Express + TypeScript + Prisma)
- ✅ Database design and implementation
- ✅ **Basic authentication system (JWT authentication implemented)**
- 🔄 Basic UI framework (pending frontend implementation)

### Phase 2: Core Features
- User management
- Course and lesson management
- Basic learning progress functionality

### Phase 3: Advanced Features
- Advanced analytics
- Capability assessment system
- Educational planning support

### Phase 4: Testing & Optimization
- Comprehensive unit and integration testing
- Playwright E2E test implementation with MCP server integration
- Performance optimization
- Security hardening
- Operational monitoring
- Documentation completion

## File Structure Recommendations

```
lms-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── course/
│   │   │   ├── qa/
│   │   │   └── user/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── public/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── prisma/
└── docker/
```

## Key Implementation Notes

### Material Management
- Support for multiple material types (file, URL, manual progress)
- Flexible progress tracking system combining automatic and manual methods
- Supplementary resource hierarchy with importance levels
- File upload security for programming assignments

### Q&A System
- Comprehensive tagging system for categorization
- Best answer selection with community voting
- Knowledge base auto-generation from popular Q&A
- Public/private visibility controls

### Gamification Implementation
- Point system with multiple earning methods including streak bonuses
- Badge system with rarity levels and achievement conditions
- Multi-dimensional ranking systems (time, points, contribution)
- Skill progression tracking by programming language and domain

### Assessment System
- Flexible question types (multiple choice, essay, programming)
- Auto-grading for objective questions
- Manual grading workflow for subjective assessments
- Test configuration with time limits and attempt restrictions

## Deployment Considerations

### Docker Configuration
- **frontend**: React Router v7 application container
- **backend**: Node.js/Express API server container  
- **database**: PostgreSQL container
- **nginx**: Reverse proxy for production

### Security Measures
- JWT token-based authentication
- Role-based access control (RBAC)
- File upload validation and scanning
- Rate limiting on API endpoints
- CORS configuration for frontend domain

### Monitoring & Maintenance
- Daily database backups
- Audit logging for critical operations
- Performance monitoring
- Error tracking and alerting
- Regular security updates

## Special Requirements

### User Scale
- Designed for approximately 500 concurrent users
- Optimized database queries and indexing
- Connection pooling for database efficiency

### Content Focus
- Programming education primary focus
- Certification training support
- Japanese language interface (though this guide is in English)

### Assessment Philosophy
- Subjective evaluation combined with automatic grading
- Admin-created questions and tests
- Flexible progress tracking accommodating various learning styles

### Team Operation
- 3-person development and maintenance team
- Extensive documentation and commenting for maintainability
- Clear separation of concerns and modular architecture

---

## Backend Infrastructure Completion Status

### ✅ Completed (January 31, 2025)
**Backend Foundation (Phase 1)** has been successfully implemented with the following components:

#### Project Structure
- ✅ Complete backend directory structure (`backend/src/`)
- ✅ TypeScript configuration with strict settings
- ✅ ESLint and Prettier code quality tools
- ✅ Package.json with all required dependencies

#### Database Layer
- ✅ Prisma ORM configuration  
- ✅ Complete database schema (47 tables)
- ✅ All core entities: Users, Courses, Progress, Q&A, Gamification
- ✅ Proper relationships and indexes defined

#### Application Layer
- ✅ Express.js server with security middleware
- ✅ Authentication middleware structure
- ✅ Error handling and logging
- ✅ Health check endpoints
- ✅ Rate limiting and CORS configuration

#### Development Environment
- ✅ Docker Compose integration
- ✅ TypeScript compilation pipeline
- ✅ Code quality validation (ESLint/Prettier)
- ✅ Development server with hot reload

#### API Foundation
- ✅ RESTful API structure
- ✅ Type-safe request/response interfaces
- ✅ Basic routing system
- ✅ Health monitoring endpoint

### ✅ Authentication System Completed (August 1, 2025)
**JWT Authentication Implementation** has been successfully completed with the following components:

#### Authentication Services
- ✅ Password hashing service with bcrypt (`backend/src/services/passwordService.ts`)
- ✅ JWT token service with access/refresh tokens (`backend/src/services/jwtService.ts`)
- ✅ Authentication controller with login/logout/refresh endpoints (`backend/src/controllers/authController.ts`)

#### Route Integration
- ✅ Authentication routes module (`backend/src/routes/auth.ts`)
- ✅ Validation middleware for auth endpoints (`backend/src/middleware/validateRequest.ts`)
- ✅ Auth routes registered in main router

#### API Endpoints
- ✅ `POST /api/v1/auth/login` - User login with JWT token generation
- ✅ `POST /api/v1/auth/logout` - User logout
- ✅ `POST /api/v1/auth/refresh` - Token refresh
- ✅ `POST /api/v1/auth/forgot-password` - Password reset initiation

#### Testing & Quality
- ✅ Unit tests for password service (17 tests passing)
- ✅ Unit tests for JWT service (17 tests passing)
- ✅ TypeScript compilation passing
- ✅ ESLint code quality checks passing

### ✅ API Infrastructure Enhanced (August 1, 2025)
**API基盤実装 (Issue #19/20)** has been successfully completed with comprehensive improvements:

#### Enhanced Error Handling System
- ✅ Custom error classes with structured error codes (`backend/src/utils/errors.ts`)
- ✅ Enhanced error handler with Prisma error conversion (`backend/src/middleware/errorHandler.ts`)
- ✅ Comprehensive error logging with request context
- ✅ Type-safe error responses with operational/non-operational classification

#### Unified Validation System using Joi
- ✅ Joi-based validation middleware (`backend/src/middleware/validation.ts`)
- ✅ Common validation schemas for reusability
- ✅ Specific validation schemas for auth, courses, users, and Q&A
- ✅ Migration from express-validator to Joi for consistency

#### Express Router Configuration Enhancement
- ✅ Complete course routes with CRUD operations (`backend/src/routes/courses.ts`)
- ✅ Complete user management routes (`backend/src/routes/users.ts`)
- ✅ Complete Q&A system routes (`backend/src/routes/qa.ts`)
- ✅ Role-based access control middleware (`backend/src/middleware/auth.ts`)
- ✅ All routes integrated in main router with proper structure

#### Optimized CORS Configuration
- ✅ Enhanced CORS with dynamic origin validation
- ✅ Additional security headers and exposed headers
- ✅ Support for multiple development environments
- ✅ Preflight request optimization with maxAge

#### Comprehensive Testing
- ✅ Error handling system tests (40+ test cases)
- ✅ Validation system tests (comprehensive schema testing)
- ✅ Unit tests for all custom error classes
- ✅ Type-safe test implementations

### 🔄 Next Steps
1. **Controller Implementation**: Implement actual controller logic for courses, users, Q&A
2. **Database Integration**: Connect routes to Prisma database operations
3. **Integration Testing**: E2E API testing with real database scenarios
4. **Frontend Integration**: Connect React frontend to enhanced API endpoints

The API infrastructure now provides a robust, type-safe, and well-tested foundation for the LMS system with comprehensive error handling, validation, and routing capabilities.

---

## Frontend Infrastructure Completion Status

### ✅ Completed (February 1, 2025)
**Frontend Foundation (Phase 2)** has been successfully implemented with the following components:

#### Project Structure
- ✅ Complete frontend directory structure (`frontend/src/`)
- ✅ React Router v7 with Vite build tool
- ✅ TypeScript configuration with strict mode and path aliases
- ✅ ESLint and Prettier code quality tools

#### Core Technologies
- ✅ React Router v7 for routing
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Vite for fast development and building
- ✅ Axios for API communication

#### UI Components
- ✅ Layout component with navigation
- ✅ Home page with LMS overview
- ✅ 404 Not Found page
- ✅ Responsive design with Tailwind CSS
- ✅ Custom utility classes for consistent styling

#### Development Features
- ✅ Hot module replacement (HMR)
- ✅ Path aliases (@components, @services, etc.)
- ✅ Environment variable support
- ✅ API proxy configuration for development

#### Docker Integration
- ✅ Frontend container configuration
- ✅ Port mapping (3002:3000)
- ✅ Volume mounting for development
- ✅ Automatic npm install on container start

#### API Services
- ✅ API client with interceptors
- ✅ Authentication token management
- ✅ Typed API responses
- ✅ Service modules for auth, courses, and progress

### ✅ UI Components Completed (August 1, 2025)
**Basic UI Components (Issue #16/17)** have been successfully implemented with the following components:

#### Authentication Components
- ✅ Authentication Context with JWT token management
- ✅ LoginForm component with validation and error handling
- ✅ LogoutButton component with confirmation dialog
- ✅ Login page with responsive design

#### Navigation & Layout Components
- ✅ Updated Layout component with sidebar integration
- ✅ Sidebar component with role-based navigation
- ✅ MobileMenu component for responsive navigation
- ✅ Responsive design for mobile, tablet, and desktop

#### Common UI Components
- ✅ Button component with variants and loading states
- ✅ Input component with validation and error display
- ✅ Card component for content containers
- ✅ LoadingSpinner component

#### Integration Features
- ✅ Authentication state management
- ✅ Route protection for authenticated users
- ✅ Type-safe API integration
- ✅ ESLint and TypeScript compliance

### 🔄 Next Steps
1. **Course Pages**: Course listing, details, and enrollment
2. **User Dashboard**: Progress tracking and statistics
3. **Q&A System**: Question posting and answer interface
4. **Gamification UI**: Points, badges, and rankings display
5. **User Registration**: Registration form and workflow

The frontend infrastructure is now ready for advanced feature development, with complete authentication UI and responsive layout system integrated with the backend API and Docker environment.

### ✅ User Management API Completed (August 1, 2025)
**User Management API (Issue #22/23)** has been successfully implemented with comprehensive functionality:

#### User Service Layer
- ✅ Complete user CRUD operations (`backend/src/services/userService.ts`)
- ✅ Password hashing with bcrypt integration
- ✅ User conflict detection (username/email uniqueness)
- ✅ Paginated user queries with filtering and search
- ✅ User progress, badges, and skills retrieval
- ✅ Soft delete functionality with isActive flag

#### User Controller Implementation
- ✅ Complete user controller with business logic (`backend/src/controllers/userController.ts`)
- ✅ Type-safe request/response handling
- ✅ Role-based access control for all endpoints
- ✅ Password hash exclusion from responses
- ✅ Comprehensive error handling with custom error types

#### API Endpoints
- ✅ `POST /users` - User registration (Admin only)
- ✅ `GET /users` - Paginated user listing with filters (Admin only)
- ✅ `GET /users/me` - Current user profile
- ✅ `PUT /users/me` - Current user profile update (restricted fields)
- ✅ `GET /users/:id` - User details (Admin or own profile)
- ✅ `PUT /users/:id` - User update (Admin only)
- ✅ `DELETE /users/:id` - Soft delete user (Admin only)
- ✅ `GET /users/:id/progress` - User learning progress (Admin or own)
- ✅ `GET /users/:id/badges` - User badges (Admin or own)
- ✅ `GET /users/:id/skills` - User skills (Admin or own)

#### Validation & Security
- ✅ Enhanced validation schemas for user operations
- ✅ Bio and profile image URL fields support
- ✅ Joi validation with custom error messages
- ✅ Input sanitization and type safety
- ✅ Role-based access control enforcement

#### Testing & Quality
- ✅ Comprehensive unit tests for user service (21 test cases)
- ✅ Mock database operations with Prisma
- ✅ Password service integration testing
- ✅ Error scenario coverage (NotFound, Conflict errors)
- ✅ TypeScript compilation and linting compliance

#### Technical Features
- ✅ Generic RequestWithUser interface for type safety
- ✅ Proper database field mapping (badgeName, skillName, etc.)
- ✅ Efficient pagination with configurable limits
- ✅ Search functionality across multiple user fields
- ✅ Last login timestamp tracking

The User Management API provides a complete, secure, and well-tested foundation for user operations in the LMS system, following all established architectural patterns and security best practices.

### ✅ E2E Test Implementation Completed (August 2, 2025)
**E2E Test Environment (Issue #25/26)** has been successfully implemented with comprehensive test coverage:

#### Playwright Test Framework
- ✅ Playwright configuration with multi-browser support (`playwright.config.ts`)
- ✅ TypeScript configuration for E2E tests (`e2e/tsconfig.json`)
- ✅ Test fixtures for authentication and test data
- ✅ Page Object Model implementation for maintainable tests
- ✅ Utility functions and MCP client integration

#### Test Specifications Implemented
- ✅ **Authentication Tests** (`e2e/specs/auth.spec.ts`)
  - Login/logout flows
  - Form validation
  - Token refresh handling
  - Password reset functionality
- ✅ **Navigation Tests** (`e2e/specs/navigation.spec.ts`)
  - Menu navigation
  - Role-based menu visibility
  - Mobile responsive navigation
  - Breadcrumb navigation
  - 404 error handling
- ✅ **Course Management Tests** (`e2e/specs/courses.spec.ts`)
  - Course listing and filtering
  - Course details and enrollment
  - Admin course CRUD operations
  - Progress tracking
- ✅ **User Management Tests** (`e2e/specs/users.spec.ts`)
  - User profile management
  - Admin user operations
  - User registration
  - Statistics and achievements

#### Test Infrastructure
- ✅ Docker test environment configuration (`docker-compose.test.yml`)
- ✅ E2E seed data script (`backend/prisma/seed-e2e.ts`)
- ✅ Test user accounts with predefined data
- ✅ MCP server integration for test data management

#### Manual Testing Requirements
- ✅ Selective test execution for changed files (`scripts/run-affected-e2e-tests.js`)
- ✅ NPM scripts for various test scenarios
- ✅ **MANDATORY**: E2E tests with MCP must be executed before every git commit
- ✅ Developer responsibility to ensure all affected tests pass before committing

#### Test Execution Commands
```bash
# Install Playwright browsers
npm run e2e:install

# Run all E2E tests
npm run e2e

# Run tests in UI mode
npm run e2e:ui

# Run tests in headed mode
npm run e2e:headed

# Run only affected tests (REQUIRED before commit)
npm run e2e:affected

# Start test environment with Docker
npm run docker:test
```

#### Test Data
- Admin: `admin@test.example.com` / `Admin123!`
- User 1: `user1@test.example.com` / `User123!`
- User 2: `user2@test.example.com` / `User123!`

#### Environment Setup Status
- ✅ **Playwright Environment**: Fully configured with multi-browser support
- ✅ **MCP Server Integration**: Complete setup for test data management
- ✅ **Docker Test Environment**: Isolated database and services ready
- ✅ **Test Fixtures and Utilities**: All components implemented and verified

## 🚨 CRITICAL DEVELOPMENT WORKFLOW

### Pre-Commit Testing Requirements
**EVERY developer MUST execute E2E tests with MCP before committing code:**

1. **Identify Affected Tests**:
   ```bash
   npm run e2e:affected
   ```

2. **Run Complete Test Suite** (if major changes):
   ```bash
   npm run docker:test  # Start test environment
   npm run e2e          # Run all tests
   ```

3. **Verify All Tests Pass** before proceeding with commit

4. **Commit Only After** successful test execution

### Test Execution Responsibility
- **Individual Developer**: Must run affected E2E tests before every commit
- **No Automated Hooks**: Manual execution ensures developer awareness of test results
- **MCP Integration**: Test data is automatically managed through MCP server
- **Comprehensive Coverage**: Authentication, navigation, courses, and user management flows

The E2E test suite provides comprehensive coverage of all major user flows, ensuring reliability and quality of the LMS system through mandatory manual testing before every commit.

---

This guide should serve as your primary reference when working on any aspect of the LMS system. Always refer back to these specifications and maintain consistency with the established architecture and design principles.