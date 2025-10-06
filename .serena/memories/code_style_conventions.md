# Code Style & Conventions

## TypeScript
- Strong typing required for all functions and interfaces
- Interfaces in `types/index.ts` for shared types
- Use type inference where obvious

## Naming Conventions
- **Frontend**: camelCase for files/functions, PascalCase for components
- **Backend**: camelCase for functions, snake_case for database fields
- **API Routes**: kebab-case in URLs

## File Structure
- **Frontend Components**: `components/category/ComponentName.tsx`
- **Backend**: Controller → Service → Database pattern
- **Tests**: Colocated in `__tests__` directories

## Import Patterns
```typescript
// Frontend
import { Component } from '@/components/common/Component';
import type { User } from '@/types';

// Backend
import { Service } from '../services/service';
```

## Error Handling
- Custom error classes (NotFoundError, ValidationError, ConflictError)
- Structured API responses with status/message/data