import express, { Application } from 'express';
import bodyParser from 'body-parser';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes

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