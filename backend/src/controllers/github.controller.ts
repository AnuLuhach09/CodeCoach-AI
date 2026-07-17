import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../interfaces/auth';
import { sendSuccess, sendError } from '../utils/response';
import { gitService } from '../services/git.service';
import { analyzerService } from '../services/analyzer.service';
import { logger } from '../utils/logger';

export class GitHubController {
  async analyzeRepository(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { url, branch } = req.body;

      if (!url) {
        return sendError(res, 'BAD_REQUEST', 'Repository URL is required', 400);
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.userId !== req.user!.id) {
        return sendError(res, 'FORBIDDEN', 'Access denied', 403);
      }

      // Create Repository record
      const repo = await prisma.repository.create({
        data: {
          projectId,
          url,
          branch: branch || 'main',
          status: 'CLONING',
        },
      });

      // Create empty Analysis record
      const analysis = await prisma.analysis.create({
        data: {
          projectId,
          repositoryId: repo.id,
          status: 'PENDING',
        },
      });

      // Run clone and analysis asynchronously in background
      Promise.resolve().then(async () => {
        try {
          // 1. Clone & Index
          await prisma.repository.update({
            where: { id: repo.id },
            data: { status: 'CLONING' },
          });

          const { filesCount } = await gitService.cloneAndIndex(projectId, url, branch || 'main');

          await prisma.repository.update({
            where: { id: repo.id },
            data: {
              status: 'ANALYZING',
              lastClonedAt: new Date(),
            },
          });

          // 2. Perform Code Analysis
          const result = await analyzerService.analyzeProject(projectId);

          // 3. Save analysis results
          await prisma.analysis.update({
            where: { id: analysis.id },
            data: {
              status: 'COMPLETED',
              scoreCodeQuality: result.scoreCodeQuality,
              scoreSecurity: result.scoreSecurity,
              reportArchitecture: result.reportArchitecture,
              reportSecurity: result.reportSecurity,
              reportPerformance: result.reportPerformance,
              reportDependencies: result.reportDependencies,
              suggestions: result.suggestions,
            },
          });

          await prisma.repository.update({
            where: { id: repo.id },
            data: { status: 'COMPLETED' },
          });

          logger.info(`Successfully completed repository analysis for: ${url}`);
        } catch (err: any) {
          logger.error(`Async repository analysis failed for repo ${repo.id}: ${err.message}`);
          
          await prisma.repository.update({
            where: { id: repo.id },
            data: { status: 'FAILED' },
          });

          await prisma.analysis.update({
            where: { id: analysis.id },
            data: { status: 'FAILED' },
          });
        }
      });

      return sendSuccess(res, {
        message: 'Repository analysis triggered in background',
        repository: repo,
        analysisId: analysis.id,
      }, 202);
    } catch (error) {
      return next(error);
    }
  }

  async getProjectAnalyses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.userId !== req.user!.id) {
        return sendError(res, 'FORBIDDEN', 'Access denied', 403);
      }

      const analyses = await prisma.analysis.findMany({
        where: { projectId },
        include: { repository: true },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, { analyses });
    } catch (error) {
      return next(error);
    }
  }
}

export const githubController = new GitHubController();
