import { Router } from 'express';
import { localizedTestController } from '../controllers/localizedTestController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { 
  validateCreateTestLocalized,
  validateUpdateTestLocalized,
  validateAddQuestionLocalized,
  validateSubmitTestLocalized
} from '../middleware/localizedValidation';

const router = Router();

// Public routes (with authentication and localization)
router.get('/', authenticateToken, localizedTestController.getTests.bind(localizedTestController));
router.get('/results/me', authenticateToken, localizedTestController.getUserTestResults.bind(localizedTestController));
router.get('/:id', authenticateToken, localizedTestController.getTestById.bind(localizedTestController));
router.get('/:id/can-take', authenticateToken, localizedTestController.canUserTakeTest.bind(localizedTestController));
router.get('/:id/session', authenticateToken, localizedTestController.getUserTestSession.bind(localizedTestController));
router.get('/:id/questions', authenticateToken, localizedTestController.getTestQuestions.bind(localizedTestController));

// User test-taking routes with localization
router.post('/:id/start', authenticateToken, localizedTestController.startTest.bind(localizedTestController));
router.post('/:id/submit', authenticateToken, validateSubmitTestLocalized, localizedTestController.submitTest.bind(localizedTestController));

// Admin/Creator only routes with localization
router.post('/', authenticateToken, requireRole('ADMIN'), validateCreateTestLocalized, localizedTestController.createTest.bind(localizedTestController));
router.put('/:id', authenticateToken, validateUpdateTestLocalized, localizedTestController.updateTest.bind(localizedTestController));
router.delete('/:id', authenticateToken, localizedTestController.deleteTest.bind(localizedTestController));

// Test question management with localization (Admin/Creator)
router.post('/:id/questions', authenticateToken, validateAddQuestionLocalized, localizedTestController.addQuestionToTest.bind(localizedTestController));
router.delete('/:id/questions/:questionId', authenticateToken, localizedTestController.removeQuestionFromTest.bind(localizedTestController));

// Statistics and results with localization (Admin/Creator)
router.get('/:id/statistics', authenticateToken, localizedTestController.getTestStatistics.bind(localizedTestController));

export default router;