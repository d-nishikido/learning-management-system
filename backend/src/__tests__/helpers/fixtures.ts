// Fixtures for testing

export const userFixtures = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@test.example.com',
    passwordHash: '$2b$10$testHashedPassword',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
    profileImageUrl: null,
    bio: null,
    isActive: true,
    lastLogin: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  
  user1: {
    id: 2,
    username: 'user1',
    email: 'user1@test.example.com',
    passwordHash: '$2b$10$testHashedPassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as const,
    profileImageUrl: null,
    bio: null,
    isActive: true,
    lastLogin: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  user2: {
    id: 3,
    username: 'user2',
    email: 'user2@test.example.com',
    passwordHash: '$2b$10$testHashedPassword',
    firstName: 'Another',
    lastName: 'User',
    role: 'USER' as const,
    profileImageUrl: null,
    bio: null,
    isActive: true,
    lastLogin: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  inactiveUser: {
    id: 4,
    username: 'inactive',
    email: 'inactive@test.example.com',
    passwordHash: '$2b$10$testHashedPassword',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'USER' as const,
    profileImageUrl: null,
    bio: null,
    isActive: false,
    lastLogin: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const courseFixtures = {
  course1: {
    id: 1,
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming',
    category: 'Programming',
    level: 'BEGINNER' as const,
    duration: 40,
    isPublished: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  course2: {
    id: 2,
    title: 'Advanced React',
    description: 'Master advanced React concepts',
    category: 'Programming',
    level: 'ADVANCED' as const,
    duration: 60,
    isPublished: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  unpublishedCourse: {
    id: 3,
    title: 'Draft Course',
    description: 'This course is not published yet',
    category: 'Programming',
    level: 'INTERMEDIATE' as const,
    duration: 30,
    isPublished: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const createUserData = {
  valid: {
    username: 'newuser',
    email: 'newuser@test.example.com',
    password: 'NewPass123!',
    firstName: 'New',
    lastName: 'User',
    role: 'USER' as const,
  },

  invalidEmail: {
    username: 'newuser',
    email: 'invalid-email',
    password: 'NewPass123!',
    firstName: 'New',
    lastName: 'User',
  },

  weakPassword: {
    username: 'newuser',
    email: 'newuser@test.example.com',
    password: 'weak',
    firstName: 'New',
    lastName: 'User',
  },

  missingRequired: {
    email: 'newuser@test.example.com',
    password: 'NewPass123!',
  },
};

export const loginData = {
  admin: {
    email: 'admin@test.example.com',
    password: 'Admin123!',
  },

  user1: {
    email: 'user1@test.example.com',
    password: 'User123!',
  },

  invalid: {
    email: 'nonexistent@test.example.com',
    password: 'wrongpassword',
  },

  malformed: {
    email: 'invalid-email',
    password: '123',
  },
};

export const jwtTokens = {
  validAdmin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk4ODAwfQ.test-admin-token',
  validUser: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.test-user-token',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTUyMDB9.test-expired-token',
  invalid: 'invalid.jwt.token',
  refreshToken: 'refresh-token-example',
};

export const apiResponses = {
  unauthorized: {
    success: false,
    message: 'Access token required',
    error: 'UNAUTHORIZED',
  },

  forbidden: {
    success: false,
    message: 'Insufficient permissions',
    error: 'FORBIDDEN',
  },

  notFound: {
    success: false,
    message: 'Resource not found',
    error: 'NOT_FOUND',
  },

  validationError: {
    success: false,
    message: 'Validation failed',
    error: 'VALIDATION_ERROR',
  },
};