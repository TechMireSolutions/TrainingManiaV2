import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Key, ArrowRight, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const CandidateLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('LOGIN'); // 'LOGIN' or 'SET_PASSWORD'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login State
  const [email, setEmail] = useState('');
  const [credential, setCredential] = useState(''); // Can be Access Code or Password

  // Set Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState({ loading: false, success: false, error: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, credential }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.step === 'SET_PASSWORD') {
          setStep('SET_PASSWORD');
          setError('');
        } else if (data.step === 'DASHBOARD') {
          localStorage.setItem('candidateInfo', JSON.stringify(data.candidate));
          navigate('/candidate/dashboard');
        }
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/set-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('candidateInfo', JSON.stringify(data.candidate));
        navigate('/candidate/dashboard');
      } else {
        setError(data.error || 'Failed to set password.');
      }
    } catch (err) {
      console.error("Set password error:", err);
      setError("Network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetStatus({ loading: true, success: false, error: '' });

    try {
      const res = await fetch('/api/auth/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setResetStatus({ loading: false, success: true, error: data.message });
      } else {
        setResetStatus({ loading: false, success: false, error: data.error || 'Failed to request password reset.' });
      }
    } catch (err) {
      setResetStatus({ loading: false, success: false, error: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h3>
            <p className="text-slate-500 mb-6">Enter your email address and we'll send you a new password.</p>

            {resetStatus.success ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 mb-6 font-medium">
                {resetStatus.error}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {resetStatus.error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    {resetStatus.error}
                  </div>
                )}
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus.loading}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {resetStatus.loading ? 'Sending...' : 'Send Password'}
                  </button>
                </div>
              </form>
            )}

            {resetStatus.success && (
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Back to Login
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="cursor-pointer group flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-8 font-medium"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-3 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-white p-8 pb-0 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mx-auto mb-6 transform rotate-3">
            <span className="text-white font-bold text-3xl">T</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Candidate Portal</h2>
          <p className="text-slate-500">
            {step === 'LOGIN' ? 'Access your training and assessments' : 'Secure your account'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {step === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Access Code / Password
                  </label>
                  <button type="button" onClick={() => setShowForgotModal(true)} className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                    placeholder="Enter code or password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1">
                  First time? Use the Access Code sent to your email.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-6">
                <div className="flex items-center gap-3 text-indigo-700 font-medium mb-1">
                  <CheckCircle className="w-5 h-5" />
                  Access Code Verified
                </div>
                <p className="text-sm text-indigo-600/80 ml-8">
                  Please set a secure password for future logins.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Set Password & Login <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateLogin;
