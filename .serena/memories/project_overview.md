# Learning Management System Project Overview

## Purpose
A comprehensive Learning Management System (LMS) for programming education and certification training, supporting ~500 users with gamification elements.

## Tech Stack
- **Frontend**: React Router v7 with TypeScript, Vite
- **Backend**: Node.js/Express with TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Testing**: Jest (unit), Playwright (E2E)
- **Infrastructure**: Docker

## Key Structure
- Monorepo with workspaces (frontend/backend)
- Database models: User, Course, Lesson, LearningMaterial, UserProgress
- Progress tracking: Auto/Manual types with completion status
- API: RESTful with JWT authentication

## Current Issue #150
Implementing lesson completion feature with checkbox and course progress calculation based on lesson completion and estimated duration.