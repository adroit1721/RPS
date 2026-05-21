import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const ResultProcess = () => {
  const { user } = useSelector(state => state.auth);
  const { classes } = useSelector(state => state.admin);
  
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ name: '', classId: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/admin/exams', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch(err) {
      toast.error('Failed to load exams');
    }
  };

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeclare = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/admin/exams/${editId}` : '/api/admin/exams';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if(res.ok){
        toast.success(editId ? 'Exam updated successfully!' : 'Exam declared successfully!');
        setForm({ name: '', classId: '', deadline: '' });
        setEditId(null);
        fetchExams();
      } else {
        toast.error(data.msg || 'Error saving exam');
      }
    } catch(err) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handlePublishToggle = async (id, currentStatus) => {
    if(!window.confirm(`Are you sure you want to ${currentStatus ? 'UNPUBLISH' : 'PUBLISH'} this result?`)) return;
    try {
      const res = await fetch(`/api/admin/exams/${id}/publish`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus })
      });
      if(res.ok) {
        toast.success(`Result ${!currentStatus ? 'Published' : 'Unpublished'}`);
        fetchExams();
      } else {
        toast.error('Failed to update status');
      }
    } catch(err) {
      toast.error('Network error');
    }
  };

  const handleEdit = (exam) => {
    setEditId(exam._id);
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(new Date(exam.deadline) - tzoffset)).toISOString().slice(0, 16);
    setForm({
      name: exam.name,
      classId: exam.classId?._id || exam.classId,
      deadline: localISOTime
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam? High risk action.')) return;
    try {
      const res = await fetch(`/api/admin/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.success('Exam deleted successfully');
        fetchExams();
      } else {
        toast.error('Failed to delete exam');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-700">
      <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl shadow-rose-200/50 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl sm:text-3xl font-black mb-1.5 tracking-tighter">Academic Coordinator</h2>
          <p className="opacity-90 font-bold text-[10px] sm:text-sm leading-relaxed max-w-2xl">Initialize examinations, enforce grading deadlines, and orchestrate final result dissemination across the institution.</p>
        </div>
        <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute left-[-20px] bottom-[-20px] w-48 h-48 bg-orange-400/20 rounded-full blur-2xl" />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">{editId ? 'Modify Examination Details' : 'Declare New Assessment'}</h3>
          {editId && (
            <button 
              type="button" 
              onClick={() => { setEditId(null); setForm({ name: '', classId: '', deadline: '' }); }}
              className="text-xs font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleDeclare} className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-5 items-end">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Exam Designation</label>
            <input 
              type="text" placeholder="e.g. Final Term 2024" 
              value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-slate-700 text-sm" required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Target Class</label>
            <select 
              value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-slate-700 text-sm" required
            >
              <option value="" disabled>Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Submission Deadline</label>
            <input 
              type="datetime-local" 
              value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-slate-700 text-sm" required 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-95 text-sm">
            {loading ? 'Processing...' : editId ? 'Update Exam' : 'Initialize Exam'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {exams.map(exam => (
          <div key={exam._id} className={`p-5 sm:p-6 rounded-2xl border-2 transition-all duration-500 group ${exam.isPublished ? 'bg-emerald-50/30 border-emerald-200 shadow-emerald-100' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2.5 py-1 rounded-lg mb-2 inline-block uppercase tracking-widest border border-slate-200 shadow-sm">
                  {exam.classId?.name}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">{exam.name}</h3>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-sm ${new Date(exam.deadline) < new Date() ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-500 shadow-emerald-200'}`}></div>
            </div>
            
            <div className="text-[11px] sm:text-xs text-slate-500 mb-6 space-y-2 font-bold">
              <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                 <p className="tracking-tight">{new Date(exam.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <div className="flex items-center gap-2">
                 <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${exam.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={exam.isPublished ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                 </div>
                 <p className={`tracking-tight uppercase font-black text-[10px] ${exam.isPublished ? 'text-emerald-600' : 'text-amber-500'}`}>{exam.isPublished ? 'Publicly Released' : 'Data Acquisition Phase'}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => handlePublishToggle(exam._id, exam.isPublished)}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all focus:outline-none ${
                  exam.isPublished 
                    ? 'bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 active:scale-95'
                }`}
              >
                {exam.isPublished ? 'Revoke Rights' : 'Authorize Release'}
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(exam)} 
                  className="bg-slate-50 hover:bg-slate-100 text-slate-500 p-3 rounded-xl transition-all group/edit active:scale-90 border border-slate-100"
                  title="Modify Declaration"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button 
                  onClick={() => handleDelete(exam._id)} 
                  className="bg-rose-50/50 hover:bg-rose-50 text-rose-500 p-3 rounded-xl transition-all group/del active:scale-90 border border-rose-100/50"
                  title="Expunge Assessment"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        {exams.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs bg-white rounded-3xl border-2 border-dashed border-slate-100">No examination sequences initialized.</div>}
      </div>
    </div>
  );
};

export default ResultProcess;
