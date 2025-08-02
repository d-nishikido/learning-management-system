// Mock Prisma first
const mockPrisma = {
  $queryRaw: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

import request from 'supertest';
import express from 'express';
import healthRouter from '../../routes/health';

describe('Health API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/health', healthRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/health', () => {
    it('should return healthy status when database is connected', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'ok',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          database: 'connected',
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
          },
        },
        message: 'Service is healthy',
      });
    });

    it('should return error status when database is disconnected', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await request(app)
        .get('/api/v1/health')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        data: {
          status: 'error',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          database: 'disconnected',
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
          },
        },
        message: 'Service has issues',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Database health check failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should include correct timestamp format', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await request(app)
        .get('/api/v1/health');

      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should have positive uptime', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await request(app)
        .get('/api/v1/health');

      expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include memory usage information', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const response = await request(app)
        .get('/api/v1/health');

      expect(response.body.data.memory).toMatchObject({
        used: expect.any(Number),
        total: expect.any(Number),
        percentage: expect.any(Number),
      });

      expect(response.body.data.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(response.body.data.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should handle internal server error', async () => {
      // Mock an error in the route handler itself
      const originalQuery = mockPrisma.$queryRaw;
      (mockPrisma as any).$queryRaw = undefined; // This should cause an error

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await request(app)
        .get('/api/v1/health')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        data: expect.objectContaining({
          status: 'error',
          database: 'disconnected',
        }),
        message: 'Service has issues',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Database health check failed:', expect.any(Error));
      
      // Restore mocks
      mockPrisma.$queryRaw = originalQuery;
      consoleSpy.mockRestore();
    });
  });
});