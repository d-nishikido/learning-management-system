import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, validateParams, lessonSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { LessonController } from '../controllers/lessonController';
import materialRoutes from './materials';

const router = Router({ mergeParams: true }); // Allow access to parent route params (courseId)

/**
 * GET /courses/:courseId/lessons
 * Get all lessons for a course with filtering and pagination
 * Public endpoint with optional authentication for personalized results
 */
router.get('/', 
  validateParams(Joi.object({ courseId: commonSchemas.id })),
  validateQuery(lessonSchemas.query),
  optionalAuth,
  LessonController.getLessonsByCourse
);

/**
 * GET /courses/:courseId/lessons/:id
 * Get lesson by ID with detailed information
 * Public endpoint with optional authentication for personalized results
 */
router.get('/:id',
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  optionalAuth,
  LessonController.getLessonById
);

/**
 * POST /courses/:courseId/lessons
 * Create new lesson
 * Admin only
 */
router.post('/',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ courseId: commonSchemas.id })),
  validateBody(lessonSchemas.create),
  LessonController.createLesson
);

/**
 * PUT /courses/:courseId/lessons/:id
 * Update lesson
 * Admin only
 */
router.put('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  validateBody(lessonSchemas.update),
  LessonController.updateLesson
);

/**
 * DELETE /courses/:courseId/lessons/:id
 * Delete lesson
 * Admin only
 */
router.delete('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  LessonController.deleteLesson
);

/**
 * PATCH /courses/:courseId/lessons/:id/order
 * Update lesson order
 * Admin only
 */
router.patch('/:id/order',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  validateBody(lessonSchemas.updateOrder),
  LessonController.updateLessonOrder
);

/**
 * Material routes - nested under lessons
 * /courses/:courseId/lessons/:lessonId/materials/*
 */
router.use('/:lessonId/materials', materialRoutes);

export default router;