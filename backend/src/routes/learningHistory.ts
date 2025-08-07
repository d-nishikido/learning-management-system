import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, commonSchemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { LearningHistoryController } from '../controllers/learningHistoryController';

const router = Router();

// Access history query schema
const accessHistoryQuerySchema = Joi.object({
  materialId: Joi.number().integer().positive().optional(),
  resourceId: Joi.number().integer().positive().optional(),
  accessType: Joi.string().valid('VIEW', 'DOWNLOAD', 'EXTERNAL_LINK').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Detailed history query schema
const detailedHistoryQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

// Stats report query schema
const statsReportQuerySchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required()
}).custom((value, helpers) => {
  if (value.startDate >= value.endDate) {
    return helpers.error('any.invalid', { message: 'Start date must be before end date' });
  }
  return value;
});

// Record access schema
const recordAccessSchema = Joi.object({
  materialId: Joi.number().integer().positive().optional(),
  resourceId: Joi.number().integer().positive().optional(),
  accessType: Joi.string().valid('VIEW', 'DOWNLOAD', 'EXTERNAL_LINK').required(),
  sessionDuration: Joi.number().integer().min(0).optional()
}).custom((value, helpers) => {
  // Ensure either materialId or resourceId is provided, but not both
  if (!value.materialId && !value.resourceId) {
    return helpers.error('any.invalid', { message: 'Either materialId or resourceId must be provided' });
  }
  if (value.materialId && value.resourceId) {
    return helpers.error('any.invalid', { message: 'Cannot specify both materialId and resourceId' });
  }
  return value;
});

/**
 * GET /api/progress/history/access
 * Get access history for current user
 * Authenticated users only
 */
router.get('/access',
  authenticateToken,
  validateQuery(accessHistoryQuerySchema),
  LearningHistoryController.getAccessHistory
);

/**
 * GET /api/progress/history/detailed
 * Get detailed learning history for current user
 * Authenticated users only
 */
router.get('/detailed',
  authenticateToken,
  validateQuery(detailedHistoryQuerySchema),
  LearningHistoryController.getDetailedHistory
);

/**
 * GET /api/progress/stats/reports
 * Generate learning statistics report
 * Authenticated users only
 */
router.get('/reports',
  authenticateToken,
  validateQuery(statsReportQuerySchema),
  LearningHistoryController.generateStatsReport
);

/**
 * GET /api/progress/stats/patterns
 * Get learning patterns analysis
 * Authenticated users only
 */
router.get('/patterns',
  authenticateToken,
  validateQuery(detailedHistoryQuerySchema),
  LearningHistoryController.getLearningPatterns
);

/**
 * POST /api/progress/history/record-access
 * Record material or resource access
 * Authenticated users only
 */
router.post('/record-access',
  authenticateToken,
  validateBody(recordAccessSchema),
  LearningHistoryController.recordAccess
);

export default router;