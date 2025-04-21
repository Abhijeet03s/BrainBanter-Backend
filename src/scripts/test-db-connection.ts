import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new Prisma client
const prisma = new PrismaClient();

async function main() {
   try {
      // Test connection by querying the database version
      const result = await prisma.$queryRaw`SELECT version()`;
      console.log('Successfully connected to the database!');
      console.log('Database version:', result);

      // Count users (this will fail if tables don't exist)
      const userCount = await prisma.user.count();
      console.log(`Number of users in the database: ${userCount}`);

      return { success: true };
   } catch (error) {
      console.error('Failed to connect to the database:');
      console.error(error);
      return { success: false, error };
   } finally {
      await prisma.$disconnect();
   }
}

main()
   .then((result) => {
      if (result.success) {
         console.log('Database connection test completed successfully!');
      } else {
         console.log('Database connection test failed.');
         process.exit(1);
      }
   })
   .catch((e) => {
      console.error(e);
      process.exit(1);
   }); 