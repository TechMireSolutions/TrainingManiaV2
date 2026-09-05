import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {

        // Store admin details if needed
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));

        if (data.admin.is_superadmin) {
          navigate('/superadmin/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError(data.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState({ loading: false, success: false, error: '' });

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetStatus({ loading: true, success: false, error: '' });

    try {
      const res = await fetch('/api/admin/forgot-password/', {
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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-indigo-600/5 -skew-y-3 origin-top-left -z-10"></div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h3>
            <p className="text-slate-500 mb-6">Enter your email address and we'll send you a new temporary password.</p>

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
                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus.loading}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-70"
                  >
                    {resetStatus.loading ? 'Sending...' : 'Send Password'}
                  </button>
                </div>
              </form>
            )}

            {resetStatus.success && (
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
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

        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 overflow-hidden border border-slate-100">
          <div className="p-10">
            <div className="mb-10">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Login</h1>
              <p className="text-slate-500">Enter your credentials to access the dashboard.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-pulse">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Password or Access Code
                  </label>
                  <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400 pr-12"
                    placeholder="Enter password or access code"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-4"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
