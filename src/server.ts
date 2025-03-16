import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '8000');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
   res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Simple test route
app.get('/', (req, res) => {
   res.send('BrainBanter backend is running');
});

// Start the server
app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});


export default app; 