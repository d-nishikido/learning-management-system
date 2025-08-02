import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, validateParams, courseSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { CourseController } from '../controllers/courseController';

const router = Router();

/**
 * GET /courses
 * Get all courses with filtering and pagination
 * Public endpoint with optional authentication for personalized results
 */
router.get('/', 
  validateQuery(courseSchemas.query),
  CourseController.getAllCourses
);

/**
 * GET /courses/:id
 * Get course by ID with detailed information
 * Public endpoint
 */
router.get('/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  CourseController.getCourseById
);

/**
 * POST /courses
 * Create new course
 * Admin only
 */
router.post('/',
  authenticateToken,
  requireRole('ADMIN'),
  validateBody(courseSchemas.create),
  CourseController.createCourse
);

/**
 * PUT /courses/:id
 * Update course
 * Admin only
 */
router.put('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  validateBody(courseSchemas.update),
  CourseController.updateCourse
);

/**
 * DELETE /courses/:id
 * Delete course
 * Admin only
 */
router.delete('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  CourseController.deleteCourse
);

/**
 * POST /courses/:id/enroll
 * Enroll in course
 * Authenticated users only
 */
router.post('/:id/enroll',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  CourseController.enrollInCourse
);

/**
 * DELETE /courses/:id/enroll
 * Unenroll from course
 * Authenticated users only
 */
router.delete('/:id/enroll',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  CourseController.unenrollFromCourse
);

export default router;