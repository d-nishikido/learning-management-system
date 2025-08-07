import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import courseRoutes from './courses';
import userRoutes from './users';
import qaRoutes from './qa';
import resourceRoutes from './resources';
import progressRoutes from './progress';
import materialRoutes from './materials';
import questionRoutes from './questions';
import testRoutes from './tests';
import localizedTestRoutes from './localizedTests';

const router = Router();

// API version and health routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Core feature routes
router.use('/courses', courseRoutes);
router.use('/users', userRoutes);
router.use('/qa', qaRoutes);
router.use('/questions', questionRoutes);
router.use('/tests', testRoutes);
router.use('/i18n/tests', localizedTestRoutes);
router.use('/resources', resourceRoutes);
router.use('/progress', progressRoutes);
router.use('/materials', materialRoutes);

export default router;
