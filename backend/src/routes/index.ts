import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';

const router = Router();

// API version and health routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Placeholder for future API routes
// router.use('/courses', courseRoutes);
// router.use('/users', userRoutes);
// router.use('/qa', qaRoutes);

export default router;
