import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import TeacherLayout from './teacher/TeacherLayout';
import MarksInput from './teacher/sections/MarksInput';
import TeacherSettings from './teacher/sections/TeacherSettings';

const TeacherDashboardHome = () => {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState({ assignedClassesCount: 0, pendingSubmissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/teachers/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.token]);

  if (loading) return <div className="p-8 text-center text-indigo-600 font-bold">Loading stats...</div>;

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black mb-3 tracking-tight">Welcome back, {user?.name || 'Teacher'}! 👋</h2>
          <p className="text-indigo-100 text-xs sm:text-base font-bold tracking-wide transition-all opacity-90">Manage your assigned classes and record academic excellence.</p>
        </div>
        <div className="absolute right-[-20px] top-[-20px] w-64 h-64 sm:w-80 sm:h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute left-[-20px] bottom-[-20px] w-48 h-48 sm:w-64 sm:h-64 bg-indigo-400/20 rounded-full blur-2xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-morphism p-8 sm:p-10 rounded-[2.5rem] border border-white/20 shadow-xl shadow-indigo-900/5 group hover:scale-[1.02] transition-all duration-300">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:rotate-12 transition-transform">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] sm:text-xs mb-1">Assigned Classes</p>
            <p className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter">{stats.assignedClassesCount}</p>
          </div>
        </div>

        <div className="glass-morphism p-8 sm:p-10 rounded-[2.5rem] border border-white/20 shadow-xl shadow-rose-900/5 group hover:scale-[1.02] transition-all duration-300">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-rose-500 mb-6 group-hover:rotate-12 transition-transform">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] sm:text-xs mb-1">Pending Records</p>
            <p className="text-3xl sm:text-5xl font-black text-rose-500 tracking-tighter">{stats.pendingSubmissions}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const renderSection = () => {
    switch(activeMenu) {
      case 'Dashboard': return <TeacherDashboardHome />;
      case 'MarksInput': return <MarksInput />;
      case 'Settings': return <TeacherSettings />;
      default: return <TeacherDashboardHome />;
    }
  };

  return (
    <TeacherLayout activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
      {renderSection()}
    </TeacherLayout>
  );
};

export default TeacherDashboard;
