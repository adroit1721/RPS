import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const TeacherSettings = () => {
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
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] bg-white text-indigo-800 flex items-center justify-center text-3xl sm:text-4xl font-black shadow-2xl border-4 border-indigo-200/50 transition-transform hover:rotate-3">
            {user?.name?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div className="pt-1">
            <h2 className="text-2xl sm:text-3xl font-black mb-1.5 tracking-tighter leading-none">{user?.name || 'Faculty Member'}</h2>
            <div className="flex flex-col sm:flex-row items-center gap-2">
               <p className="text-indigo-200 font-bold bg-indigo-950/40 px-3 py-1 rounded-xl inline-block text-[9px] sm:text-[10px] border border-indigo-700/50 uppercase tracking-widest backdrop-blur-md">Employee ID: {user?.id || 'PENDING'}</p>
               <span className="hidden sm:inline-block w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-200" />
               <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Active Personnel</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
           </div>
           <div>
              <h3 className="text-base sm:text-xl font-black text-slate-800 tracking-tight">Access Credentials</h3>
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">Maintain your security authentication</p>
           </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Current Authentication Token</label>
            <input 
              type="password" 
              value={form.oldPassword}
              onChange={e => setForm({...form, oldPassword: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" 
              placeholder="••••••••••••"
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Generate New Password</label>
              <input 
                type="password" 
                value={form.newPassword}
                onChange={e => setForm({...form, newPassword: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" 
                placeholder="New Access Code"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Verify New Code</label>
              <input 
                type="password" 
                value={form.confirmPassword}
                onChange={e => setForm({...form, confirmPassword: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" 
                placeholder="Repeat Access Code"
                required 
              />
            </div>
          </div>
          
          <div className="pt-5 sm:pt-8 border-t border-slate-50">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Rotate Security Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherSettings;
