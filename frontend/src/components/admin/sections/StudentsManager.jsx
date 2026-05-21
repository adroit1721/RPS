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
          setForm(f => ({ ...f, name: '', fatherName: '', motherName: '', dob: '', roll: (parseInt(f.roll)+1).toString() || '' }));
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
    const headers = "session,name,fatherName,motherName,dob,className,roll";
    const row = `${new Date().getFullYear()},John Doe,Richard Doe,Jane Doe,2010-01-01,Class 1,101`;
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + row;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Filtering */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 gap-3">
        <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Students Directory</h3>
        <select 
          value={selectedClassFilter} 
          onChange={e => setSelectedClassFilter(e.target.value)}
          className="w-full sm:w-auto p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-600 text-sm"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Form */}
        <div className="xl:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">{editId ? 'Edit Student Profile' : 'Add Single Student'}</h3>
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setForm({ session: new Date().getFullYear().toString(), name: '', fatherName: '', motherName: '', dob: '', classId: '', roll: '' }); }}
                className="text-xs font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-2">Academic Session</label>
              <input type="text" placeholder="e.g. 2024" value={form.session} onChange={e => setForm({...form, session: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-2">Admission Cycle</label>
              <select value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" required>
                <option value="" disabled>Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Full Name</label>
              <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Roll Number</label>
              <input type="number" placeholder="101" value={form.roll} onChange={e => setForm({...form, roll: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Father's Name</label>
              <input type="text" placeholder="Richard Doe" value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Mother's Name</label>
              <input type="text" placeholder="Jane Doe" value={form.motherName} onChange={e => setForm({...form, motherName: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase ml-2">Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm" required />
            </div>
            <div className="md:col-span-2 flex justify-end mt-4">
              <button type="submit" disabled={loading} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1 text-base">
                {loading ? 'Processing...' : editId ? 'Update Record' : 'Enroll Student'}
              </button>
            </div>
          </form>
        </div>

        {/* CSV Upload */}
        <div className="bg-indigo-50/50 p-4 sm:p-6 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center h-fit">
          <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl shadow-sm flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">Automated Enrollment</h3>
          <p className="text-slate-500 text-[11px] font-bold leading-relaxed mb-6">Upload massive student datasets instantly using CSV format.</p>
          
          <button onClick={handleDownloadDemoCSV} className="text-indigo-600 font-black uppercase text-[9px] tracking-widest hover:text-indigo-800 mb-4 transition-colors">
            Get CSV Template
          </button>
          
          <label className="w-full cursor-pointer bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/10 p-4 rounded-xl transition-all duration-300">
            <span className="text-indigo-600 font-black text-xs">{loading ? 'Transferring...' : 'Select CSV Dataset'}</span>
            <input type="file" accept=".csv" disabled={loading} className="hidden" onChange={handleFileUpload}/>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Roll</th>
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Student Identity</th>
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Class</th>
                <th className="px-6 py-4 font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records available</td></tr>
              ) : students.map(s => (
                <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-black text-indigo-600 text-base">{s.roll}</td>
                  <td className="px-4 py-3">
                    <p className="font-black text-slate-800 text-sm italic tracking-tight">{s.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 opacity-70">S/O: {s.fatherName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase border border-indigo-100 shadow-sm">
                      {s.classId?.name || 'Assigned'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => handleEdit(s)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90" title="Edit Profile">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(s._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90" title="Delete record">
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

export default StudentsManager;
