import { JwtService } from '../../services/jwtService';

describe('JwtService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER' as const,
      };

      const token = JwtService.generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      
      const payload = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER' as const,
      };

      expect(() => JwtService.generateAccessToken(payload)).toThrow('JWT_SECRET environment variable is required');
      
      process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = 1;
      const tokenVersion = 0;

      const token = JwtService.generateRefreshToken(userId, tokenVersion);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokenPair = JwtService.generateTokenPair(
        1,
        'testuser',
        'test@example.com',
        'USER'
      );

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(typeof tokenPair.accessToken).toBe('string');
      expect(typeof tokenPair.refreshToken).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER' as const,
      };

      const token = JwtService.generateAccessToken(payload);
      const decoded = JwtService.verifyAccessToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => JwtService.verifyAccessToken(invalidToken)).toThrow('Invalid access token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'malformed-token';
      
      expect(() => JwtService.verifyAccessToken(malformedToken)).toThrow('Invalid access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const userId = 1;
      const tokenVersion = 0;

      const token = JwtService.generateRefreshToken(userId, tokenVersion);
      const decoded = JwtService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.tokenVersion).toBe(tokenVersion);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';
      
      expect(() => JwtService.verifyRefreshToken(invalidToken)).toThrow('Invalid refresh token');
    });
  });

  describe('getTokenExpiryTime', () => {
    it('should return expiry time for valid token', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER' as const,
      };

      const token = JwtService.generateAccessToken(payload);
      const expiryTime = JwtService.getTokenExpiryTime(token);

      expect(expiryTime).toBeInstanceOf(Date);
      expect(expiryTime!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid-token';
      const expiryTime = JwtService.getTokenExpiryTime(invalidToken);

      expect(expiryTime).toBeNull();
    });
  });
});