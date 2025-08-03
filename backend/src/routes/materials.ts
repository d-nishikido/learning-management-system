import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, validateParams, learningMaterialSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { uploadMaterial, validateFileSize, processFileInfo, cleanupOnError } from '../middleware/upload';
import { LearningMaterialController } from '../controllers/learningMaterialController';

const router = Router({ mergeParams: true }); // Allow access to parent route params (courseId, lessonId)

/**
 * GET /courses/:courseId/lessons/:lessonId/materials
 * Get all learning materials for a lesson with filtering and pagination
 * Public endpoint with optional authentication for personalized results
 */
router.get('/', 
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id 
  })),
  validateQuery(learningMaterialSchemas.query),
  LearningMaterialController.getLearningMaterialsByLesson as any
);

/**
 * GET /courses/:courseId/lessons/:lessonId/materials/:id
 * Get learning material by ID with detailed information
 * Public endpoint
 */
router.get('/:id',
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  LearningMaterialController.getLearningMaterialById as any
);

/**
 * GET /courses/:courseId/lessons/:lessonId/materials/:id/download
 * Download learning material file
 * Authentication required
 */
router.get('/:id/download',
  authenticateToken,
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  LearningMaterialController.downloadLearningMaterial as any
);

/**
 * POST /courses/:courseId/lessons/:lessonId/materials
 * Create new learning material (URL or MANUAL_PROGRESS type)
 * Admin only
 */
router.post('/',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id 
  })),
  validateBody(learningMaterialSchemas.create),
  LearningMaterialController.createLearningMaterial as any
);

/**
 * POST /courses/:courseId/lessons/:lessonId/materials/upload
 * Upload file and create learning material (FILE type)
 * Admin only
 */
router.post('/upload',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id 
  })),
  uploadMaterial.single('file'),
  validateFileSize,
  processFileInfo,
  validateBody(learningMaterialSchemas.fileUpload),
  LearningMaterialController.uploadLearningMaterial as any,
  cleanupOnError
);

/**
 * PUT /courses/:courseId/lessons/:lessonId/materials/:id
 * Update learning material
 * Admin only
 */
router.put('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  validateBody(learningMaterialSchemas.update),
  LearningMaterialController.updateLearningMaterial as any
);

/**
 * DELETE /courses/:courseId/lessons/:lessonId/materials/:id
 * Delete learning material
 * Admin only
 */
router.delete('/:id',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  LearningMaterialController.deleteLearningMaterial as any
);

/**
 * PATCH /courses/:courseId/lessons/:lessonId/materials/:id/order
 * Update learning material order
 * Admin only
 */
router.patch('/:id/order',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id,
    id: commonSchemas.id 
  })),
  validateBody(learningMaterialSchemas.updateOrder),
  LearningMaterialController.updateLearningMaterialOrder as any
);

export default router;