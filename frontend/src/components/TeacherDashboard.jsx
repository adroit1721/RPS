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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-2xl shadow-lg text-white">
        <h2 className="text-3xl font-black mb-2">Welcome back, {user?.name || 'Teacher'}! 👋</h2>
        <p className="opacity-90">Manage your assigned classes and input student marks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex items-center space-x-6">
          <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold mb-1">Assigned Classes</p>
            <p className="text-4xl font-black text-gray-800">{stats.assignedClassesCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center space-x-6">
          <div className="p-4 bg-orange-50 rounded-xl text-orange-600">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold mb-1">Pending Exam Submissions</p>
            <p className="text-4xl font-black text-orange-500">{stats.pendingSubmissions}</p>
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
