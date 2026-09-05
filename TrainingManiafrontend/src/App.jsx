import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import GeneratedTest from './pages/admin/GeneratedTest';
import TrainingDetails from './pages/admin/TrainingDetails';
import NewTraining from './pages/admin/NewTraining';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';

import CandidateLogin from './pages/candidate/CandidateLogin';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import Quiz from './pages/candidate/Quiz';
import TakeQuiz from './pages/candidate/TakeQuiz';
import Certificate from './pages/candidate/Certificate';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/test-preview" element={<GeneratedTest />} />
        <Route path="/admin/training/:id" element={<TrainingDetails />} />
        <Route path="/admin/new-training" element={<NewTraining />} />

        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />

        {/* Candidate Routes */}
        <Route path="/candidate/login" element={<CandidateLogin />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/candidate/quiz" element={<Quiz />} />
        <Route path="/candidate/take-test/:id" element={<TakeQuiz />} />
        <Route path="/candidate/certificate/:id" element={<Certificate />} />
      </Routes>
    </Router>
  );
}

export default App;
