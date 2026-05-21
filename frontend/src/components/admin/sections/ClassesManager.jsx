import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { setClasses } from '../../../store/slices/adminSlice';

const ClassesManager = () => {
  const dispatch = useDispatch();
  const { classes } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  const [form, setForm] = useState({ name: '', subjects: '' });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if(res.ok) dispatch(setClasses(data));
    } catch(err) {
      toast.error('Failed to load classes');
    }
  }, [dispatch, user.token]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const subjectsArray = form.subjects.split(',').map(s => s.trim()).filter(s => s).map(s => ({ name: s }));
      const url = editId ? `/api/classes/${editId}` : '/api/classes';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name: form.name, subjects: subjectsArray })
      });
      const data = await res.json();
      if(res.ok){
        toast.success(editId ? 'Class updated successfully!' : 'Class added successfully!');
        setForm({ name: '', subjects: '' });
        setEditId(null);
        fetchClasses();
      } else {
        toast.error(data.msg || 'Error saving class');
      }
    } catch(err) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handleEdit = (cls) => {
    setEditId(cls._id);
    setForm({
      name: cls.name,
      subjects: cls.subjects ? cls.subjects.map(s => s.name).join(', ') : ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.success('Class deleted successfully!');
        fetchClasses();
      } else {
        toast.error('Failed to delete class');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">{editId ? 'Modify Academic Class' : 'Define New Class'}</h3>
          {editId && (
            <button 
              type="button" 
              onClick={() => { setEditId(null); setForm({ name: '', subjects: '' }); }}
              className="text-xs font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Class Identity</label>
            <input 
              type="text"
              placeholder="e.g. Class 10-A"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm sm:text-base"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Subject Matrix</label>
            <input 
              type="text"
              placeholder="Math, English, Science (comma separated)"
              value={form.subjects}
              onChange={e => setForm({...form, subjects: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm sm:text-base"
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end mt-2">
            <button type="submit" disabled={loading} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1 text-sm">
              {loading ? 'Processing...' : editId ? 'Update Curriculum' : 'Register Class'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Class Identifier</th>
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Subject Matrix</th>
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr><td colSpan="3" className="px-4 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No classes registered</td></tr>
              ) : classes.map(cls => (
                <tr key={cls._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-black text-slate-800 text-sm italic tracking-tight">{cls.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex flex-wrap gap-1">
                      {cls.subjects?.map((sub, i) => (
                        <span key={i} className="bg-white text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border border-indigo-100 shadow-sm">{sub.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                       <button onClick={() => handleEdit(cls)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90" title="Modify Class">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(cls._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90" title="Delete record">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
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

export default ClassesManager;
