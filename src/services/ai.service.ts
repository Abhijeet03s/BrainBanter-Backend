import dotenv from 'dotenv';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { getSystemPrompt, getSentimentAnalysisPrompt } from '@/config/prompts';
import { logger } from '@/utils/logger';
import { cacheService } from '@/services/cache.service';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
   logger.error('GEMINI_API_KEY is not defined in environment variables');
}

class AIService {
   private model: GenerativeModel;

   constructor() {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-pro' });
      logger.info('AI service initialized with Gemini 2.0 Pro model');
   }

   // Helper to create cache key for AI responses
   private createCacheKey(prompt: string, history: any[], options?: any): string {
      return cacheService.createKey(
         'ai_response',
         prompt,
         history.length > 0 ? history.map(msg => `${msg.sender}:${msg.content.substring(0, 100)}`).join('|') : 'no_history',
         options?.stance || 'neutral',
         options?.depth || 'deep'
      );
   }

   // Helper to create cache key for sentiment analysis
   private createSentimentCacheKey(message: string, history: any[]): string {
      return cacheService.createKey(
         'sentiment',
         message,
         history.length > 0 ? history.slice(-3).map(msg => `${msg.sender}:${msg.content.substring(0, 100)}`).join('|') : 'no_history'
      );
   }

   private cleanFormattedResponse(response: string): string {
      // First handle bullet points with asterisks (like in your example)
      let cleaned = response.replace(/^\s*\*\s+/gm, '• '); // Convert asterisk bullets to proper bullet points

      // Remove header-style formatting (like **Header:** or ***Header:***)
      cleaned = cleaned.replace(/\*{2,3}([^*]+?):?\*{2,3}/g, '$1');

      // Remove standalone headers or section titles
      cleaned = cleaned.replace(/^([A-Za-z\s]+):\s*$/gm, '$1');

      // Convert remaining asterisks to proper formatting
      // First handle bold (double asterisks)
      cleaned = cleaned.replace(/\*\*([^*]+?)\*\*/g, '$1');

      // Then handle italics (single asterisks)
      cleaned = cleaned.replace(/\*([^*]+?)\*/g, '$1');

      // Replace numbered list patterns
      cleaned = cleaned.replace(/^\s*[\d]+\.\s+/gm, '');

      // Replace dash bullet points
      cleaned = cleaned.replace(/^\s*-\s+/gm, '');

      // Clean up extra newlines from the removals
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

      // Remove any other markdown-style formatting that might appear
      cleaned = cleaned
         .replace(/^#+\s+/gm, '') // Remove heading markers
         .replace(/^>\s+/gm, '')  // Remove blockquote markers

      return cleaned;
   }

   async generateDebateResponse(prompt: string, history: any[] = [], options?: {
      stance?: 'supportive' | 'challenging' | 'neutral',
      depth?: 'surface' | 'deep' | 'expert'
   }): Promise<string> {
      try {
         // Create a cache key for this specific request
         const cacheKey = this.createCacheKey(prompt, history, options);

         // Check if we have a cached response
         const cachedResponse = cacheService.get<string>(cacheKey);
         if (cachedResponse) {
            logger.info('Using cached AI response', {
               promptLength: prompt.length,
               historyLength: history.length,
               stance: options?.stance || 'neutral'
            });
            return cachedResponse;
         }

         // Configure the model parameters for debate-style responses
         const generationConfig = {
            temperature: options?.stance === 'challenging' ? 0.8 : 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 800,
         };

         logger.debug('Generating AI response', {
            stance: options?.stance || 'neutral',
            depth: options?.depth || 'deep',
            historyLength: history.length
         });

         // Format history for the chat model
         const formattedHistory = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
         }));

         // Get system prompt from the prompts configuration
         const systemPrompt = getSystemPrompt(
            options?.stance || 'neutral',
            options?.depth || 'deep'
         );

         // Create a chat session
         const chat = this.model.startChat({
            // Only include conversation history if there is any
            history: formattedHistory.length > 0 ? formattedHistory : undefined,
            generationConfig,
         });

         // For the first message, include system instructions in the prompt
         const fullPrompt = formattedHistory.length === 0
            ? `${systemPrompt}\n\nUser query: ${prompt}`
            : prompt;

         // Send the user's message and get the response
         const result = await chat.sendMessage(fullPrompt);
         let response = result.response.text();

         // Clean the response to remove any formatting
         response = this.cleanFormattedResponse(response);

         // Cache the response for future use (1 hour TTL)
         cacheService.set(cacheKey, response, 3600);

         logger.debug('AI response generated successfully', {
            responseLength: response.length,
            stance: options?.stance || 'neutral'
         });

         return response;
      } catch (error) {
         logger.error('Error generating AI response', { error });
         throw new Error('Failed to generate AI response');
      }
   }

   // Method to analyze sentiment and determine optimal stance
   async analyzeUserSentiment(message: string, history: any[] = []): Promise<{
      stance: 'supportive' | 'challenging' | 'neutral',
      depth: 'surface' | 'deep' | 'expert'
   }> {
      try {
         // Default settings
         let stance: 'supportive' | 'challenging' | 'neutral' = 'neutral';
         let depth: 'surface' | 'deep' | 'expert' = 'deep';

         logger.debug('Analyzing user sentiment', {
            messageLength: message.length,
            historyLength: history.length
         });

         // For very early conversations, use default challenging stance
         if (history.length < 3) {
            stance = 'challenging';
            logger.debug('Using default challenging stance for early conversation');
            return { stance, depth };
         }

         // Create cache key for sentiment analysis
         const cacheKey = this.createSentimentCacheKey(message, history);

         // Check if we have cached sentiment analysis
         const cachedAnalysis = cacheService.get<{ stance: any, depth: any }>(cacheKey);
         if (cachedAnalysis) {
            logger.info('Using cached sentiment analysis', {
               stance: cachedAnalysis.stance,
               depth: cachedAnalysis.depth
            });
            return cachedAnalysis;
         }

         // Get the sentiment analysis prompt from the prompts configuration
         const analysisPrompt = getSentimentAnalysisPrompt(history, message);

         const chat = this.model.startChat({
            generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
         });

         const result = await chat.sendMessage(analysisPrompt);
         const analysis = result.response.text();

         // Parse results
         const stanceMatch = analysis.match(/stance:\s*(supportive|challenging|neutral)/i);
         if (stanceMatch) stance = stanceMatch[1].toLowerCase() as any;

         const depthMatch = analysis.match(/depth:\s*(surface|deep|expert)/i);
         if (depthMatch) depth = depthMatch[1].toLowerCase() as any;

         // Cache the result for 30 minutes
         const analysisResult = { stance, depth };
         cacheService.set(cacheKey, analysisResult, 1800);

         logger.debug('Sentiment analysis complete', { stance, depth });
         return analysisResult;
      } catch (error) {
         logger.error('Error analyzing sentiment', { error });
         return { stance: 'neutral', depth: 'deep' };
      }
   }
}

// Export singleton instance
export const aiService = new AIService(); 