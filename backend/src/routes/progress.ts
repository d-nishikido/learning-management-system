import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, validateParams, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ProgressController } from '../controllers/progressController';

const router = Router();

// Progress query schema
const progressQuerySchema = Joi.object({
  courseId: Joi.number().integer().positive().optional(),
  lessonId: Joi.number().integer().positive().optional(),
  materialId: Joi.number().integer().positive().optional(),
  isCompleted: Joi.boolean().optional(),
  progressType: Joi.string().valid('AUTO', 'MANUAL').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Manual progress update schema
const manualProgressSchema = Joi.object({
  progressRate: Joi.number().min(0).max(100).required(),
  spentMinutes: Joi.number().integer().min(0).optional(),
  notes: Joi.string().max(1000).optional()
});

// Learning session schema
const sessionSchema = Joi.object({
  materialId: Joi.number().integer().positive().optional(),
  courseId: Joi.number().integer().positive().optional(),
  lessonId: Joi.number().integer().positive().optional()
});

const sessionUpdateSchema = Joi.object({
  spentMinutes: Joi.number().integer().min(1).required()
});

/**
 * GET /progress/me
 * Get current user's all progress
 * Authenticated users only
 */
router.get('/me',
  authenticateToken,
  validateQuery(progressQuerySchema),
  ProgressController.getUserProgress
);

/**
 * GET /progress/courses/:courseId
 * Get progress for specific course
 * Authenticated users only
 */
router.get('/courses/:courseId',
  authenticateToken,
  validateParams(Joi.object({ courseId: commonSchemas.id })),
  ProgressController.getCourseProgress
);

/**
 * GET /progress/lessons/:lessonId
 * Get progress for specific lesson
 * Authenticated users only
 */
router.get('/lessons/:lessonId',
  authenticateToken,
  validateParams(Joi.object({ lessonId: commonSchemas.id })),
  ProgressController.getLessonProgress
);

/**
 * GET /progress/materials/:materialId
 * Get progress for specific material
 * Authenticated users only
 */
router.get('/materials/:materialId',
  authenticateToken,
  validateParams(Joi.object({ materialId: commonSchemas.id })),
  ProgressController.getMaterialProgress
);

/**
 * POST /progress
 * Create new progress record
 * Authenticated users only
 */
router.post('/',
  authenticateToken,
  validateBody(Joi.object({
    courseId: commonSchemas.id.required(),
    lessonId: commonSchemas.id.optional(),
    materialId: commonSchemas.id.optional(),
    progressType: Joi.string().valid('AUTO', 'MANUAL').default('AUTO'),
    progressRate: Joi.number().min(0).max(100).default(0),
    spentMinutes: Joi.number().integer().min(0).default(0),
    notes: Joi.string().max(1000).optional()
  })),
  ProgressController.createProgress
);

/**
 * PUT /progress/:id
 * Update progress record
 * Authenticated users only
 */
router.put('/:id',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  validateBody(Joi.object({
    progressRate: Joi.number().min(0).max(100).optional(),
    spentMinutes: Joi.number().integer().min(0).optional(),
    isCompleted: Joi.boolean().optional(),
    notes: Joi.string().max(1000).optional()
  })),
  ProgressController.updateProgress
);

/**
 * DELETE /progress/:id
 * Delete progress record
 * Admin only
 */
router.delete('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ id: commonSchemas.id })),
  ProgressController.deleteProgress
);

/**
 * PUT /progress/materials/:materialId/manual
 * Update manual progress for material
 * Authenticated users only
 */
router.put('/materials/:materialId/manual',
  authenticateToken,
  validateParams(Joi.object({ materialId: commonSchemas.id })),
  validateBody(manualProgressSchema),
  ProgressController.updateManualProgress
);

/**
 * POST /progress/materials/:materialId/complete
 * Mark material as completed
 * Authenticated users only
 */
router.post('/materials/:materialId/complete',
  authenticateToken,
  validateParams(Joi.object({ materialId: commonSchemas.id })),
  ProgressController.markMaterialComplete
);

/**
 * POST /progress/sessions/start
 * Start learning session
 * Authenticated users only
 */
router.post('/sessions/start',
  authenticateToken,
  validateBody(sessionSchema),
  ProgressController.startLearningSession
);

/**
 * PUT /progress/sessions/:sessionId/update
 * Update learning session time
 * Authenticated users only
 */
router.put('/sessions/:sessionId/update',
  authenticateToken,
  validateParams(Joi.object({ sessionId: commonSchemas.id })),
  validateBody(sessionUpdateSchema),
  ProgressController.updateLearningSession
);

/**
 * POST /progress/sessions/:sessionId/end
 * End learning session
 * Authenticated users only
 */
router.post('/sessions/:sessionId/end',
  authenticateToken,
  validateParams(Joi.object({ sessionId: commonSchemas.id })),
  ProgressController.endLearningSession
);

/**
 * GET /progress/time-stats
 * Get learning time statistics
 * Authenticated users only
 */
router.get('/time-stats',
  authenticateToken,
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    courseId: Joi.number().integer().positive().optional()
  })),
  ProgressController.getTimeStats
);

/**
 * GET /progress/stats/summary
 * Get progress summary statistics
 * Authenticated users only
 */
router.get('/stats/summary',
  authenticateToken,
  validateQuery(Joi.object({
    courseId: Joi.number().integer().positive().optional()
  })),
  ProgressController.getProgressSummary
);

/**
 * GET /progress/stats/streaks
 * Get learning streak information
 * Authenticated users only
 */
router.get('/stats/streaks',
  authenticateToken,
  ProgressController.getStreakStats
);

/**
 * GET /progress/stats/time-series
 * Get time-series progress data
 * Authenticated users only
 */
router.get('/stats/time-series',
  authenticateToken,
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    interval: Joi.string().valid('day', 'week', 'month').default('day'),
    courseId: Joi.number().integer().positive().optional()
  })),
  ProgressController.getTimeSeriesData
);

export default router;