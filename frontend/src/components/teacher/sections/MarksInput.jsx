import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const MarksInput = () => {
  const { user } = useSelector(state => state.auth);
  
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

  // 3. Fetch Students and Existing Marks when Class, Subject, and Exam are selected
  useEffect(() => {
    if(!selectedClassId || !selectedSubject || !selectedExam) {
      setStudents([]);
      setMarks({});
      setSubmittedMarks([]);
      return;
    }

    const fetchData = async () => {
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
    };
    fetchData();
  }, [selectedClassId, selectedSubject, selectedExam, user.token]);

  const handleMarkChange = (studentId, value) => {
    const numValue = Math.max(0, Math.min(100, Number(value))); 
    setMarks(prev => ({
      ...prev,
      [studentId]: value === '' ? '' : numValue
    }));
  };

  const fetchSubmittedOnly = async () => {
     try {
        const marksRes = await fetch(`/api/teachers/marks?classId=${selectedClassId}&subjectName=${encodeURIComponent(selectedSubject)}&examId=${selectedExam}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const existingMarks = await marksRes.json();
        if(marksRes.ok) setSubmittedMarks(existingMarks);
     } catch(e) {}
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
        fetchSubmittedOnly();
      } else {
        toast.error(data.msg || 'Error saving marks');
      }
    } catch(err) {
      toast.error('Network Error');
    }
    setLoading(false);
  };

  const currentAssignment = assignments.find(a => a.classId._id === selectedClassId);

  return (
    <div className="space-y-8">
      {/* 1. SELECTION PORTAL */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-indigo-900 leading-tight">Marks Entry Portal</h2>
          <p className="text-indigo-600 font-medium">Follow the steps to input student marks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Class */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-indigo-400 ml-1">Step 1: Select Class</label>
            <select 
              className="w-full p-4 border-2 border-indigo-50 rounded-2xl bg-indigo-50/30 focus:bg-white focus:border-indigo-500 outline-none font-bold text-indigo-900 transition-all"
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
            <label className="text-xs font-black uppercase tracking-wider text-indigo-400 ml-1">Step 2: Select Subject</label>
            <select 
              className="w-full p-4 border-2 border-indigo-50 rounded-2xl bg-indigo-50/30 focus:bg-white focus:border-indigo-500 outline-none font-bold text-indigo-900 transition-all disabled:opacity-50"
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
            <label className="text-xs font-black uppercase tracking-wider text-indigo-400 ml-1">Step 3: Select Exam</label>
            <select 
              className="w-full p-4 border-2 border-indigo-50 rounded-2xl bg-indigo-50/30 focus:bg-white focus:border-indigo-500 outline-none font-bold text-indigo-900 transition-all disabled:opacity-50"
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
          <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-lg font-black tracking-tight">Student Roster - {selectedSubject}</h3>
                <p className="text-indigo-100 text-sm font-medium">Class {currentAssignment?.classId.name} | {exams.find(e => e._id === selectedExam)?.name}</p>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-md">
                Marks Entry Mode
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-20 text-center font-bold text-indigo-400 animate-pulse">Loading Roster...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-indigo-50">
                          <th className="p-4 font-black text-indigo-900/40 w-24">Roll</th>
                          <th className="p-4 font-black text-indigo-900">Student Name</th>
                          <th className="p-4 font-black text-indigo-900 text-right w-48">Score (0-100)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((stu, i) => (
                          <tr key={stu._id} className={`group hover:bg-indigo-50/50 transition-colors ${i % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}>
                            <td className="p-4 font-mono font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">{stu.roll}</td>
                            <td className="p-4 font-bold text-gray-800">{stu.name}</td>
                            <td className="p-4 text-right">
                              <input 
                                type="number" 
                                value={marks[stu._id] !== undefined ? marks[stu._id] : ''}
                                onChange={(e) => handleMarkChange(stu._id, e.target.value)}
                                className={`w-32 p-3 text-center rounded-2xl font-black transition-all outline-none border-2 ${
                                  marks[stu._id] !== '' 
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                    : 'border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
                                }`}
                                placeholder="--"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-2xl font-black shadow-[0_20px_40px_-12px_rgba(79,70,229,0.4)] active:scale-95 transition-all text-lg"
                    >
                      {loading ? 'Processing...' : 'Save & Submit Marks'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-[3rem] p-20 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-50">
              <svg className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-indigo-900 mb-2">Ready to Enter Marks?</h3>
            <p className="text-indigo-500 font-medium max-w-sm mx-auto leading-relaxed">Please complete the three selection steps above to load the student roster and start entering marks.</p>
        </div>
      )}

      {/* 3. SUBMITTED VIEW AREA */}
      {submittedMarks.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="flex items-center space-x-3 mb-6">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <h3 className="text-xl font-black text-gray-800">Currently Saved Marks</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submittedMarks.map((m) => (
                <div key={m.studentId} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Roll {m.roll}</div>
                      <div className="font-bold text-gray-800">{m.studentName}</div>
                   </div>
                   <div className="flex flex-col items-end">
                      <div className="text-2xl font-black text-indigo-600">{m.score}</div>
                      <div className={`text-[10px] font-black px-2 py-0.5 rounded-md ${m.score >= 40 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{m.grade}</div>
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
