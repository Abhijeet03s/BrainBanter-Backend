import swaggerJsdoc from 'swagger-jsdoc';

const API_VERSION = '1.0.0';

const options: swaggerJsdoc.Options = {
   definition: {
      openapi: '3.0.0',
      info: {
         title: 'BrainBanter API Documentation',
         version: API_VERSION,
         description: 'API documentation for the BrainBanter debate platform',
         license: {
            name: 'ISC',
         },
      },
      servers: [
         {
            url: process.env.NODE_ENV === 'production'
               ? 'https://api.brainbanter.io'
               : 'http://localhost:8000',
            description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
         },
      ],
      components: {
         securitySchemes: {
            bearerAuth: {
               type: 'http',
               scheme: 'bearer',
               bearerFormat: 'JWT',
            },
         },
         schemas: {
            Error: {
               type: 'object',
               properties: {
                  success: {
                     type: 'boolean',
                     example: false,
                  },
                  message: {
                     type: 'string',
                     example: 'Error message',
                  },
                  stack: {
                     type: 'string',
                     example: 'Error stack trace',
                  },
                  details: {
                     type: 'object',
                     example: { requestId: '123-456-789' },
                  },
               },
            },
            DebateSession: {
               type: 'object',
               properties: {
                  id: {
                     type: 'string',
                     example: '123e4567-e89b-12d3-a456-426614174000',
                  },
                  userId: {
                     type: 'string',
                     example: '123e4567-e89b-12d3-a456-426614174001',
                  },
                  title: {
                     type: 'string',
                     example: 'Benefits of renewable energy',
                  },
                  mode: {
                     type: 'string',
                     enum: ['creative', 'precise', 'balanced'],
                     example: 'balanced',
                  },
                  status: {
                     type: 'string',
                     enum: ['active', 'completed', 'archived'],
                     example: 'active',
                  },
                  createdAt: {
                     type: 'string',
                     format: 'date-time',
                     example: '2023-01-01T00:00:00Z',
                  },
                  updatedAt: {
                     type: 'string',
                     format: 'date-time',
                     example: '2023-01-01T01:00:00Z',
                  },
               },
            },
            Message: {
               type: 'object',
               properties: {
                  id: {
                     type: 'string',
                     example: '123e4567-e89b-12d3-a456-426614174002',
                  },
                  debateSessionId: {
                     type: 'string',
                     example: '123e4567-e89b-12d3-a456-426614174000',
                  },
                  sender: {
                     type: 'string',
                     enum: ['user', 'ai'],
                     example: 'user',
                  },
                  content: {
                     type: 'string',
                     example: 'What are your thoughts on renewable energy?',
                  },
                  createdAt: {
                     type: 'string',
                     format: 'date-time',
                     example: '2023-01-01T00:00:00Z',
                  },
               },
            },
            SavedDebate: {
               type: 'object',
               properties: {
                  id: {
                     type: 'string',
                     example: '123e4567-e89b-12d3-a456-426614174003',
                  },
                  userId: {
                     type: 'string',
                     example: '123e4567-e89b-12d3-a456-426614174001',
                  },
                  debateSessionId: {
                     type: 'string',
                     example: '123e4567-e89b-12d3-a456-426614174000',
                  },
                  createdAt: {
                     type: 'string',
                     format: 'date-time',
                     example: '2023-01-01T00:00:00Z',
                  },
               },
            },
         },
      },
      security: [
         {
            bearerAuth: [],
         },
      ],
   },
   apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(options); 