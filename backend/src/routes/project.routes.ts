import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';

const router = Router();

// Apply auth middleware to all project endpoints
router.use(authMiddleware);

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', validate(createProjectSchema), projectController.create);
router.put('/:id', validate(updateProjectSchema), projectController.update);
router.delete('/:id', projectController.delete);

export default router;
