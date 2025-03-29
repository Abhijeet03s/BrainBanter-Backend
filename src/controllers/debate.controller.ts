import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { aiService } from '../services/ai.service';
import { getInitialDebatePrompt } from '../config/prompts';

const prisma = new PrismaClient();

const ensureCleanFormatting = (text: string): string => {
   // Remove all markdown formatting
   return text
      .replace(/\*{1,3}([^*]+?)\*{1,3}/g, '$1') // Remove all asterisks formatting
      .replace(/^([A-Za-z\s]+):\s*$/gm, '$1')   // Remove section headers 
      .replace(/^\s*[\d*-]+\.?\s+/gm, '')       // Remove list markers
      .replace(/\n{3,}/g, '\n\n')               // Clean up extra newlines
      .trim();
};

export const startDebateSession = async (req: Request, res: Response) => {
   try {
      const userData = req.user?.user || req.user;
      const { topic, mode = 'creative' } = req.body;

      if (!userData || !userData.id) {
         return res.status(401).json({
            error: 'Unauthorized',
            message: 'User not authenticated'
         });
      }

      if (!topic) {
         return res.status(400).json({
            error: 'Bad Request',
            message: 'Topic is required to start a debate'
         });
      }

      // Create a new debate session
      const debateSession = await prisma.debateSession.create({
         data: {
            userId: userData.id,
            title: topic,
            mode,
            status: 'active'
         }
      });

      // Get the initial debate prompt
      const initialPrompt = getInitialDebatePrompt(topic);

      // Generate initial AI response with counterarguments
      // No history for the first message
      const aiResponse = await aiService.generateDebateResponse(initialPrompt, [], {
         stance: 'challenging',
         depth: 'deep'
      });

      // Save the user's initial message
      const userMessage = await prisma.message.create({
         data: {
            debateSessionId: debateSession.id,
            sender: 'user',
            content: topic
         }
      });

      // Save the AI's response
      const aiMessage = await prisma.message.create({
         data: {
            debateSessionId: debateSession.id,
            sender: 'ai',
            content: ensureCleanFormatting(aiResponse)
         }
      });

      res.status(201).json({
         success: true,
         session: debateSession,
         messages: [userMessage, aiMessage]
      });
   } catch (error) {
      console.error('Error starting debate session:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to start debate session'
      });
   }
};

export const sendMessage = async (req: Request, res: Response) => {
   try {
      const userData = req.user?.user || req.user;
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!userData || !userData.id) {
         return res.status(401).json({
            error: 'Unauthorized',
            message: 'User not authenticated'
         });
      }

      if (!sessionId || !message) {
         return res.status(400).json({
            error: 'Bad Request',
            message: 'Session ID and message are required'
         });
      }

      // Check if the debate session exists and belongs to the user
      const debateSession = await prisma.debateSession.findFirst({
         where: {
            id: sessionId,
            userId: userData.id
         }
      });

      if (!debateSession) {
         return res.status(404).json({
            error: 'Not Found',
            message: 'Debate session not found or does not belong to the user'
         });
      }

      // Get the conversation history
      const history = await prisma.message.findMany({
         where: {
            debateSessionId: sessionId
         },
         orderBy: {
            createdAt: 'asc'
         }
      });

      // Save the user's message
      const userMessage = await prisma.message.create({
         data: {
            debateSessionId: sessionId,
            sender: 'user',
            content: message
         }
      });

      // Analyze sentiment and determine appropriate stance
      const analysisResult = await aiService.analyzeUserSentiment(message, history);

      // Generate AI response based on conversation history and analysis
      const aiResponse = await aiService.generateDebateResponse(
         message,
         history,
         analysisResult
      );

      // Save the AI's response
      const aiMessage = await prisma.message.create({
         data: {
            debateSessionId: sessionId,
            sender: 'ai',
            content: ensureCleanFormatting(aiResponse)
         }
      });

      res.status(200).json({
         success: true,
         messages: [userMessage, aiMessage]
      });
   } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to process message'
      });
   }
};

export const getDebateSession = async (req: Request, res: Response) => {
   try {
      const userData = req.user?.user || req.user;
      const { sessionId } = req.params;

      if (!userData || !userData.id) {
         return res.status(401).json({
            error: 'Unauthorized',
            message: 'User not authenticated'
         });
      }

      // Get the debate session
      const debateSession = await prisma.debateSession.findFirst({
         where: {
            id: sessionId,
            userId: userData.id
         },
         include: {
            messages: {
               orderBy: {
                  createdAt: 'asc'
               }
            }
         }
      });

      if (!debateSession) {
         return res.status(404).json({
            error: 'Not Found',
            message: 'Debate session not found or does not belong to the user'
         });
      }

      res.status(200).json({
         success: true,
         session: debateSession
      });
   } catch (error) {
      console.error('Error retrieving debate session:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to retrieve debate session'
      });
   }
};

export const getUserDebateSessions = async (req: Request, res: Response) => {
   try {
      const userData = req.user?.user || req.user;

      if (!userData || !userData.id) {
         return res.status(401).json({
            error: 'Unauthorized',
            message: 'User not authenticated'
         });
      }

      // Get all debate sessions for the user
      const debateSessions = await prisma.debateSession.findMany({
         where: {
            userId: userData.id
         },
         orderBy: {
            updatedAt: 'desc'
         }
      });

      res.status(200).json({
         success: true,
         sessions: debateSessions
      });
   } catch (error) {
      console.error('Error retrieving user debate sessions:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to retrieve user debate sessions'
      });
   }
};

export const deleteDebateSession = async (req: Request, res: Response) => {
   try {
      const userData = req.user?.user || req.user;
      const { sessionId } = req.params;

      if (!userData || !userData.id) {
         return res.status(401).json({
            error: 'Unauthorized',
            message: 'User not authenticated'
         });
      }

      // Check if the debate session exists and belongs to the user
      const debateSession = await prisma.debateSession.findFirst({
         where: {
            id: sessionId,
            userId: userData.id
         }
      });

      if (!debateSession) {
         return res.status(404).json({
            error: 'Not Found',
            message: 'Debate session not found or does not belong to the user'
         });
      }

      // Delete all related messages first (due to foreign key constraints)
      await prisma.message.deleteMany({
         where: {
            debateSessionId: sessionId
         }
      });

      // Delete any related feedback
      await prisma.feedback.deleteMany({
         where: {
            debateSessionId: sessionId
         }
      });

      // Delete the analytics
      await prisma.conversationAnalytics.deleteMany({
         where: {
            debateSessionId: sessionId
         }
      });

      // Finally, delete the debate session
      await prisma.debateSession.delete({
         where: {
            id: sessionId
         }
      });

      res.status(200).json({
         success: true,
         message: 'Debate session deleted successfully'
      });
   } catch (error) {
      console.error('Error deleting debate session:', error);
      res.status(500).json({
         error: 'Internal Server Error',
         message: 'Failed to delete debate session'
      });
   }
}; 