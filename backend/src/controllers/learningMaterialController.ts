import { Response, NextFunction } from 'express';
import { LearningMaterialService, CreateLearningMaterialData, UpdateLearningMaterialData, LearningMaterialQuery } from '../services/learningMaterialService';
import { ApiResponse, RequestWithUser } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { MaterialType } from '@prisma/client';

interface LearningMaterialListParams {
  courseId: string;
  lessonId: string;
}

interface LearningMaterialParams extends LearningMaterialListParams {
  id: string;
}

export class LearningMaterialController {
  /**
   * GET /courses/:courseId/lessons/:lessonId/materials
   * Get all learning materials for a lesson with filtering and pagination
   */
  static async getLearningMaterialsByLesson(req: RequestWithUser<LearningMaterialListParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const query: LearningMaterialQuery = req.query;
      const includeUnpublished = req.user?.role === 'ADMIN';

      const result = await LearningMaterialService.getLearningMaterialsByLesson(lessonId, query, includeUnpublished);

      res.status(200).json({
        success: true,
        message: 'Learning materials retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /courses/:courseId/lessons/:lessonId/materials/:id
   * Get learning material by ID with detailed information
   */
  static async getLearningMaterialById(req: RequestWithUser<LearningMaterialParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const materialId = parseInt(req.params.id);
      const includeUnpublished = req.user?.role === 'ADMIN';

      const material = await LearningMaterialService.getLearningMaterialById(lessonId, materialId, includeUnpublished);

      res.status(200).json({
        success: true,
        message: 'Learning material retrieved successfully',
        data: material,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /courses/:courseId/lessons/:lessonId/materials
   * Create new learning material
   */
  static async createLearningMaterial(req: RequestWithUser<LearningMaterialListParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const materialData: CreateLearningMaterialData = {
        lessonId,
        ...req.body,
      };

      const material = await LearningMaterialService.createLearningMaterial(materialData);

      res.status(201).json({
        success: true,
        message: 'Learning material created successfully',
        data: material,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /courses/:courseId/lessons/:lessonId/materials/upload
   * Upload file and create learning material
   */
  static async uploadLearningMaterial(req: RequestWithUser<LearningMaterialListParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const materialData: CreateLearningMaterialData = {
        lessonId,
        materialType: 'FILE' as MaterialType,
        title: req.body.title,
        description: req.body.description,
        materialCategory: req.body.materialCategory || 'MAIN',
        filePath: req.body.optimizedFilePath || req.body.filePath || req.file.path,
        fileSize: req.body.optimizedFileSize || req.body.fileSize || req.file.size,
        fileType: req.body.fileType || req.file.mimetype,
        durationMinutes: req.body.durationMinutes,
        allowManualProgress: req.body.allowManualProgress || false,
        sortOrder: req.body.sortOrder,
        isPublished: req.body.isPublished || false,
      };

      const material = await LearningMaterialService.createLearningMaterial(materialData);

      // Include optimization information in response
      const responseData = {
        ...material,
        optimization: req.body.optimizedFilePath ? {
          originalSize: req.body.originalFileSize,
          optimizedSize: req.body.optimizedFileSize,
          compressionRatio: req.body.compressionRatio,
          thumbnailPath: req.body.thumbnailPath,
          dimensions: req.body.fileDimensions,
          metadata: req.body.optimizationMetadata
        } : null
      };

      res.status(201).json({
        success: true,
        message: 'Learning material uploaded successfully',
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /courses/:courseId/lessons/:lessonId/materials/:id
   * Update learning material
   */
  static async updateLearningMaterial(req: RequestWithUser<LearningMaterialParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const materialId = parseInt(req.params.id);
      const updateData: UpdateLearningMaterialData = req.body;

      const material = await LearningMaterialService.updateLearningMaterial(lessonId, materialId, updateData);

      res.status(200).json({
        success: true,
        message: 'Learning material updated successfully',
        data: material,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /courses/:courseId/lessons/:lessonId/materials/:id
   * Delete learning material
   */
  static async deleteLearningMaterial(req: RequestWithUser<LearningMaterialParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const materialId = parseInt(req.params.id);

      await LearningMaterialService.deleteLearningMaterial(lessonId, materialId);

      res.status(200).json({
        success: true,
        message: 'Learning material deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /courses/:courseId/lessons/:lessonId/materials/:id/order
   * Update learning material order
   */
  static async updateLearningMaterialOrder(req: RequestWithUser<LearningMaterialParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const materialId = parseInt(req.params.id);
      const { sortOrder } = req.body;

      const material = await LearningMaterialService.updateMaterialOrder(lessonId, materialId, sortOrder);

      res.status(200).json({
        success: true,
        message: 'Learning material order updated successfully',
        data: material,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /courses/:courseId/lessons/:lessonId/materials/:id/download
   * Download learning material file
   */
  static async downloadLearningMaterial(req: RequestWithUser<LearningMaterialParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const materialId = parseInt(req.params.id);

      const material = await LearningMaterialService.getLearningMaterialById(lessonId, materialId, req.user?.role === 'ADMIN');

      if (material.materialType !== 'FILE' || !material.filePath) {
        throw new ValidationError('This material is not a downloadable file');
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${material.title}"`);
      res.setHeader('Content-Type', material.fileType || 'application/octet-stream');
      
      // Send file
      res.sendFile(material.filePath, (err) => {
        if (err) {
          next(new NotFoundError('File not found on server'));
        }
      });
    } catch (error) {
      next(error);
    }
  }
}