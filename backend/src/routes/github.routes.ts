import { Router } from 'express';
import { githubController } from '../controllers/github.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/projects/:projectId/analyze', githubController.analyzeRepository);
router.get('/projects/:projectId/analyses', githubController.getProjectAnalyses);

export default router;
