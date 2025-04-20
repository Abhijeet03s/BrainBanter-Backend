import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from '@/config/swagger';

export const setupSwagger = (app: Application): void => {
   // Serve Swagger documentation
   app.use('/api-docs', swaggerUi.serve);
   app.get('/api-docs', swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'BrainBanter API Documentation',
   }));

   // Serve Swagger spec as JSON
   app.get('/api-docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
   });
}; 