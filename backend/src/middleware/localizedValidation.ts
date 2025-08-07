import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { getLocaleFromRequest } from '../utils/i18n';
import { createLocalizedSchema } from '../schemas/localizedTestSchemas';

export function validateBodyWithLocale(schemaName: 'createTest' | 'updateTest' | 'addQuestionToTest' | 'submitTest') {
  return (req: Request, res: Response, next: NextFunction) => {
    const locale = getLocaleFromRequest(req);
    const schemas = createLocalizedSchema(locale);
    
    let schema: Joi.ObjectSchema;
    
    switch (schemaName) {
      case 'createTest':
        schema = schemas.createTestSchema;
        break;
      case 'updateTest':
        schema = schemas.updateTestSchema;
        break;
      case 'addQuestionToTest':
        schema = schemas.addQuestionToTestSchema;
        break;
      case 'submitTest':
        schema = schemas.submitTestSchema;
        break;
      default:
        return next(new Error('Invalid schema name'));
    }

    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: locale === 'ja' ? '入力検証エラー' : 'Validation error',
        errors: errorDetails,
        meta: {
          locale,
          validationFailed: true
        }
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

// Convenience functions for specific schemas
export const validateCreateTestLocalized = validateBodyWithLocale('createTest');
export const validateUpdateTestLocalized = validateBodyWithLocale('updateTest');
export const validateAddQuestionLocalized = validateBodyWithLocale('addQuestionToTest');
export const validateSubmitTestLocalized = validateBodyWithLocale('submitTest');