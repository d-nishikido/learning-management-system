import { Router } from 'express';
import { testController } from '../controllers/testController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createTestSchema, updateTestSchema, addQuestionToTestSchema, submitTestSchema } from '../schemas/testSchemas';

const router = Router();

// Public routes (with authentication)
router.get('/', authenticateToken, testController.getTests.bind(testController));
router.get('/results/me', authenticateToken, testController.getUserTestResults.bind(testController));
router.get('/:id', authenticateToken, testController.getTestById.bind(testController));
router.get('/:id/can-take', authenticateToken, testController.canUserTakeTest.bind(testController));
router.get('/:id/session', authenticateToken, testController.getUserTestSession.bind(testController));
router.get('/:id/questions', authenticateToken, testController.getTestQuestions.bind(testController));

// User test-taking routes
router.post('/:id/start', authenticateToken, testController.startTest.bind(testController));
router.post('/:id/submit', authenticateToken, validateBody(submitTestSchema), testController.submitTest.bind(testController));

// Admin/Creator only routes
router.post('/', authenticateToken, requireRole('ADMIN'), validateBody(createTestSchema), testController.createTest.bind(testController));
router.put('/:id', authenticateToken, validateBody(updateTestSchema), testController.updateTest.bind(testController));
router.delete('/:id', authenticateToken, testController.deleteTest.bind(testController));

// Test question management (Admin/Creator)
router.post('/:id/questions', authenticateToken, validateBody(addQuestionToTestSchema), testController.addQuestionToTest.bind(testController));
router.delete('/:id/questions/:questionId', authenticateToken, testController.removeQuestionFromTest.bind(testController));

// Statistics and results (Admin/Creator)
router.get('/:id/statistics', authenticateToken, testController.getTestStatistics.bind(testController));
router.get('/:id/results', authenticateToken, testController.getTestResults.bind(testController));

export default router;