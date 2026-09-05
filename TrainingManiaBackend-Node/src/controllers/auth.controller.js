import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '../services/mail.service.js';
import { generateToken } from '../middlewares/auth.middleware.js';

function generateRandomPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

/**
 * Verifies password against bcrypt or legacy Django PBKDF2 SHA256
 */
export function verifyPassword(plainPassword, storedHash) {
  if (!storedHash || !plainPassword) return false;

  // 1. Standard bcrypt
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    return bcrypt.compareSync(plainPassword, storedHash);
  }

  // 2. Legacy Django PBKDF2 SHA-256
  if (storedHash.startsWith('pbkdf2_sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const expectedHash = parts[3];
      const derivedKey = crypto.pbkdf2Sync(plainPassword, salt, iterations, 32, 'sha256');
      return derivedKey.toString('base64') === expectedHash;
    }
  }

  // 3. Plain text fallback
  return plainPassword === storedHash;
}

// ==================== CANDIDATE AUTH ====================

export async function candidateLogin(req, res, next) {
  try {
    const { email, credential } = req.body;

    if (!email || !credential) {
      return res.status(400).json({ error: 'Email and credential are required' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: {
        email: { equals: email.trim() },
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Please register yourself first' });
    }

    if (!candidate.is_active) {
      return res.status(403).json({ error: 'Candidate account is deactivated' });
    }

    // First time login: Check Access Code
    if (!candidate.password) {
      if (candidate.access_code === credential) {
        return res.status(200).json({
          message: 'Access code verified',
          step: 'SET_PASSWORD',
          candidate: {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
          },
        });
      } else {
        return res.status(401).json({ error: 'Invalid Access Code' });
      }
    } else {
      // Subsequent login: Check Password with dual-algorithm support
      const isPasswordValid = verifyPassword(credential, candidate.password);
      const isAccessCodeValid = credential === candidate.access_code;
      const isValid = isPasswordValid || isAccessCodeValid;

      // Transparent upgrade to bcrypt if verified with legacy Django hash
      if (isPasswordValid && candidate.password.startsWith('pbkdf2_sha256$')) {
        const upgradedHash = await bcrypt.hash(credential, 10);
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: { password: upgradedHash },
        });
      }

      if (isValid) {
        return res.status(200).json({
          message: 'Login successful',
          step: 'DASHBOARD',
          candidate: {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
          },
        });
      } else {
        return res.status(401).json({ error: 'Invalid Password' });
      }
    }
  } catch (error) {
    next(error);
  }
}

export async function candidateSetPassword(req, res, next) {
  try {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { email: { equals: email.trim() } },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);

    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: 'Password set successfully',
      candidate: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function candidateForgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { email: { equals: email.trim() } },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Email not registered' });
    }

    const newPassword = generateRandomPassword(10);
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { password: hashedPassword },
    });

    try {
      await sendEmail({
        to: candidate.email,
        subject: 'Password Reset - Candidate Portal',
        text: `Hello ${candidate.name || 'Candidate'},\n\nYour password for the Training Mania Candidate Portal has been reset.\n\nNew Password: ${newPassword}\n\nPlease login and change it if desired.`,
      });
    } catch (err) {
      console.error('[CandidateForgotPassword] Email error:', err.message);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ message: 'New password sent to your email.' });
  } catch (error) {
    next(error);
  }
}

// ==================== ADMIN AUTH ====================

export async function adminRegister(req, res, next) {
  try {
    const { email, name, password, is_superadmin } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const admin = await prisma.admin.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        password: hashedPassword,
        is_superadmin: Boolean(is_superadmin),
        is_active: true,
      },
    });

    return res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        is_superadmin: admin.is_superadmin,
        is_active: admin.is_active,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const admin = await prisma.admin.findFirst({
      where: { email: { equals: cleanEmail } },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Please register yourself first' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Admin account is deactivated' });
    }

    const isPasswordValid =
      verifyPassword(password, admin.password) ||
      (admin.access_code && admin.access_code === password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Transparent upgrade to bcrypt if verified with legacy Django hash
    const lastLogin = new Date();
    let updateData = { last_login: lastLogin };
    if (admin.password && admin.password.startsWith('pbkdf2_sha256$')) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: updateData,
    });

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      is_superadmin: admin.is_superadmin,
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        is_superadmin: admin.is_superadmin,
        is_active: admin.is_active,
        last_login: lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminForgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const admin = await prisma.admin.findFirst({
      where: { email: { equals: cleanEmail } },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Email not registered' });
    }

    const newPassword = generateRandomPassword(10);
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    try {
      await sendEmail({
        to: admin.email,
        subject: 'Password Reset - Training Mania',
        text: `Hello ${admin.name},\n\nYour password has been reset.\n\nNew Password: ${newPassword}\n\nPlease login and change it immediately.`,
      });
    } catch (err) {
      console.error('[AdminForgotPassword] Email error:', err.message);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ message: 'New password sent to your email.' });
  } catch (error) {
    next(error);
  }
}

export default {
  candidateLogin,
  candidateSetPassword,
  candidateForgotPassword,
  adminRegister,
  adminLogin,
  adminForgotPassword,
};
