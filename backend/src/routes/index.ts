console.log('Starting routes/index.ts...');
import { Router } from 'express';
console.log('Importing route modules...');
console.log('Importing health...');
import healthRoutes from './health';
console.log('Importing auth...');
import authRoutes from './auth';
console.log('Importing courses...');
import courseRoutes from './courses';
console.log('Importing lessons...');
import lessonRoutes from './lessons';
console.log('Importing users...');
import userRoutes from './users';
console.log('Importing qa...');
import qaRoutes from './qa';
console.log('Importing resources...');
import resourceRoutes from './resources';
console.log('Importing progress...');
import progressRoutes from './progress';
console.log('Importing materials...');
import materialRoutes from './materials';
console.log('Importing questions...');
import questionRoutes from './questions';
console.log('Importing tests...');
import testRoutes from './tests';
console.log('Importing localizedTests...');
import localizedTestRoutes from './localizedTests';
console.log('Importing learningHistory...');
import learningHistoryRoutes from './learningHistory';
console.log('All route modules imported.');

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
