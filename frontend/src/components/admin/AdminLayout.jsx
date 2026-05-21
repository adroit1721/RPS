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
  School,
  Menu,
  ChevronDown,
  X
} from 'lucide-react';

const AdminLayout = ({ children, activeMenu, setActiveMenu }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'Classes', label: 'Classes', icon: <BookOpen size={18} /> },
    { id: 'Teachers', label: 'Teachers', icon: <UserCheck size={18} /> },
    { id: 'Students', label: 'Students', icon: <Users size={18} /> },
    { id: 'AssignSubjects', label: 'Assign Subjects', icon: <PenTool size={18} /> },
    { id: 'ResultProcess', label: 'Result Process', icon: <Clock size={18} /> },
    { id: 'ResultOverview', label: 'Result Overview', icon: <BarChart3 size={18} /> },
    { id: 'SchoolProfile', label: 'School Profile', icon: <School size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col font-sans text-slate-900 transition-all duration-500 overflow-x-hidden p-3 sm:p-5 lg:p-6 gap-4">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Compact Header */}
      <header className="bg-white rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50 relative z-30 animate-in fade-in duration-700">
        <div className="flex justify-between items-center px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-all mr-4"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-[1rem] flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <School size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#5e54d8] tracking-tight uppercase leading-none">
                  Admin Portal
                </h2>
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] mt-1.5 uppercase opacity-70">Control Center</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-8">
            <button className="hidden md:flex p-2.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-full relative transition-all border border-slate-100/50">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-1 rounded-[1.5rem] bg-slate-50/50 hover:bg-slate-100/50 transition-all focus:outline-none border border-slate-100 shadow-sm"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm sm:text-base border border-white">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:flex flex-col items-start pr-3">
                  <span className="font-bold text-slate-800 text-[13px] leading-none">System Admin</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">Privileged</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in transition-all">
                  <div className="px-6 py-4 border-b border-slate-50 mb-1">
                    <p className="text-sm font-bold text-slate-800">Administrator</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase">{user?.username || 'admin'}@portal.local</p>
                  </div>
                  <button
                    onClick={() => { setActiveMenu('Settings'); setDropdownOpen(false); }}
                    className="flex w-full items-center space-x-3 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <Settings size={16} />
                    <span>Portal Settings</span>
                  </button>
                  <button
                    onClick={() => dispatch(logout())}
                    className="flex w-full items-center space-x-3 px-5 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-all"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Container */}
      <div className="flex flex-1 gap-4 lg:gap-6">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 lg:relative lg:inset-0 w-80 lg:w-72 bg-white lg:bg-transparent z-[70] lg:z-auto transform transition-all duration-500 ease-out lg:translate-x-0 shadow-2xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex flex-col h-full lg:h-fit lg:sticky lg:top-6">
            <div className="lg:hidden p-6 flex justify-between items-center border-b border-slate-50 mb-4 bg-white rounded-t-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                  <School size={16} />
                </div>
                <span className="font-bold tracking-widest text-indigo-600 text-[10px] uppercase">Navigation</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 transition-all hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex-1 lg:pr-4 px-4 lg:px-0 py-2 flex flex-col gap-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 group ${activeMenu === item.id
                    ? 'bg-white shadow-xl shadow-slate-200/40 text-slate-900 border border-slate-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
                    }`}
                >
                  <span className={`transition-all duration-300 ${activeMenu === item.id 
                    ? 'text-[#5e54d8] scale-110 drop-shadow-[0_0_8px_rgba(94,84,216,0.3)]' 
                    : 'text-slate-300 group-hover:text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span className="text-[14px] tracking-tight">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 p-4 sm:p-8 lg:p-10 shadow-sm shadow-slate-200/50 min-w-0 transition-all">
          <div className="max-w-[1400px]">
            <div className="flex items-center gap-4 mb-8 sm:mb-12">
              <div className="h-6 w-1.5 bg-[#5e54d8] rounded-full"></div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1e1e2e] tracking-tight">
                {menuItems.find(m => m.id === activeMenu)?.label || activeMenu}
              </h1>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
