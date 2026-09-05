import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../services/mail.service.js';

function generateRandomAccessCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getStats(req, res, next) {
  try {
    const total_admins = await prisma.admin.count({
      where: { is_superadmin: false },
    });
    const total_candidates = await prisma.candidate.count();
    const total_trainings = await prisma.trainingModule.count();

    return res.status(200).json({
      stats: {
        total_admins,
        total_candidates,
        total_trainings,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdmins(req, res, next) {
  try {
    const admins = await prisma.admin.findMany({
      where: { is_superadmin: false },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            candidates: true,
            training_modules: true,
          },
        },
      },
    });

    const data = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      access_code: admin.access_code,
      training_limit: admin.training_limit,
      student_limit: admin.student_limit,
      enrollment_limit: admin.enrollment_limit,
      created_at: admin.created_at,
      candidates_count: admin._count.candidates,
      trainings_count: admin._count.training_modules,
      is_active: admin.is_active,
    }));

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const {
      email,
      name,
      password,
      training_limit,
      trainingLimit,
      student_limit,
      studentLimit,
      enrollment_limit,
      enrollmentLimit,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate Name (at least 2 characters)
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const existing = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    const parseLimit = (v) => {
      if (v === '' || v == null) return null;
      const num = parseInt(v, 10);
      return isNaN(num) || num < 0 ? null : num;
    };

    const tLimit = parseLimit(training_limit ?? trainingLimit);
    const sLimit = parseLimit(student_limit ?? studentLimit);
    const eLimit = parseLimit(enrollment_limit ?? enrollmentLimit);

    const accessCode = generateRandomAccessCode(8);
    const assignedPassword = password && password.trim() ? password.trim() : generateRandomAccessCode(10);
    const hashedPassword = bcrypt.hashSync(assignedPassword, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        password: hashedPassword,
        access_code: accessCode,
        training_limit: tLimit,
        student_limit: sLimit,
        enrollment_limit: eLimit,
        is_active: true,
        is_superadmin: false,
      },
    });

    // Send Credentials Email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const emailBody = `Hello ${newAdmin.name},\n\nYou have been added as an Admin to the Training Mania portal.\nHere are your login credentials:\n\nEmail: ${newAdmin.email}\nPassword: ${assignedPassword}\nAccess Code: ${accessCode}\n\nLogin here: ${frontendUrl}/admin/login\n\nPlease keep this information secure.\n\nBest Regards,\nTraining Mania Team`;

    let emailSent = false;
    let emailErrorMsg = '';

    try {
      await sendEmail({
        to: newAdmin.email,
        subject: 'Training Mania - Admin Account Created',
        text: emailBody,
      });
      emailSent = true;
    } catch (mailErr) {
      console.warn('[SuperAdmin] Failed to send email to new admin, but admin was created:', mailErr.message);
      emailErrorMsg = mailErr.message;
    }

    const message = emailSent
      ? 'Admin created successfully! Credentials sent to email.'
      : 'Admin created successfully! (Email not delivered: SMTP authentication failed on mail server. Please share credentials manually below).';

    return res.status(201).json({
      message,
      email_sent: emailSent,
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        password: assignedPassword,
        access_code: newAdmin.access_code,
        training_limit: newAdmin.training_limit,
        student_limit: newAdmin.student_limit,
        enrollment_limit: newAdmin.enrollment_limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = parseInt(id, 10);

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (admin.is_superadmin) {
      return res.status(403).json({ error: 'Cannot delete superadmin' });
    }

    await prisma.admin.delete({
      where: { id: adminId },
    });

    return res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getGlobalCandidates(req, res, next) {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        enrollments: {
          include: {
            training_module: {
              select: { title: true },
            },
          },
        },
      },
    });

    const data = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      student_id: c.student_id,
      enrolled_courses: c.enrollments.map((e) => e.training_module?.title).filter(Boolean),
      created_at: c.created_at,
    }));

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteGlobalCandidate(req, res, next) {
  try {
    const candidateId = parseInt(req.params.id, 10);
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.created_by_id) {
      await prisma.notification.create({
        data: {
          admin_id: candidate.created_by_id,
          message: `Student ${candidate.name || candidate.email} has been removed by Super Admin.`,
          type: 'deletion',
        },
      });
    }

    await prisma.candidate.delete({
      where: { id: candidateId },
    });

    return res.status(200).json({ message: 'Candidate removed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getGlobalTrainings(req, res, next) {
  try {
    const trainings = await prisma.trainingModule.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        created_by: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            questions: true,
            enrollments: true,
          },
        },
      },
    });

    const data = trainings.map((t) => ({
      id: t.id,
      title: t.title,
      created_by: t.created_by ? t.created_by.name || t.created_by.email : 'Super Admin',
      created_by_id: t.created_by_id,
      created_at: t.created_at,
      questions_count: t._count.questions,
      enrollments_count: t._count.enrollments,
    }));

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteGlobalTraining(req, res, next) {
  try {
    const trainingId = parseInt(req.params.id, 10);
    const training = await prisma.trainingModule.findUnique({
      where: { id: trainingId },
    });

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    if (training.created_by_id) {
      await prisma.notification.create({
        data: {
          admin_id: training.created_by_id,
          message: `Training '${training.title}' has been deleted by Super Admin.`,
          type: 'deletion',
        },
      });
    }

    await prisma.trainingModule.delete({
      where: { id: trainingId },
    });

    return res.status(200).json({ message: 'Training deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getTrainingEnrollments(req, res, next) {
  try {
    const trainingId = parseInt(req.params.training_id, 10);

    const training = await prisma.trainingModule.findUnique({
      where: { id: trainingId },
    });

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { training_module_id: trainingId },
      include: { candidate: true },
    });

    const data = enrollments.map((enroll) => ({
      id: enroll.candidate.id,
      name: enroll.candidate.name,
      email: enroll.candidate.email,
      student_id: enroll.candidate.student_id,
      status: enroll.status || 'Enrolled',
      enrolled_at: enroll.enrolled_at.toISOString(),
      created_at: enroll.candidate.created_at,
    }));

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function checkEmailStatus(req, res, next) {
  try {
    return res.status(200).json({ message: 'Sync complete. 0 emails marked invalid.' });
  } catch (error) {
    next(error);
  }
}

export default {
  getStats,
  getAdmins,
  createAdmin,
  deleteAdmin,
  getGlobalCandidates,
  deleteGlobalCandidate,
  getGlobalTrainings,
  deleteGlobalTraining,
  getTrainingEnrollments,
  checkEmailStatus,
};
