/**
 * Safe logging utility that sanitizes sensitive information in production
 */

const isDevelopment = __DEV__;

/**
 * Sanitizes objects by removing potentially sensitive keys
 */
const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = [
    'oauth_token',
    'oauth_token_secret', 
    'consumer_secret',
    'consumer_key',
    'password',
    'secret',
    'key',
    'token',
    'authorization',
    'auth'
  ];
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Safe console.log that sanitizes sensitive data in production
 */
export const safeLog = (message: string, data?: any): void => {
  if (isDevelopment) {
    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  } else {
    if (data !== undefined) {
      console.log(message, sanitizeObject(data));
    } else {
      console.log(message);
    }
  }
};

/**
 * Safe console.error that sanitizes sensitive data in production
 */
export const safeError = (message: string, error?: any): void => {
  if (isDevelopment) {
    if (error !== undefined) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  } else {
    // In production, log sanitized error information
    if (error !== undefined) {
      const sanitizedError = {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        // Don't include full error object or stack trace in production
      };
      console.error(message, sanitizedError);
    } else {
      console.error(message);
    }
  }
};

/**
 * Safe console.warn that sanitizes sensitive data in production
 */
export const safeWarn = (message: string, data?: any): void => {
  if (isDevelopment) {
    if (data !== undefined) {
      console.warn(message, data);
    } else {
      console.warn(message);
    }
  } else {
    if (data !== undefined) {
      console.warn(message, sanitizeObject(data));
    } else {
      console.warn(message);
    }
  }
};