import { PrismaClient } from '@prisma/client';

const isDev = process.env.NODE_ENV === 'development';

const prisma = new PrismaClient({
  log: isDev
    ? [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ]
    : [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
});

export default prisma;
