import { Router } from 'express';
import Joi from 'joi';
import { questionController } from '../controllers/questionController';
import { validateBody, validateQuery, validateParams, questionSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

/**
 * GET /questions
 * Get all questions with filtering and pagination
 * Public endpoint - shows only published questions for non-admin users
 */
router.get('/',
  validateQuery(questionSchemas.query),
  questionController.getQuestions.bind(questionController)
);

/**
 * GET /questions/categories
 * Get all unique categories
 * Public endpoint
 */
router.get('/categories',
  questionController.getCategories.bind(questionController)
);

/**
 * GET /questions/tags
 * Get all unique tags
 * Public endpoint
 */
router.get('/tags',
  questionController.getTags.bind(questionController)
);

/**
 * GET /questions/:id
 * Get question by ID
 * Public endpoint - shows only published questions for non-admin users
 */
router.get('/:id',
  validateParams(Joi.object({ id: commonSchemas.id })),
  questionController.getQuestionById.bind(questionController)
);

/**
 * POST /questions
 * Create new question
 * Admin only
 */
router.post('/',
  authenticateToken,
  requireRole('ADMIN'),
  validateBody(questionSchemas.create),
  questionController.createQuestion.bind(questionController)
);

/**
 * PUT /questions/:id
 * Update question
 * Question creator or admin only
 */
router.put('/:id',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  validateBody(questionSchemas.update),
  questionController.updateQuestion.bind(questionController)
);

/**
 * DELETE /questions/:id
 * Delete question
 * Question creator or admin only
 */
router.delete('/:id',
  authenticateToken,
  validateParams(Joi.object({ id: commonSchemas.id })),
  questionController.deleteQuestion.bind(questionController)
);

export default router;