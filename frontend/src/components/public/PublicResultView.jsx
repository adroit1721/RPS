import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Calendar,
  User,
  MapPin,
  Mail,
  Printer
} from 'lucide-react';

// Helper function to calculate Grade from Total Marks (5.0 Scale)
const calculateGrade = (score) => {
  if (score >= 80) return { grade: 'A+', gpa: 5.0, remarks: 'Outstanding' };
  if (score >= 70) return { grade: 'A', gpa: 4.0, remarks: 'Excellent' };
  if (score >= 60) return { grade: 'A-', gpa: 3.5, remarks: 'Very Good' };
  if (score >= 50) return { grade: 'B', gpa: 3.0, remarks: 'Good' };
  if (score >= 40) return { grade: 'C', gpa: 2.0, remarks: 'Pass' };
  if (score >= 33) return { grade: 'D', gpa: 1.0, remarks: 'Pass' };
  return { grade: 'F', gpa: 0.0, remarks: 'Fail' };
};

const PublicResultView = () => {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [school, setSchool] = useState({ name: 'School Name', address: '', email: '', logoUrl: '', signatureUrl: '' });

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
    fetchSchoolData();
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

  const fetchSchoolData = async () => {
    try {
      const res = await fetch('/api/school');
      if (res.ok) setSchool(await res.json());
    } catch (err) {
      console.error('Error fetching school data');
    }
  };

  const fetchExamsForClass = async (classId) => {
    try {
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
        // Apply "Fail in one = Fail all" logic
        const hasFailed = data.marks.some(m => m.score < 33);
        const totalGPA = hasFailed ? 0 : (data.marks.reduce((acc, m) => acc + calculateGrade(m.score).gpa, 0) / data.marks.length);

        setResultData({
          ...data,
          hasFailed,
          calculatedGPA: totalGPA.toFixed(2),
          finalGrade: hasFailed ? 'Fail' : calculateOverallGrade(totalGPA)
        });
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

  const calculateOverallGrade = (gpa) => {
    if (gpa >= 5.0) return 'A+';
    if (gpa >= 4.0) return 'A';
    if (gpa >= 3.5) return 'A-';
    if (gpa >= 3.0) return 'B';
    if (gpa >= 2.0) return 'C';
    if (gpa >= 1.0) return 'D';
    return 'F';
  };

  const handleDownloadPDF = async () => {
    const marksheetElement = document.getElementById('marksheet-content');
    if (!marksheetElement) return;

    try {
      const toastId = toast.loading('Generating High-Resolution Certificate...');

      const canvas = await html2canvas(marksheetElement, {
        scale: 3,
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
      if (contentRatio > pdfRatio) {
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / contentRatio;
      } else {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * contentRatio;
      }

      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = 0;

      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight, undefined, 'FAST');

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast.update(toastId, { render: 'Certificate opened in new tab!', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8 font-['Outfit']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&family=Playfair+Display:ital,wght@0,700..900;1,700..900&display=swap');
        
        .marksheet-border {
          border: 15px double #0f172a;
          padding: 4px;
          position: relative;
        }
        .marksheet-inner-border {
          border: 2px solid #0f172a;
          height: 100%;
          width: 100%;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 8rem;
          color: rgba(15, 23, 42, 0.04);
          font-weight: 900;
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
          text-transform: uppercase;
        }
        .cert-seal {
          width: 100px;
          height: 100px;
          border: 4px double #0f172a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.15;
          transform: rotate(15deg);
        }
      `}</style>

      {/* Hero Header Area */}
      <div className="max-w-4xl mx-auto text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl shadow-indigo-100/50 mb-6 border border-slate-100">
          <GraduationCap size={48} className="text-indigo-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Academic <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent italic">Result</span> Portal
        </h1>
        <div className="mt-4 flex items-center justify-center space-x-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Official Verification System</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Search Panel - Premium Glassmorphism Design */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-indigo-100/40 border border-white p-8 md:p-12 transition-all hover:shadow-indigo-200/40 duration-500">
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg italic">?</div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Access Your Records</h2>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400 ml-1">Academic Session</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="text" value={form.session} onChange={e => setForm({ ...form, session: e.target.value })}
                  className="w-full pl-12 pr-6 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400 ml-1">Student Class</label>
              <select
                value={form.classId} onChange={handleClassChange}
                className="w-full p-5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 shadow-sm custom-select"
                required
              >
                <option value="" disabled>Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400 ml-1">Specific Examination</label>
              <select
                value={form.examId} onChange={e => setForm({ ...form, examId: e.target.value })}
                className="w-full p-5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 shadow-sm disabled:opacity-50"
                required
                disabled={!form.classId || exams.length === 0}
              >
                <option value="" disabled>{!form.classId ? 'Select class first' : (exams.length === 0 ? 'No published exams' : 'Select Term/Exam')}</option>
                {exams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400 ml-1">Student Roll ID</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="number" value={form.roll} onChange={e => setForm({ ...form, roll: e.target.value })}
                  className="w-full pl-12 pr-6 py-5 bg-indigo-50/20 border-2 border-indigo-100/50 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-black text-indigo-700 text-xl placeholder:text-indigo-200 shadow-sm"
                  placeholder="00"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-900/5 p-8 rounded-[2rem] border border-slate-100/50 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-3">Mathematical Challenge (Security)</p>
                <div className="flex items-center gap-4 text-3xl font-black text-slate-800 italic">
                  <span className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">{captchaMath.num1}</span>
                  <span className="text-slate-300">+</span>
                  <span className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">{captchaMath.num2}</span>
                  <span className="text-slate-300">=</span>
                </div>
              </div>
              <input
                type="number"
                value={form.captchaInput} onChange={e => setForm({ ...form, captchaInput: e.target.value })}
                className="w-full md:w-32 p-6 text-center bg-white border-4 border-indigo-50 text-indigo-600 rounded-3xl focus:border-indigo-500 outline-none font-black text-3xl shadow-inner-lg"
                placeholder="?"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 relative group overflow-hidden bg-slate-900 text-white py-6 rounded-3xl font-black text-lg uppercase tracking-[.2em] transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 shadow-2xl shadow-slate-200/50"
            >
              <span className="relative z-10 flex items-center justify-center gap-4">
                {loading ? 'Authenticating...' : 'Generate Official Transcript'}
                {!loading && <Award size={22} className="group-hover:rotate-12 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
          </form>
        </div>

        {/* Result & Certificate Presentation */}
        {resultData && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Action Bar */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-white">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-pulse">✨</div>
                <div>
                  <h3 className="text-2xl font-black leading-none mb-1 text-white">Transcript Ready</h3>
                  <p className="text-white/60 text-sm font-bold tracking-wide">Academic Year {resultData.student.session}</p>
                </div>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="group flex items-center gap-4 bg-white text-indigo-900 hover:bg-slate-900 hover:text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95"
              >
                <Printer size={22} />
                <span>Download Secure PDF</span>
              </button>
            </div>

            {/* The Certificate - Official Copy */}
            <div className="overflow-x-auto pb-8 flex justify-center">
              <div
                id="marksheet-content"
                className="bg-white marksheet-border relative shadow-2xl"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '12mm',
                  flexShrink: 0
                }}
              >
                <div className="marksheet-inner-border p-10 relative flex flex-col h-full overflow-hidden">
                  <div className="watermark uppercase italic">{school.name}</div>


                  {/* Institution Header */}
                  <div className="text-center border-b-4 border-slate-900 pb-8 mb-10 relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-24 h-24 bg-slate-50 p-2 rounded-2xl flex items-center justify-center">
                        {school.logoUrl ? (
                          <img src={school.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-black uppercase">{school.name?.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 px-8">
                        <h1 className="text-4xl font-['Playfair_Display'] font-black text-slate-900 tracking-tight uppercase leading-none mb-2">{school.name}</h1>
                        <p className="text-slate-500 font-black tracking-[0.25em] text-[10px] uppercase mb-1 flex items-center justify-center gap-2">
                          <MapPin size={10} className="text-indigo-600" /> {school.address || 'Institution Address'}
                        </p>
                        <p className="text-slate-400 font-bold tracking-[0.1em] text-[10px] flex items-center justify-center gap-2">
                          <Mail size={10} className="text-indigo-600" /> {school.email || 'Educational Affairs Office'}
                        </p>
                      </div>
                      <div className="w-24 h-24 cert-seal">
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-tighter">OFFICIAL SEAL</span>
                      </div>
                    </div>
                    <div>
                      <span className="inline-block bg-slate-900 text-white px-12 py-3.5 rounded-full font-black text-sm tracking-[0.4em] uppercase shadow-lg">
                        Academic Transcript
                      </span>
                    </div>
                  </div>

                  {/* Identity Grid */}
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-12 relative z-10 border-b-2 border-slate-50 pb-8">
                    {[
                      { label: 'Student Full Name', value: resultData.student.name.toUpperCase() },
                      { label: 'Father\'s Name', value: resultData.student.fatherName.toUpperCase() },
                      { label: 'Enrollment Roll', value: resultData.student.roll, highlight: true },
                      { label: 'Class / Grade', value: resultData.classData.name },
                      { label: 'Subject / Department', value: 'Regular Education Selection' },
                      { label: 'Examination Period', value: resultData.exam.name, full: true }
                    ].map((item, idx) => (
                      <div key={idx} className={`${item.full ? 'col-span-2' : ''} flex flex-col`}>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1.5">{item.label}</span>
                        <span className={`text-xl font-bold text-slate-900 border-b-2 border-slate-100 pb-1 ${item.highlight ? 'text-indigo-600 font-black' : ''}`}>
                          {item.value || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Academic Performance Matrix */}
                  <div className="flex-grow mb-10 relative z-10">
                    <table className="w-full border-collapse border-4 border-slate-900">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="p-5 text-left font-black uppercase tracking-[0.2em] text-[10px] border-r border-white/20">Subject</th>
                          <th className="p-5 text-center font-black uppercase tracking-[0.2em] text-[10px] border-r border-white/20 w-32">Marks</th>
                          <th className="p-5 text-center font-black uppercase tracking-[0.2em] text-[10px] border-r border-white/20 w-32">Obtained Marks</th>
                          <th className="p-5 text-center font-black uppercase tracking-[0.2em] text-[10px] border-r border-white/20 w-24">Grade</th>
                          <th className="p-5 text-center font-black uppercase tracking-[0.2em] text-[10px] w-24">GPA Point</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-100 font-['Outfit']">
                        {resultData.marks.map((m, i) => {
                          const assessment = calculateGrade(m.score);
                          return (
                            <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/30' : 'bg-white'}>
                              <td className="p-5 font-black text-slate-800 text-lg uppercase leading-none">{m.subject}</td>
                              <td className="p-5 text-center font-bold text-slate-400 text-lg tracking-tighter italic">100.00</td>
                              <td className="p-5 text-center font-black text-indigo-700 text-2xl tracking-tighter">{m.score}</td>
                              <td className={`p-5 text-center font-black text-xl ${assessment.grade === 'F' ? 'text-rose-600' : 'text-slate-900'}`}>{assessment.grade}</td>
                              <td className="p-5 text-center font-black text-slate-700 text-lg">{assessment.gpa.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Evaluation Summary */}
                  <div className="grid grid-cols-2 gap-10 mb-12 relative z-10 p-10 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl">
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Cumulative Grade Point</p>
                        <p className="text-7xl font-black italic flex items-baseline">
                          {resultData.calculatedGPA}
                          <span className="text-xl opacity-20 ml-3 italic">/ 5.00</span>
                        </p>
                      </div>
                      <div className="flex gap-10">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Total Marks</p>
                          <p className="text-2xl font-bold">{resultData.totalMarks}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Subject Count</p>
                          <p className="text-2xl font-bold">{resultData.marks.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/10 p-8 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center text-center">
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-4">Academic Status</p>
                      <p className={`text-5xl font-black italic tracking-tighter ${resultData.hasFailed ? 'text-rose-400 animate-pulse' : 'text-emerald-400 italic underline decoration-8 underline-offset-8'}`}>
                        {resultData.hasFailed ? 'FAILED' : 'PASSED'}
                      </p>
                      {resultData.hasFailed && <p className="mt-4 text-[9px] font-black bg-rose-500 text-white px-4 py-1 rounded-full uppercase">Review Required</p>}
                    </div>
                  </div>

                  {/* Authentication & Authority */}
                  <div className="mt-auto pt-10 flex justify-between items-end relative z-10 border-t border-slate-100">
                    <div className="max-w-[240px]">
                      <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl p-6 mb-4 relative flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-300 absolute top-2 uppercase tracking-widest leading-none">Record Verification Hash</span>
                        <div className="mt-2 text-center">
                          <p className="text-[10px] font-mono font-black text-slate-400 break-all leading-tight">SHA256:{resultData.student._id?.slice(-12).toUpperCase()}</p>
                          <div className="mt-3 w-16 h-16 border-4 border-white shadow-md rounded-xl bg-slate-200" />
                        </div>
                      </div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Date of Issue: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-56 h-28 relative flex flex-col items-center justify-center mb-2">
                        {school.signatureUrl && (
                          <img src={school.signatureUrl} alt="Signature" className="w-full h-full object-contain mb-[-20px] relative z-20 grayscale brightness-90 hover:grayscale-0 transition-all duration-500" />
                        )}
                        <div className="w-full border-b-2 border-slate-900 relative z-10" />
                        <p className="mt-3 text-[10px] font-black uppercase text-slate-900 tracking-[0.3em]">Institutional Head Signature</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {!resultData && (
          <div className="bg-white/40 rounded-[3.5rem] border-4 border-dashed border-slate-200 h-96 flex flex-col items-center justify-center p-12 text-center group active:scale-[0.98] transition-all duration-500">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-slate-100 mb-8 border border-slate-50 group-hover:scale-110 group-hover:rotate-12 duration-700">
              <GraduationCap size={44} className="text-indigo-200 group-hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-slate-400 font-black max-w-xs leading-relaxed uppercase tracking-[0.3em] text-[10px]">
              Enter Student Roll Number & Select Session to Access Archives
            </p>
          </div>
        )}

        {/* Global Professional Footer */}
        <div className="pt-20 pb-12 opacity-30 hover:opacity-100 transition-opacity duration-700 text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Admin Gateway</Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Teacher Portal</Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Academic Archives © 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicResultView;
