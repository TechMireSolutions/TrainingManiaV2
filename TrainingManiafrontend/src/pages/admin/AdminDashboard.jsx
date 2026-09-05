import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  LogOut,
  Bell,
  Search,
  CheckCircle,
  Plus,
  UserCheck,
  BarChart2,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import NewTraining from './NewTraining';
import TrainingList from './TrainingList';
import CandidateRegistration from './CandidateRegistration';
import Enrollment from './Enrollment';
import Reports from './Reports';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('new-training');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      if (!adminInfo) return;

      const res = await fetch('/api/admin/notifications/', {
        headers: { 'X-Admin-ID': adminInfo.id }
      });

      const data = await res.json();

      if (res.ok) {
        setNotifications(data);
      } else if (res.status === 401 && data.error === 'Please register yourself first') {
        // Admin deleted or invalid
        alert(data.error);
        localStorage.removeItem('adminInfo');
        navigate('/');
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    navigate('/');
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false); // Close sidebar on mobile when item clicked
      }}
      className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group cursor-pointer ${activeTab === id
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
        : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="h-screen bg-slate-50 flex font-sans overflow-hidden text-slate-900">
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
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">Training</h1>
              <span className="text-indigo-600 font-semibold text-sm">Mania</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-2 overflow-y-auto">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</div>
          <NavItem id="new-training" icon={Plus} label="New Training" />
          <NavItem id="modules" icon={BookOpen} label="Training Modules" />
          <NavItem id="candidates" icon={Users} label="Candidates" />
          <NavItem id="register" icon={UserCheck} label="Register" />
          <NavItem id="reports" icon={BarChart2} label="Reports" />
        </nav>

        <div className="p-6 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md z-20 border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-indigo-600 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1"></div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
              >
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                    <button onClick={() => setNotifications([])} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer">Mark all read</button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'enrollment' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                          <div>
                            <p className="text-sm text-slate-700 font-medium leading-snug mb-1">{n.text}</p>
                            <p className="text-xs text-slate-400 font-medium">{n.time}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-medium">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">
                  {JSON.parse(localStorage.getItem('adminInfo'))?.email.split('@')[0].replace(/[0-9]/g, '').replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Admin User'}
                </p>
                <p className="text-xs text-slate-500">
                  {JSON.parse(localStorage.getItem('adminInfo'))?.is_superadmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                {(JSON.parse(localStorage.getItem('adminInfo'))?.email?.charAt(0).toUpperCase()) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'new-training' ? (
            <NewTraining />
          ) : activeTab === 'modules' ? (
            <TrainingList onCreateNew={() => setActiveTab('new-training')} />
          ) : activeTab === 'candidates' ? (
            <CandidateRegistration />
          ) : activeTab === 'register' ? (
            <Enrollment onActionComplete={fetchNotifications} />
          ) : activeTab === 'reports' ? (
            <Reports />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select "New Training" from the sidebar to start.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
