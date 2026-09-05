import prisma from '../config/db.js';
import jwt from 'jsonwebtoken';

/**
 * Middleware to extract admin from X-Admin-ID header or Bearer token
 */
export async function getAdminContext(req, res, next) {
  try {
    const adminIdHeader = req.headers['x-admin-id'];
    const authHeader = req.headers['authorization'];

    let adminId = null;

    if (adminIdHeader) {
      adminId = parseInt(adminIdHeader, 10);
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'trainingmania_secret_jwt_token_key_2026');
        if (decoded && decoded.id) {
          adminId = decoded.id;
        }
      } catch (err) {
        // Token invalid, proceed with null
      }
    }

    if (adminId && !isNaN(adminId)) {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });
      if (admin) {
        req.admin = admin;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to generate JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET || 'trainingmania_secret_jwt_token_key_2026', {
    expiresIn,
  });
}

export default {
  getAdminContext,
  generateToken,
};
