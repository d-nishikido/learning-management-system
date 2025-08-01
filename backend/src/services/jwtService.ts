import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenVersion: number;
  type: 'refresh';
}

export class JwtService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  private static getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
  }

  private static getRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET || this.getJwtSecret();
    return secret;
  }

  static generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const secret = this.getJwtSecret();
    try {
      return jwt.sign(payload, secret, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
      });
    } catch (error) {
      throw new Error('Failed to generate access token');
    }
  }

  static generateRefreshToken(userId: number, tokenVersion: number = 0): string {
    try {
      const payload: RefreshTokenPayload = {
        userId,
        tokenVersion,
        type: 'refresh',
      };
      
      return jwt.sign(payload, this.getRefreshSecret(), {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      });
    } catch (error) {
      throw new Error('Failed to generate refresh token');
    }
  }

  static generateTokenPair(
    userId: number,
    username: string,
    email: string,
    role: 'USER' | 'ADMIN',
    tokenVersion: number = 0
  ): TokenPair {
    const accessToken = this.generateAccessToken({
      userId,
      username,
      email,
      role,
    });

    const refreshToken = this.generateRefreshToken(userId, tokenVersion);

    return {
      accessToken,
      refreshToken,
    };
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.getJwtSecret()) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw new Error('Token verification failed');
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.getRefreshSecret()) as RefreshTokenPayload;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Refresh token verification failed');
    }
  }

  static getTokenExpiryTime(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}