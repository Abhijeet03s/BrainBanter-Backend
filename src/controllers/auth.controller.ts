import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create or update user in our database after Supabase authentication
 */
export const handleUserAuth = async (req: Request, res: Response) => {
   try {
      // Extract the user data correctly from the nested structure
      const userData = req.user?.user || req.user;

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
               username: userData.username || userData.email.split('@')[0], // Use existing username or create from email
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

/**
 * Get current user profile
 */
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