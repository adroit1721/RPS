import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import ConfirmationModal from './common/ConfirmationModal';

const Login = () => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Custom Confirmation Modal State
  const [showConfirm, setShowConfirm] = useState(false);

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setShowConfirm(true); // Trigger custom JS confirmation popup
  };

  const handleConfirmedLogin = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const endpoint = `/api/auth/${tab}/login`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: tab === 'admin' ? username : undefined, id: tab === 'teacher' ? username : undefined, password })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Welcome back, ${data.username || data.name || tab}!`);
        dispatch(loginSuccess(data));
      } else {
        toast.error(data.msg || 'Login failed');
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">School Portal</h1>
            <p className="text-slate-500 font-medium">Please sign in to continue</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button 
              type="button"
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${tab === 'admin' ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`} 
              onClick={() => { setTab('admin'); setUsername(''); setPassword(''); }}
            >
              Admin
            </button>
            <button 
              type="button"
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${tab === 'teacher' ? 'bg-white text-purple-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`} 
              onClick={() => { setTab('teacher'); setUsername(''); setPassword(''); }}
            >
              Teacher
            </button>
          </div>
          
          <form onSubmit={handleInitialSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">{tab === 'admin' ? "Admin Username" : "Teacher ID"}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-700 font-medium placeholder-slate-400"
                placeholder={tab === 'admin' ? "admin" : "TCH-001"}
                required
              />
            </div>
            
            <div className="mb-8 relative">
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-700 font-medium pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-black text-lg shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_20px_rgba(79,70,229,0.5)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? 'Authenticating...' : `Sign In as ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
            </button>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmationModal
          title="Confirm Login"
          message={`Are you sure you want to login as ${tab}?`}
          onConfirm={handleConfirmedLogin}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

export default Login;
