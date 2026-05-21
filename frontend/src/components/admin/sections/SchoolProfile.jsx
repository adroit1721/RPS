import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { setSchool } from '../../../store/slices/adminSlice';
import { Upload, Save, School as SchoolIcon, FileText } from 'lucide-react';

const SchoolProfile = () => {
  const dispatch = useDispatch();
  const { school } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  const [form, setForm] = useState({
    name: '',
    address: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name || '',
        address: school.address || '',
        email: school.email || ''
      });
    }
  }, [school]);

  const handleUpdateText = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(setSchool(data));
        toast.success('School profile updated!');
      } else {
        toast.error(data.msg || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    const endpoint = type === 'logo' ? '/api/school/upload-logo' : '/api/school/upload-signature';
    
    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(setSchool(data));
        toast.update(toastId, { render: `${type.toUpperCase()} uploaded!`, type: 'success', isLoading: false, autoClose: 3000 });
      } else {
        toast.update(toastId, { render: data.msg || 'Upload failed', type: 'error', isLoading: false, autoClose: 3000 });
      }
    } catch (err) {
      toast.update(toastId, { render: 'Network error', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8">
        <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
          {school.logoUrl ? (
            <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <SchoolIcon size={48} className="text-slate-300" />
          )}
          <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Upload size={20} className="mb-1" />
            <span className="text-[10px] font-black uppercase">Change Logo</span>
            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" />
          </label>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{school.name || 'Set School Name'}</h2>
          <p className="text-slate-500 font-medium">{school.address || 'Address not set'}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
             <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">Official Profile</span>
             {school.email && <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold border border-slate-100">{school.email}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Info Form */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 italic">i</div>
            Institutional Details
          </h3>
          <form onSubmit={handleUpdateText} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">School Full Name</label>
              <input 
                type="text" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                placeholder="Enter School Name"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">Physical Address</label>
              <textarea 
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 min-h-[100px]"
                placeholder="Street address, City, District"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 ml-1">Email Address</label>
              <input 
                type="email" 
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                placeholder="school@example.com"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-100 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save General Settings'}
            </button>
          </form>
        </div>

        {/* Assets Upload Section */}
        <div className="space-y-8">
          {/* Logo Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Official School Logo</h3>
             <div className="w-24 h-24 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 overflow-hidden">
                {school.logoUrl ? <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" /> : <Upload size={32} className="text-indigo-200" />}
             </div>
             <p className="text-xs text-slate-400 font-medium mb-6 px-8 leading-relaxed">Shown on the header of academic transcripts and portals.</p>
             <label className="w-full bg-indigo-50 text-indigo-700 p-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-indigo-100 transition-colors text-center">
                Replace Logo File
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" />
             </label>
          </div>

          {/* Signature Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Headmaster Signature</h3>
             <div className="w-48 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 overflow-hidden border border-dashed border-slate-200">
                {school.signatureUrl ? <img src={school.signatureUrl} alt="Signature" className="w-full h-full object-contain" /> : <FileText size={32} className="text-slate-200" />}
             </div>
             <p className="text-xs text-slate-400 font-medium mb-6 px-8 leading-relaxed">Electronically signed at the bottom of every student marksheet.</p>
             <label className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-indigo-600 transition-colors text-center shadow-lg shadow-indigo-100">
                Upload New Signature
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'signature')} accept="image/*" />
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolProfile;
