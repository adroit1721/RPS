import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
// Keeping it simple, no direct redux action needed if we just fetch and list, 
// but we'll manage local state for the form

const AssignSubjects = () => {
  const { classes, teachers } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ teacherId: '', classId: '', subjectName: '' });
  const [loading, setLoading] = useState(false);

  // Derived state for subjects of the selected class
  const selectedClass = classes.find(c => c._id === form.classId);
  const availableSubjects = selectedClass?.subjects || [];

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/admin/assignments', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch(err) {
      toast.error('Failed to load assignments');
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if(res.ok){
        toast.success('Subject assigned successfully!');
        setForm({ ...form, subjectName: '' }); // Reset subject, keep teacher/class for rapid entry
        fetchAssignments();
      } else {
        toast.error(data.msg || 'Error assigning subject');
      }
    } catch(err) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this assignment?')) return;
    try {
      const res = await fetch(`/api/admin/assignments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if(res.ok) {
        toast.success('Assignment deleted');
        fetchAssignments();
      }
    } catch(err) {
      toast.error('Error deleting assignment');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight mb-4">Assign Subject to Faculty</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-5">
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Select Faculty</label>
            <select 
              value={form.teacherId} 
              onChange={e => setForm({...form, teacherId: e.target.value})} 
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" 
              required
            >
              <option value="" disabled>Select Teacher</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.id})</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Assigned Class</label>
            <select 
              value={form.classId} 
              onChange={e => setForm({...form, classId: e.target.value, subjectName: ''})} 
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" 
              required
            >
              <option value="" disabled>Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Subject Area</label>
            <select 
              value={form.subjectName} 
              onChange={e => setForm({...form, subjectName: e.target.value})} 
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" 
              required
              disabled={!form.classId}
            >
              <option value="" disabled>Select Subject</option>
              {availableSubjects.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1 text-sm">
              {loading ? 'Processing...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Faculty Member</th>
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Target Class</th>
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Subject Domains</th>
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No assignments logged</td></tr>
              ) : assignments.map(a => (
                <tr key={a._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-black text-slate-800 text-sm italic tracking-tight">{a.teacherId?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 font-bold text-slate-600 text-xs">{a.classId?.name || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(a.subjects || [a.subjectName]).map((sub, i) => (
                        <span key={i} className="bg-white text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border border-indigo-100 shadow-sm">{sub}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(a._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90" title="Revoke access">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignSubjects;
