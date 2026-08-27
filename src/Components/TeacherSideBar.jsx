import Header from '../layouts/Header';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, ClipboardCheck, FileText,
  CalendarDays, BarChart3, Bell, User, LogOut, Settings,
  GraduationCap, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useSchool } from '../Pages/SchoolContext';

const TeacherSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState({});
  const { schoolName } = useSchool();

  // ----- DYNAMIC BADGE COUNTS -----
  const [badgeCounts, setBadgeCounts] = useState({
    myClasses: 0,
    students: 0,
    pendingMarks: 0,
    unreadNotifications: 0
  });

  // Fetch badge data from the database
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // ✅ FIXED: Use /me endpoints (uses token to identify teacher)
        const [
          classesRes,
          studentsRes,
          marksRes,
          notificationsRes
        ] = await Promise.all([
          api.get(`/teachers/me/classes`, config).catch(() => ({ data: { data: [] } })),
          api.get(`/teachers/me/students`, config).catch(() => ({ data: { data: [] } })),
          api.get(`/marks?submitted=false`, config).catch(() => ({ data: { data: [] } })),
          api.get(`/notifications/unread-count`, config).catch(() => ({ data: { count: 0 } }))
        ]);

        const classes = classesRes.data?.data || classesRes.data || [];
        const students = studentsRes.data?.data || studentsRes.data || [];
        const pendingMarks = marksRes.data?.data || marksRes.data || [];
        const unreadCount = notificationsRes.data?.count || notificationsRes.data?.count || 0;

        setBadgeCounts({
          myClasses: Array.isArray(classes) ? classes.length : 0,
          students: Array.isArray(students) ? students.length : 0,
          pendingMarks: Array.isArray(pendingMarks) ? pendingMarks.length : 0,
          unreadNotifications: unreadCount
        });
      } catch (error) {
        console.error('Failed to fetch sidebar badge counts:', error);
      }
    };

    if (user.id) {
      fetchBadgeCounts();
    }
  }, [user.id]);

  // ----- ROUTE DETECTION -----
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/teacher/dashboard')) setActiveMenu('dashboard');
    else if (path.includes('/teacher/myclass')) setActiveMenu('myclass');
    else if (path.includes('/teacher/students')) setActiveMenu('students');
    else if (path.includes('/teacher/attendance')) setActiveMenu('attendance');
    else if (path.includes('/teacher/marks')) setActiveMenu('marks');
    else if (path.includes('/teacher/timetable')) setActiveMenu('timetable');
    else if (path.includes('/teacher/teacheranalytics') || path.includes('/teacher/analytics')) setActiveMenu('analytics');
    else if (path.includes('/teacher/teachernotification') || path.includes('/teacher/notifications')) setActiveMenu('notifications');
    else if (path.includes('/teacher/profile')) setActiveMenu('profile');
    else if (path.includes('/teacher/settings') || path.includes('/teacher/teachersettings')) setActiveMenu('settings');
  }, [location]);

  // ----- LOAD USER FROM LOCAL STORAGE -----
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const handleNavigate = (path, id) => {
    setActiveMenu(id);
    navigate(path);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      toast.success('Logged out successfully!');
      navigate('/');
    }
  };

  // ----- MENU ITEMS -----
  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard', color: 'indigo' },
    { id: 'myclass', title: 'My Classes', icon: BookOpen, path: '/teacher/myclass', color: 'blue', badgeKey: 'myClasses' },
    { id: 'students', title: 'Students', icon: Users, path: '/teacher/students', color: 'green', badgeKey: 'students' },
    { id: 'attendance', title: 'Attendance', icon: ClipboardCheck, path: '/teacher/attendance', color: 'amber' },
    { id: 'marks', title: 'Marks Entry', icon: FileText, path: '/teacher/marks-entry', color: 'purple', badgeKey: 'pendingMarks' },
    { id: 'timetable', title: 'Timetable', icon: CalendarDays, path: '/teacher/timetable', color: 'rose' },
    { id: 'analytics', title: 'Analytics', icon: BarChart3, path: '/teacher/teacheranalytics', color: 'emerald' },
    { id: 'notifications', title: 'Notifications', icon: Bell, path: '/teacher/teachernotification', color: 'orange', badgeKey: 'unreadNotifications' },
  ];

  return (
    <aside
    
      className={`h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* LOGO */}
      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-5'} border-b border-gray-100 dark:border-gray-700`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900">
         <Header  />

            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-red-500 dark:text-white tracking-tight truncate max-w-[200px]">


             
              {schoolName || 'EduPortal'}



        


            </span>

            
          )}
         

        </div>


        
        

          
        {!isCollapsed && (
          <button onClick={() => setIsCollapsed(true)} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>
           


      {/* SCROLLABLE MAIN AREA */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {/* Teacher info */}
        {!isCollapsed && (
          <div className="px-1 mb-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                {user.Fname?.charAt(0) || 'T'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.Fname || 'Teacher'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.Email || 'teacher@school.com'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation items with dynamic badges */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          const badgeValue = item.badgeKey ? badgeCounts[item.badgeKey] : undefined;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path, item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title={isCollapsed ? item.title : ''}
            >
              <div className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}>
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  }`}
                />
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
                  {badgeValue !== undefined && badgeValue > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                      {badgeValue}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"></div>
                  )}
                </>
              )}
            </button>
          );
        })}

        <div className="my-4 border-t border-gray-100 dark:border-gray-700" />

        <button onClick={() => handleNavigate('/teacher/profile', 'profile')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${activeMenu === 'profile' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'}`} title={isCollapsed ? 'Profile' : ''}>
          <User className={`w-5 h-5 ${activeMenu === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
          {!isCollapsed && <span className="text-sm font-medium">Profile</span>}
        </button>

        <button onClick={() => handleNavigate('/teacher/teachersettings', 'settings')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${activeMenu === 'settings' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'}`} title={isCollapsed ? 'Settings' : ''}>
          <Settings className={`w-5 h-5 ${activeMenu === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </button>

        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200" title={isCollapsed ? 'Logout' : ''}>
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {isCollapsed && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-center">
          <button onClick={() => setIsCollapsed(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default TeacherSidebar;