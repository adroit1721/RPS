import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store/slices/authSlice';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import PublicResultView from './components/public/PublicResultView';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, role, user } = useSelector(state => state.auth);
  const [view, setView] = useState('public'); // Default landing could be public

  // Override view based on auth state and URL params
  useEffect(() => {
    // Check for custom login links in URL: ?login=admin or ?login=teacher
    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get('login');
    
    if (loginParam === 'admin' || loginParam === 'teacher' || loginParam === 'staff') {
      setView('login');
      // Clean up URL without refreshing to keep it "custom" and clean
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (isAuthenticated) {
      setView(role === 'admin' ? 'admin' : 'teacher');
    } else {
      if (view === 'admin' || view === 'teacher') {
         setView('public'); 
      }
    }
  }, [isAuthenticated, role, view]);

  // Global fetch interceptor to handle 401 Unauthorized errors (expired/invalid token)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        dispatch(logout());
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch; // Cleanup on unmount
    };
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
  };


  // Navigation logic
  if (view === 'login') return <Login />;
  if (isAuthenticated && view === 'admin' && role === 'admin') return <AdminDashboard user={user} onLogout={handleLogout} />;
  if (isAuthenticated && view === 'teacher' && role === 'teacher') return <TeacherDashboard user={user} onLogout={handleLogout} />;
  
  // Default is public result
  return (
    <PublicResultView setView={setView} />
  );
}

export default App;
