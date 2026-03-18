import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setClasses, setTeachers, setStudents, setExams } from '../store/slices/adminSlice';
import AdminLayout from './admin/AdminLayout';
import ClassesManager from './admin/sections/ClassesManager';
import TeachersManager from './admin/sections/TeachersManager';
import StudentsManager from './admin/sections/StudentsManager';
import AssignSubjects from './admin/sections/AssignSubjects';
import ResultProcess from './admin/sections/ResultProcess';
import ResultOverview from './admin/sections/ResultOverview';
import AdminSettings from './admin/sections/AdminSettings';

const AdminDashboardHome = () => {
  const { classes, teachers, students, exams } = useSelector(state => state.admin);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
        <h4 className="text-gray-500 font-medium mb-1">Total Classes</h4>
        <p className="text-3xl font-black text-gray-800">{classes.length}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
        <h4 className="text-gray-500 font-medium mb-1">Total Teachers</h4>
        <p className="text-3xl font-black text-gray-800">{teachers.length}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
        <h4 className="text-gray-500 font-medium mb-1">Total Students</h4>
        <p className="text-3xl font-black text-gray-800">{students.length}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
        <h4 className="text-gray-500 font-medium mb-1">Total Exams</h4>
        <p className="text-3xl font-black text-gray-800">{exams.length}</p>
      </div>
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
        const [clsRes, tchRes, stuRes, examRes] = await Promise.all([
          fetch('/api/classes', { headers: { 'Authorization': `Bearer ${user.token}` } }),
          fetch('/api/teachers', { headers: { 'Authorization': `Bearer ${user.token}` } }),
          fetch('/api/students', { headers: { 'Authorization': `Bearer ${user.token}` } }),
          fetch('/api/admin/exams', { headers: { 'Authorization': `Bearer ${user.token}` } })
        ]);

        if (clsRes.ok) dispatch(setClasses(await clsRes.json()));
        if (tchRes.ok) dispatch(setTeachers(await tchRes.json()));
        if (stuRes.ok) dispatch(setStudents(await stuRes.json()));
        if (examRes.ok) dispatch(setExams(await examRes.json()));
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
