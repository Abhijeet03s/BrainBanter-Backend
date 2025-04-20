import { Router } from 'express';
import {
   startDebateSession,
   sendMessage,
   getDebateSession,
   getUserDebateSessions,
   deleteDebateSession,
   saveDebateSession,
   getSavedDebates,
   removeSavedDebate
} from '@/controllers/debate.controller';
import { authenticateUser } from '@/middleware/auth';
import { cacheMiddleware } from '@/middleware/cache';
import { CACHE_TTL, CACHE_KEYS } from '@/config/redis';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Debates
 *   description: Debate session management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateDebateRequest:
 *       type: object
 *       required:
 *         - topic
 *       properties:
 *         topic:
 *           type: string
 *           description: The debate topic
 *         mode:
 *           type: string
 *           enum: [creative, precise, balanced]
 *           default: creative
 *           description: Debate mode
 *       example:
 *         topic: "Are electric vehicles better for the environment?"
 *         mode: "balanced"
 *     MessageRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: Message content
 *       example:
 *         message: "What about the environmental impact of battery production?"
 */

// All routes below require authentication
router.use(authenticateUser);

/**
 * @swagger
 * /api/debates/sessions:
 *   post:
 *     summary: Start a new debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDebateRequest'
 *     responses:
 *       201:
 *         description: Debate session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/DebateSession'
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/sessions', startDebateSession);

/**
 * @swagger
 * /api/debates/sessions/{sessionId}/messages:
 *   post:
 *     summary: Send a message in a debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The debate session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageRequest'
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Debate session not found
 */
router.post('/sessions/:sessionId/messages', sendMessage);

/**
 * @swagger
 * /api/debates/sessions/{sessionId}:
 *   get:
 *     summary: Get a specific debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The debate session ID
 *     responses:
 *       200:
 *         description: Debate session data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/DebateSession'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Debate session not found
 */
router.get('/sessions/:sessionId', cacheMiddleware({
   ttl: CACHE_TTL.DEBATE_SESSION,
   key: (req) => `${CACHE_KEYS.DEBATE_SESSION}${req.params.sessionId}`
}), getDebateSession);

/**
 * @swagger
 * /api/debates/sessions:
 *   get:
 *     summary: Get all user's debate sessions
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of debate sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DebateSession'
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions', cacheMiddleware({
   ttl: CACHE_TTL.DEBATE_SESSION,
   key: (req) => `${CACHE_KEYS.DEBATE_SESSION}user:${req.user.id}`
}), getUserDebateSessions);

/**
 * @swagger
 * /api/debates/sessions/{sessionId}:
 *   delete:
 *     summary: Delete a debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The debate session ID
 *     responses:
 *       200:
 *         description: Debate session deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Debate session not found
 */
router.delete('/sessions/:sessionId', deleteDebateSession);

/**
 * @swagger
 * /api/debates/sessions/{sessionId}/save:
 *   post:
 *     summary: Save a debate session
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The debate session ID
 *     responses:
 *       201:
 *         description: Debate session saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     savedDebate:
 *                       $ref: '#/components/schemas/SavedDebate'
 *       400:
 *         description: Debate already saved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Debate session not found
 */
router.post('/sessions/:sessionId/save', saveDebateSession);

/**
 * @swagger
 * /api/debates/saved:
 *   get:
 *     summary: Get all saved debates for a user
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved debates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     savedDebates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SavedDebate'
 *       401:
 *         description: Unauthorized
 */
router.get('/saved', cacheMiddleware({
   ttl: CACHE_TTL.SAVED_DEBATES,
   key: (req) => `${CACHE_KEYS.SAVED_DEBATES}${req.user.id}`
}), getSavedDebates);

/**
 * @swagger
 * /api/debates/saved/{savedId}:
 *   delete:
 *     summary: Remove a saved debate
 *     tags: [Debates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: savedId
 *         required: true
 *         schema:
 *           type: string
 *         description: The saved debate ID
 *     responses:
 *       200:
 *         description: Saved debate removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved debate not found
 */
router.delete('/saved/:savedId', removeSavedDebate);

export default router; 