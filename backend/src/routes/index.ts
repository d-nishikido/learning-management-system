import { Router } from 'express';
import healthRoutes from './health';

const router = Router();

// API version and health routes
router.use('/health', healthRoutes);

// Placeholder for future API routes
// router.use('/auth', authRoutes);
// router.use('/courses', courseRoutes);
// router.use('/users', userRoutes);
// router.use('/qa', qaRoutes);

export default router;
