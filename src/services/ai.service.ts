import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
   console.error('GEMINI_API_KEY is not defined in environment variables');
}

class AIService {
   private model: GenerativeModel;

   constructor() {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
   }

   async generateDebateResponse(prompt: string, history: any[] = []): Promise<string> {
      try {
         // Configure the model parameters for debate-style responses
         const generationConfig = {
            temperature: 0.7,         // Higher for more creative, lower for more deterministic
            topK: 40,                 // Consider top K tokens
            topP: 0.95,               // Nucleus sampling probability
            maxOutputTokens: 800,     // Limit response length
         };

         // Format history for the chat model
         const formattedHistory = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
         }));

         // Start a chat session with the history
         const chat = this.model.startChat({
            history: formattedHistory,
            generationConfig,
         });

         // Send the user's message and get the response
         const result = await chat.sendMessage(prompt);
         const response = result.response.text();

         return response;
      } catch (error) {
         console.error('Error generating AI response:', error);
         throw new Error('Failed to generate AI response');
      }
   }
}

export const aiService = new AIService(); 