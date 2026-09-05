import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('[Database] Connected to database successfully via Prisma.');

    // Auto-seed initial administrator and production courses if database is empty
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      console.log('[Database] Fresh database detected. Auto-seeding default administrator and training modules...');
      try {
        const { seedCleanData } = await import('../seed-production-data.js');
        await seedCleanData();
        console.log('[Database] Default administrator created: admin@trainingmania.com (Password: tms12345)');
      } catch (seedError) {
        console.warn('[Database] Auto-seed note:', seedError.message);
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`[Server] Training Mania Node.js API running on http://localhost:${PORT}`);
      console.log(`[Server] Healthcheck: http://localhost:${PORT}/`);
      console.log(`[Server] Static media served at http://localhost:${PORT}/media/`);
    });

    const shutdown = async () => {
      console.log('[Server] Gracefully shutting down...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('[Database] Disconnected.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
