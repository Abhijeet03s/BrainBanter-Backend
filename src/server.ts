import './paths';
import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from "@/routes/auth.routes"
import dotenv from 'dotenv';
import debateRoutes from "@/routes/debate.routes"
import { setupSwagger } from "@/middleware/swagger"

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '8000');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Set up Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/debates', debateRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the server is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Server is running
 */
app.get('/health', (req, res) => {
   res.status(200).json({ status: 'ok', message: 'Server is running' });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Returns a simple message indicating the server is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: A welcome message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: BrainBanter backend is running
 */
app.get('/', (req, res) => {
   res.send('BrainBanter backend is running');
});

// Start the server
app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});


export default app; 