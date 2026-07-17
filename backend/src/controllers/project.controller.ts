import { Response, NextFunction } from 'express';
import { projectRepository } from '../repositories/project.repository';
import { AuthRequest } from '../interfaces/auth';
import { sendSuccess, sendError } from '../utils/response';
import { ragService } from '../services/rag.service';

export class ProjectController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const projects = await projectRepository.findAllByUserId(userId);
      return sendSuccess(res, { projects });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await projectRepository.findById(id);

      if (!project) {
        return sendError(res, 'NOT_FOUND', 'Project not found', 404);
      }

      if (project.userId !== req.user!.id) {
        return sendError(res, 'FORBIDDEN', 'Access denied', 403);
      }

      return sendSuccess(res, { project });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, description, language } = req.body;

      const project = await projectRepository.create({
        name,
        description,
        language,
        user: { connect: { id: userId } },
      });

      return sendSuccess(res, { project }, 201);
    } catch (error) {
      return next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, language } = req.body;

      const project = await projectRepository.findById(id);
      if (!project) {
        return sendError(res, 'NOT_FOUND', 'Project not found', 404);
      }

      if (project.userId !== req.user!.id) {
        return sendError(res, 'FORBIDDEN', 'Access denied', 403);
      }

      const updatedProject = await projectRepository.update(id, {
        name,
        description,
        language,
      });

      return sendSuccess(res, { project: updatedProject });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await projectRepository.findById(id);

      if (!project) {
        return sendError(res, 'NOT_FOUND', 'Project not found', 404);
      }

      if (project.userId !== req.user!.id) {
        return sendError(res, 'FORBIDDEN', 'Access denied', 403);
      }

      await projectRepository.delete(id);
      // Clean up ChromaDB collection index as well
      await ragService.deleteProjectIndex(id);

      return sendSuccess(res, { message: 'Project deleted successfully' });
    } catch (error) {
      return next(error);
    }
  }
}

export const projectController = new ProjectController();
