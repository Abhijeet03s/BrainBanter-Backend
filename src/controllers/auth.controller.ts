import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import { sendSuccessResponse, sendErrorResponse, ApiError, getRequestId } from '../utils/api-utils';

const prisma = new PrismaClient();

export const handleUserAuth = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      // Extract the user data correctly from the nested structure
      const userData = req.user?.user || req.user;

      if (!userData || !userData.id || !userData.email) {
         logger.warn('Invalid user data in authentication request', {
            requestId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('Invalid user data', 400);
      }

      // Check if user already exists in our database
      let dbUser = await prisma.user.findUnique({
         where: { email: userData.email }
      });

      if (!dbUser) {
         // Create new user in our database
         logger.info('Creating new user in database', {
            requestId,
            userId: userData.id,
            email: userData.email
         });

         dbUser = await prisma.user.create({
            data: {
               id: userData.id,
               email: userData.email,
               username: userData.username || userData.email.split('@')[0],
               authProvider: 'supabase'
            }
         });
      } else {
         logger.debug('User already exists in database', {
            requestId,
            userId: dbUser.id
         });
      }

      return sendSuccessResponse(res, 200, {
         id: dbUser.id,
         email: dbUser.email,
         username: dbUser.username
      }, 'User authenticated successfully');
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error in user authentication', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method
      });
   }
};

export const getCurrentUser = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;

      if (!userData || !userData.id) {
         logger.warn('User not authenticated', {
            requestId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      // Get user from our database
      const dbUser = await prisma.user.findUnique({
         where: { id: userData.id }
      });

      if (!dbUser) {
         logger.warn('User not found in database', {
            requestId,
            userId: userData.id,
            path: req.path
         });
         throw new ApiError('User not found in database', 404);
      }

      logger.debug('User profile retrieved successfully', {
         requestId,
         userId: dbUser.id
      });

      return sendSuccessResponse(res, 200, {
         id: dbUser.id,
         email: dbUser.email,
         username: dbUser.username,
         preferences: dbUser.preferences
      });
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id
      });
   }
};

export const forgotPassword = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const { email } = req.body;

      if (!email) {
         logger.warn('Missing email in password reset request', {
            requestId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('Email is required', 400);
      }

      // Check if user exists in our database
      const user = await prisma.user.findUnique({
         where: { email }
      });

      if (!user) {
         // Still return success to prevent email enumeration attacks
         logger.info('Password reset requested for non-existent email', {
            requestId,
            email: email,
            exists: false
         });

         return sendSuccessResponse(res, 200, null,
            'If an account with that email exists, a password reset link has been sent');
      }

      // Send password reset email via Supabase Auth
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
         redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL || 'https://yourapp.com/reset-password',
      });

      if (error) {
         logger.error('Error sending reset email', {
            error,
            requestId,
            userId: user.id,
            email: email
         });
         throw new ApiError('Failed to send password reset email', 500);
      }

      logger.info('Password reset email sent successfully', {
         requestId,
         userId: user.id,
         email: email
      });

      return sendSuccessResponse(res, 200, null,
         'If an account with that email exists, a password reset link has been sent');
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method
      });
   }
};

export const logout = async (req: Request, res: Response) => {
   try {
      const authHeader = req.headers.authorization;
      const requestId = getRequestId(req);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         throw new ApiError('Missing or invalid authorization header', 400);
      }

      const token = authHeader.split(' ')[1];

      // Set auth context with the user's JWT token
      supabaseAdmin.auth.setSession({
         access_token: token,
         refresh_token: ''
      });

      // Sign out using Supabase - invalidate the user's session
      const { error } = await supabaseAdmin.auth.signOut({
         scope: 'global'
      });

      if (error) {
         logger.error('Error logging out user', {
            error,
            requestId,
            userId: req.user?.id
         });
         throw new ApiError('Failed to logout user', 500);
      }

      logger.info('User logged out successfully', {
         userId: req.user?.id,
         requestId
      });

      return sendSuccessResponse(res, 200, null, 'User logged out successfully');
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id
      });
   }
};
