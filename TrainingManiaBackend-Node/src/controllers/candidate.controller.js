import prisma from '../config/db.js';
import { serializeTrainingModule } from './admin.controller.js';

export async function getCandidateDashboard(req, res, next) {
  try {
    const candidateId = parseInt(req.params.candidate_id, 10);

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return res.status(401).json({ error: 'Please register yourself first' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { candidate_id: candidateId },
      select: { training_module_id: true },
    });

    const enrolledTrainingIds = enrollments.map((e) => e.training_module_id);

    const trainings = await prisma.trainingModule.findMany({
      where: { id: { in: enrolledTrainingIds } },
      include: {
        test_configuration: true,
      },
    });

    const data = [];
    for (const t of trainings) {
      const lastResult = await prisma.testResult.findFirst({
        where: {
          candidate_id: candidateId,
          training_module_id: t.id,
        },
        orderBy: { date_taken: 'desc' },
      });

      const attemptsTaken = await prisma.testResult.count({
        where: {
          candidate_id: candidateId,
          training_module_id: t.id,
        },
      });

      const attemptsAllowed = t.test_configuration?.attempts_allowed || 3;

      let statusText = 'Enrolled';
      let score = 0;

      if (lastResult) {
        statusText = lastResult.is_passed ? 'Completed' : 'Failed';
        score = lastResult.score;
      }

      let parsedAnswers = null;
      if (lastResult && lastResult.user_answers) {
        try {
          parsedAnswers = typeof lastResult.user_answers === 'string'
            ? JSON.parse(lastResult.user_answers)
            : lastResult.user_answers;
        } catch (e) {
          parsedAnswers = null;
        }
      }

      data.push({
        id: t.id,
        trainingId: t.id,
        training: t.title,
        status: statusText,
        date: lastResult
          ? lastResult.date_taken.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        score,
        videoType: t.video_type,
        videoUrl: t.video_url || '',
        thumbnail: '',
        pdfFile: t.pdf_file || '',
        userAnswers: parsedAnswers,
        testDuration: t.test_configuration?.duration_minutes || 20,
        attemptsTaken,
        attemptsAllowed,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function getTrainingDetail(req, res, next) {
  try {
    const trainingId = parseInt(req.params.id, 10);

    const training = await prisma.trainingModule.findUnique({
      where: { id: trainingId },
      include: {
        test_configuration: true,
        questions: {
          include: { choices: true },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    return res.status(200).json(serializeTrainingModule(training));
  } catch (error) {
    next(error);
  }
}

export async function updateTrainingDetail(req, res, next) {
  try {
    const trainingId = parseInt(req.params.id, 10);
    const { title, video_type, video_url, description, test_configuration, questions } = req.body;

    const existing = await prisma.trainingModule.findUnique({
      where: { id: trainingId },
      include: { enrollments: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Training not found' });
    }

    if (existing.enrollments.length > 0) {
      return res.status(400).json({
        error: 'Cannot edit a training module that has enrolled candidates.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.trainingModule.update({
        where: { id: trainingId },
        data: {
          ...(title ? { title } : {}),
          ...(video_type ? { video_type } : {}),
          ...(video_url !== undefined ? { video_url } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      });

      if (test_configuration) {
        const conf = typeof test_configuration === 'string' ? JSON.parse(test_configuration) : test_configuration;
        await tx.testConfiguration.upsert({
          where: { training_module_id: trainingId },
          create: {
            training_module_id: trainingId,
            ...conf,
          },
          update: conf,
        });
      }

      if (questions && Array.isArray(questions)) {
        await tx.question.deleteMany({
          where: { training_module_id: trainingId },
        });

        for (const q of questions) {
          const newQ = await tx.question.create({
            data: {
              training_module_id: trainingId,
              text: q.text,
              question_type: q.question_type || 'mcq',
            },
          });

          if (q.choices && Array.isArray(q.choices)) {
            for (const c of q.choices) {
              await tx.choice.create({
                data: {
                  question_id: newQ.id,
                  text: c.text,
                  is_correct: Boolean(c.is_correct),
                },
              });
            }
          }
        }
      }
    });

    const updated = await prisma.trainingModule.findUnique({
      where: { id: trainingId },
      include: {
        test_configuration: true,
        questions: {
          include: { choices: true },
        },
        _count: { select: { enrollments: true } },
      },
    });

    return res.status(200).json(serializeTrainingModule(updated));
  } catch (error) {
    next(error);
  }
}

export async function submitTest(req, res, next) {
  try {
    const { candidate_id, training_id } = req.body;
    let results = req.body.results;
    let user_answers = req.body.user_answers;

    if (typeof results === 'string') {
      try { results = JSON.parse(results); } catch (e) {}
    }
    if (typeof user_answers === 'string') {
      try { user_answers = JSON.parse(user_answers); } catch (e) {}
    }

    if (!candidate_id || !training_id || !results) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const candidateIdInt = parseInt(candidate_id, 10);
    const trainingIdInt = parseInt(training_id, 10);

    let verificationImagePath = null;
    let nicImagePath = null;

    if (req.files) {
      if (req.files.verification_image && req.files.verification_image[0]) {
        verificationImagePath = `verification_images/${req.files.verification_image[0].filename}`;
      }
      if (req.files.nic_image && req.files.nic_image[0]) {
        nicImagePath = `nic_images/${req.files.nic_image[0].filename}`;
      }
    }

    const isPassed = Boolean(results.isPassed);
    const obtainedMarks = parseFloat(results.obtainedMarks || results.score || 0);
    const correctCount = parseInt(results.correctCount, 10) || 0;
    const incorrectCount = parseInt(results.incorrectCount, 10) || 0;
    const totalMarks = parseInt(results.totalMarks, 10) || 100;

    await prisma.$transaction(async (tx) => {
      await tx.testResult.create({
        data: {
          candidate_id: candidateIdInt,
          training_module_id: trainingIdInt,
          score: obtainedMarks,
          is_passed: isPassed,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          total_marks: totalMarks,
          user_answers: JSON.stringify(user_answers || {}),
          verification_image: verificationImagePath,
          nic_image: nicImagePath,
          is_verified: false,
        },
      });

      // Update enrollment status
      const enrollment = await tx.enrollment.findFirst({
        where: {
          candidate_id: candidateIdInt,
          training_module_id: trainingIdInt,
        },
      });

      if (enrollment) {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: isPassed ? 'Completed' : 'Failed',
          },
        });
      }
    });

    return res.status(201).json({ message: 'Test submitted successfully' });
  } catch (error) {
    next(error);
  }
}

export default {
  getCandidateDashboard,
  getTrainingDetail,
  updateTrainingDetail,
  submitTest,
};
