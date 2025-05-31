import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { supabaseAdmin } from '@/config/supabase';

const prisma = new PrismaClient();

export const handleUserAuth = async (req: Request, res: Response) => {
   try {
      // Extract the user data correctly from the nested structure
      const userData = req.user?.user || req.user;

      // Debug logging to see what userData contains
      console.log('userData received:', JSON.stringify(userData, null, 2));

      if (!userData || !userData.id || !userData.email) {
         res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid user data'
         });
         return;
      }

      // Check if user already exists in our database
      let dbUser = await prisma.user.findUnique({
         where: { email: userData.email }
      });

      if (!dbUser) {
         // Create new user in our database
         dbUser = await prisma.user.create({
            data: {
               id: userData.id,
               email: userData.email,
               username: userData.user_metadata?.username || userData.email.split('@')[0],
               authProvider: 'supabase'
            }
         });
      }

      res.status(200).json({
         message: 'User authenticated successfully',
         id: dbUser.id,
         email: dbUser.email,
         username: dbUser.username
      });
   } catch (error) {
      console.error('Error in handleUserAuth:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to process user authentication'
      });
   }
};

export const getCurrentUser = async (req: Request, res: Response) => {
   try {
      const userData = req.user?.user || req.user;

      if (!userData || !userData.id) {
         res.status(401).json({
            error: 'Unauthorized',
            message: 'User not authenticated'
         });
         return;
      }

      // Get user from our database
      const dbUser = await prisma.user.findUnique({
         where: { id: userData.id }
      });

      if (!dbUser) {
         res.status(404).json({
            error: 'Not Found',
            message: 'User not found in database'
         });
         return;
      }

      res.status(200).json({
         id: dbUser.id,
         email: dbUser.email,
         username: dbUser.username,
         preferences: dbUser.preferences
      });
   } catch (error) {
      console.error('Error in getCurrentUser:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to retrieve user profile'
      });
   }
};

export const forgotPassword = async (req: Request, res: Response) => {
   try {
      const { email } = req.body;

      if (!email) {
         res.status(400).json({
            error: 'Bad Request',
            message: 'Email is required'
         });
         return;
      }

      // Check if user exists in our database
      const user = await prisma.user.findUnique({
         where: { email }
      });

      if (!user) {
         // Still return success to prevent email enumeration attacks
         res.status(200).json({
            message: 'If an account with that email exists, a password reset link has been sent'
         });
         return;
      }

      // Send password reset email via Supabase Auth
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
         redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL || 'https://yourapp.com/reset-password',
      });

      if (error) {
         console.error('Error sending reset email:', error);
         res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to send password reset email'
         });
         return;
      }

      res.status(200).json({
         message: 'If an account with that email exists, a password reset link has been sent'
      });
   } catch (error) {
      console.error('Error in forgotPassword:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to process password reset request'
      });
   }
};

export const logout = async (req: Request, res: Response) => {
   try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         res.status(400).json({
            error: 'Bad Request',
            message: 'Missing or invalid authorization header'
         });
         return;
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
         console.error('Error logging out user:', error);
         res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to logout user'
         });
         return;
      }

      res.status(200).json({
         success: true,
         message: 'User logged out successfully'
      });
   } catch (error) {
      console.error('Error in logout:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to process logout request'
      });
   }
};
