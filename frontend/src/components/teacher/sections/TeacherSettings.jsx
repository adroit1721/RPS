import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateUser } from '../../../store/slices/authSlice';

const TeacherSettings = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/teachers/password', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ oldPassword: form.oldPassword, newPassword: form.newPassword })
      });
      const data = await res.json();
      if(res.ok){
        toast.success('Password updated successfully!');
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.msg || 'Failed to update password');
      }
    } catch(err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-white text-indigo-800 flex items-center justify-center text-4xl font-black shadow-lg border-4 border-indigo-300">
            {user?.name?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div>
            <h2 className="text-3xl font-black mb-1">{user?.name || 'Teacher Name'}</h2>
            <p className="text-indigo-200 font-mono bg-indigo-950/50 px-3 py-1 rounded-lg inline-block text-sm border border-indigo-700">{user?.id || 'ID NOT SET'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Security Settings
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
            <input 
              type="password" 
              value={form.oldPassword}
              onChange={e => setForm({...form, oldPassword: e.target.value})}
              className="w-full p-4 border-2 border-indigo-50 rounded-xl bg-indigo-50/30 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input 
                type="password" 
                value={form.newPassword}
                onChange={e => setForm({...form, newPassword: e.target.value})}
                className="w-full p-4 border-2 border-indigo-50 rounded-xl bg-indigo-50/30 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <input 
                type="password" 
                value={form.confirmPassword}
                onChange={e => setForm({...form, confirmPassword: e.target.value})}
                className="w-full p-4 border-2 border-indigo-50 rounded-xl bg-indigo-50/30 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                required 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-indigo-50">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_8px_16px_rgba(79,70,229,0.2)] hover:shadow-[0_8px_16px_rgba(79,70,229,0.4)] transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? 'Securing Account...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherSettings;
