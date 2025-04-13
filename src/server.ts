import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import debateRoutes from './routes/debate.routes';
import dotenv from 'dotenv';
import { logger, stream } from './utils/logger';
import { notFound, errorHandler } from './middleware/error';

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '8000');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', { stream }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/debates', debateRoutes);

// Health check route
app.get('/health', (req, res) => {
   res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Simple test route
app.get('/', (req, res) => {
   res.send('BrainBanter backend is running');
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
   logger.info(`Server is running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
   logger.error('Uncaught Exception', { error });
   process.exit(1); // Exit with error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
   logger.error('Unhandled Rejection', { reason, promise });
   process.exit(1); // Exit with error
});

export default app; 