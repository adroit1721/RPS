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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Assign Subject to Teacher</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select 
            value={form.teacherId} 
            onChange={e => setForm({...form, teacherId: e.target.value})} 
            className="p-3 border rounded-xl bg-gray-50 focus:ring-2 outline-none" 
            required
          >
            <option value="" disabled>Select Teacher</option>
            {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.id})</option>)}
          </select>

          <select 
            value={form.classId} 
            onChange={e => setForm({...form, classId: e.target.value, subjectName: ''})} 
            className="p-3 border rounded-xl bg-gray-50 focus:ring-2 outline-none" 
            required
          >
            <option value="" disabled>Select Class</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          <select 
            value={form.subjectName} 
            onChange={e => setForm({...form, subjectName: e.target.value})} 
            className="p-3 border rounded-xl bg-gray-50 focus:ring-2 outline-none" 
            required
            disabled={!form.classId}
          >
            <option value="" disabled>Select Subject</option>
            {availableSubjects.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
          </select>

          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all">
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-bold text-gray-600">Teacher</th>
              <th className="p-4 font-bold text-gray-600">Class</th>
              <th className="p-4 font-bold text-gray-600">Subject</th>
              <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">No assignments found</td></tr>
            ) : assignments.map(a => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-semibold text-gray-800">{a.teacherId?.name || 'Unknown'}</td>
                <td className="p-4 text-gray-600">{a.classId?.name || 'Unknown'}</td>
                <td className="p-4 font-semibold text-blue-600">{a.subjects ? a.subjects.join(', ') : a.subjectName}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(a._id)} className="text-red-500 hover:text-red-700 px-3 py-1 font-semibold">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignSubjects;
