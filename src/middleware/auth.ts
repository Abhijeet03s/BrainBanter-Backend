import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Extend Express Request type to include user
declare global {
   namespace Express {
      interface Request {
         user?: any;
      }
   }
}

/**
 * Middleware to authenticate requests using Supabase JWT
 */
export const authenticateUser = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   const authHeader = req.headers.authorization;

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
         error: 'Unauthorized',
         message: 'Missing or invalid authorization header'
      });
      return;
   }

   const token = authHeader.split(' ')[1];

   try {
      // Verify the JWT token with Supabase
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
         res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authentication token'
         });
         return;
      }

      // Add user to request object
      req.user = data.user;
      next();
   } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({
         error: 'Unauthorized',
         message: 'Authentication failed'
      });
   }
};

/**
 * Optional authentication middleware - doesn't reject if no token
 */
export const optionalAuth = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   const authHeader = req.headers.authorization;

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
   }

   const token = authHeader.split(' ')[1];

   try {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data?.user) {
         req.user = data.user;
      }
   } catch (error) {
      // Just continue if token is invalid
      console.warn('Invalid token in optional auth');
   }

   next();
}; 