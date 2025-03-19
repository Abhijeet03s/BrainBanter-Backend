import { Router } from 'express';
import {
   startDebateSession,
   sendMessage,
   getDebateSession,
   getUserDebateSessions
} from '../controllers/debate.controller';
import { authenticateUser } from '../middleware/auth';
import { aiService } from '../services/ai.service';

const router = Router();

// Test route for AI - remove in production
router.post('/test-ai', async (req, res) => {
   try {
      const { prompt } = req.body;
      if (!prompt) {
         return res.status(400).json({ error: 'Prompt is required' });
      }

      const response = await aiService.generateDebateResponse(prompt);
      res.json({ response });
   } catch (error) {
      console.error('AI test error:', error);
      res.status(500).json({ error: 'Failed to generate AI response' });
   }
});

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

export default router; 