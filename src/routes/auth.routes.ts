import { Router } from 'express';
import { handleUserAuth, getCurrentUser, forgotPassword } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Route to handle user authentication after Supabase login
router.post('/callback', authenticateUser, handleUserAuth);

// Route to get current user profile
router.get('/me', authenticateUser, getCurrentUser);

// Route for forgot password
router.post('/forgot-password', forgotPassword);

export default router;