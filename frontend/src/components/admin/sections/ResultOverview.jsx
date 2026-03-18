import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const ResultOverview = () => {
  const { classes } = useSelector(state => state.admin);
  const { user } = useSelector(state => state.auth);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // We should actually fetch students for the class and their corresponding results
  // For the UI demonstration, let's fetch an overview
  const fetchClassResults = async (classId) => {
    if(!classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/results/overview?classId=${classId}`, {
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
  };

  useEffect(() => {
    if(selectedClass) fetchClassResults(selectedClass);
  }, [selectedClass]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Result Overview</h2>
          <p className="text-gray-500">View detailed student marks and grades by class.</p>
        </div>
        <select 
          value={selectedClass} 
          onChange={e => setSelectedClass(e.target.value)}
          className="p-3 border rounded-xl bg-gray-50 focus:ring-2 outline-none min-w-[200px]"
        >
          <option value="" disabled>Select Class to View</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedClass ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg text-gray-500 font-medium">Please select a class to view its results overview.</p>
        </div>
      ) : loading ? (
        <div className="text-center p-12 text-gray-500">Loading results...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <th className="p-4 font-bold text-gray-700">Roll</th>
                  <th className="p-4 font-bold text-gray-700 sticky left-0 bg-gradient-to-r from-blue-50 to-blue-50/90 backdrop-blur-sm z-10">Student Name</th>
                  {/* Dynamic Subject Headers assuming first student has all subjects or based on class subjects */}
                  {classes.find(c => c._id === selectedClass)?.subjects?.map((sub, i) => (
                    <th key={i} className="p-4 font-bold text-gray-700 text-center">{sub.name}</th>
                  ))}
                  <th className="p-4 font-bold text-gray-700 text-center bg-gray-100">Total</th>
                  <th className="p-4 font-bold text-gray-700 text-center bg-gray-100">Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="100%" className="p-8 text-center text-gray-500">No results found for this class yet.</td></tr>
                ) : results.map((resItem, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-mono text-gray-600">{resItem.student.roll}</td>
                    <td className="p-4 font-bold text-gray-800 sticky left-0 bg-white/90 backdrop-blur-sm shadow-[1px_0_0_0_#f3f4f6] z-10">
                      {resItem.student.name}
                    </td>
                    
                    {/* Render marks mapping to class subjects */}
                    {classes.find(c => c._id === selectedClass)?.subjects?.map((sub, i) => {
                      const markObj = resItem.marks.find(m => m.subject === sub.name);
                      return (
                        <td key={i} className="p-4 text-center">
                          {markObj ? (
                            <div className="flex flex-col items-center">
                              <span className="font-semibold">{markObj.score}</span>
                              <span className={`text-[10px] px-1.5 rounded-sm font-bold ${markObj.score >= 80 ? 'bg-green-100 text-green-700' : markObj.score >= 40 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                {markObj.grade}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="p-4 text-center font-black text-blue-600 bg-gray-50/50">{resItem.totalMarks || 0}</td>
                    <td className="p-4 text-center bg-gray-50/50">
                      <span className={`px-3 py-1 rounded-full font-black text-sm ${resItem.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
