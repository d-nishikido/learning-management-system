import { Router } from 'express';
import Joi from 'joi';
import { validateBody, validateQuery, validateParams, learningMaterialSchemas, commonSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { uploadMaterial, validateFileSize, processFileInfo, cleanupOnError } from '../middleware/upload';
import { optimizeFile, validateOptimizedFile, cleanupOptimizedFiles, trackOptimizationStats, getOptimizationStats } from '../middleware/fileOptimization';
import { validateFileComprehensive } from '../middleware/fileValidation';
import { LearningMaterialController } from '../controllers/learningMaterialController';

const router = Router({ mergeParams: true }); // Allow access to parent route params (courseId, lessonId)

/**
 * GET /materials/search
 * Search learning materials across the system
 * Authentication required
 */
router.get('/search',
  authenticateToken,
  validateQuery(learningMaterialSchemas.query),
  LearningMaterialController.searchLearningMaterials as any
);

/**
 * GET /courses/:courseId/lessons/:lessonId/materials
 * Get all learning materials for a lesson with filtering and pagination
 * Authentication required for user progress tracking
 */
router.get('/', 
  authenticateToken,
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
 * Authentication required
 */
router.get('/:id',
  authenticateToken,
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
  ...validateFileComprehensive({
    maxSizeBytes: 500 * 1024 * 1024, // 500MB max
    maxImageWidth: 4096,
    maxImageHeight: 4096,
    maxVideoDurationSeconds: 7200, // 2 hours max
    enableHeaderValidation: true,
    enableContentScanning: true
  }),
  validateFileSize,
  optimizeFile({
    images: {
      enabled: true,
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1080,
      generateThumbnail: true,
      thumbnailSize: 300,
      convertToWebP: true
    },
    videos: {
      enabled: true,
      quality: 'medium',
      maxWidth: 1280,
      maxHeight: 720,
      generateThumbnail: true,
      compression: 'balanced',
      format: 'mp4'
    }
  }),
  validateOptimizedFile,
  processFileInfo,
  trackOptimizationStats,
  validateBody(learningMaterialSchemas.fileUpload),
  LearningMaterialController.uploadLearningMaterial as any,
  cleanupOnError,
  cleanupOptimizedFiles
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

/**
 * GET /courses/:courseId/lessons/:lessonId/materials/optimization/stats
 * Get file optimization statistics
 * Admin only
 */
router.get('/optimization/stats',
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(Joi.object({ 
    courseId: commonSchemas.id,
    lessonId: commonSchemas.id 
  })),
  (_req: any, res: any) => {
    const stats = getOptimizationStats();
    res.status(200).json({
      success: true,
      message: 'Optimization statistics retrieved successfully',
      data: stats,
    });
  }
);

export default router;