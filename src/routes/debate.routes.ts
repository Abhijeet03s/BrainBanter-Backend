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
} from '../controllers/debate.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All routes below require authentication
router.use(authenticateUser);

// Route to start a new debate session
router.post('/sessions', startDebateSession);

// Route to send a message in a debate session
router.post('/sessions/:sessionId/messages', sendMessage);

// Route to get a specific debate session
router.get('/sessions/:sessionId', getDebateSession);

// Route to get all user's debate sessions
router.get('/sessions', getUserDebateSessions);

// Route to delete a debate session
router.delete('/sessions/:sessionId', deleteDebateSession);

// Route to save a debate session
router.post('/sessions/:sessionId/save', saveDebateSession);

// Route to get all saved debates for a user
router.get('/saved', getSavedDebates);

// Route to remove a saved debate
router.delete('/saved/:savedId', removeSavedDebate);

export default router; 