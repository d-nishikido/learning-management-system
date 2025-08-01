import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const refreshValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

router.post('/login', loginValidation, validateRequest, AuthController.login);

router.post('/refresh', refreshValidation, validateRequest, AuthController.refresh);

router.post('/logout', authenticateToken, AuthController.logout);

router.post('/forgot-password', forgotPasswordValidation, validateRequest, AuthController.forgotPassword);

export default router;