import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from '../auth';
import { JwtService } from '../../services/jwtService';
import { UserService } from '../../services/userService';
import { AuthenticationError, AuthorizationError } from '../../utils/errors';
import { mockHelpers } from '../../__tests__/helpers/apiHelpers';
import { userFixtures, jwtTokens } from '../../__tests__/helpers/fixtures';

// Mock dependencies
jest.mock('../../services/jwtService');
jest.mock('../../services/userService');

const mockJwtService = {
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  generateTokenPair: jest.fn(),
} as any;

const mockUserService = UserService as jest.Mocked<typeof UserService>;

// Apply the mocks
(JwtService as any).verifyAccessToken = mockJwtService.verifyAccessToken;
(JwtService as any).verifyRefreshToken = mockJwtService.verifyRefreshToken;
(JwtService as any).generateTokenPair = mockJwtService.generateTokenPair;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = mockHelpers.createMockRequest();
    mockResponse = mockHelpers.createMockResponse();
    mockNext = mockHelpers.createMockNext();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate user with valid token', async () => {
      const payload = { userId: 1, role: 'USER' };
      mockRequest.headers = { authorization: `Bearer ${jwtTokens.validUser}` };
      
      mockJwtService.verifyAccessToken.mockResolvedValue(payload);
      mockUserService.getUserById.mockResolvedValue(userFixtures.user1);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtService.verifyAccessToken).toHaveBeenCalledWith(jwtTokens.validUser);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect((mockRequest as any).user).toEqual(userFixtures.user1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', async () => {
      mockRequest.headers = {};
      mockResponse.status = jest.fn().mockReturnThis();
      mockResponse.json = jest.fn().mockReturnThis();

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token is required',
      });
      expect(mockJwtService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      expect(mockJwtService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockRequest.headers = { authorization: `Bearer ${jwtTokens.invalid}` };
      
      mockJwtService.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should reject request with expired token', async () => {
      mockRequest.headers = { authorization: `Bearer ${jwtTokens.expired}` };
      
      mockJwtService.verifyAccessToken.mockRejectedValue(new Error('Token expired'));

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should reject request when user not found', async () => {
      const payload = { userId: 999, role: 'USER' };
      mockRequest.headers = { authorization: `Bearer ${jwtTokens.validUser}` };
      
      mockJwtService.verifyAccessToken.mockResolvedValue(payload);
      mockUserService.getUserById.mockResolvedValue(null);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should reject request when user is inactive', async () => {
      const payload = { userId: 4, role: 'USER' };
      mockRequest.headers = { authorization: `Bearer ${jwtTokens.validUser}` };
      
      mockJwtService.verifyAccessToken.mockResolvedValue(payload);
      mockUserService.getUserById.mockResolvedValue(userFixtures.inactiveUser);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should handle Bearer token with extra whitespace', async () => {
      const payload = { userId: 1, role: 'USER' };
      mockRequest.headers = { authorization: `  Bearer   ${jwtTokens.validUser}  ` };
      
      mockJwtService.verifyAccessToken.mockResolvedValue(payload);
      mockUserService.getUserById.mockResolvedValue(userFixtures.user1);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtService.verifyAccessToken).toHaveBeenCalledWith(jwtTokens.validUser);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      // Set up authenticated user in request
      (mockRequest as any).user = userFixtures.user1;
    });

    it('should allow access for exact role match', () => {
      const middleware = requireRole('USER');
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for admin role when USER is required', () => {
      (mockRequest as any).user = userFixtures.admin;
      const middleware = requireRole('USER');
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for insufficient permissions', () => {
      const middleware = requireRole('ADMIN');
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });

    it('should deny access when user is not in request', () => {
      (mockRequest as any).user = undefined;
      const middleware = requireRole('USER');
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });

    it('should allow USER role specifically', () => {
      const middleware = requireRole('USER');
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user role does not match required', () => {
      const middleware = requireRole('ADMIN');
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });
  });

  describe('combined auth flow', () => {
    it('should authenticate and authorize user successfully', async () => {
      const payload = { userId: 1, role: 'ADMIN' };
      mockRequest.headers = { authorization: `Bearer ${jwtTokens.validAdmin}` };
      
      mockJwtService.verifyAccessToken.mockResolvedValue(payload);
      mockUserService.getUserById.mockResolvedValue(userFixtures.admin);

      // First middleware: authenticate
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect((mockRequest as any).user).toEqual(userFixtures.admin);
      expect(mockNext).toHaveBeenCalledWith();

      // Reset next mock for second middleware
      (mockNext as jest.Mock).mockClear();

      // Second middleware: authorize
      const roleMiddleware = requireRole('ADMIN');
      roleMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject unauthorized user at role check', async () => {
      const payload = { userId: 2, role: 'USER' };
      mockRequest.headers = { authorization: `Bearer ${jwtTokens.validUser}` };
      
      mockJwtService.verifyAccessToken.mockResolvedValue(payload);
      mockUserService.getUserById.mockResolvedValue(userFixtures.user1);

      // First middleware: authenticate
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect((mockRequest as any).user).toEqual(userFixtures.user1);
      expect(mockNext).toHaveBeenCalledWith();

      // Reset next mock for second middleware
      (mockNext as jest.Mock).mockClear();

      // Second middleware: authorize (should fail)
      const roleMiddleware = requireRole('ADMIN');
      roleMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });
  });
});