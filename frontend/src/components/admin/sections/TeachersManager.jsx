import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { setTeachers } from '../../../store/slices/adminSlice';

const TeachersManager = () => {
  const dispatch = useDispatch();
  const { teachers } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  const [form, setForm] = useState({ name: '', id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if(res.ok) dispatch(setTeachers(data));
    } catch(err) {
      toast.error('Failed to load teachers');
    }
  };

  useEffect(() => {
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/teachers/${editId}` : '/api/teachers';
      const method = editId ? 'PUT' : 'POST';
      // If editing and password is left blank, remove it from payload so it doesn't try to hash an empty string
      const payload = { ...form };
      if (editId && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(res.ok){
        toast.success(editId ? 'Teacher updated successfully!' : 'Teacher added successfully!');
        setForm({ name: '', id: '', password: '' });
        setEditId(null);
        fetchTeachers();
      } else {
        toast.error(data.msg || 'Error saving teacher');
      }
    } catch(err) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handleEdit = (t) => {
    setEditId(t._id);
    setForm({
      name: t.name,
      id: t.id,
      password: '' // Don't populate password
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      const res = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.success('Teacher deleted successfully!');
        fetchTeachers();
      } else {
        toast.error('Failed to delete teacher');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{editId ? 'Edit Teacher' : 'Add New Teacher'}</h3>
          {editId && (
            <button 
              type="button" 
              onClick={() => { setEditId(null); setForm({ name: '', id: '', password: '' }); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-green-500 outline-none"
            required
          />
          <input 
            type="text"
            placeholder="Assign ID (e.g. TCH-001)"
            value={form.id}
            onChange={e => setForm({...form, id: e.target.value})}
            className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-green-500 outline-none font-mono"
            required
          />
            <input 
              type="text"
              placeholder={editId ? "New Password (leave blank to keep current)" : "Initial Password"}
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-green-500 outline-none"
              required={!editId}
            />
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all">
              {loading ? 'Saving...' : editId ? 'Update Teacher' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-bold text-gray-600">Name</th>
              <th className="p-4 font-bold text-gray-600">ID</th>
              <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan="3" className="p-8 text-center text-gray-500">No teachers found</td></tr>
            ) : teachers.map(t => (
              <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-semibold text-gray-800">{t.name}</td>
                <td className="p-4"><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-mono text-sm border border-gray-200">{t.id}</span></td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700 px-3 py-1 font-semibold border border-blue-500 rounded-md">Edit</button>
                  <button onClick={() => handleDelete(t._id)} className="text-red-500 hover:text-red-700 px-3 py-1 font-semibold border border-red-500 rounded-md">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeachersManager;
