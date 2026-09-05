import { ZodError } from 'zod';
import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error('[ErrorMiddleware] Uncaught Exception:', err);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const errorMessage = firstIssue
      ? `${firstIssue.path.join('.') || 'payload'}: ${firstIssue.message}`
      : 'Validation failed';

    return res.status(400).json({
      error: errorMessage,
      details: err.flatten().fieldErrors,
    });
  }

  // 2. Multer File Upload Error
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size limit exceeded. Max 50MB for video/PDF, 10MB for images.',
      });
    }
    return res.status(400).json({
      error: `File upload error: ${err.message}`,
    });
  }

  // 3. Prisma Known Request Error
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      return res.status(400).json({
        error: `A record with this ${target} already exists.`,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Requested record was not found.',
      });
    }
  }

  // 4. Standard App Errors
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

export default errorHandler;
