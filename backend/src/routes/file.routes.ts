import { Router } from 'express';
import multer from 'multer';
import { fileController } from '../controllers/file.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});

router.use(authMiddleware);

router.get('/projects/:projectId/files', fileController.getProjectFiles);
router.post('/projects/:projectId/files/upload', upload.array('files', 100), fileController.uploadFiles);
router.delete('/files/:fileId', fileController.deleteFile);

export default router;
