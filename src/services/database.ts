import { PrismaClient } from '@prisma/client';

// Connection pooling configuration
const prisma = new PrismaClient({
   log: ['query', 'info', 'warn', 'error'],
   datasources: {
      db: {
         url: process.env.DATABASE_URL,
      },
   }
});

// Handle connection cleanup on application shutdown
process.on('beforeExit', async () => {
   await prisma.$disconnect();
});

export default prisma; 