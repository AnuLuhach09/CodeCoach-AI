import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { settingRepository } from '../repositories/setting.repository';
import { User } from '@prisma/client';
import { UserPayload } from '../interfaces/auth';

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'super-secret-access-token-key-change-in-production';
  private jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-token-key-change-in-production';

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(user: User): string {
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '15m' });
  }

  generateRefreshToken(user: User): string {
    const payload = { id: user.id };
    return jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: '7d' });
  }

  verifyRefreshToken(token: string): { id: string } {
    return jwt.verify(token, this.jwtRefreshSecret) as { id: string };
  }

  async register(email: string, passwordRaw: string, name: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await this.hashPassword(passwordRaw);
    const user = await userRepository.create({
      email,
      passwordHash,
      name,
    });

    // Create default settings for user
    await settingRepository.create({
      userId: user.id,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  async login(email: string, passwordRaw: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.verifyPassword(passwordRaw, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  async refresh(token: string): Promise<{ accessToken: string; user: User }> {
    const payload = this.verifyRefreshToken(token);
    const user = await userRepository.findById(payload.id);
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = this.generateAccessToken(user);
    return { accessToken, user };
  }
}

export const authService = new AuthService();
