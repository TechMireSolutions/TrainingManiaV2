import prisma from '../config/db.js';
import path from 'path';
import { sendEmail } from '../services/mail.service.js';
import { extractTextFromPdf, extractTextFromYoutube } from '../services/extractor.service.js';

function generateRandomString(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return 'just now';
}

function formatReportDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper to serialize training module matching Django
export function serializeTrainingModule(module) {
  const pdfFileUrl = module.pdf_file ? (module.pdf_file.startsWith('http') || module.pdf_file.startsWith('/') ? module.pdf_file : `/media/${module.pdf_file}`) : '';
  const videoFileUrl = module.video_file ? (module.video_file.startsWith('http') || module.video_file.startsWith('/') ? module.video_file : `/media/${module.video_file}`) : '';
  const thumbnailUrl = module.thumbnail ? (module.thumbnail.startsWith('http') || module.thumbnail.startsWith('/') ? module.thumbnail : `/media/${module.thumbnail}`) : '';

  const duration = module.test_configuration ? `${module.test_configuration.duration_minutes} mins` : 'N/A';
  const enrollmentCount = module._count ? module._count.enrollments : (module.enrollments ? module.enrollments.length : 0);

  return {
    id: module.id,
    title: module.title,
    unique_code: module.unique_code,
    description: module.description || '',
    pdf_file: pdfFileUrl,
    video_type: module.video_type,
    video_url: module.video_url || '',
    video_file: videoFileUrl,
    thumbnail: thumbnailUrl,
    created_at: module.created_at,
    enrollment_count: enrollmentCount,
    duration,
    test_configuration: module.test_configuration || null,
    questions: (module.questions || []).map((q) => ({
      id: q.id,
      text: q.text,
      question_type: q.question_type,
      choices: (q.choices || []).map((c) => ({
        id: c.id,
        text: c.text,
        is_correct: c.is_correct,
      })),
    })),
  };
}

// ==================== TRAINING MODULE CREATION ====================

export async function createTrainingModule(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;
    const { title, video_type, video_url, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Training title is required' });
    }

    // Check duplicate title for this admin
    if (adminId) {
      const existing = await prisma.trainingModule.findFirst({
        where: {
          created_by_id: adminId,
          title: title.trim(),
        },
      });
      if (existing) {
        return res.status(400).json({
          error: `A training module with the title '${title.trim()}' already exists. Please delete the existing one or choose a different title.`,
        });
      }
    }

    // Parse test_configuration & questions
    let testConfigData = {};
    let questionsData = [];

    try {
      if (req.body.test_configuration) {
        testConfigData = typeof req.body.test_configuration === 'string'
          ? JSON.parse(req.body.test_configuration)
          : req.body.test_configuration;
      }
      if (req.body.questions) {
        questionsData = typeof req.body.questions === 'string'
          ? JSON.parse(req.body.questions)
          : req.body.questions;
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON format for configuration or questions' });
    }

    // Process files
    let pdfPath = null;
    let videoFilePath = null;
    let thumbnailPath = null;
    let fullPdfPath = null;

    if (req.files) {
      if (req.files.pdf_file && req.files.pdf_file[0]) {
        pdfPath = `training_pdfs/${req.files.pdf_file[0].filename}`;
        fullPdfPath = req.files.pdf_file[0].path;
      }
      if (req.files.video_file && req.files.video_file[0]) {
        videoFilePath = `training_videos/${req.files.video_file[0].filename}`;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        thumbnailPath = `training_thumbnails/${req.files.thumbnail[0].filename}`;
      }
    }

    // Unique Code generation (TRN-XXXXXX)
    let uniqueCode = '';
    while (true) {
      uniqueCode = 'TRN-' + generateRandomString(6);
      const codeExists = await prisma.trainingModule.findUnique({
        where: { unique_code: uniqueCode },
      });
      if (!codeExists) break;
    }

    // Extract text from PDF & YouTube (Replacing Django Signals)
    let extractedText = '';

    if (video_type === 'youtube' && video_url) {
      try {
        const transcript = await extractTextFromYoutube(video_url);
        if (transcript) {
          extractedText += `\n\n--- VIDEO TRANSCRIPT ---\n${transcript}`;
        }
      } catch (err) {
        console.warn('[CreateTraining] Transcript extraction failed:', err.message);
      }
    }

    if (fullPdfPath) {
      try {
        const pdfText = await extractTextFromPdf(fullPdfPath);
        if (pdfText) {
          extractedText += `\n\n--- PDF CONTENT ---\n${pdfText}`;
        }
      } catch (err) {
        console.warn('[CreateTraining] PDF text extraction failed:', err.message);
      }
    }

    // Create module and nested relations in transaction
    const trainingModule = await prisma.$transaction(async (tx) => {
      const module = await tx.trainingModule.create({
        data: {
          title: title.trim(),
          description: description || '',
          unique_code: uniqueCode,
          video_type: video_type || 'youtube',
          video_url: video_url || '',
          pdf_file: pdfPath,
          video_file: videoFilePath,
          thumbnail: thumbnailPath,
          extracted_text: extractedText,
          created_by_id: adminId || null,
        },
      });

      // Create test configuration
      await tx.testConfiguration.create({
        data: {
          training_module_id: module.id,
          total_questions: parseInt(testConfigData.total_questions, 10) || 20,
          mcq_percentage: parseInt(testConfigData.mcq_percentage, 10) || 100,
          fib_percentage: parseInt(testConfigData.fib_percentage, 10) || 0,
          short_answer_percentage: parseInt(testConfigData.short_answer_percentage, 10) || 0,
          total_marks: parseInt(testConfigData.total_marks, 10) || 100,
          passing_marks: parseInt(testConfigData.passing_marks, 10) || 40,
          duration_minutes: parseInt(testConfigData.duration_minutes, 10) || 20,
          attempts_allowed: parseInt(testConfigData.attempts_allowed, 10) || 3,
          is_negative_marking: Boolean(testConfigData.is_negative_marking),
          negative_marking_value: parseFloat(testConfigData.negative_marking_value) || 0.0,
          requires_verification: Boolean(testConfigData.requires_verification),
          no_copy_paste: Boolean(testConfigData.no_copy_paste),
          no_tab_switch: Boolean(testConfigData.no_tab_switch),
          no_screenshot: Boolean(testConfigData.no_screenshot),
          exam_instructions: testConfigData.exam_instructions || '',
        },
      });

      // Create questions & choices
      for (const q of questionsData) {
        const question = await tx.question.create({
          data: {
            training_module_id: module.id,
            text: q.text || q.question || '',
            question_type: q.question_type || q.type || 'mcq',
          },
        });

        if (Array.isArray(q.choices)) {
          for (const c of q.choices) {
            await tx.choice.create({
              data: {
                question_id: question.id,
                text: c.text || '',
                is_correct: Boolean(c.is_correct),
              },
            });
          }
        }
      }

      return module;
    });

    // Fetch full module with relations for exact response
    const fullModule = await prisma.trainingModule.findUnique({
      where: { id: trainingModule.id },
      include: {
        test_configuration: true,
        questions: {
          include: { choices: true },
        },
        _count: { select: { enrollments: true } },
      },
    });

    return res.status(201).json(serializeTrainingModule(fullModule));
  } catch (error) {
    next(error);
  }
}

// ==================== CANDIDATE MANAGEMENT ====================

export async function getCandidates(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;
    const query = req.query.search || '';

    const where = {};
    if (adminId) {
      where.created_by_id = adminId;
    }
    if (query) {
      where.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
        { access_code: { contains: query } },
      ];
    }

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const data = candidates.map((c) => ({
      id: c.id,
      email: c.email,
      name: c.name,
      code: c.access_code,
      date: c.created_at.toISOString().split('T')[0],
      method: c.method,
      is_active: c.is_active,
    }));

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function createCandidate(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;
    const candidatesToProcess = Array.isArray(req.body) ? req.body : [req.body];
    const createdList = [];
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    for (const item of candidatesToProcess) {
      const email = item.email ? item.email.toLowerCase().trim() : '';
      const name = item.name ? item.name.trim() : '';

      if (!email) continue;

      const existing = await prisma.candidate.findUnique({
        where: { email },
      });

      if (existing) {
        if (!Array.isArray(req.body)) {
          return res.status(400).json({ error: 'Candidate already exists' });
        }
        continue;
      }

      const code = generateRandomString(6);
      const candidate = await prisma.candidate.create({
        data: {
          email,
          name: name || '',
          access_code: code,
          method: 'Manual',
          is_active: true,
          created_by_id: adminId || null,
        },
      });

      // Send Access Code Email
      const emailMessage = `Hello,\n\nYou have been added as a candidate to the Training Mania portal.\nHere are your login details:\n\nEmail: ${email}\nAccess Code: ${code}\n\nLogin here: ${frontendUrl}/candidate/login\n\nPlease go to the portal, enter your email and this access code to set your password and log in.\n\nBest Regards,\nTraining Mania Team`;

      try {
        await sendEmail({
          to: email,
          subject: 'Welcome to Training Mania - Your Access Code',
          text: emailMessage,
        });
      } catch (err) {
        console.warn(`[CreateCandidate] Email send failed for ${email}, candidate created:`, err.message);
      }

      createdList.push({
        id: candidate.id,
        email: candidate.email,
        name: candidate.name,
        code: candidate.access_code,
        date: 'Just now',
        method: 'Manual',
      });
    }

    if (Array.isArray(req.body)) {
      return res.status(201).json({
        message: `Processed ${createdList.length} candidates successfully.`,
        candidates: createdList,
      });
    }

    if (createdList.length === 0) {
      return res.status(400).json({ error: 'Failed to create candidate' });
    }

    return res.status(201).json({
      message: 'Candidate created successfully. Email sent.',
      candidate: createdList[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCandidate(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;
    const { id } = req.params;

    if (id) {
      const candidateId = parseInt(id, 10);
      await prisma.candidate.delete({
        where: { id: candidateId },
      });
      return res.status(200).json({ message: 'Candidate deleted' });
    }

    if (req.query.delete_all === 'true') {
      const where = adminId ? { created_by_id: adminId } : {};
      const { count } = await prisma.candidate.deleteMany({ where });
      return res.status(200).json({ message: `Deleted ${count} candidates` });
    }

    return res.status(400).json({ error: 'Candidate ID required' });
  } catch (error) {
    next(error);
  }
}

// ==================== TRAINING LISTING & REMOVAL ====================

export async function getTrainings(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;
    const where = adminId ? { created_by_id: adminId } : {};

    const trainings = await prisma.trainingModule.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        test_configuration: true,
        questions: {
          include: { choices: true },
        },
        _count: { select: { enrollments: true } },
      },
    });

    const data = trainings.map(serializeTrainingModule);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteTraining(req, res, next) {
  try {
    const trainingId = parseInt(req.params.id, 10);
    await prisma.trainingModule.delete({
      where: { id: trainingId },
    });
    return res.status(200).json({ message: 'Training deleted' });
  } catch (error) {
    next(error);
  }
}

// ==================== ENROLLMENTS ====================

export async function getEnrollments(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;
    const query = req.query.search || '';

    const where = {};
    if (adminId) {
      where.candidate = { created_by_id: adminId };
    }
    if (query) {
      where.OR = [
        { candidate: { email: { contains: query } } },
        { candidate: { name: { contains: query } } },
        { training_module: { title: { contains: query } } },
      ];
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { enrolled_at: 'desc' },
      include: {
        candidate: true,
        training_module: true,
      },
    });

    const data = enrollments.map((e) => ({
      id: e.id,
      candidate: e.candidate.email,
      training: e.training_module.title,
      date: formatReportDate(e.enrolled_at),
      status: e.status,
    }));

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function createEnrollment(req, res, next) {
  try {
    const { candidate_email, training_id } = req.body;
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;

    if (!candidate_email || !training_id) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const candidateWhere = { email: candidate_email.toLowerCase().trim() };
    if (adminId) {
      candidateWhere.created_by_id = adminId;
    }

    const candidate = await prisma.candidate.findFirst({
      where: candidateWhere,
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const trainingIdInt = parseInt(training_id, 10);
    const training = await prisma.trainingModule.findUnique({
      where: { id: trainingIdInt },
    });

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    const existing = await prisma.enrollment.findFirst({
      where: {
        candidate_id: candidate.id,
        training_module_id: trainingIdInt,
      },
    });

    if (existing) {
      return res.status(200).json({ message: 'Already enrolled' });
    }

    await prisma.enrollment.create({
      data: {
        candidate_id: candidate.id,
        training_module_id: trainingIdInt,
        status: 'Enrolled',
      },
    });

    return res.status(201).json({ message: 'Enrolled successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateEnrollment(req, res, next) {
  try {
    const { id, status: statusVal } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Enrollment ID required' });
    }

    const enrollmentId = parseInt(id, 10);
    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        ...(statusVal ? { status: statusVal } : {}),
      },
    });

    return res.status(200).json({ message: 'Enrollment updated' });
  } catch (error) {
    next(error);
  }
}

export async function deleteEnrollment(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;
    const { id } = req.params;

    if (id) {
      const enrollmentId = parseInt(id, 10);
      await prisma.enrollment.delete({
        where: { id: enrollmentId },
      });
      return res.status(200).json({ message: 'Enrollment deleted' });
    }

    if (req.query.delete_all === 'true') {
      const where = adminId ? { candidate: { created_by_id: adminId } } : {};
      const { count } = await prisma.enrollment.deleteMany({ where });
      return res.status(200).json({ message: `Deleted ${count} enrollments` });
    }

    return res.status(400).json({ error: 'Enrollment ID required' });
  } catch (error) {
    next(error);
  }
}

// ==================== REPORTS & METRICS ====================

export async function getReports(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;
    const searchQuery = (req.query.search || '').toLowerCase();
    const statusFilter = (req.query.status || '').toLowerCase();

    const where = {};
    if (adminId) {
      where.candidate = { created_by_id: adminId };
    }
    if (statusFilter === 'passed') {
      where.is_passed = true;
    } else if (statusFilter === 'failed') {
      where.is_passed = false;
    }
    if (searchQuery) {
      where.OR = [
        { candidate: { email: { contains: searchQuery } } },
        { candidate: { name: { contains: searchQuery } } },
        { training_module: { title: { contains: searchQuery } } },
      ];
    }

    const results = await prisma.testResult.findMany({
      where,
      orderBy: { date_taken: 'desc' },
      include: {
        candidate: true,
        training_module: {
          include: { test_configuration: true },
        },
      },
    });

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    const data = results.map((result) => {
      const totalQuestions = result.correct_count + result.incorrect_count;
      const expectedTotal = result.training_module.test_configuration?.total_questions || 20;
      const skipped = Math.max(0, expectedTotal - totalQuestions);

      const verificationUrl = result.verification_image
        ? `${baseUrl}/media/${result.verification_image}`
        : null;
      const nicUrl = result.nic_image
        ? `${baseUrl}/media/${result.nic_image}`
        : null;

      return {
        id: result.id,
        candidate: result.candidate.email,
        candidateName: result.candidate.name || result.candidate.email.split('@')[0],
        training: result.training_module.title,
        unique_code: result.training_module.unique_code,
        score: result.score,
        totalMarks: result.total_marks,
        correct: result.correct_count,
        wrong: result.incorrect_count,
        skipped,
        status: result.is_passed ? 'Passed' : 'Failed',
        date: formatReportDate(result.date_taken),
        dateTime: result.date_taken.toISOString(),
        is_verified: result.is_verified,
        verification_image: verificationUrl,
        nic_image: nicUrl,
        certificate_downloaded: result.candidate.certificate_downloaded,
      };
    });

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteReports(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;

    if (req.query.delete_all === 'true') {
      const where = adminId ? { candidate: { created_by_id: adminId } } : {};
      const { count } = await prisma.testResult.deleteMany({ where });
      return res.status(200).json({ message: `Deleted ${count} reports` });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    next(error);
  }
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications(req, res, next) {
  try {
    const adminId = req.headers['x-admin-id'] ? parseInt(req.headers['x-admin-id'], 10) : null;

    if (!adminId) {
      return res.status(200).json([]);
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Please register yourself first' });
    }

    // 1. Persistent Notifications
    const persistent = await prisma.notification.findMany({
      where: { admin_id: adminId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    const notifications = persistent.map((n) => ({
      id: `p-${n.id}`,
      text: n.message,
      time: timeSince(n.created_at),
      timestamp: n.created_at,
      type: n.type,
    }));

    // 2. Recent Course Activity (Dynamic)
    const recentTrainings = await prisma.trainingModule.findMany({
      where: { created_by_id: adminId },
      orderBy: { updated_at: 'desc' },
      take: 5,
    });

    for (const t of recentTrainings) {
      const delta = (t.updated_at - t.created_at) / 1000;
      if (delta < 60) {
        notifications.push({
          id: `t-create-${t.id}`,
          text: `New course '${t.title}' created`,
          time: timeSince(t.created_at),
          timestamp: t.created_at,
          type: 'course',
        });
      } else {
        notifications.push({
          id: `t-update-${t.id}-${t.updated_at.getTime()}`,
          text: `Course '${t.title}' updated`,
          time: timeSince(t.updated_at),
          timestamp: t.updated_at,
          type: 'course_update',
        });
      }
    }

    // 3. New Enrollments (Dynamic)
    const recentEnrollments = await prisma.enrollment.findMany({
      where: { training_module: { created_by_id: adminId } },
      orderBy: { enrolled_at: 'desc' },
      take: 5,
      include: {
        candidate: true,
        training_module: true,
      },
    });

    for (const e of recentEnrollments) {
      notifications.push({
        id: `e-${e.id}`,
        text: `New student ${e.candidate.name || e.candidate.email} enrolled in '${e.training_module.title}'`,
        time: timeSince(e.enrolled_at),
        timestamp: e.enrolled_at,
        type: 'enrollment',
      });
    }

    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json(notifications.slice(0, 15));
  } catch (error) {
    next(error);
  }
}

export default {
  createTrainingModule,
  getCandidates,
  createCandidate,
  deleteCandidate,
  getTrainings,
  deleteTraining,
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getReports,
  deleteReports,
  getNotifications,
};
