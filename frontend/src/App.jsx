import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { logout } from './store/slices/authSlice';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import PublicResultView from './components/public/PublicResultView';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, role, user } = useSelector(state => state.auth);

  // Global fetch interceptor (keeping this for any raw fetches, but mostly using api.js now)
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
      window.fetch = originalFetch;
    };
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicResultView />} />
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to={role === 'admin' ? "/admin" : "/teacher"} replace />
          ) : (
            <Login />
          )
        } />

        {/* Protected Admin Routes */}
        <Route path="/admin/*" element={
          isAuthenticated && role === 'admin' ? (
            <AdminDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Protected Teacher Routes */}
        <Route path="/teacher/*" element={
          isAuthenticated && role === 'teacher' ? (
            <TeacherDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
