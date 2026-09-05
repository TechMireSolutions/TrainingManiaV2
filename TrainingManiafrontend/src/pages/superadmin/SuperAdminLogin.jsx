import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, ShieldAlert } from 'lucide-react';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Map "admin" username to the specific superadmin email
        const emailToUse = username.trim() === 'admin' ? 'admin@trainingmania.com' : username;

        try {
            const response = await fetch('/api/admin/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailToUse, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.admin.is_superadmin) {
                    // Store admin details
                    localStorage.setItem('adminInfo', JSON.stringify(data.admin));
                    navigate('/superadmin/dashboard');
                } else {
                    setError('Access Denied. You are not a Super Admin.');
                }
            } else {
                setError(data.error || 'Invalid credentials.');
            }
        } catch (err) {
            setError('Unable to connect to server. Please try again later.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative">
            {/* Purple background accent for Super Admin */}
            <div className="absolute top-0 left-0 w-full h-64 bg-purple-600/5 -skew-y-3 origin-top-left -z-10"></div>

            <div className="w-full max-w-md">
                <button
                    onClick={() => navigate('/')}
                    className="group flex items-center text-slate-500 hover:text-purple-600 transition-colors mb-8 font-medium"
                >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-3 group-hover:border-purple-200 group-hover:bg-purple-50 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Back to Home
                </button>

                <div className="bg-white rounded-3xl shadow-xl shadow-purple-100/50 overflow-hidden border border-slate-100">
                    <div className="p-10">
                        <div className="mb-10">
                            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200">
                                <ShieldAlert className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Super Admin</h1>
                            <p className="text-slate-500">Restricted access area.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-pulse">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                    placeholder="admin"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400 pr-12"
                                        placeholder="Enter password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
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
                                className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {isLoading ? 'Verifying...' : 'Login to Console'}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SuperAdminLogin;
