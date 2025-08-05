import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, validateParams, courseSchemas, learningResourceSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { CourseController } from '../controllers/courseController';
import { LearningResourceController } from '../controllers/learningResourceController';
import lessonRoutes from './lessons';

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

/**
 * GET /courses/:courseId/resources
 * Get all learning resources for a course with filtering and pagination
 * Public endpoint with optional authentication for personalized results
 */
router.get('/:courseId/resources',
  validateParams(Joi.object({ courseId: commonSchemas.id })),
  validateQuery(learningResourceSchemas.query),
  LearningResourceController.getLearningResourcesByCourse as any
);

/**
 * POST /courses/:courseId/resources
 * Create new learning resource for a course
 * Admin only
 */
router.post('/:courseId/resources',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ courseId: commonSchemas.id })),
  validateBody(learningResourceSchemas.create),
  LearningResourceController.createLearningResourceForCourse as any
);

/**
 * Lesson routes
 * Nested under /courses/:courseId/lessons
 */
router.use('/:courseId/lessons', lessonRoutes);

export default router;