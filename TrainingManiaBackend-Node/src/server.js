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
