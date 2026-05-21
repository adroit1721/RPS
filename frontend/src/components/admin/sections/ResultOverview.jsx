import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const ResultOverview = () => {
  const { classes } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // We should actually fetch students for the class and their corresponding results
  // For the UI demonstration, let's fetch an overview
  const fetchClassResults = useCallback(async (classId, examId) => {
    if(!classId) return;
    setLoading(true);
    setResults([]);
    try {
      let url = `/api/admin/results/overview?classId=${classId}`;
      if (examId) url += `&examId=${examId}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch(err) {
      toast.error('Failed to load results overview');
    }
    setLoading(false);
  }, [user.token]);

  const fetchExams = useCallback(async (classId) => {
    try {
      const res = await fetch(`/api/admin/exams?classId=${classId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) setExams(await res.json());
    } catch (err) {
      console.error('Error fetching exams');
    }
  }, [user.token]);

  useEffect(() => {
    if(selectedClass) {
      fetchExams(selectedClass);
      fetchClassResults(selectedClass, selectedExam);
    }
  }, [selectedClass, selectedExam, fetchClassResults, fetchExams]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">Performance Analytics</h2>
          <p className="text-slate-500 font-bold text-[10px] sm:text-sm">Comprehensive evaluation overview across student demographics.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex-1">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Academic Cohort</label>
            <select 
              value={selectedClass} 
              onChange={e => { setSelectedClass(e.target.value); setSelectedExam(''); }}
              className="w-full sm:min-w-[180px] p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
            >
              <option value="" disabled>Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Audit Period (Exam)</label>
            <select 
              value={selectedExam} 
              onChange={e => setSelectedExam(e.target.value)}
              className="w-full sm:min-w-[180px] p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm disabled:opacity-50"
              disabled={!selectedClass}
            >
              <option value="">All Periods (Summary)</option>
              {exams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedClass ? (
        <div className="bg-white py-20 text-center rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-200">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm sm:text-xl text-slate-400 font-black uppercase tracking-widest">Select an academic cohort to begin audit</p>
        </div>
      ) : loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-black uppercase tracking-widest text-xs">Decrypting Performance Data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 font-black text-slate-400 text-[11px] uppercase tracking-widest">Roll No.</th>
                  <th className="px-6 py-4 font-black text-slate-400 text-[11px] uppercase tracking-widest sticky left-0 bg-slate-50/50 z-20">Academic Profile</th>
                  {classes.find(c => c._id === selectedClass)?.subjects?.map((sub, i) => (
                    <th key={i} className="px-6 py-4 font-black text-slate-400 text-[11px] uppercase tracking-widest text-center">{sub.name}</th>
                  ))}
                  <th className="px-6 py-4 font-black text-slate-800 text-[11px] uppercase tracking-widest text-center bg-slate-100/50">Cumulative</th>
                  <th className="px-6 py-4 font-black text-slate-800 text-[11px] uppercase tracking-widest text-center bg-slate-100/50">Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="100%" className="px-4 py-16 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No examination data found for this cohort</td></tr>
                ) : results.map((resItem, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 font-mono text-[10px] font-black text-slate-400">{resItem.student.roll}</td>
                    <td className="px-4 py-3 font-black text-slate-800 text-sm italic tracking-tight sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] z-10">
                      {resItem.student.name}
                    </td>
                    
                    {classes.find(c => c._id === selectedClass)?.subjects?.map((sub, i) => {
                      const markObj = resItem.marks.find(m => m.subject === sub.name);
                      return (
                        <td key={i} className="px-4 py-3 text-center">
                          {markObj ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-black text-slate-700 text-xs">{markObj.score}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${
                                markObj.score >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                markObj.score >= 40 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                                'bg-rose-50 text-rose-600 border border-rose-100'
                              }`}>
                                {markObj.grade}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-200">•••</span>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="px-4 py-3 text-center font-black text-indigo-600 bg-slate-50/30 text-base">{resItem.totalMarks || 0}</td>
                    <td className="px-4 py-3 text-center bg-slate-50/30">
                      <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm border ${
                        resItem.grade === 'F' ? 'bg-rose-500 text-white border-rose-400' : 'bg-emerald-500 text-white border-emerald-400'
                      }`}>
                        {resItem.grade || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultOverview;
