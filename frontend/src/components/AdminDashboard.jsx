import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BookOpen, Users, UserCheck, BarChart3 } from 'lucide-react';
import { setClasses, setTeachers, setStudents, setExams, setSchool } from '../store/slices/adminSlice';
import AdminLayout from './admin/AdminLayout';
import ClassesManager from './admin/sections/ClassesManager';
import TeachersManager from './admin/sections/TeachersManager';
import StudentsManager from './admin/sections/StudentsManager';
import AssignSubjects from './admin/sections/AssignSubjects';
import ResultProcess from './admin/sections/ResultProcess';
import ResultOverview from './admin/sections/ResultOverview';
import AdminSettings from './admin/sections/AdminSettings';
import SchoolProfile from './admin/sections/SchoolProfile';

const AdminDashboardHome = () => {
  const { classes, teachers, students, exams } = useSelector(state => state.admin);

  const stats = [
    { 
      label: 'Classes', 
      value: classes.length, 
      color: 'blue', 
      icon: <BookOpen size={24} /> 
    },
    { 
      label: 'Teachers', 
      value: teachers.length, 
      color: 'emerald', 
      icon: <Users size={24} /> 
    },
    { 
      label: 'Students', 
      value: students.length, 
      color: 'purple', 
      icon: <UserCheck size={24} /> 
    },
    { 
      label: 'Exams', 
      value: exams.length, 
      color: 'orange', 
      icon: <BarChart3 size={24} /> 
    }
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50/50', text: 'text-blue-500', shadow: 'shadow-blue-100/50' },
    emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-500', shadow: 'shadow-emerald-100/50' },
    purple: { bg: 'bg-purple-50/50', text: 'text-purple-500', shadow: 'shadow-purple-100/50' },
    orange: { bg: 'bg-orange-50/50', text: 'text-orange-500', shadow: 'shadow-orange-100/50' }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 animate-in fade-in duration-700">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50 group hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-500 flex flex-col items-start">
          <div className={`w-14 h-14 ${colorMap[stat.color].bg} rounded-2xl flex items-center justify-center ${colorMap[stat.color].text} mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm ${colorMap[stat.color].shadow}`}>
            {stat.icon}
          </div>
          <h4 className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[11px] mb-2">{stat.label}</h4>
          <p className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [clsRes, tchRes, stuRes, examRes, schoolRes] = await Promise.all([
          fetch('/api/classes', { headers: { 'Authorization': `Bearer ${user.token}` } }),
          fetch('/api/teachers', { headers: { 'Authorization': `Bearer ${user.token}` } }),
          fetch('/api/students', { headers: { 'Authorization': `Bearer ${user.token}` } }),
          fetch('/api/admin/exams', { headers: { 'Authorization': `Bearer ${user.token}` } }),
          fetch('/api/school')
        ]);

        if (clsRes.ok) dispatch(setClasses(await clsRes.json()));
        if (tchRes.ok) dispatch(setTeachers(await tchRes.json()));
        if (stuRes.ok) dispatch(setStudents(await stuRes.json()));
        if (examRes.ok) dispatch(setExams(await examRes.json()));
        if (schoolRes.ok) dispatch(setSchool(await schoolRes.json()));

      } catch (err) {
        console.error('Failed to load initial admin data', err);
      }
    };
    if (user?.token) fetchAllData();
  }, [dispatch, user]);

  const renderSection = () => {
    switch(activeMenu) {
      case 'Dashboard': return <AdminDashboardHome />;
      case 'Classes': return <ClassesManager />;
      case 'Teachers': return <TeachersManager />;
      case 'Students': return <StudentsManager />;
      case 'AssignSubjects': return <AssignSubjects />;
      case 'ResultProcess': return <ResultProcess />;
      case 'ResultOverview': return <ResultOverview />;
      case 'SchoolProfile': return <SchoolProfile />;
      case 'Settings': return <AdminSettings />;
      default: return <div className="p-12 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{activeMenu}</h2>
        <p>This module is under development.</p>
      </div>;
    }
  };

  return (
    <AdminLayout activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
      {renderSection()}
    </AdminLayout>
  );
};

export default AdminDashboard;
