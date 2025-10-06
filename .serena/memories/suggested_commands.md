# Suggested Commands for LMS Development

## Development
- `npm run docker:up` - Start development environment
- `npm run frontend` - Start frontend dev server
- `npm run backend` - Start backend dev server
- `npm run docker:down` - Stop Docker environment

## Testing & Quality
- `cd frontend && npm run lint` - Run ESLint for frontend
- `cd frontend && npm run typecheck` - TypeScript checking for frontend
- `cd backend && npm run lint` - Run ESLint for backend
- `cd backend && npm run test` - Run backend Jest tests
- `npm run e2e:affected` - Run affected E2E tests (required before commits)

## Database
- `cd backend && npm run db:generate` - Generate Prisma client
- `cd backend && npm run db:push` - Push schema to database
- `cd backend && npm run db:migrate` - Run migrations
- `cd backend && npm run db:seed` - Seed development data

## Git
- `git status` - Check current branch and changes
- `git diff` - Review changes before commit
- `git add .` - Stage changes
- `git commit -m "message"` - Commit with descriptive message