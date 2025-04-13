import { Response, Request } from 'express';
import { logger } from './logger';

interface SuccessResponse {
   success: boolean;
   message?: string;
   data?: any;
}

interface ErrorDetails {
   path?: string;
   method?: string;
   requestId?: string;
   [key: string]: any;
}

/**
 * Standard success response with logging
 */
export const sendSuccessResponse = (
   res: Response,
   statusCode = 200,
   data?: any,
   message = 'Success'
): Response => {
   const response: SuccessResponse = {
      success: true,
      message
   };

   if (data) {
      response.data = data;
   }

   // Log successful operations (optional, can be removed if too verbose)
   if (statusCode === 201) {
      logger.info(`Resource created: ${message}`);
   }

   return res.status(statusCode).json(response);
};

/**
 * Standard error response with logging
 */
export const sendErrorResponse = (
   res: Response,
   error: Error,
   statusCode = 500,
   details?: ErrorDetails
): Response => {
   const errorDetails = {
      ...details,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
   };

   // Log errors with appropriate level
   if (statusCode >= 500) {
      logger.error(error.message, errorDetails);
   } else if (statusCode >= 400) {
      logger.warn(error.message, errorDetails);
   }

   return res.status(statusCode).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      ...(details && { details })
   });
};

/**
 * Create a custom error with status code
 */
export class ApiError extends Error {
   statusCode: number;
   details?: any;

   constructor(message: string, statusCode = 500, details?: any) {
      super(message);
      this.statusCode = statusCode;
      this.details = details;
      Object.setPrototypeOf(this, ApiError.prototype);
   }
}

/**
 * Extract request ID from headers
 */
export const getRequestId = (req: Request): string => {
   const requestId = req.headers['x-request-id'];
   if (!requestId) return 'unknown';

   return Array.isArray(requestId) ? requestId[0] : requestId;
}; 