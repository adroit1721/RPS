import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const AdminSettings = () => {
  const { user } = useSelector(state => state.auth);

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
      const res = await fetch('/api/admin/password', {
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
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-4xl font-black shadow-lg border-4 border-white/20">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <h2 className="text-3xl font-black mb-1">{user?.username || 'Administrator'}</h2>
            <p className="text-slate-400 font-medium bg-white/10 px-3 py-1 rounded-full inline-block text-sm">System Administrator</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
            <input 
              type="password" 
              value={form.oldPassword}
              onChange={e => setForm({...form, oldPassword: e.target.value})}
              className="w-full p-4 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
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
                className="w-full p-4 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <input 
                type="password" 
                value={form.confirmPassword}
                onChange={e => setForm({...form, confirmPassword: e.target.value})}
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                required 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_8px_16px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_16px_rgba(37,99,235,0.4)] transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? 'Updating Credentials...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
