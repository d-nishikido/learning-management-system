import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { authSchemas } from '../middleware/validation';

const router = Router();

router.post('/login', validateBody(authSchemas.login), AuthController.login);

router.post('/refresh', validateBody(authSchemas.refresh), AuthController.refresh);

router.post('/logout', authenticateToken, AuthController.logout);

router.post('/forgot-password', validateBody(authSchemas.forgotPassword), AuthController.forgotPassword);

export default router;