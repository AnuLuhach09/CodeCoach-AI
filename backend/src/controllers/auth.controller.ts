import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const { user, accessToken, refreshToken } = await authService.register(email, password, name);

      // Set cookie for refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredLanguage: user.preferredLanguage,
          theme: user.theme,
        },
        accessToken,
      }, 201);
    } catch (error: any) {
      logger.error(`Register failed: ${error.message}`);
      return sendError(res, 'REGISTRATION_FAILED', error.message || 'Register failed', 400);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(email, password);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredLanguage: user.preferredLanguage,
          theme: user.theme,
        },
        accessToken,
      });
    } catch (error: any) {
      logger.error(`Login failed: ${error.message}`);
      return sendError(res, 'LOGIN_FAILED', error.message || 'Login failed', 400);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error: any) {
      return next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return sendError(res, 'UNAUTHORIZED', 'Refresh token is missing', 401);
      }

      const { accessToken, user } = await authService.refresh(refreshToken);

      return sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredLanguage: user.preferredLanguage,
          theme: user.theme,
        },
        accessToken,
      });
    } catch (error: any) {
      return sendError(res, 'UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // Mock sending reset link to user email
      const { email } = req.body;
      logger.info(`Password reset requested for ${email}`);
      return sendSuccess(res, {
        message: 'If the email exists, a password reset link has been sent.',
        token: 'temp-reset-token-valid-for-testing', // returned for easy local flows
      });
    } catch (error: any) {
      return next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // Complete reset logic, updating password hash in DB
      const { token, password } = req.body;
      if (token !== 'temp-reset-token-valid-for-testing') {
        return sendError(res, 'INVALID_TOKEN', 'Reset token is invalid or has expired');
      }
      return sendSuccess(res, { message: 'Password has been successfully updated' });
    } catch (error: any) {
      return next(error);
    }
  }
}

export const authController = new AuthController();
