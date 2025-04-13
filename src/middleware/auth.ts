import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@/config/supabase';

// Extend Express Request type to include user
declare global {
   namespace Express {
      interface Request {
         user?: any;
      }
   }
}

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

      // Extract user data correctly
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
