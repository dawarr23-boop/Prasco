import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    // Console output
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // File output for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File output for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File output for security events
    new winston.transports.File({
      filename: 'logs/security.log',
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Handle uncaught exceptions
logger.exceptions.handle(new winston.transports.File({ filename: 'logs/exceptions.log' }));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

// Security event logging helpers
export const securityLogger = {
  logFailedLogin: (email: string, ip: string) => {
    logger.warn('SECURITY: Failed login attempt', {
      event: 'FAILED_LOGIN',
      email,
      ip,
      timestamp: new Date().toISOString(),
    });
  },

  logSuccessfulLogin: (userId: number, email: string, ip: string) => {
    logger.info('SECURITY: Successful login', {
      event: 'SUCCESSFUL_LOGIN',
      userId,
      email,
      ip,
      timestamp: new Date().toISOString(),
    });
  },

  logPermissionDenied: (
    userId: number,
    email: string,
    permission: string,
    resource: string,
    ip: string
  ) => {
    logger.warn('SECURITY: Permission denied', {
      event: 'PERMISSION_DENIED',
      userId,
      email,
      permission,
      resource,
      ip,
      timestamp: new Date().toISOString(),
    });
  },

  logRateLimitHit: (ip: string, endpoint: string) => {
    logger.warn('SECURITY: Rate limit exceeded', {
      event: 'RATE_LIMIT_EXCEEDED',
      ip,
      endpoint,
      timestamp: new Date().toISOString(),
    });
  },

  logSuspiciousActivity: (description: string, ip: string, details?: any) => {
    logger.warn('SECURITY: Suspicious activity detected', {
      event: 'SUSPICIOUS_ACTIVITY',
      description,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

export default logger;
