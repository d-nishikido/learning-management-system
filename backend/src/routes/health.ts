import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types';

const router = Router();
const prisma = new PrismaClient();

interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

router.get(
  '/',
  async (_req: Request, res: Response<ApiResponse<HealthCheckResponse>>) => {
    try {
      // Check database connection
      let databaseStatus: 'connected' | 'disconnected' = 'disconnected';
      try {
        await prisma.$queryRaw`SELECT 1`;
        databaseStatus = 'connected';
      } catch (error) {
        console.error('Database health check failed:', error);
      }

      // Get memory usage
      const memUsage = process.memoryUsage();
      const memoryUsed = memUsage.heapUsed;
      const memoryTotal = memUsage.heapTotal;
      const memoryPercentage = Math.round((memoryUsed / memoryTotal) * 100);

      const healthData: HealthCheckResponse = {
        status: databaseStatus === 'connected' ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: databaseStatus,
        memory: {
          used: memoryUsed,
          total: memoryTotal,
          percentage: memoryPercentage,
        },
      };

      const statusCode = healthData.status === 'ok' ? 200 : 503;

      res.status(statusCode).json({
        success: healthData.status === 'ok',
        data: healthData,
        message:
          healthData.status === 'ok'
            ? 'Service is healthy'
            : 'Service has issues',
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
      });
    }
  },
);

export default router;
