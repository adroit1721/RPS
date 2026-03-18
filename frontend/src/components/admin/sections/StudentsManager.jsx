import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { setStudents } from '../../../store/slices/adminSlice';

const StudentsManager = () => {
  const dispatch = useDispatch();
  const { students, classes } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  
  const [form, setForm] = useState({
    session: new Date().getFullYear().toString(),
    name: '',
    fatherName: '',
    motherName: '',
    dob: '',
    classId: '',
    roll: ''
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchStudents = async () => {
    try {
      let url = '/api/students';
      if (selectedClassFilter) url += `?classId=${selectedClassFilter}`;
      
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${user.token}` } });
      const data = await res.json();
      if(res.ok) dispatch(setStudents(data));
    } catch(err) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };

      const url = editId ? `/api/students/${editId}` : '/api/students';
      const method = editId ? 'PUT' : 'POST';

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
        toast.success(editId ? 'Student updated successfully!' : 'Student added successfully!');
        if (!editId) {
          // Keep session and class, clear personal details for faster data entry
          setForm(f => ({ ...f, name: '', fatherName: '', motherName: '', dob: '', roll: parseInt(f.roll)+1 || '' }));
        } else {
          setForm({ session: new Date().getFullYear().toString(), name: '', fatherName: '', motherName: '', dob: '', classId: '', roll: '' });
          setEditId(null);
        }
        fetchStudents();
      } else {
        toast.error(data.msg || 'Error saving student');
      }
    } catch(err) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setForm({
      session: s.session || new Date().getFullYear().toString(),
      name: s.name,
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      dob: s.dob ? s.dob.split('T')[0] : '', // Extract just the YYYY-MM-DD
      classId: s.classId?._id || s.classId || '',
      roll: s.roll
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.success('Student deleted successfully!');
        fetchStudents();
      } else {
        toast.error('Failed to delete student');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDownloadDemoCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "session,name,fatherName,motherName,dob,className,roll\n" +
      "2024,John Doe,Richard Doe,Jane Doe,2010-05-15,Class 1,101";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_demo.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast.error('CSV file is empty or missing headers.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const studentsData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const studentObj = {};
        headers.forEach((header, index) => {
          studentObj[header] = values[index];
        });

        // Map className to class ObjectId
        const foundClass = classes.find(c => c.name.toLowerCase() === studentObj.className?.toLowerCase());
        
        if (!foundClass) {
          toast.error(`Class "${studentObj.className}" not found for student ${studentObj.name}. Skipping row.`);
          continue;
        }

        studentsData.push({
          session: studentObj.session,
          name: studentObj.name,
          fatherName: studentObj.fatherName,
          motherName: studentObj.motherName,
          dob: studentObj.dob,
          classId: foundClass._id, // Set the mapped ID directly
          roll: studentObj.roll
        });
      }

      if (studentsData.length === 0) return;

      toast.info(`Uploading ${studentsData.length} students...`);
      setLoading(true);

      // Simple implementation: Send them one by one. Can optimize with bulk endpoint later.
      let successCount = 0;
      let errorCount = 0;

      for (const student of studentsData) {
        try {
          const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify(student)
          });
          if (res.ok) successCount++;
          else errorCount++;
        } catch (err) {
          errorCount++;
        }
      }

      setLoading(false);
      if (successCount > 0) toast.success(`Successfully uploaded ${successCount} students.`);
      if (errorCount > 0) toast.error(`Failed to upload ${errorCount} students due to errors (e.g. duplicate rolls).`);
      
      e.target.value = null; // Reset file input
      fetchStudents();
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Filtering */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800">Students Directory</h3>
        <select 
          value={selectedClassFilter} 
          onChange={e => setSelectedClassFilter(e.target.value)}
          className="p-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">{editId ? 'Edit Student' : 'Add Single Student'}</h3>
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setForm({ session: new Date().getFullYear().toString(), name: '', fatherName: '', motherName: '', dob: '', classId: '', roll: '' }); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Session (e.g. 2024)" value={form.session} onChange={e => setForm({...form, session: e.target.value})} className="p-3 border rounded-xl" required />
            <select value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} className="p-3 border rounded-xl" required>
              <option value="" disabled>Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input type="text" placeholder="Student Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="p-3 border rounded-xl" required />
            <input type="number" placeholder="Roll Number" value={form.roll} onChange={e => setForm({...form, roll: e.target.value})} className="p-3 border rounded-xl" required />
            <input type="text" placeholder="Father's Name" value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} className="p-3 border rounded-xl" required />
            <input type="text" placeholder="Mother's Name" value={form.motherName} onChange={e => setForm({...form, motherName: e.target.value})} className="p-3 border rounded-xl" required />
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-1 ml-1">Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="p-3 border rounded-xl w-full" required />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all">
                {loading ? 'Saving...' : editId ? 'Update Student' : 'Save Student'}
              </button>
            </div>
          </form>
        </div>

        {/* CSV Upload */}
        <div className="bg-purple-50 p-6 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center justify-center text-center h-fit">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Bulk Upload</h3>
          <p className="text-gray-600 text-sm mb-6">Upload multiple students at once using a CSV file.</p>
          
          <button onClick={handleDownloadDemoCSV} className="text-purple-600 font-semibold hover:underline mb-4 text-sm">
            Download Demo CSV
          </button>
          
          <label className="w-full cursor-pointer bg-white border-2 border-dashed border-purple-300 hover:border-purple-500 p-4 rounded-xl transition-colors">
            <span className="text-purple-600 font-semibold">{loading ? 'Uploading...' : 'Choose CSV File'}</span>
            <input type="file" accept=".csv" disabled={loading} className="hidden" onChange={handleFileUpload}/>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-bold text-gray-600">Roll</th>
              <th className="p-4 font-bold text-gray-600">Name</th>
              <th className="p-4 font-bold text-gray-600">Session</th>
              <th className="p-4 font-bold text-gray-600">Class</th>
              <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">No students found</td></tr>
            ) : students.map(s => (
              <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono font-semibold text-gray-600">{s.roll}</td>
                <td className="p-4 font-semibold text-gray-800">{s.name}</td>
                <td className="p-4 text-gray-600">{s.session}</td>
                <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{s.classId?.name || 'Loading...'}</span></td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700 px-2 py-1 font-semibold text-sm border border-blue-500 rounded-md">Edit</button>
                  <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 px-2 py-1 font-semibold text-sm border border-red-500 rounded-md">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsManager;
