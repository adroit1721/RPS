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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-8 rounded-2xl shadow-lg text-white">
        <h2 className="text-3xl font-black mb-2">Result Process & Coordinator</h2>
        <p className="opacity-90">Declare exams, set deadlines for teachers, and finalize results.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{editId ? 'Edit Exam' : 'Declare New Exam'}</h3>
          {editId && (
            <button 
              type="button" 
              onClick={() => { setEditId(null); setForm({ name: '', classId: '', deadline: '' }); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleDeclare} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Exam Name</label>
            <input 
              type="text" placeholder="e.g. Final Term 2024" 
              value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 outline-none" required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Target Class</label>
            <select 
              value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 outline-none" required
            >
              <option value="" disabled>Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Teacher Deadline</label>
            <input 
              type="datetime-local" 
              value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 outline-none" required 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all h-[52px]">
            {loading ? 'Saving...' : editId ? 'Update Exam' : 'Declare Exam'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => (
          <div key={exam._id} className={`p-6 rounded-2xl border-2 transition-all ${exam.isPublished ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg mb-2 inline-block">
                  {exam.classId?.name}
                </span>
                <h3 className="text-xl font-bold text-gray-800">{exam.name}</h3>
              </div>
              <div className={`w-3 h-3 rounded-full ${new Date(exam.deadline) < new Date() ? 'bg-red-500' : 'bg-green-500'}`}></div>
            </div>
            
            <div className="text-sm text-gray-600 mb-6 space-y-2">
              <p><strong>Deadline:</strong> {new Date(exam.deadline).toLocaleString()}</p>
              <p><strong>Status:</strong> {exam.isPublished ? <span className="text-green-600 font-bold">Published to Public</span> : <span className="text-orange-500 font-bold">Gathering Marks</span>}</p>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => handlePublishToggle(exam._id, exam.isPublished)}
                className={`flex-1 py-3 rounded-xl font-bold shadow-sm transition-all focus:outline-none ${
                  exam.isPublished 
                    ? 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50' 
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                }`}
              >
                {exam.isPublished ? 'Revoke Publish' : 'Publish'}
              </button>
              
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => handleEdit(exam)} 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold h-1/2"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(exam._id)} 
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm font-bold h-1/2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {exams.length === 0 && <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">No exams declared yet.</div>}
      </div>
    </div>
  );
};

export default ResultProcess;
