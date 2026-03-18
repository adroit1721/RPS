import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  GraduationCap, 
  ShieldCheck, 
  Search, 
  Printer, 
  UserCircle,
  ExternalLink 
} from 'lucide-react';

// Helper function to calculate Grade from Total Marks
const calculateGrade = (total, maxScore = 100) => {
  const percentage = (total / maxScore) * 100;
  if (percentage >= 80) return { grade: 'A+', gpa: 5.0, remarks: 'Outstanding' };
  if (percentage >= 70) return { grade: 'A', gpa: 4.0, remarks: 'Excellent' };
  if (percentage >= 60) return { grade: 'A-', gpa: 3.5, remarks: 'Very Good' };
  if (percentage >= 50) return { grade: 'B', gpa: 3.0, remarks: 'Good' };
  if (percentage >= 40) return { grade: 'C', gpa: 2.0, remarks: 'Pass' };
  if (percentage >= 33) return { grade: 'D', gpa: 1.0, remarks: 'Pass' };
  return { grade: 'F', gpa: 0.0, remarks: 'Fail' };
};

const PublicResultView = ({ setView }) => {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);

  const [form, setForm] = useState({
    session: new Date().getFullYear().toString(),
    classId: '',
    examId: '',
    roll: '',
    captchaInput: ''
  });

  const [captchaMath, setCaptchaMath] = useState({ num1: 0, num2: 0 });
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize
  useEffect(() => {
    generateCaptcha();
    fetchClasses();
  }, []);

  const generateCaptcha = () => {
    setCaptchaMath({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1
    });
    setForm(f => ({ ...f, captchaInput: '' }));
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) setClasses(await res.json());
    } catch (err) {
      console.error('Error fetching classes');
    }
  };

  const fetchExamsForClass = async (classId) => {
    try {
      // Only fetch published exams
      const res = await fetch(`/api/public/published-exams?classId=${classId}`);
      if (res.ok) setExams(await res.json());
    } catch (err) {
      console.error('Error fetching exams');
    }
  };

  const handleClassChange = (e) => {
    const cid = e.target.value;
    setForm({ ...form, classId: cid, examId: '' });
    fetchExamsForClass(cid);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Verify Captcha
    if (parseInt(form.captchaInput) !== (captchaMath.num1 + captchaMath.num2)) {
      toast.error('Incorrect CAPTCHA answer. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    setResultData(null);
    try {
      const query = new URLSearchParams({
        session: form.session,
        classId: form.classId,
        examId: form.examId,
        roll: form.roll
      }).toString();

      const res = await fetch(`/api/public/result?${query}`);
      const data = await res.json();

      if (res.ok && data) {
        setResultData(data);
      } else {
        toast.error(data.msg || 'Result not found. Please check your details.');
        generateCaptcha();
      }
    } catch (err) {
      toast.error('Network Error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const marksheetElement = document.getElementById('marksheet-content');
    if (!marksheetElement) return;

    try {
      const toastId = toast.loading('Generating High-Resolution Transcript...');

      // Capture the full element without hard-coding dimensions to avoid cropping
      const canvas = await html2canvas(marksheetElement, {
        scale: 3, // Higher scale for ultra-sharp text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: marksheetElement.scrollWidth,
        windowHeight: marksheetElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const contentRatio = canvas.width / canvas.height;
      const pdfRatio = pdfWidth / pdfHeight;

      let finalWidth, finalHeight;

      // Smart scaling: Ensure it fits A4 without cropping or squashing
      if (contentRatio > pdfRatio) {
        // Limited by width
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / contentRatio;
      } else {
        // Limited by height (this is usually the case when it's cropping at the bottom)
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * contentRatio;
      }

      // Center horizontally
      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = 0; // Align to top

      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight, undefined, 'FAST');

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast.update(toastId, { render: 'Transcript opened in new tab!', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-['Outfit']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&family=Playfair+Display:ital,wght@0,900;1,900&family=JetBrains+Mono:wght@700&display=swap');
        
        .marksheet-border {
          border: 12px double #1e293b;
          padding: 2px;
          position: relative;
        }
        .marksheet-inner-border {
          border: 2px solid #1e293b;
          height: 100%;
          width: 100%;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 10rem;
          color: rgba(30, 41, 59, 0.03);
          font-weight: 900;
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
        }
      `}</style>

      {/* Header Area */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6 border-4 border-indigo-100 transform hover:scale-110 transition-transform duration-300">
          <span className="text-4xl text-indigo-600">🎓</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Academic <span className="text-indigo-600">Marksheet</span> Portal
        </h1>
        <p className="mt-4 text-slate-500 font-medium">Get Result with your Roll Number</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Search Panel - Single Page Centered Design */}
        <div className="w-full">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 p-8 md:p-12 hover:shadow-indigo-200/50 transition-all duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
              <h2 className="text-3xl font-black text-slate-800 flex items-center">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100 italic">?</div>
                Search Result
              </h2>
            </div>

            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Session Year</label>
                <input
                  type="text" value={form.session} onChange={e => setForm({ ...form, session: e.target.value })}
                  className="w-full p-5 border-2 border-slate-50 rounded-[1.25rem] bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Academic Class</label>
                <select
                  value={form.classId} onChange={handleClassChange}
                  className="w-full p-5 border-2 border-slate-50 rounded-[1.25rem] bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 shadow-sm custom-select"
                  required
                >
                  <option value="" disabled>Select Class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Examination Title</label>
                <select
                  value={form.examId} onChange={e => setForm({ ...form, examId: e.target.value })}
                  className="w-full p-5 border-2 border-slate-50 rounded-[1.25rem] bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 shadow-sm disabled:opacity-50"
                  required
                  disabled={!form.classId || exams.length === 0}
                >
                  <option value="" disabled>{!form.classId ? 'Select class first' : (exams.length === 0 ? 'No published exams' : 'Select Exam')}</option>
                  {exams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Student Roll Number</label>
                <input
                  type="number" value={form.roll} onChange={e => setForm({ ...form, roll: e.target.value })}
                  className="w-full p-5 border-2 border-slate-50 rounded-[1.25rem] bg-indigo-50/30 focus:bg-white focus:border-indigo-500 outline-none transition-all font-['JetBrains_Mono'] text-2xl font-black text-indigo-700 placeholder:text-indigo-200 shadow-sm"
                  placeholder="00"
                  required
                />
              </div>

              {/* CAPTCHA - Full width on mobile/tablet, part of grid on desktop */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900/5 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-2">Human Verification Required</p>
                  <div className="text-3xl font-black text-slate-800 tracking-widest italic flex items-center gap-4">
                    <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">{captchaMath.num1}</span>
                    <span className="text-slate-400">+</span>
                    <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">{captchaMath.num2}</span>
                    <span className="text-slate-400">=</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={form.captchaInput} onChange={e => setForm({ ...form, captchaInput: e.target.value })}
                    className="w-full p-6 text-center bg-white border-4 border-indigo-100 text-indigo-600 rounded-[1.5rem] focus:border-indigo-500 outline-none font-black text-3xl placeholder:text-indigo-200 shadow-sm"
                    placeholder="?"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="md:col-span-2 group relative overflow-hidden bg-slate-900 text-white px-10 py-6 rounded-[1.5rem] font-black text-xl transition-all hover:shadow-2xl hover:shadow-indigo-200 active:scale-[0.98] disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating Records...
                    </>
                  ) : (
                    <>
                      View Marksheet
                      <svg className="w-6 h-6 transform transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </form>
          </div>
        </div>

        {/* Result Display Panel - Centered Flow */}
        <div className="w-full">
          {resultData ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-600 p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white gap-6">
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">✨</div>
                  <div>
                    <h3 className="text-xl font-black">Official Result Found</h3>
                    <p className="text-white/70 font-bold text-sm tracking-wide">Transcript ready for digital verification & print</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full md:w-auto group flex items-center justify-center space-x-3 bg-white text-indigo-600 hover:bg-slate-900 hover:text-white px-10 py-5 rounded-2xl font-black shadow-xl transition-all active:scale-95"
                >
                  <svg className="w-6 h-6 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
                  </svg>
                  <span>Print as PDF</span>
                </button>
              </div>

              {/* Marksheet Preview - Standard A4 210mm x 297mm */}
              <div className="overflow-x-auto pb-12 flex justify-center bg-slate-50/50 rounded-[3rem] p-4 md:p-8 border border-slate-100">
                <div
                  id="marksheet-content"
                  className="bg-white marksheet-border shadow-2xl relative"
                  style={{
                    width: '210mm',
                    minHeight: '270mm',
                    padding: '10mm',
                    backgroundColor: '#fff',
                    flexShrink: 0
                  }}
                >
                  <div className="marksheet-inner-border p-8 relative overflow-visible flex flex-col h-full bg-white">
                    <div className="watermark uppercase italic">Official Copy</div>

                    {/* Header - Compact for A4 */}
                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8 relative z-10">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-lg">RHHS</div>
                      </div>
                      <h1 className="text-4xl font-['Playfair_Display'] font-black text-slate-900 tracking-tighter uppercase mb-1">Rajabari Hat High School</h1>
                      <p className="text-slate-500 font-bold tracking-[0.2em] text-[10px] uppercase">Rajabri Hat, Godagari, Rajshahi || Email:rajabarihhighschool@gmail.com</p>
                      <div className="mt-4">
                        <span className="bg-slate-900 text-white px-10 py-2.5 rounded-full font-black text-xs tracking-[0.3em] uppercase shadow-md">
                          Academic Transcript
                        </span>
                      </div>
                    </div>

                    {/* Student Info Grid - Compact */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 relative z-10">
                      {[
                        { label: 'Student Name', value: resultData.student.name.toUpperCase() },
                        { label: 'Roll Number', value: resultData.student.roll, mono: true },
                        { label: 'Academic Session', value: resultData.student.session },
                        { label: 'Class/Grade', value: resultData.classData.name },
                        { label: 'Father\'s Name', value: resultData.student.fatherName },
                        { label: 'Mother\'s Name', value: resultData.student.motherName },
                        { label: 'Examination', value: resultData.exam.name, full: true }
                      ].map((item, idx) => (
                        <div key={idx} className={`${item.full ? 'col-span-2' : ''} flex flex-col border-b border-slate-100 pb-2`}>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{item.label}</span>
                          <span className={`text-lg font-black text-slate-900 ${item.mono ? 'font-[\'JetBrains_Mono\'] text-indigo-700' : ''}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Main Marks Table - Optimized Padding */}
                    <div className="flex-grow relative z-10">
                      <table className="w-full border-collapse border-[3px] border-slate-900 text-left">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="p-4 border-r border-white/20 font-black uppercase tracking-widest text-[10px]">Subject Name</th>
                            <th className="p-4 border-r border-white/20 text-center font-black uppercase tracking-widest text-[10px] w-28">Full Marks</th>
                            <th className="p-4 border-r border-white/20 text-center font-black uppercase tracking-widest text-[10px] w-28">Obtained</th>
                            <th className="p-4 border-r border-white/20 text-center font-black uppercase tracking-widest text-[10px] w-20">Grade</th>
                            <th className="p-4 text-center font-black uppercase tracking-widest text-[10px] w-20">GPA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultData.marks.map((m, i) => {
                            const assessment = calculateGrade(m.score);
                            return (
                              <tr key={i} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                <td className="p-4 border-r-2 border-slate-200 font-bold text-slate-800 text-base uppercase">{m.subject}</td>
                                <td className="p-4 border-r-2 border-slate-200 text-center font-bold text-slate-400 text-base">100</td>
                                <td className="p-4 border-r-2 border-slate-200 text-center font-black text-indigo-700 text-xl">{m.score}</td>
                                <td className="p-4 border-r-2 border-slate-200 text-center font-black text-slate-800 text-lg">{assessment.grade}</td>
                                <td className="p-4 text-center font-black text-slate-600 text-base">{assessment.gpa.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Summary - Reduced Vertical Footprint */}
                    <div className="mt-8 mb-10 relative z-10">
                      <div className="grid grid-cols-3 border-[3px] border-slate-900 rounded-[1.5rem] overflow-hidden shadow-lg shadow-slate-100">
                        <div className="bg-slate-50 p-6 text-center border-r-[3px] border-slate-900">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Total Marks</p>
                          <p className="text-4xl font-black text-slate-900">{resultData.totalMarks}</p>
                        </div>
                        <div className="bg-white p-6 text-center border-r-[3px] border-slate-900">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Final GPA Score</p>
                          <p className="text-4xl font-black text-indigo-600">
                            {(resultData.marks.reduce((acc, m) => acc + calculateGrade(m.score).gpa, 0) / resultData.marks.length).toFixed(2)}
                          </p>
                        </div>
                        <div className={`p-6 text-center flex flex-col items-center justify-center ${resultData.grade === 'F' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Final Status</p>
                          <p className={`text-3xl font-black tracking-tighter ${resultData.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {resultData.grade === 'F' ? 'FAILED' : 'PASSED'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Authenticity & Signatures - Compacted */}
                    <div className="mt-auto flex justify-between items-end relative z-10">
                      <div className="w-48">
                        <div className="w-24 h-24 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center mb-3 relative opacity-60">
                          <span className="text-[8px] font-black absolute top-2 tracking-tighter text-slate-400">VERIFY DOCUMENT</span>
                          <div className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-lg" />
                          <span className="text-[7px] font-black mt-2 text-slate-300">SECURE-ID-{resultData.student._id?.slice(-6).toUpperCase()}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date: {new Date().toLocaleDateString('en-GB')}</p>
                      </div>

                      <div className="text-center w-56 flex flex-col items-center">
                        <div className="w-48 border-b-2 border-slate-900 mb-2 font-['Playfair_Display'] text-xl font-black italic text-slate-200 h-10 flex items-center justify-center">
                          Signature
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">Headmaster / Principal</p>
                      </div>

                      <div className="absolute right-0 top-[-80px] w-32 h-32 border-[4px] border-slate-100 rounded-full flex items-center justify-center opacity-40 transform rotate-12">
                        <div className="text-center">
                          <p className="text-[8px] font-black tracking-tighter text-slate-300 uppercase">Academic Council</p>
                          <p className="text-[14px] font-black text-slate-400 tracking-tighter">CERTIFIED</p>
                          <p className="text-[8px] font-black tracking-tighter text-slate-300 uppercase">Original Copy</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 rounded-[3rem] border-4 border-dashed border-slate-200 h-96 flex flex-col items-center justify-center p-12 text-center group transition-colors hover:border-indigo-200">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-100 mb-6 border border-slate-100 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                <GraduationCap size={48} className="text-indigo-600" strokeWidth={1.5} />
              </div>
              <p className="text-slate-400 font-bold max-w-xs leading-relaxed uppercase tracking-widest text-xs">
                Enter roll & select exam to reveal academic records
              </p>
            </div>
          )}
        </div>

        {/* Custom Portal Links - Highly Professional Footer */}
        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 pb-12 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck size={20} className="text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Academic Infrastructure</p>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="/?login=admin"
              className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <UserCircle size={14} />
              <span>Admin Portal</span>
            </a>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <a
              href="/?login=teacher"
              className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <UserCircle size={14} />
              <span>Teacher Access</span>
            </a>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">© 2026 SCHOOL PORTAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicResultView;
