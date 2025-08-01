import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, validateParams, userSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserController } from '../controllers/userController';

const router = Router();

/**
 * POST /users
 * Create a new user
 * Admin only
 */
router.post('/',
  authenticateToken,
  requireRole('ADMIN'),
  validateBody(userSchemas.create),
  UserController.createUser
);

/**
 * GET /users
 * Get all users with filtering and pagination
 * Admin only
 */
router.get('/',
  authenticateToken,
  requireRole('ADMIN'),
  validateQuery(userSchemas.query),
  UserController.getAllUsers
);

/**
 * GET /users/me
 * Get current user profile
 * Authenticated users only
 */
router.get('/me',
  authenticateToken,
  UserController.getCurrentUser
);

/**
 * PUT /users/me
 * Update current user profile
 * Authenticated users only
 */
router.put('/me',
  authenticateToken,
  validateBody(userSchemas.update.fork(['role', 'isActive'], (schema) => schema.forbidden())),
  UserController.updateCurrentUser
);

/**
 * GET /users/:id
 * Get user by ID
 * Admin only or own profile
 */
router.get('/:id',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  UserController.getUserById
);

/**
 * PUT /users/:id
 * Update user by ID
 * Admin only
 */
router.put('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  validateBody(userSchemas.update),
  UserController.updateUser
);

/**
 * DELETE /users/:id
 * Delete user by ID (soft delete)
 * Admin only
 */
router.delete('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  UserController.deleteUser
);

/**
 * GET /users/:id/progress
 * Get user learning progress
 * Admin only or own progress
 */
router.get('/:id/progress',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  UserController.getUserProgress
);

/**
 * GET /users/:id/badges
 * Get user badges
 * Admin only or own badges
 */
router.get('/:id/badges',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  UserController.getUserBadges
);

/**
 * GET /users/:id/skills
 * Get user skills
 * Admin only or own skills
 */
router.get('/:id/skills',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  UserController.getUserSkills
);

export default router;