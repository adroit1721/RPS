import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Save, FileUp } from 'lucide-react';

const MarksInput = () => {
  const { user } = useSelector(state => state.auth);
  const fileInputRef = useRef(null);
  
  const [assignments, setAssignments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [submittedMarks, setSubmittedMarks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch teacher's assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch('/api/teachers/assignments', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if(res.ok) {
          const data = await res.json();
          setAssignments(data);
        }
      } catch(err) {
        toast.error('Failed to load assignments');
      }
    };
    fetchAssignments();
  }, [user.token]);

  // 2. Fetch Exams when Class is selected
  useEffect(() => {
    if(!selectedClassId) {
      setExams([]);
      setSelectedExam('');
      return;
    }
    const fetchExams = async () => {
      try {
        const examRes = await fetch(`/api/admin/exams?classId=${selectedClassId}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if(examRes.ok) {
          const examData = await examRes.json();
          setExams(examData.filter(e => !e.isPublished)); 
        }
      } catch(err) {
        toast.error('Error loading exams');
      }
    };
    fetchExams();
  }, [selectedClassId, user.token]);

  const fetchMarksData = useCallback(async () => {
    if(!selectedClassId || !selectedSubject || !selectedExam) {
      setStudents([]);
      setMarks({});
      setSubmittedMarks([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch Students
      const stuRes = await fetch(`/api/students?classId=${selectedClassId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const stuData = await stuRes.json();
      
      // Fetch Existing Marks
      const marksRes = await fetch(`/api/teachers/marks?classId=${selectedClassId}&subjectName=${encodeURIComponent(selectedSubject)}&examId=${selectedExam}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const existingMarks = await marksRes.json();
      
      if(stuRes.ok) {
        setStudents(stuData);
        setSubmittedMarks(existingMarks);
        
        // Initialize/Populate marks state
        const initialMarks = {};
        stuData.forEach(s => {
          const found = existingMarks.find(em => em.studentId === s._id);
          initialMarks[s._id] = found ? found.score : '';
        });
        setMarks(initialMarks);
      }
    } catch(err) {
      toast.error('Error loading data');
    }
    setLoading(false);
  }, [selectedClassId, selectedSubject, selectedExam, user.token]);

  // 3. Fetch Data when dependency changes
  useEffect(() => {
    fetchMarksData();
  }, [fetchMarksData]);

  const handleMarkChange = (studentId, value) => {
    const numValue = Math.max(0, Math.min(100, Number(value))); 
    setMarks(prev => ({
      ...prev,
      [studentId]: value === '' ? '' : numValue
    }));
  };


  const handleSubmit = async () => {
    const marksData = Object.entries(marks)
      .filter(([_, score]) => score !== '')
      .map(([studentId, score]) => ({
        studentId,
        score: Number(score)
      }));
      
    if(marksData.length === 0) {
      toast.warning('No marks entered');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teachers/marks', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          examId: selectedExam,
          subjectName: selectedSubject,
          marks: marksData
        })
      });
      
      const data = await res.json();
      if(res.ok) {
        toast.success(`Marks saved successfully`);
        fetchMarksData();
      } else {
        toast.error(data.msg || 'Error saving marks');
      }
    } catch(err) {
      toast.error('Network Error');
    }
    setLoading(false);
  };
  
  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('examId', selectedExam);
    formData.append('subjectName', selectedSubject);
    formData.append('classId', selectedClassId);

    const toastId = toast.loading('Parsing CSV and Processing Bulk Marks...');
    try {
      const res = await fetch('/api/teachers/bulk-marks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.update(toastId, { render: 'Bulk update successful!', type: 'success', isLoading: false, autoClose: 3000 });
        fetchMarksData();
        e.target.value = ''; // Reset input
      } else {
        toast.update(toastId, { render: data.msg || 'Bulk update failed', type: 'error', isLoading: false, autoClose: 3000 });
      }
    } catch (err) {
      toast.update(toastId, { render: 'Network error during bulk upload', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const currentAssignment = assignments.find(a => a.classId._id === selectedClassId);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. SELECTION PORTAL */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-indigo-50">
        <div className="mb-6">
          <h2 className="text-lg sm:text-2xl font-black text-indigo-900 tracking-tight">Academic Grading Terminal</h2>
          <p className="text-indigo-500 font-bold text-[10px] sm:text-sm opacity-80 uppercase tracking-widest">Enroll & Commit Scores</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Step 1: Class */}
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-500 ml-2">Phase 1: Academic Roster</label>
            <select 
              className="w-full p-2.5 border border-indigo-100 rounded-xl bg-indigo-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-indigo-900 transition-all cursor-pointer text-sm"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubject('');
                setSelectedExam('');
              }}
            >
              <option value="">Choose Class...</option>
              {assignments.map(a => (
                <option key={a._id} value={a.classId._id}>{a.classId.name}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Subject */}
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-500 ml-2">Phase 2: Subject Domain</label>
            <select 
              className="w-full p-2.5 border border-indigo-100 rounded-xl bg-indigo-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-indigo-900 transition-all disabled:opacity-50 cursor-pointer text-sm"
              value={selectedSubject}
              disabled={!selectedClassId}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Choose Subject...</option>
              {currentAssignment?.subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Exam */}
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-500 ml-2">Phase 3: Assessment Cycle</label>
            <select 
              className="w-full p-2.5 border border-indigo-100 rounded-xl bg-indigo-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-indigo-900 transition-all disabled:opacity-50 cursor-pointer text-sm"
              value={selectedExam}
              disabled={!selectedSubject}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">Choose Exam...</option>
              {exams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 2. ENTRY AREA */}
      {selectedExam ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-4 sm:px-6 sm:py-5 flex justify-between items-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-none mb-1.5 uppercase italic">Grading Roster — {selectedSubject}</h3>
                <p className="text-indigo-100 text-[10px] font-bold opacity-80 uppercase tracking-wider">{currentAssignment?.classId.name} • {exams.find(e => e._id === selectedExam)?.name}</p>
              </div>
              <div className="relative z-10 bg-white/10 border border-white/20 px-2.5 py-1 rounded-[10px] text-[8px] font-black uppercase tracking-widest backdrop-blur-md hidden sm:block">
                Verification Required
              </div>
              <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="p-3 sm:p-6">
              {loading ? (
                <div className="py-16 text-center flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Synchronizing Roster...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-slate-50">
                    <table className="w-full text-left border-collapse min-w-[400px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-indigo-50">
                          <th className="px-4 py-3 font-black text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest w-20 text-center">ID</th>
                          <th className="px-4 py-3 font-black text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest">Candidate</th>
                          <th className="px-4 py-3 font-black text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest text-right w-32">Numeric Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((stu, i) => (
                          <tr key={stu._id} className={`group hover:bg-indigo-50/30 transition-colors border-b border-slate-50/50`}>
                            <td className="px-3 py-2.5 font-black text-[9px] text-slate-400 group-hover:text-indigo-500 transition-colors text-center bg-slate-50/10 tracking-widest uppercase italic">#{stu.roll}</td>
                            <td className="px-3 py-2.5 font-black text-slate-800 text-xs sm:text-sm tracking-tight italic uppercase">{stu.name}</td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex justify-end">
                                <input 
                                  type="number" 
                                  value={marks[stu._id] !== undefined ? marks[stu._id] : ''}
                                  onChange={(e) => handleMarkChange(stu._id, e.target.value)}
                                  className={`w-16 sm:w-20 p-2 text-center rounded-lg font-black transition-all outline-none border-2 text-xs sm:text-sm ${
                                    marks[stu._id] !== '' 
                                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                      : 'border-slate-100 bg-slate-50 focus:border-indigo-400'
                                  }`}
                                  placeholder="00"
                                  max="100"
                                  min="0"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 px-1">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleBulkUpload} 
                      className="hidden" 
                      accept=".csv" 
                    />
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-5 py-3 rounded-xl font-bold transition-all text-[11px] uppercase tracking-widest border border-slate-200"
                    >
                      <FileUp size={16} />
                      CSV Template
                    </button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all text-sm tracking-tight flex items-center justify-center gap-2 uppercase"
                    >
                      <Save size={18} />
                      {loading ? 'Processing...' : 'Commit Records'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/50 border-4 border-dashed border-slate-200/50 rounded-[3rem] p-12 sm:p-24 text-center transition-all">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Audit Ready</h3>
            <p className="text-slate-500 font-bold max-w-sm mx-auto leading-relaxed text-sm sm:text-base opacity-80">Finalize Class, Subject, and Exam selections above to initiate the grading roster.</p>
        </div>
      )}

      {/* 3. SUBMITTED VIEW AREA */}
      {submittedMarks.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pt-4">
           <div className="flex items-center space-x-2.5 mb-6">
              <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
              <h3 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">Active Grade Profile</h3>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {submittedMarks.map((m) => (
                <div key={m.studentId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-between group">
                   <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">Roll No. {m.roll}</div>
                      <div className="font-black text-slate-800 text-base leading-tight italic tracking-tight">{m.studentName}</div>
                   </div>
                   <div className="flex flex-col items-end">
                      <div className="text-2xl font-black text-indigo-600 tracking-tighter">{m.score}</div>
                      <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter border shadow-sm ${m.score >= 40 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{m.grade === 'F' ? 'Fail' : m.grade}</div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default MarksInput;
