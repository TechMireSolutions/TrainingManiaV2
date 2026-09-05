import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { getAdminContext } from './middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mediaRoot = path.resolve(__dirname, '../media');

const app = express();

// Allowed origins configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost', 'http://localhost:80'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV !== 'production' ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        !process.env.ALLOWED_ORIGINS
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-ID'],
  })
);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Media Serving matching MEDIA_URL = '/media/'
app.use('/media', express.static(mediaRoot));

// Admin context middleware
app.use(getAdminContext);

// API Routes mounted under /api
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Training Mania Node.js API is operational',
    version: '1.0.0',
  });
});

// Serve frontend build if available (Unified full-stack container on Render/Docker)
const candidateDistDirs = [
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, '../../TrainingManiafrontend/dist'),
];

const clientDist = candidateDistDirs.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (clientDist) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/media')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Root fallback if no frontend dist is present
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Training Mania Node.js API is operational',
      version: '1.0.0',
    });
  });
}

// Central Error Handler
app.use(errorHandler);

export default app;
