import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { aiService } from '@/services/ai.service';
import { getInitialDebatePrompt } from '@/config/prompts';
import { logger } from '@/utils/logger';
import { sendSuccessResponse, sendErrorResponse, ApiError, getRequestId } from '@/utils/api-utils';

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
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;
      const { topic, mode = 'creative' } = req.body;

      if (!userData || !userData.id) {
         logger.warn('Unauthorized attempt to start debate session', {
            requestId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      if (!topic) {
         logger.warn('Missing topic in debate session request', {
            requestId,
            userId: userData.id,
            path: req.path
         });
         throw new ApiError('Topic is required to start a debate', 400);
      }

      // Create a new debate session
      logger.info('Creating new debate session', {
         requestId,
         userId: userData.id,
         topic,
         mode
      });

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
      logger.debug('Generating initial AI response', {
         requestId,
         debateSessionId: debateSession.id,
         topic
      });

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

      logger.info('Debate session started successfully', {
         requestId,
         userId: userData.id,
         debateSessionId: debateSession.id,
         messageCount: 2 // Initial user message + AI response
      });

      return sendSuccessResponse(res, 201, {
         session: debateSession,
         messages: [userMessage, aiMessage]
      });
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error starting debate session', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id
      });
   }
};

export const sendMessage = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!userData || !userData.id) {
         logger.warn('Unauthorized attempt to send message', {
            requestId,
            sessionId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      if (!sessionId || !message) {
         logger.warn('Missing session ID or message in request', {
            requestId,
            userId: userData.id,
            sessionId,
            path: req.path
         });
         throw new ApiError('Session ID and message are required', 400);
      }

      // Check if the debate session exists and belongs to the user
      const debateSession = await prisma.debateSession.findFirst({
         where: {
            id: sessionId,
            userId: userData.id
         }
      });

      if (!debateSession) {
         logger.warn('Debate session not found or unauthorized access', {
            requestId,
            userId: userData.id,
            sessionId,
            path: req.path
         });
         throw new ApiError('Debate session not found or does not belong to the user', 404);
      }

      logger.debug('Processing message for debate session', {
         requestId,
         userId: userData.id,
         sessionId
      });

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

      logger.debug('AI sentiment analysis completed', {
         requestId,
         sessionId,
         stance: analysisResult.stance,
         depth: analysisResult.depth
      });

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

      logger.info('Message processed successfully', {
         requestId,
         userId: userData.id,
         sessionId,
         messageId: aiMessage.id
      });

      return sendSuccessResponse(res, 200, {
         messages: [userMessage, aiMessage]
      });
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error sending message', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         sessionId: req.params.sessionId
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         sessionId: req.params.sessionId
      });
   }
};

export const getDebateSession = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;
      const { sessionId } = req.params;

      if (!userData || !userData.id) {
         logger.warn('Unauthorized attempt to access debate session', {
            requestId,
            sessionId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      logger.debug('Retrieving debate session', {
         requestId,
         userId: userData.id,
         sessionId
      });

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
         logger.warn('Debate session not found or unauthorized access', {
            requestId,
            userId: userData.id,
            sessionId,
            path: req.path
         });
         throw new ApiError('Debate session not found or does not belong to the user', 404);
      }

      logger.debug('Debate session retrieved successfully', {
         requestId,
         userId: userData.id,
         sessionId,
         messageCount: debateSession.messages.length
      });

      return sendSuccessResponse(res, 200, {
         session: debateSession
      });
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error retrieving debate session', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         sessionId: req.params.sessionId
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         sessionId: req.params.sessionId
      });
   }
};

export const getUserDebateSessions = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;

      if (!userData || !userData.id) {
         logger.warn('Unauthorized attempt to access user debate sessions', {
            requestId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      logger.debug('Retrieving user debate sessions', {
         requestId,
         userId: userData.id
      });

      // Get all debate sessions for the user
      const debateSessions = await prisma.debateSession.findMany({
         where: {
            userId: userData.id
         },
         orderBy: {
            updatedAt: 'desc'
         }
      });

      logger.debug('User debate sessions retrieved successfully', {
         requestId,
         userId: userData.id,
         sessionCount: debateSessions.length
      });

      return sendSuccessResponse(res, 200, {
         sessions: debateSessions
      });
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error retrieving user debate sessions', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id
      });
   }
};

export const deleteDebateSession = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;
      const { sessionId } = req.params;

      if (!userData || !userData.id) {
         logger.warn('Unauthorized attempt to delete debate session', {
            requestId,
            sessionId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      logger.debug('Verifying debate session ownership before deletion', {
         requestId,
         userId: userData.id,
         sessionId
      });

      // Check if the debate session exists and belongs to the user
      const debateSession = await prisma.debateSession.findFirst({
         where: {
            id: sessionId,
            userId: userData.id
         }
      });

      if (!debateSession) {
         logger.warn('Attempt to delete non-existent or unauthorized debate session', {
            requestId,
            userId: userData.id,
            sessionId,
            path: req.path
         });
         throw new ApiError('Debate session not found or does not belong to the user', 404);
      }

      logger.info('Deleting debate session and related data', {
         requestId,
         userId: userData.id,
         sessionId
      });

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

      logger.info('Debate session deleted successfully', {
         requestId,
         userId: userData.id,
         sessionId
      });

      return sendSuccessResponse(res, 200, null, 'Debate session deleted successfully');
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error deleting debate session', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         sessionId: req.params.sessionId
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         sessionId: req.params.sessionId
      });
   }
};

export const saveDebateSession = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;
      const { sessionId } = req.params;

      if (!userData || !userData.id) {
         logger.warn('Unauthorized attempt to save debate session', {
            requestId,
            sessionId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      logger.debug('Verifying debate session existence', {
         requestId,
         userId: userData.id,
         sessionId
      });

      // Check if the debate session exists
      const debateSession = await prisma.debateSession.findUnique({
         where: {
            id: sessionId
         }
      });

      if (!debateSession) {
         logger.warn('Attempt to save non-existent debate session', {
            requestId,
            userId: userData.id,
            sessionId,
            path: req.path
         });
         throw new ApiError('Debate session not found', 404);
      }

      // Check if this debate is already saved by the user
      const existingSave = await prisma.savedDebate.findFirst({
         where: {
            userId: userData.id,
            debateSessionId: sessionId
         }
      });

      if (existingSave) {
         logger.info('Attempt to save already saved debate session', {
            requestId,
            userId: userData.id,
            sessionId,
            savedId: existingSave.id
         });
         throw new ApiError('Debate session is already saved', 400);
      }

      logger.info('Saving debate session', {
         requestId,
         userId: userData.id,
         sessionId
      });

      // Save the debate session
      const savedDebate = await prisma.savedDebate.create({
         data: {
            userId: userData.id,
            debateSessionId: sessionId
         }
      });

      logger.info('Debate session saved successfully', {
         requestId,
         userId: userData.id,
         sessionId,
         savedId: savedDebate.id
      });

      return sendSuccessResponse(res, 201, {
         savedDebate
      });
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error saving debate session', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         sessionId: req.params.sessionId
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         sessionId: req.params.sessionId
      });
   }
};

export const getSavedDebates = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;

      if (!userData || !userData.id) {
         logger.warn('Unauthorized attempt to access saved debates', {
            requestId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      logger.debug('Retrieving saved debates', {
         requestId,
         userId: userData.id
      });

      // Get all saved debates for the user with related debate session data
      const savedDebates = await prisma.savedDebate.findMany({
         where: {
            userId: userData.id
         },
         include: {
            debateSession: {
               select: {
                  id: true,
                  title: true,
                  mode: true,
                  status: true,
                  createdAt: true
               }
            }
         },
         orderBy: {
            createdAt: 'desc'
         }
      });

      logger.debug('Saved debates retrieved successfully', {
         requestId,
         userId: userData.id,
         count: savedDebates.length
      });

      return sendSuccessResponse(res, 200, {
         savedDebates
      });
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error retrieving saved debates', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id
      });
   }
};

export const removeSavedDebate = async (req: Request, res: Response) => {
   try {
      const requestId = getRequestId(req);
      const userData = req.user?.user || req.user;
      const { savedId } = req.params;

      if (!userData || !userData.id) {
         logger.warn('Unauthorized attempt to remove saved debate', {
            requestId,
            savedId,
            path: req.path,
            method: req.method
         });
         throw new ApiError('User not authenticated', 401);
      }

      logger.debug('Verifying saved debate ownership before removal', {
         requestId,
         userId: userData.id,
         savedId
      });

      // Check if the saved debate exists and belongs to the user
      const savedDebate = await prisma.savedDebate.findFirst({
         where: {
            id: savedId,
            userId: userData.id
         }
      });

      if (!savedDebate) {
         logger.warn('Attempt to remove non-existent or unauthorized saved debate', {
            requestId,
            userId: userData.id,
            savedId,
            path: req.path
         });
         throw new ApiError('Saved debate not found or does not belong to the user', 404);
      }

      logger.info('Removing saved debate', {
         requestId,
         userId: userData.id,
         savedId,
         debateSessionId: savedDebate.debateSessionId
      });

      // Delete the saved debate
      await prisma.savedDebate.delete({
         where: {
            id: savedId
         }
      });

      logger.info('Saved debate removed successfully', {
         requestId,
         userId: userData.id,
         savedId
      });

      return sendSuccessResponse(res, 200, null, 'Saved debate removed successfully');
   } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;

      logger.error('Error removing saved debate', {
         error,
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         savedId: req.params.savedId
      });

      return sendErrorResponse(res, error as Error, statusCode, {
         requestId: getRequestId(req),
         path: req.path,
         method: req.method,
         userId: req.user?.id,
         savedId: req.params.savedId
      });
   }
}; 