import bcrypt from 'bcryptjs';
import prisma from './src/config/db.js';

async function seedCleanData() {
  console.log('--- PURGING ALL OLD/DEMO DATA ---');

  // Delete in proper dependency order
  await prisma.chatMessage.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.testResult.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.choice.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.testConfiguration.deleteMany({});
  await prisma.trainingModule.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.admin.deleteMany({});

  console.log('✅ All old test/demo records wiped completely.\n');

  console.log('--- CREATING PRODUCTION DATA ---');

  // 1. PRIMARY SUPER ADMIN
  const adminPasswordHash = await bcrypt.hash('tms12345', 10);
  const admin = await prisma.admin.create({
    data: {
      email: 'admin@trainingmania.com',
      name: 'Training Mania Administrator',
      password: adminPasswordHash,
      access_code: 'tms12345',
      is_active: true,
      is_superadmin: true,
      last_login: new Date(),
    },
  });
  console.log(`✅ Admin created: ${admin.email} (Password: tms12345)`);

  // 2. TRAINING MODULE 1: Full-Stack Web Development
  const module1 = await prisma.trainingModule.create({
    data: {
      created_by_id: admin.id,
      title: 'Full-Stack Web Development Mastery',
      unique_code: 'TRN-FSW101',
      description: 'Master modern frontend and backend development with React 19, Node.js, Express, and Prisma ORM.',
      video_type: 'youtube',
      video_url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
      extracted_text: `
Full-Stack Web Development Course Overview:
- Frontend: React 19 Virtual DOM, state management with hooks (useState, useEffect, useTransition), responsive CSS.
- Backend: Node.js runtime, Express RESTful API architecture, HTTP methods (GET, POST, PUT, PATCH, DELETE).
- Databases: Relational schema design, Prisma ORM modeling, transactions, migrations, and indexing.
- Authentication: Password hashing with bcrypt, stateless JSON Web Tokens (JWT) in Authorization headers.
- Error Handling: Standardized HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Internal Error).
      `.trim(),
      test_configuration: {
        create: {
          total_questions: 5,
          total_marks: 100,
          passing_marks: 60,
          duration_minutes: 25,
          attempts_allowed: 3,
          mcq_percentage: 100,
          fib_percentage: 0,
          short_answer_percentage: 0,
          no_copy_paste: true,
          no_tab_switch: true,
          no_screenshot: true,
          requires_verification: true,
          exam_instructions: 'Ensure your webcam is enabled. Tab switching or copy-pasting is monitored.',
        },
      },
      questions: {
        create: [
          {
            text: 'What is the primary role of an Object-Relational Mapper (ORM) in modern backend development?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'To map object-oriented programming entities to relational database tables', is_correct: true },
                { text: 'To compress HTTP payloads before network transmission', is_correct: false },
                { text: 'To serve static files like images and stylesheets', is_correct: false },
                { text: 'To compile frontend JSX templates into HTML', is_correct: false },
              ],
            },
          },
          {
            text: 'Which React 19 hook is specifically designed to handle non-blocking asynchronous state transitions?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'useTransition', is_correct: true },
                { text: 'useEffect', is_correct: false },
                { text: 'useMemo', is_correct: false },
                { text: 'useCallback', is_correct: false },
              ],
            },
          },
          {
            text: 'In REST architectural design, which HTTP method is idempotent and intended to replace an entire resource representation?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'PUT', is_correct: true },
                { text: 'POST', is_correct: false },
                { text: 'PATCH', is_correct: false },
                { text: 'CONNECT', is_correct: false },
              ],
            },
          },
          {
            text: 'Which HTTP header is standard for passing JSON Web Tokens (JWT) for authenticated requests?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'Authorization: Bearer <token>', is_correct: true },
                { text: 'X-Auth-Key: <token>', is_correct: false },
                { text: 'Token-Payload: <token>', is_correct: false },
                { text: 'Cookie: session_id=<token>', is_correct: false },
              ],
            },
          },
          {
            text: 'Which HTTP status code should an API return when client input fails validation rules?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: '400 Bad Request', is_correct: true },
                { text: '401 Unauthorized', is_correct: false },
                { text: '403 Forbidden', is_correct: false },
                { text: '500 Internal Server Error', is_correct: false },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅ Module 1 created: "${module1.title}" (${module1.unique_code}) with 5 questions`);

  // 3. TRAINING MODULE 2: Corporate Cybersecurity
  const module2 = await prisma.trainingModule.create({
    data: {
      created_by_id: admin.id,
      title: 'Corporate Cybersecurity & Privacy Standards',
      unique_code: 'TRN-SEC202',
      description: 'Essential cybersecurity practices, phishing prevention, credential hygiene, and enterprise data protection standards.',
      video_type: 'youtube',
      video_url: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
      extracted_text: `
Corporate Cybersecurity Curriculum:
- Identity Security: Password complexity, credential reuse dangers, Multi-Factor Authentication (MFA).
- Threat Vectors: Phishing tactics, spear phishing, malicious attachments, and social engineering.
- Cryptography: Secure hashing with salt (bcrypt, Argon2), encryption in transit (TLS 1.3), encryption at rest (AES-256).
- Compliance Standards: GDPR, HIPAA, and ISO 27001 data governance and breach notification protocols.
      `.trim(),
      test_configuration: {
        create: {
          total_questions: 3,
          total_marks: 100,
          passing_marks: 70,
          duration_minutes: 15,
          attempts_allowed: 2,
          mcq_percentage: 100,
          fib_percentage: 0,
          short_answer_percentage: 0,
          no_copy_paste: true,
          no_tab_switch: true,
          no_screenshot: false,
          requires_verification: true,
        },
      },
      questions: {
        create: [
          {
            text: 'What is the single most effective safeguard against credential stuffing and password reuse attacks?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'Enforcing Multi-Factor Authentication (MFA)', is_correct: true },
                { text: 'Requiring password changes every 7 days without MFA', is_correct: false },
                { text: 'Allowing users to write down passwords securely', is_correct: false },
              ],
            },
          },
          {
            text: 'Which fraudulent attack manipulates users into clicking deceitful links to steal login credentials?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'Phishing attack', is_correct: true },
                { text: 'DDoS attack', is_correct: false },
                { text: 'Buffer overflow attack', is_correct: false },
              ],
            },
          },
          {
            text: 'Which standard mandates strict privacy rights and rapid data breach notification in the European Union?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'General Data Protection Regulation (GDPR)', is_correct: true },
                { text: 'PCI-DSS v3', is_correct: false },
                { text: 'IEEE 802.11 Protocol', is_correct: false },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅ Module 2 created: "${module2.title}" (${module2.unique_code}) with 3 questions`);

  // 4. TRAINING MODULE 3: Enterprise Generative AI
  const module3 = await prisma.trainingModule.create({
    data: {
      created_by_id: admin.id,
      title: 'Enterprise Generative AI & Prompt Engineering',
      unique_code: 'TRN-GAI303',
      description: 'Leveraging Google Gemini and LLMs for automated corporate workflows, grounded context, and prompt design.',
      video_type: 'youtube',
      video_url: 'https://www.youtube.com/watch?v=mEsleV16qdo',
      extracted_text: `
Generative AI & LLMs in Production:
- Foundation Models: Google Gemini 2.0 Flash, tokenization, context windows, and latency vs throughput tradeoffs.
- Prompt Engineering: System instructions, role-playing, few-shot prompting with explicit output schemas (JSON).
- Grounding: Retrieval-Augmented Generation (RAG) to eliminate hallucinations using verified documentation.
- Responsible AI: Safety thresholds, content filtering, bias mitigation, and PII protection.
      `.trim(),
      test_configuration: {
        create: {
          total_questions: 2,
          total_marks: 100,
          passing_marks: 50,
          duration_minutes: 15,
          attempts_allowed: 3,
          mcq_percentage: 100,
        },
      },
      questions: {
        create: [
          {
            text: 'In prompt engineering, what is the practice of providing example input-output pairs in the prompt called?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'Few-shot prompting', is_correct: true },
                { text: 'Zero-shot prompting', is_correct: false },
                { text: 'Greedy decoding', is_correct: false },
              ],
            },
          },
          {
            text: 'Which technique ensures an AI chatbot generates factual answers strictly grounded in corporate manuals?',
            question_type: 'mcq',
            choices: {
              create: [
                { text: 'Retrieval-Augmented Generation (RAG) with context injection', is_correct: true },
                { text: 'Increasing model temperature to 1.0', is_correct: false },
                { text: 'Disabling safety filters', is_correct: false },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅ Module 3 created: "${module3.title}" (${module3.unique_code}) with 2 questions`);

  // 5. CANDIDATES
  const candPasswordHash = await bcrypt.hash('tms12345', 10);
  const defaultHash = await bcrypt.hash('Password123!', 10);

  // Candidate 1: Primary test account matching user credentials
  const cand1 = await prisma.candidate.create({
    data: {
      created_by_id: admin.id,
      email: 'candidate@trainingmania.com',
      name: 'Sarah Connor',
      password: candPasswordHash,
      access_code: 'tms12345',
      is_active: true,
      method: 'Manual',
    },
  });

  // Candidate 2: Active candidate
  const cand2 = await prisma.candidate.create({
    data: {
      created_by_id: admin.id,
      email: 'david.chen@enterprise.com',
      name: 'David Chen',
      password: defaultHash,
      access_code: 'DC2026',
      is_active: true,
      method: 'Manual',
    },
  });

  // Candidate 3: Active candidate
  const cand3 = await prisma.candidate.create({
    data: {
      created_by_id: admin.id,
      email: 'elena.rostova@techcorp.io',
      name: 'Elena Rostova',
      password: defaultHash,
      access_code: 'ER2026',
      is_active: true,
      method: 'Manual',
    },
  });

  // Candidate 4: First-time onboard candidate (requires setting password via access code)
  const cand4 = await prisma.candidate.create({
    data: {
      created_by_id: admin.id,
      email: 'marcus.vance@innovate.com',
      name: 'Marcus Vance',
      password: null,
      access_code: 'WELCOME2026',
      is_active: true,
      method: 'Manual',
    },
  });

  console.log(`✅ Candidates created:`);
  console.log(`   - candidate@trainingmania.com (Password: tms12345)`);
  console.log(`   - david.chen@enterprise.com (Password: Password123!)`);
  console.log(`   - elena.rostova@techcorp.io (Password: Password123!)`);
  console.log(`   - marcus.vance@innovate.com (Access Code: WELCOME2026)`);

  // 6. ENROLLMENTS
  // Sarah Connor: Enrolled in all 3 courses (Module 1 completed, Module 2 & 3 Pending)
  await prisma.enrollment.create({
    data: { candidate_id: cand1.id, training_module_id: module1.id, status: 'Completed' },
  });
  await prisma.enrollment.create({
    data: { candidate_id: cand1.id, training_module_id: module2.id, status: 'Pending' },
  });
  await prisma.enrollment.create({
    data: { candidate_id: cand1.id, training_module_id: module3.id, status: 'Pending' },
  });

  // David Chen: Enrolled in Module 1 (Completed) and Module 3 (Pending)
  await prisma.enrollment.create({
    data: { candidate_id: cand2.id, training_module_id: module1.id, status: 'Completed' },
  });
  await prisma.enrollment.create({
    data: { candidate_id: cand2.id, training_module_id: module3.id, status: 'Pending' },
  });

  // Elena Rostova: Enrolled in Module 2 (Completed)
  await prisma.enrollment.create({
    data: { candidate_id: cand3.id, training_module_id: module2.id, status: 'Completed' },
  });

  // Marcus Vance: Enrolled in all modules
  await prisma.enrollment.create({
    data: { candidate_id: cand4.id, training_module_id: module1.id, status: 'Pending' },
  });
  await prisma.enrollment.create({
    data: { candidate_id: cand4.id, training_module_id: module2.id, status: 'Pending' },
  });

  console.log(`✅ Course enrollments established.`);

  // 7. REALISTIC TEST RESULTS (FOR ADMIN REPORTS AUDIT)
  // Sarah Connor - Module 1 (100% Score)
  await prisma.testResult.create({
    data: {
      candidate_id: cand1.id,
      training_module_id: module1.id,
      score: 100,
      total_marks: 100,
      is_passed: true,
      correct_count: 5,
      incorrect_count: 0,
      user_answers: JSON.stringify({
        0: 'To map object-oriented programming entities to relational database tables',
        1: 'useTransition',
        2: 'PUT',
        3: 'Authorization: Bearer <token>',
        4: '400 Bad Request',
      }),
      is_verified: true,
    },
  });

  // David Chen - Module 1 (80% Score)
  await prisma.testResult.create({
    data: {
      candidate_id: cand2.id,
      training_module_id: module1.id,
      score: 80,
      total_marks: 100,
      is_passed: true,
      correct_count: 4,
      incorrect_count: 1,
      user_answers: JSON.stringify({
        0: 'To map object-oriented programming entities to relational database tables',
        1: 'useTransition',
        2: 'PATCH', // wrong answer
        3: 'Authorization: Bearer <token>',
        4: '400 Bad Request',
      }),
      is_verified: true,
    },
  });

  // Elena Rostova - Module 2 (100% Score)
  await prisma.testResult.create({
    data: {
      candidate_id: cand3.id,
      training_module_id: module2.id,
      score: 100,
      total_marks: 100,
      is_passed: true,
      correct_count: 3,
      incorrect_count: 0,
      user_answers: JSON.stringify({
        0: 'Enforcing Multi-Factor Authentication (MFA)',
        1: 'Phishing attack',
        2: 'General Data Protection Regulation (GDPR)',
      }),
      is_verified: true,
    },
  });

  console.log(`✅ Exam test reports seeded for Admin Reports view.`);

  // 8. NOTIFICATIONS FOR ADMIN
  await prisma.notification.createMany({
    data: [
      {
        admin_id: admin.id,
        type: 'test_completion',
        message: "Sarah Connor scored 100% on 'Full-Stack Web Development Mastery'.",
        is_read: false,
      },
      {
        admin_id: admin.id,
        type: 'test_completion',
        message: "David Chen completed 'Full-Stack Web Development Mastery' (Score: 80%).",
        is_read: false,
      },
      {
        admin_id: admin.id,
        type: 'test_completion',
        message: "Elena Rostova passed 'Corporate Cybersecurity & Privacy Standards' (Score: 100%).",
        is_read: false,
      },
      {
        admin_id: admin.id,
        type: 'system',
        message: 'Platform onboarding complete: 4 candidates active across 3 corporate modules.',
        is_read: true,
      },
    ],
  });
  console.log(`✅ Admin activity notifications created.`);

  // 9. SAMPLE CHAT FOR AI TUTOR
  await prisma.chatMessage.createMany({
    data: [
      {
        candidate_id: cand1.id,
        training_module_id: module1.id,
        sender: 'user',
        message: 'Can you explain the difference between PUT and PATCH in REST APIs?',
      },
      {
        candidate_id: cand1.id,
        training_module_id: module1.id,
        sender: 'ai',
        message: 'In RESTful web services, PUT is idempotent and used to replace the entire target resource with the submitted payload. In contrast, PATCH is designed for partial updates, modifying only the fields specified in the request.',
      },
    ],
  });
  console.log(`✅ AI Tutor grounded chat conversation seeded.`);

  console.log('\n================================================================');
  console.log('🎉 PRODUCTION DATABASE SEEDING COMPLETED WITH ZERO DEMO JUNK!');
  console.log('================================================================\n');
}

seedCleanData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding data:', err);
    process.exit(1);
  });
