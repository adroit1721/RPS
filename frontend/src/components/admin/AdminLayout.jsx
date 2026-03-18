import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { 
  LayoutDashboard, 
  BookOpen, 
  UserCheck, 
  Users, 
  PenTool, 
  Clock, 
  BarChart3,
  LogOut,
  Settings,
  Bell,
  Menu,
  ChevronDown,
  User
} from 'lucide-react';

const AdminLayout = ({ children, activeMenu, setActiveMenu }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'Classes', label: 'Classes', icon: <BookOpen size={20} /> },
    { id: 'Teachers', label: 'Teachers', icon: <UserCheck size={20} /> },
    { id: 'Students', label: 'Students', icon: <Users size={20} /> },
    { id: 'AssignSubjects', label: 'Assign Subjects', icon: <PenTool size={20} /> },
    { id: 'ResultProcess', label: 'Result Process', icon: <Clock size={20} /> },
    { id: 'ResultOverview', label: 'Result Overview', icon: <BarChart3 size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-64 z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:w-72 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 pb-4">
            <h2 className="text-2xl font-black bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter uppercase italic">
              Admin Portal
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl font-bold transition-all duration-200 group ${
                  activeMenu === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`${activeMenu === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}>{item.icon}</span>
                <span className="text-[15px]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
          <div className="flex justify-between items-center px-4 md:px-10 py-5">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-black text-slate-900 ml-4 lg:ml-0 hidden sm:block tracking-tight">
                {menuItems.find(m => m.id === activeMenu)?.label || activeMenu}
              </h1>
            </div>

            <div className="flex items-center space-x-6">
              <button className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-xl relative transition-colors">
                <Bell size={22} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-4 ring-white"></span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 p-1 rounded-2xl hover:bg-slate-50 transition-all focus:outline-none border border-transparent hover:border-slate-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-md ring-2 ring-white">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="hidden md:flex flex-col items-start pr-2">
                    <span className="font-bold text-slate-900 text-sm leading-none">Account Settings</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Administrator</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-6 py-4 border-b border-slate-50 mb-1">
                      <p className="text-sm font-black text-slate-900 truncate">Logged in as {user?.username || 'Admin'}</p>
                    </div>
                    <button
                      onClick={() => { setActiveMenu('Settings'); setDropdownOpen(false); }}
                      className="flex w-full items-center space-x-3 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50/80 hover:text-indigo-600 transition-colors"
                    >
                      <Settings size={18} />
                      <span>Security Settings</span>
                    </button>
                    <button
                      onClick={() => dispatch(logout())}
                      className="flex w-full items-center space-x-3 px-6 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
