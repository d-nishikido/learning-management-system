import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, validateParams, learningResourceSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { LearningResourceController } from '../controllers/learningResourceController';

const router = Router({ mergeParams: true }); // Allow access to parent route params

/**
 * GET /resources/search
 * Search learning resources across the system
 * Public endpoint with optional authentication for personalized results
 */
router.get('/search',
  validateQuery(learningResourceSchemas.query),
  LearningResourceController.searchLearningResources as any
);

/**
 * GET /resources/tags
 * Get all unique tags across all resources
 * Public endpoint
 */
router.get('/tags',
  LearningResourceController.getAllTags as any
);

/**
 * GET /resources/:id
 * Get learning resource by ID with detailed information
 * Public endpoint
 */
router.get('/:id',
  validateParams(Joi.object({ 
    id: commonSchemas.id 
  })),
  LearningResourceController.getLearningResourceById as any
);

/**
 * PUT /resources/:id
 * Update learning resource
 * Admin only
 */
router.put('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    id: commonSchemas.id 
  })),
  validateBody(learningResourceSchemas.update),
  LearningResourceController.updateLearningResource as any
);

/**
 * DELETE /resources/:id
 * Delete learning resource
 * Admin only
 */
router.delete('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    id: commonSchemas.id 
  })),
  LearningResourceController.deleteLearningResource as any
);

export default router;