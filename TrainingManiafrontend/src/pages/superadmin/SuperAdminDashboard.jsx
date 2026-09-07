import React, { useState, useEffect } from 'react';
import {
    Users,
    LayoutDashboard,
    LogOut,
    ShieldCheck,
    Plus,
    Loader,
    CheckCircle,
    X,
    Menu,
    BookOpen,
    UserCheck,
    Trash2,
    RefreshCw,
    Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State for New Admin
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdAdmin, setCreatedAdmin] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Filter States
    const [selectedAdminFilter, setSelectedAdminFilter] = useState('');
    const [selectedTrainingFilter, setSelectedTrainingFilter] = useState('');
    const [filteredCandidates, setFilteredCandidates] = useState(null);
    const [loadingCandidates, setLoadingCandidates] = useState(false);

    // New Admin Form Data
    const [newAdminData, setNewAdminData] = useState({
        name: '',
        email: '',
        training_limit: '',
        student_limit: '',
        enrollment_limit: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsRes = await fetch('/api/superadmin/stats/');
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }

            const adminsRes = await fetch('/api/superadmin/admins/');
            if (adminsRes.ok) setAdmins(await adminsRes.json());

            const candidatesRes = await fetch('/api/superadmin/candidates/');
            if (candidatesRes.ok) setCandidates(await candidatesRes.json());

            const trainingsRes = await fetch('/api/superadmin/trainings/');
            if (trainingsRes.ok) setTrainings(await trainingsRes.json());

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewAdminData(prev => ({ ...prev, password: pass }));
    };

    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
        let errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!newAdminData.name.trim()) errors.name = "Name is required";
        else if (!/^[a-zA-Z\s]+$/.test(newAdminData.name)) errors.name = "Name must contain only letters";

        if (!newAdminData.email) errors.email = "Email is required";
        else if (!emailRegex.test(newAdminData.email)) errors.email = "Invalid email format";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const res = await fetch('/api/superadmin/admins/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAdminData)
            });
            const data = await res.json();
            if (res.ok) {
                // Success modal logic
                setCreatedAdmin({
                    ...data.admin,
                    password: data.admin?.password || 'Generated & sent via email'
                });
                setSuccessMessage(data.message); // Store backend message
                setShowAddAdminModal(false);
                setShowSuccessModal(true);

                setNewAdminData({
                    name: '',
                    email: '',
                    training_limit: '',
                    student_limit: '',
                    enrollment_limit: ''
                });
                fetchData(); // Refresh data
            } else {
                alert(data.error || 'Failed to create admin');
            }
        } catch (err) {
            alert('Error creating admin');
        }
    };

    const [loadingEmails, setLoadingEmails] = useState(false);

    const handleCheckEmails = async () => {
        setLoadingEmails(true);
        try {
            const res = await fetch('/api/superadmin/check-bounces/', { method: 'POST' });
            const text = await res.text(); // Read text first
            try {
                const data = JSON.parse(text); // Try parsing JSON
                if (res.ok) {
                    alert(data.message);
                    fetchData(); // Refresh list
                } else {
                    alert("Failed: " + (data.error || text));
                }
            } catch (e) {
                // If JSON parse fails, show the raw text (likely an HTML error page)
                console.error("Non-JSON response:", text);
                alert("Server Error (Not JSON): " + text.substring(0, 150)); // Show start of error
            }
        } catch (err) {
            console.error(err);
            alert("Network Error: " + err.message);
        } finally {
            setLoadingEmails(false);
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm("Are you sure you want to delete this admin? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/superadmin/admins/${id}/`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setAdmins(admins.filter(admin => admin.id !== id));
                // Optionally refresh stats
                const statsRes = await fetch('/api/superadmin/stats/');
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data.stats);
                }
            } else {
                alert("Failed to delete admin");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting admin");
        }
    };

    const [sendingCodeId, setSendingCodeId] = useState(null);

    const handleResendCode = async (adminId, adminEmail) => {
        setSendingCodeId(adminId);
        try {
            const res = await fetch(`/api/superadmin/admins/${adminId}/resend-code/`, {
                method: 'POST',
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ ${data.message}`);
                fetchData();
            } else {
                alert(`❌ Failed: ${data.error || 'Could not resend access code'}`);
            }
        } catch (err) {
            console.error('Error resending access code:', err);
            alert(`Network error: ${err.message}`);
        } finally {
            setSendingCodeId(null);
        }
    };

    const handleDeleteCandidate = async (id) => {
        if (!window.confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/superadmin/candidates/${id}/`, { method: 'DELETE' });
            if (res.ok) {
                setCandidates(candidates.filter(c => c.id !== id));
                if (filteredCandidates) {
                    setFilteredCandidates(filteredCandidates.filter(c => c.id !== id));
                }
                // Refresh stats
                const statsRes = await fetch('/api/superadmin/stats/');
                if (statsRes.ok) setStats((await statsRes.json()).stats);
            } else {
                alert("Failed to delete candidate");
            }
        } catch (err) {
            console.error("Error deleting candidate:", err);
            alert("Error deleting candidate");
        }
    };

    const handleDeleteTraining = async (id) => {
        if (!window.confirm("Are you sure you want to delete this training? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/superadmin/trainings/${id}/`, { method: 'DELETE' });
            if (res.ok) {
                setTrainings(trainings.filter(t => t.id !== id));
                // Refresh stats
                const statsRes = await fetch('/api/superadmin/stats/');
                if (statsRes.ok) setStats((await statsRes.json()).stats);
            } else {
                alert("Failed to delete training");
            }
        } catch (err) {
            console.error("Error deleting training:", err);
            alert("Error deleting training");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        navigate('/');
    };

    const NavItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => {
                setActiveTab(id);
                setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'
                }`}
        >
            <Icon className={`w-5 h-5 mr-3 ${activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-purple-600'}`} />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="h-screen h-[100dvh] bg-slate-50 flex font-sans overflow-hidden text-slate-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="p-8 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 leading-none">Super</h1>
                            <span className="text-purple-600 font-semibold text-sm">Admin</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-6 space-y-2 mt-2 overflow-y-auto">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dashboard</div>
                    <NavItem id="overview" icon={LayoutDashboard} label="Overview" />
                    <NavItem id="admins" icon={Users} label="Manage Admins" />
                    <NavItem id="candidates" icon={UserCheck} label="Global Candidates" />
                    <NavItem id="trainings" icon={BookOpen} label="Global Trainings" />
                </nav>

                <div className="p-6 border-t border-slate-100 flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white/90 backdrop-blur-md z-20 border-b border-slate-200 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-1.5 -ml-1.5 text-slate-600 hover:text-purple-600 active:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 capitalize truncate">{activeTab.replace('-', ' ')}</h2>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="text-xs sm:text-sm font-bold text-slate-700 hidden sm:inline">Super Admin</span>
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs sm:text-sm">SA</div>
                    </div>
                </header>

                <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto overscroll-y-contain">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && stats && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <span className="text-slate-500 font-medium">Total Admins</span>
                                        <div className="text-4xl font-bold text-slate-900 mt-2">{stats.total_admins}</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <span className="text-slate-500 font-medium">Total Candidates</span>
                                        <div className="text-4xl font-bold text-slate-900 mt-2">{stats.total_candidates}</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <span className="text-slate-500 font-medium">Total Trainings</span>
                                        <div className="text-4xl font-bold text-slate-900 mt-2">{stats.total_trainings}</div>
                                    </div>
                                </div>
                            )}

                            {/* ADMINS TAB */}
                            {activeTab === 'admins' && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
                                        <button
                                            onClick={handleCheckEmails}
                                            disabled={loadingEmails}
                                            className="w-full sm:w-auto justify-center bg-white text-slate-700 border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold flex items-center hover:bg-slate-50 transition-all shadow-sm text-xs sm:text-sm cursor-pointer"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${loadingEmails ? 'animate-spin' : ''}`} />
                                            <span className="truncate">{loadingEmails ? 'Checking...' : 'Check Status'}</span>
                                        </button>
                                        <button
                                            onClick={() => setShowAddAdminModal(true)}
                                            className="w-full sm:w-auto justify-center bg-purple-600 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold flex items-center hover:bg-purple-700 transition-all shadow-md shadow-purple-200 text-xs sm:text-sm cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                            <span className="truncate">Add Admin</span>
                                        </button>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        {/* MOBILE CARD VIEW (< md) */}
                                        <div className="md:hidden divide-y divide-slate-100">
                                            {admins.map(admin => (
                                                <div key={admin.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                                                    {/* Header: Name, Badges & Status */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-bold text-slate-900 text-sm sm:text-base">{admin.name}</span>
                                                                {admin.is_superadmin && (
                                                                    <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">SuperAdmin</span>
                                                                )}
                                                                {admin.name.includes('[Invalid Email]') && (
                                                                    <span className="text-[11px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Invalid Email</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-normal break-all mt-0.5 select-all">{admin.email}</p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${admin.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {admin.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>

                                                    {/* Info Grid: Access Code & Counts */}
                                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                                                        <div>
                                                            <span className="text-slate-400 block text-[11px]">Access Code</span>
                                                            <span className="font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-100 inline-block mt-0.5">
                                                                {admin.access_code || '-'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col justify-center text-right">
                                                            <span className="text-slate-700 font-semibold">{admin.trainings_count || 0} Modules</span>
                                                            <span className="text-slate-500 text-[11px]">{admin.candidates_count || 0} Candidates</span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    {!admin.is_superadmin ? (
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <button
                                                                onClick={() => handleResendCode(admin.id, admin.email)}
                                                                disabled={sendingCodeId === admin.id}
                                                                className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                                            >
                                                                {sendingCodeId === admin.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                                                Resend Code
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAdmin(admin.id)}
                                                                className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] text-slate-400 italic font-medium pt-0.5">System Protected Administrator</div>
                                                    )}
                                                </div>
                                            ))}
                                            {admins.length === 0 && (
                                                <div className="p-8 text-center text-slate-500 text-sm">No active admins found.</div>
                                            )}
                                        </div>

                                        {/* DESKTOP TABLE VIEW (>= md) */}
                                        <div className="hidden md:block overflow-x-auto overscroll-x-contain">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Access Code</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Training Modules</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Candidates</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {admins.map(admin => (
                                                        <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                                <div className="flex items-center flex-wrap gap-1.5">
                                                                    <span>{admin.name}</span>
                                                                    {admin.is_superadmin && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">SuperAdmin</span>}
                                                                    {admin.name.includes('[Invalid Email]') && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Invalid Email</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-600 text-sm">{admin.email}</td>
                                                            <td className="px-6 py-4 font-mono font-bold text-purple-600 text-sm">{admin.access_code || '-'}</td>
                                                            <td className="px-6 py-4 text-slate-600 text-sm">{admin.trainings_count}</td>
                                                            <td className="px-6 py-4 text-slate-600 text-sm">{admin.candidates_count}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${admin.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {admin.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {admin.is_superadmin ? (
                                                                    <span className="text-xs text-slate-400 font-semibold italic">System Protected</span>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleResendCode(admin.id, admin.email)}
                                                                            disabled={sendingCodeId === admin.id}
                                                                            className="text-slate-400 hover:text-purple-600 transition-colors p-1.5 rounded-lg hover:bg-purple-50 cursor-pointer disabled:opacity-50"
                                                                            title="Resend Access Code via Email"
                                                                        >
                                                                            {sendingCodeId === admin.id ? (
                                                                                <Loader className="w-4 h-4 animate-spin text-purple-600" />
                                                                            ) : (
                                                                                <Mail className="w-4 h-4" />
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteAdmin(admin.id)}
                                                                            className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                                                            title="Delete Admin"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {admins.length === 0 && (
                                                        <tr>
                                                            <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No active admins found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* GLOBAL CANDIDATES TAB */}
                            {activeTab === 'candidates' && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <select
                                            value={selectedAdminFilter || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedAdminFilter(val);
                                                setSelectedTrainingFilter('');
                                            }}
                                            className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-500 text-sm shadow-sm"
                                        >
                                            <option value="">All Admins</option>
                                            {admins.map(admin => (
                                                <option key={admin.id} value={admin.id}>{admin.name} ({admin.trainings_count} courses)</option>
                                            ))}
                                        </select>

                                        <select
                                            value={selectedTrainingFilter || ''}
                                            onChange={async (e) => {
                                                const val = e.target.value;
                                                setSelectedTrainingFilter(val);
                                                if (val) {
                                                    setLoadingCandidates(true);
                                                    try {
                                                        const res = await fetch(`/api/superadmin/trainings/${val}/candidates/`);
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            setFilteredCandidates(data);
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                    } finally {
                                                        setLoadingCandidates(false);
                                                    }
                                                } else {
                                                    setFilteredCandidates(null);
                                                }
                                            }}
                                            disabled={!selectedAdminFilter}
                                            className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:bg-slate-100 text-sm shadow-sm"
                                        >
                                            <option value="">Select Course</option>
                                            {trainings
                                                .filter(t => !selectedAdminFilter || t.created_by_id === parseInt(selectedAdminFilter))
                                                .map(t => (
                                                    <option key={t.id} value={t.id}>{t.title} ({t.enrollments_count} students)</option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        {/* MOBILE CARD VIEW (< md) */}
                                        <div className="md:hidden divide-y divide-slate-100">
                                            {loadingCandidates ? (
                                                <div className="p-8 text-center text-slate-500"><Loader className="w-6 h-6 animate-spin mx-auto text-purple-600" /></div>
                                            ) : (selectedTrainingFilter && filteredCandidates ? filteredCandidates : candidates).length > 0 ? (
                                                (selectedTrainingFilter && filteredCandidates ? filteredCandidates : candidates).map(candidate => {
                                                    const candidateName = candidate.name || candidate.email.split('@')[0].replace(/[0-9]/g, '').replace(/_/g, ' ').replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                                    const dateStr = (selectedTrainingFilter ? candidate.enrolled_at : candidate.created_at) ? new Date(selectedTrainingFilter ? candidate.enrolled_at : candidate.created_at).toLocaleDateString() : '-';
                                                    return (
                                                        <div key={candidate.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                                                            {/* Header: Name and Status */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">{candidateName}</h4>
                                                                    <p className="text-xs text-slate-500 break-all select-all mt-0.5">{candidate.email}</p>
                                                                </div>
                                                                {selectedTrainingFilter && candidate.status && (
                                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${candidate.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                        {candidate.status}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Course Info */}
                                                            {!selectedTrainingFilter && (
                                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                                    <span className="text-[11px] text-slate-400 block mb-1 font-medium">Enrolled Courses:</span>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {candidate.enrolled_courses && candidate.enrolled_courses.length > 0 ? (
                                                                            candidate.enrolled_courses.map((course, idx) => (
                                                                                <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-semibold border border-indigo-100">
                                                                                    {course}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-slate-400 text-xs italic">No courses enrolled</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Footer: Date & Delete */}
                                                            <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs text-slate-500">
                                                                <span>{selectedTrainingFilter ? 'Enrolled:' : 'Added:'} {dateStr}</span>
                                                                <button
                                                                    onClick={() => handleDeleteCandidate(candidate.id)}
                                                                    className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                                    title="Delete Candidate"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 mr-0.5" />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-8 text-center text-slate-500 text-sm">
                                                    No candidates found {selectedTrainingFilter ? 'in this course' : ''}.
                                                </div>
                                            )}
                                        </div>

                                        {/* DESKTOP TABLE VIEW (>= md) */}
                                        <div className="hidden md:block overflow-x-auto overscroll-x-contain">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">{selectedTrainingFilter ? 'Status' : 'Enrolled Courses'}</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">{selectedTrainingFilter ? 'Enrolled At' : 'Created At'}</th>
                                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {loadingCandidates ? (
                                                        <tr><td colSpan="5" className="p-8 text-center text-slate-500"><Loader className="w-6 h-6 animate-spin mx-auto text-purple-600" /></td></tr>
                                                    ) : (selectedTrainingFilter && filteredCandidates ? filteredCandidates : candidates).length > 0 ? (
                                                        (selectedTrainingFilter && filteredCandidates ? filteredCandidates : candidates).map(candidate => (
                                                            <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-6 py-4 font-medium text-slate-900 text-sm">
                                                                    {candidate.name || candidate.email.split('@')[0].replace(/[0-9]/g, '').replace(/_/g, ' ').replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-600 text-sm">{candidate.email}</td>

                                                                {/* Course Info Column */}
                                                                {selectedTrainingFilter ? (
                                                                    <td className="px-6 py-4">
                                                                        {candidate.status ? (
                                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${candidate.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                                {candidate.status}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-400 text-xs">-</span>
                                                                        )}
                                                                    </td>
                                                                ) : (
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {candidate.enrolled_courses && candidate.enrolled_courses.length > 0 ? (
                                                                                candidate.enrolled_courses.map((course, idx) => (
                                                                                    <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-semibold border border-indigo-100">
                                                                                        {course}
                                                                                    </span>
                                                                                ))
                                                                            ) : (
                                                                                <span className="text-slate-400 text-sm">-</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                )}

                                                                <td className="px-6 py-4 text-slate-600 text-sm">
                                                                    {(selectedTrainingFilter ? candidate.enrolled_at : candidate.created_at) ? new Date(selectedTrainingFilter ? candidate.enrolled_at : candidate.created_at).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <button
                                                                        onClick={() => handleDeleteCandidate(candidate.id)}
                                                                        className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                                                        title="Delete Candidate"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                                No candidates found {selectedTrainingFilter ? 'in this course' : ''}.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* GLOBAL TRAININGS TAB */}
                            {activeTab === 'trainings' && (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* MOBILE CARD VIEW (< md) */}
                                    <div className="md:hidden divide-y divide-slate-100">
                                        {trainings.map(t => (
                                            <div key={t.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{t.title}</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">By: <span className="font-medium text-slate-700">{t.created_by}</span></p>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                                                        {t.questions_count} Qs
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs text-slate-500">
                                                    <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                                                    <button
                                                        onClick={() => handleDeleteTraining(t.id)}
                                                        className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="Delete Training"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-0.5" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {trainings.length === 0 && (
                                            <div className="p-8 text-center text-slate-500 text-sm">No trainings found.</div>
                                        )}
                                    </div>

                                    {/* DESKTOP TABLE VIEW (>= md) */}
                                    <div className="hidden md:block overflow-x-auto overscroll-x-contain">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Title</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Created By</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Questions</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Date</th>
                                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {trainings.map(t => (
                                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-slate-900 text-sm">{t.title}</td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm">{t.created_by}</td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm">{t.questions_count}</td>
                                                        <td className="px-6 py-4 text-slate-600 text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => handleDeleteTraining(t.id)}
                                                                className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                                                title="Delete Training"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Add Admin Modal */}
            {
                showAddAdminModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-8 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92dvh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">Add New Admin</h3>
                                <button onClick={() => setShowAddAdminModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateAdmin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAdminData.name}
                                        onChange={e => setNewAdminData({ ...newAdminData, name: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${formErrors.name ? 'border-red-500' : 'border-slate-200'} focus:border-purple-500 focus:ring-0 outline-none`}
                                        placeholder="Admin Name"
                                    />
                                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={newAdminData.email}
                                        onChange={e => setNewAdminData({ ...newAdminData, email: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${formErrors.email ? 'border-red-500' : 'border-slate-200'} focus:border-purple-500 focus:ring-0 outline-none`}
                                        placeholder="admin@example.com"
                                    />
                                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Training Limit</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={newAdminData.training_limit}
                                            onChange={e => setNewAdminData({ ...newAdminData, training_limit: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-0 outline-none"
                                            placeholder="Unlimited"
                                        />
                                        <p className="text-slate-400 text-xs mt-1">Leave blank for unlimited</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Student Limit</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={newAdminData.student_limit}
                                            onChange={e => setNewAdminData({ ...newAdminData, student_limit: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-0 outline-none"
                                            placeholder="Unlimited"
                                        />
                                        <p className="text-slate-400 text-xs mt-1">Leave blank for unlimited</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Total Enrollment Limit (Course–Student pairs)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newAdminData.enrollment_limit}
                                        onChange={e => setNewAdminData({ ...newAdminData, enrollment_limit: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-0 outline-none"
                                        placeholder="Unlimited"
                                    />
                                    <p className="text-slate-400 text-xs mt-1">Leave blank for unlimited</p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 transition-all mt-6 shadow-lg shadow-purple-200"
                                >
                                    Create Admin
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Success Modal showing Credentials */}
            {
                showSuccessModal && createdAdmin && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-8 animate-in fade-in zoom-in-95 duration-200 text-center my-auto max-h-[92dvh] overflow-y-auto">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Admin Created Successfully!</h3>
                            <p className="text-emerald-600 font-semibold text-sm mb-2">
                                New Admin account is now active and ready to log in.
                            </p>
                            <p className="text-slate-500 text-sm mb-6">
                                Share these credentials with the new administrator:
                            </p>

                            <div className="bg-slate-50 p-4 rounded-xl text-left space-y-3 border border-slate-100 mb-6">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Login ID (Email)</span>
                                    <div className="text-lg font-mono font-bold text-slate-800 break-all">{createdAdmin.email}</div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Password</span>
                                    <div className="text-lg font-mono font-bold text-purple-600">{createdAdmin.password}</div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Access Code</span>
                                    <div className="text-lg font-mono font-bold text-indigo-600">{createdAdmin.access_code}</div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`Email: ${createdAdmin.email}\nPassword: ${createdAdmin.password}\nAccess Code: ${createdAdmin.access_code}\nLogin URL: ${window.location.origin}/admin/login`);
                                        alert("Credentials copied to clipboard!");
                                    }}
                                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-all cursor-pointer shadow-md shadow-purple-200 text-sm"
                                >
                                    Copy Credentials
                                </button>
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all cursor-pointer text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};


export default SuperAdminDashboard;
