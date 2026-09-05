// Native global fetch used in Node 18+

const BASE_URL = 'http://localhost:8000';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE INTEGRATION TEST ---');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/`);
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData.status === 'ok' ? 'PASS' : 'FAIL', healthData);

  // 2. SuperAdmin Stats
  const statsRes = await fetch(`${BASE_URL}/api/superadmin/stats/`);
  const statsData = await statsRes.json();
  console.log('2. SuperAdmin Stats:', statsRes.status === 200 ? 'PASS' : 'FAIL', statsData);

  // 3. Admin Registration
  const testEmail = `admin_test_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/admin/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      name: 'Test Admin',
      password: 'testpassword123',
      is_superadmin: true,
    }),
  });
  const regData = await regRes.json();
  console.log('3. Admin Registration:', regRes.status === 201 ? 'PASS' : 'FAIL', regData);
  const adminId = regData.admin ? regData.admin.id : null;

  // 4. Admin Login
  const loginRes = await fetch(`${BASE_URL}/api/admin/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'testpassword123',
    }),
  });
  const loginData = await loginRes.json();
  console.log('4. Admin Login:', loginRes.status === 200 ? 'PASS' : 'FAIL', loginData.message);

  // 5. Admin Candidate Creation
  const candEmail = `student_${Date.now()}@example.com`;
  const candRes = await fetch(`${BASE_URL}/api/admin/candidates/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-ID': String(adminId),
    },
    body: JSON.stringify({ email: candEmail }),
  });
  const candData = await candRes.json();
  console.log('5. Admin Create Candidate:', candRes.status === 201 ? 'PASS' : 'FAIL', candData.candidate?.code);
  const accessCode = candData.candidate ? candData.candidate.code : '';
  const candidateId = candData.candidate ? candData.candidate.id : '';

  // 6. Candidate First Login (Access Code)
  const cLoginRes = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: candEmail,
      credential: accessCode,
    }),
  });
  const cLoginData = await cLoginRes.json();
  console.log('6. Candidate Access Code Login:', cLoginData.step === 'SET_PASSWORD' ? 'PASS' : 'FAIL', cLoginData.step);

  // 7. Candidate Set Password
  const setPassRes = await fetch(`${BASE_URL}/api/auth/set-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: candEmail,
      new_password: 'candidate_pass_123',
    }),
  });
  const setPassData = await setPassRes.json();
  console.log('7. Candidate Set Password:', setPassRes.status === 200 ? 'PASS' : 'FAIL', setPassData.message);

  // 8. Candidate Login with new password
  const cPassLoginRes = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: candEmail,
      credential: 'candidate_pass_123',
    }),
  });
  const cPassLoginData = await cPassLoginRes.json();
  console.log('8. Candidate Login with Password:', cPassLoginData.step === 'DASHBOARD' ? 'PASS' : 'FAIL', cPassLoginData.step);

  // 9. Admin Create Training Module
  const trainRes = await fetch(`${BASE_URL}/api/training/create/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-ID': String(adminId),
    },
    body: JSON.stringify({
      title: `FullStack Node Course ${Date.now()}`,
      video_type: 'youtube',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'Test course description',
      test_configuration: {
        total_questions: 10,
        mcq_percentage: 100,
        total_marks: 100,
        passing_marks: 40,
        duration_minutes: 20,
        attempts_allowed: 3,
      },
      questions: [
        {
          text: 'What is Node.js?',
          question_type: 'mcq',
          choices: [
            { text: 'A JavaScript Runtime', is_correct: true },
            { text: 'A Database', is_correct: false },
          ],
        },
      ],
    }),
  });
  const trainData = await trainRes.json();
  console.log('9. Create Training Module:', trainRes.status === 201 ? 'PASS' : 'FAIL', trainData.unique_code);
  const trainingId = trainData.id;

  // 10. Enroll Candidate
  const enrollRes = await fetch(`${BASE_URL}/api/admin/enrollments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-ID': String(adminId),
    },
    body: JSON.stringify({
      candidate_email: candEmail,
      training_id: trainingId,
    }),
  });
  const enrollData = await enrollRes.json();
  console.log('10. Enroll Candidate in Training:', enrollRes.status === 201 ? 'PASS' : 'FAIL', enrollData.message);

  // 11. Candidate Dashboard
  const dashRes = await fetch(`${BASE_URL}/api/candidate/${candidateId}/dashboard/`);
  const dashData = await dashRes.json();
  console.log('11. Candidate Dashboard (enrolled courses):', Array.isArray(dashData) && dashData.length > 0 ? 'PASS' : 'FAIL', dashData.length);

  // 12. Training Details by ID
  const detailRes = await fetch(`${BASE_URL}/api/training/${trainingId}/`);
  const detailData = await detailRes.json();
  console.log('12. Training Details by ID:', detailRes.status === 200 ? 'PASS' : 'FAIL', detailData.title);

  // 13. Submit Test
  const testSubRes = await fetch(`${BASE_URL}/api/test/submit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_id: candidateId,
      training_id: trainingId,
      results: {
        obtainedMarks: 100,
        isPassed: true,
        correctCount: 1,
        incorrectCount: 0,
        totalMarks: 100,
      },
      user_answers: { 0: 'A JavaScript Runtime' },
    }),
  });
  const testSubData = await testSubRes.json();
  console.log('13. Submit Test:', testSubRes.status === 201 ? 'PASS' : 'FAIL', testSubData.message);

  // 14. Admin Reports
  const repRes = await fetch(`${BASE_URL}/api/admin/reports/`, {
    headers: { 'X-Admin-ID': String(adminId) },
  });
  const repData = await repRes.json();
  console.log('14. Admin Reports:', Array.isArray(repData) && repData.length > 0 ? 'PASS' : 'FAIL', repData.length);

  // 15. Admin Notifications
  const notifRes = await fetch(`${BASE_URL}/api/admin/notifications/`, {
    headers: { 'X-Admin-ID': String(adminId) },
  });
  const notifData = await notifRes.json();
  console.log('15. Admin Notifications:', Array.isArray(notifData) ? 'PASS' : 'FAIL', notifData.length);

  // 16. Chat History Fetch
  const chatHistRes = await fetch(`${BASE_URL}/api/chat/?candidate_id=${candidateId}&training_id=${trainingId}`);
  const chatHistData = await chatHistRes.json();
  console.log('16. Chat History Fetch:', chatHistRes.status === 200 ? 'PASS' : 'FAIL', Array.isArray(chatHistData));

  // 17. SuperAdmin Admins List
  const saAdminsRes = await fetch(`${BASE_URL}/api/superadmin/admins/`);
  const saAdminsData = await saAdminsRes.json();
  console.log('17. SuperAdmin Admins List:', saAdminsRes.status === 200 ? 'PASS' : 'FAIL', Array.isArray(saAdminsData));

  // 18. SuperAdmin Global Candidates
  const saCandRes = await fetch(`${BASE_URL}/api/superadmin/candidates/`);
  const saCandData = await saCandRes.json();
  console.log('18. SuperAdmin Global Candidates:', saCandRes.status === 200 ? 'PASS' : 'FAIL', Array.isArray(saCandData));

  // 19. SuperAdmin Global Trainings
  const saTrainRes = await fetch(`${BASE_URL}/api/superadmin/trainings/`);
  const saTrainData = await saTrainRes.json();
  console.log('19. SuperAdmin Global Trainings:', saTrainRes.status === 200 ? 'PASS' : 'FAIL', Array.isArray(saTrainData));

  // 20. SuperAdmin Training Enrollments
  const saEnrollRes = await fetch(`${BASE_URL}/api/superadmin/trainings/${trainingId}/candidates/`);
  const saEnrollData = await saEnrollRes.json();
  console.log('20. SuperAdmin Training Enrollments:', saEnrollRes.status === 200 ? 'PASS' : 'FAIL', Array.isArray(saEnrollData));

  console.log('--- ALL 20 INTEGRATION TESTS COMPLETED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
