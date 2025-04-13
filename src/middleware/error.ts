import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { getRequestId } from '@/utils/api-utils';

export interface ApiError extends Error {
   statusCode?: number;
   details?: any;
}

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
   const error = new Error(`Not Found - ${req.originalUrl}`) as ApiError;
   error.statusCode = 404;
   next(error);
};

// Error handling middleware
export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
   // Log the error with appropriate level based on status code
   const statusCode = err.statusCode || 500;
   const requestId = getRequestId(req);

   if (statusCode >= 500) {
      logger.error({
         message: err.message,
         error: err,
         requestId,
         path: req.path,
         method: req.method,
         ip: req.ip
      });
   } else if (statusCode >= 400) {
      logger.warn({
         message: err.message,
         error: err,
         requestId,
         path: req.path,
         method: req.method
      });
   }

   // Send error response
   res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
      details: err.details || undefined
   });
}; 