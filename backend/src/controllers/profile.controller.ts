import { Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository';
import { AuthRequest } from '../interfaces/auth';
import { sendSuccess, sendError } from '../utils/response';

export class ProfileController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await userRepository.findById(userId);

      if (!user) {
        return sendError(res, 'NOT_FOUND', 'User not found', 404);
      }

      return sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          preferredLanguage: user.preferredLanguage,
          preferredModel: user.preferredModel,
          theme: user.theme,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, avatarUrl, preferredLanguage, preferredModel, theme } = req.body;

      const updated = await userRepository.update(userId, {
        name,
        avatarUrl,
        preferredLanguage,
        preferredModel,
        theme,
      });

      return sendSuccess(res, {
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          avatarUrl: updated.avatarUrl,
          preferredLanguage: updated.preferredLanguage,
          preferredModel: updated.preferredModel,
          theme: updated.theme,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await userRepository.delete(userId);
      
      // Clear HTTP-only refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return sendSuccess(res, { message: 'Account deleted successfully' });
    } catch (error) {
      return next(error);
    }
  }
}

export const profileController = new ProfileController();
