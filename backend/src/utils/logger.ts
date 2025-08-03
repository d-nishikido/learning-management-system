import winston from 'winston';
import path from 'path';

/**
 * Custom log levels
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Log level colors for console output
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

/**
 * Choose the log level based on the running environment
 */
const level = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

/**
 * Custom format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

/**
 * Custom format for file output
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Define which transports the logger must use to print out messages
 */
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: consoleFormat
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

/**
 * Create the logger instance
 */
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: fileFormat
    })
  ]
});

/**
 * Extended logger with file upload specific methods
 */
export class FileUploadLogger {
  /**
   * Log file upload start
   */
  static logUploadStart(userId: string, filename: string, fileSize: number, mimeType: string): void {
    logger.info('File upload started', {
      userId,
      filename,
      fileSize,
      mimeType,
      timestamp: new Date().toISOString(),
      event: 'upload_start'
    });
  }

  /**
   * Log file upload success
   */
  static logUploadSuccess(
    userId: string, 
    filename: string, 
    originalSize: number, 
    optimizedSize?: number,
    compressionRatio?: number
  ): void {
    logger.info('File upload completed successfully', {
      userId,
      filename,
      originalSize,
      optimizedSize,
      compressionRatio,
      timestamp: new Date().toISOString(),
      event: 'upload_success'
    });
  }

  /**
   * Log file upload failure
   */
  static logUploadFailure(userId: string, filename: string, error: string, reason: string): void {
    logger.error('File upload failed', {
      userId,
      filename,
      error,
      reason,
      timestamp: new Date().toISOString(),
      event: 'upload_failure'
    });
  }

  /**
   * Log file optimization start
   */
  static logOptimizationStart(filename: string, fileType: string): void {
    logger.info('File optimization started', {
      filename,
      fileType,
      timestamp: new Date().toISOString(),
      event: 'optimization_start'
    });
  }

  /**
   * Log file optimization success
   */
  static logOptimizationSuccess(
    filename: string, 
    originalSize: number, 
    optimizedSize: number, 
    compressionRatio: number,
    processingTime: number
  ): void {
    logger.info('File optimization completed successfully', {
      filename,
      originalSize,
      optimizedSize,
      compressionRatio,
      processingTime,
      timestamp: new Date().toISOString(),
      event: 'optimization_success'
    });
  }

  /**
   * Log file optimization failure
   */
  static logOptimizationFailure(filename: string, error: string): void {
    logger.warn('File optimization failed, using original file', {
      filename,
      error,
      timestamp: new Date().toISOString(),
      event: 'optimization_failure'
    });
  }

  /**
   * Log security violation
   */
  static logSecurityViolation(
    userId: string, 
    filename: string, 
    violationType: string, 
    details: string,
    ipAddress?: string
  ): void {
    logger.error('Security violation detected in file upload', {
      userId,
      filename,
      violationType,
      details,
      ipAddress,
      timestamp: new Date().toISOString(),
      event: 'security_violation'
    });
  }

  /**
   * Log file quarantine
   */
  static logFileQuarantine(filename: string, reason: string, quarantinePath: string): void {
    logger.warn('File quarantined due to security concerns', {
      filename,
      reason,
      quarantinePath,
      timestamp: new Date().toISOString(),
      event: 'file_quarantine'
    });
  }

  /**
   * Log file validation failure
   */
  static logValidationFailure(filename: string, validationType: string, error: string): void {
    logger.warn('File validation failed', {
      filename,
      validationType,
      error,
      timestamp: new Date().toISOString(),
      event: 'validation_failure'
    });
  }

  /**
   * Log file cleanup
   */
  static logFileCleanup(filePaths: string[], success: boolean, error?: string): void {
    if (success) {
      logger.debug('File cleanup completed', {
        filePaths,
        timestamp: new Date().toISOString(),
        event: 'cleanup_success'
      });
    } else {
      logger.warn('File cleanup failed', {
        filePaths,
        error,
        timestamp: new Date().toISOString(),
        event: 'cleanup_failure'
      });
    }
  }
}

export default logger;