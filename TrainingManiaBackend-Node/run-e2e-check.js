// Native global fetch used in Node 18+

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function runE2ECheck() {
  console.log('================================================================');
  console.log('🚀 TRAINING MANIA - END-TO-END AUTOMATED VERIFICATION');
  console.log(`🎯 Target Endpoint: ${BASE_URL}`);
  console.log('================================================================\n');

  let passedSteps = 0;
  const totalSteps = 6;

  // -------------------------------------------------------------
  // STEP 1: Register a new Admin
  // -------------------------------------------------------------
  const adminTimestamp = Date.now();
  const adminEmail = `e2e_admin_${adminTimestamp}@techmiresolutions.com`;
  const adminPassword = `AdminPass_${adminTimestamp}!`;

  console.log(`[Step 1/6] Registering Admin (${adminEmail})...`);
  const adminRegRes = await fetch(`${BASE_URL}/api/admin/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      name: 'E2E Test Administrator',
      password: adminPassword,
      is_superadmin: true,
    }),
  });

  const adminRegData = await adminRegRes.json();
  if (adminRegRes.status !== 201 || !adminRegData.admin) {
    throw new Error(`Admin registration failed: ${JSON.stringify(adminRegData)}`);
  }
  const adminId = adminRegData.admin.id;
  console.log(`✅ Admin registered successfully! ID: ${adminId}, Email: ${adminRegData.admin.email}`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 2: Create a Training Module with mock config and sample questions
  // -------------------------------------------------------------
  console.log(`\n[Step 2/6] Creating Training Module with Zod validation...`);
  const moduleTitle = `Node.js Enterprise Architecture ${adminTimestamp}`;

  const trainingPayload = {
    title: moduleTitle,
    description: 'Comprehensive assessment module for Node.js backend development.',
    video_type: 'youtube',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    test_configuration: {
      total_questions: 10,
      mcq_percentage: 100,
      fib_percentage: 0,
      short_answer_percentage: 0,
      total_marks: 100,
      passing_marks: 40,
      duration_minutes: 20,
      attempts_allowed: 3,
      is_negative_marking: false,
      no_copy_paste: true,
      no_tab_switch: true,
      no_screenshot: true,
    },
    questions: [
      {
        text: 'Which architectural component acts as an Object-Relational Mapper in this stack?',
        question_type: 'mcq',
        choices: [
          { text: 'Prisma ORM', is_correct: true },
          { text: 'Mongoose', is_correct: false },
          { text: 'Hibernate', is_correct: false },
        ],
      },
      {
        text: 'What is the default port for the Training Mania backend service?',
        question_type: 'mcq',
        choices: [
          { text: '8000', is_correct: true },
          { text: '3000', is_correct: false },
          { text: '5173', is_correct: false },
        ],
      },
    ],
  };

  const createTrainingRes = await fetch(`${BASE_URL}/api/training/create/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-ID': String(adminId),
    },
    body: JSON.stringify(trainingPayload),
  });

  const createTrainingData = await createTrainingRes.json();
  if (createTrainingRes.status !== 201 || !createTrainingData.id) {
    throw new Error(`Training module creation failed: ${JSON.stringify(createTrainingData)}`);
  }
  const trainingId = createTrainingData.id;
  const trainingCode = createTrainingData.unique_code;
  console.log(`✅ Training Module created! ID: ${trainingId}, Code: ${trainingCode}, Title: "${createTrainingData.title}"`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 3: Register a Candidate and extract the generated Access Code
  // -------------------------------------------------------------
  const candidateEmail = `candidate_${adminTimestamp}@example.com`;
  console.log(`\n[Step 3/6] Registering Candidate (${candidateEmail})...`);

  const candRegRes = await fetch(`${BASE_URL}/api/admin/candidates/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-ID': String(adminId),
    },
    body: JSON.stringify({
      email: candidateEmail,
      name: 'Jane Doe Candidate',
    }),
  });

  const candRegData = await candRegRes.json();
  if (candRegRes.status !== 201 || !candRegData.candidate) {
    throw new Error(`Candidate registration failed: ${JSON.stringify(candRegData)}`);
  }
  const candidateId = candRegData.candidate.id;
  const accessCode = candRegData.candidate.code;
  console.log(`✅ Candidate registered! ID: ${candidateId}, Access Code: ${accessCode}`);
  passedSteps++;

  // Enroll Candidate into Training
  console.log(`   Enrolling candidate into course ${trainingId}...`);
  const enrollRes = await fetch(`${BASE_URL}/api/admin/enrollments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-ID': String(adminId),
    },
    body: JSON.stringify({
      candidate_email: candidateEmail,
      training_id: trainingId,
    }),
  });
  const enrollData = await enrollRes.json();
  console.log(`   Enrollment status: ${enrollData.message}`);

  // -------------------------------------------------------------
  // STEP 4: Log in as Candidate, set the candidate password, and retrieve dashboard
  // -------------------------------------------------------------
  console.log(`\n[Step 4/6] Candidate First-Time Login with Access Code...`);
  const loginRes1 = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: candidateEmail,
      credential: accessCode,
    }),
  });
  const loginData1 = await loginRes1.json();
  if (loginData1.step !== 'SET_PASSWORD') {
    throw new Error(`Expected step SET_PASSWORD but got: ${JSON.stringify(loginData1)}`);
  }
  console.log(`✅ Access Code verified, prompted for password creation (step: ${loginData1.step})`);

  const newCandidatePassword = `CandPass_${adminTimestamp}!`;
  console.log(`   Setting permanent candidate password...`);
  const setPassRes = await fetch(`${BASE_URL}/api/auth/set-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: candidateEmail,
      new_password: newCandidatePassword,
    }),
  });
  const setPassData = await setPassRes.json();
  if (setPassRes.status !== 200) {
    throw new Error(`Set password failed: ${JSON.stringify(setPassData)}`);
  }
  console.log(`✅ Candidate password saved successfully`);

  console.log(`   Candidate logging in with new password...`);
  const loginRes2 = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: candidateEmail,
      credential: newCandidatePassword,
    }),
  });
  const loginData2 = await loginRes2.json();
  if (loginData2.step !== 'DASHBOARD') {
    throw new Error(`Expected step DASHBOARD but got: ${JSON.stringify(loginData2)}`);
  }
  console.log(`✅ Candidate authenticated successfully (step: ${loginData2.step})`);

  console.log(`   Fetching candidate learning dashboard...`);
  const dashRes = await fetch(`${BASE_URL}/api/candidate/${candidateId}/dashboard/`);
  const dashData = await dashRes.json();
  if (!Array.isArray(dashData) || dashData.length === 0) {
    throw new Error(`Candidate dashboard returned empty or invalid courses: ${JSON.stringify(dashData)}`);
  }
  console.log(`✅ Candidate dashboard loaded ${dashData.length} enrolled courses (Course: "${dashData[0].training}")`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 5: Submit completed test payload with score & proctoring metadata
  // -------------------------------------------------------------
  console.log(`\n[Step 5/6] Submitting test answers and proctoring verification...`);
  const testPayload = {
    candidate_id: candidateId,
    training_id: trainingId,
    results: {
      obtainedMarks: 100,
      score: 100,
      isPassed: true,
      correctCount: 2,
      incorrectCount: 0,
      totalMarks: 100,
    },
    user_answers: {
      0: 'Prisma ORM',
      1: '8000',
    },
  };

  const submitTestRes = await fetch(`${BASE_URL}/api/test/submit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });
  const submitTestData = await submitTestRes.json();
  if (submitTestRes.status !== 201) {
    throw new Error(`Test submission failed: ${JSON.stringify(submitTestData)}`);
  }
  console.log(`✅ Assessment submitted successfully: "${submitTestData.message}"`);
  passedSteps++;

  // -------------------------------------------------------------
  // STEP 6: Verify Admin can fetch result in /api/admin/reports/
  // -------------------------------------------------------------
  console.log(`\n[Step 6/6] Admin fetching exam reports and proctoring audit...`);
  const reportsRes = await fetch(`${BASE_URL}/api/admin/reports/`, {
    headers: { 'X-Admin-ID': String(adminId) },
  });
  const reportsData = await reportsRes.json();
  if (!Array.isArray(reportsData) || reportsData.length === 0) {
    throw new Error(`Admin reports returned no results for admin ${adminId}: ${JSON.stringify(reportsData)}`);
  }

  const matchReport = reportsData.find((r) => r.candidate === candidateEmail);
  if (!matchReport) {
    throw new Error(`Could not find candidate ${candidateEmail} in admin report results!`);
  }

  console.log(`✅ Found candidate test report in Admin Audit!`);
  console.log(`   - Candidate: ${matchReport.candidate} (${matchReport.candidateName})`);
  console.log(`   - Training: ${matchReport.training} [${matchReport.unique_code}]`);
  console.log(`   - Score: ${matchReport.score}/${matchReport.totalMarks} (Status: ${matchReport.status})`);
  console.log(`   - Correct: ${matchReport.correct}, Wrong: ${matchReport.wrong}, Skipped: ${matchReport.skipped}`);
  console.log(`   - Exam Date: ${matchReport.date}`);
  passedSteps++;

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedSteps}/${totalSteps} END-TO-END FLOW STAGES PASSED WITHOUT ERRORS!`);
  console.log('================================================================\n');
}

runE2ECheck().catch((err) => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err.message);
  process.exit(1);
});
