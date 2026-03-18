import React, { useState, useEffect } from 'react';
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

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if(res.ok) dispatch(setClasses(data));
    } catch(err) {
      toast.error('Failed to load classes');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{editId ? 'Edit Class' : 'Add New Class'}</h3>
          {editId && (
            <button 
              type="button" 
              onClick={() => { setEditId(null); setForm({ name: '', subjects: '' }); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text"
            placeholder="Class Name (must be unique)"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <input 
            type="text"
            placeholder="Subjects (comma separated)"
            value={form.subjects}
            onChange={e => setForm({...form, subjects: e.target.value})}
            className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all">
              {loading ? 'Saving...' : editId ? 'Update Class' : 'Add Class'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-bold text-gray-600">Class Name</th>
              <th className="p-4 font-bold text-gray-600">Subjects</th>
              <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr><td colSpan="3" className="p-8 text-center text-gray-500">No classes found</td></tr>
            ) : classes.map(cls => (
              <tr key={cls._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-semibold text-gray-800">{cls.name}</td>
                <td className="p-4 text-gray-600">
                  <div className="flex flex-wrap gap-2">
                    {cls.subjects?.map((sub, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">{sub.name}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(cls)} className="text-blue-500 hover:text-blue-700 px-3 py-1 font-semibold border border-blue-500 rounded-md">Edit</button>
                  <button onClick={() => handleDelete(cls._id)} className="text-red-500 hover:text-red-700 px-3 py-1 font-semibold border border-red-500 rounded-md">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassesManager;
