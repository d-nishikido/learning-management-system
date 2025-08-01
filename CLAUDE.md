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

### 🔄 Next Steps
1. **Core API Endpoints**: User management, course management, progress tracking
2. **Frontend Integration**: Authentication UI components
3. **Integration Testing**: E2E authentication flow testing

The authentication system provides secure JWT-based authentication with bcrypt password hashing, following security best practices outlined in this document.

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

### 🔄 Next Steps
1. **Authentication UI**: Login, registration, and password reset pages
2. **Course Pages**: Course listing, details, and enrollment
3. **User Dashboard**: Progress tracking and statistics
4. **Q&A System**: Question posting and answer interface
5. **Gamification UI**: Points, badges, and rankings display

The frontend infrastructure is now ready for feature development, fully integrated with the backend API and Docker environment.

---

This guide should serve as your primary reference when working on any aspect of the LMS system. Always refer back to these specifications and maintain consistency with the established architecture and design principles.