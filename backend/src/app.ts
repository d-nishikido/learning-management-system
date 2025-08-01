import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ApiResponse } from './types';

// Load environment variables
dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL?.split(',') || []
      : [
          'http://localhost:3000', 
          'http://localhost:3001', 
          'http://localhost:3002',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002'
        ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token',
    'X-API-Version'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count', 
    'X-Current-Page',
    'X-Per-Page',
    'X-API-Version'
  ],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200, // For legacy browser support
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging middleware (simple console logging for development)
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req, res) => {
  const response: ApiResponse<{ service: string; version: string; timestamp: string }> = {
    success: true,
    data: {
      service: 'LMS Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    message: 'Learning Management System Backend API is running',
  };
  res.json(response);
});

// Handle 404 routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 LMS Backend API v1.0.0`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  });
}

export default app;