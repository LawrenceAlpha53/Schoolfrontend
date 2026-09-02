// AdminTopbar.jsx – SHOWS ONLY NOTIFICATIONS FROM THE LAST 24 HOURS
import {
  Search, Bell, CalendarDays, ChevronDown, User, LogOut,
  Settings, Sparkles, Clock, CheckCircle, X, Loader2,
  FileText, Users, BookOpen, GraduationCap, LayoutGrid,
  Calendar, BellOff, MapPin, Shield, UserCog, School,
  DollarSign, ClipboardList, BarChart3, AlertTriangle, Megaphone,
  CreditCard, Mail, ArrowRight, FileSearch, UserPlus, Award,
  TrendingUp, Zap
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AdminTopbar = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allFees, setAllFees] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allMarks, setAllMarks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const intervalRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // ========== READ IDS – SINGLE SOURCE OF TRUTH ==========
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ========== SAVE FUNCTION ==========
  const saveReadIds = (newIds) => {
    try {
      const unique = [...new Set(newIds)];
      localStorage.setItem('admin_read_notifications', JSON.stringify(unique));
      setReadIds(unique);
    } catch (err) {
      console.error('❌ Failed to save read IDs:', err);
    }
  };

  // ================= FORMAT HELPERS =================
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return 'UGX 0';
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `UGX ${(amount / 1000).toFixed(0)}K`;
    return `UGX ${amount}`;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const diffMins = Math.floor((Date.now() - new Date(dateString)) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateString).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' });
  };

  // ================= 24-HOUR FILTER =================
  const isWithinLast24Hours = (timestamp) => {
    if (!timestamp) return true; // treat missing as recent
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  // ================= MARK AS READ =================
  const markAsRead = (id) => {
    const newIds = [...readIds, id];
    saveReadIds(newIds);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const allIds = [...readIds, ...notifications.map(n => n.id)];
    saveReadIds(allIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // ================= TOGGLE NOTIFICATIONS (mark all read on open) =================
  const toggleNotifications = () => {
    const isOpening = !showNotifications;
    setShowNotifications(isOpening);
    if (isOpening) {
      markAllAsRead();
    }
  };

  // ================= GLOBAL SEARCH (unchanged) =================
  const performSearch = useCallback((query) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const term = query.toLowerCase().trim();
    const results = [];

    allStudents.forEach(s => {
      if ((s.fullName || '').toLowerCase().includes(term) || (s.studentNumber || '').toLowerCase().includes(term)) {
        const studentFees = allFees.filter(f => String(f.studentId) === String(s.id));
        const totalPaid = studentFees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
        results.push({
          id: s.id, type: 'student',
          icon: <Users className="w-5 h-5 text-blue-500" />,
          title: s.fullName, subtitle: `ID: ${s.studentNumber || 'N/A'}`,
          details: `${s.class?.className || 'No Class'} • ${formatCurrency(totalPaid)} paid`,
          path: `/admin/students`, category: 'Student'
        });
      }
    });

    allTeachers.forEach(t => {
      if ((t.fullName || '').toLowerCase().includes(term) || (t.email || '').toLowerCase().includes(term)) {
        results.push({
          id: t.id, type: 'teacher',
          icon: <GraduationCap className="w-5 h-5 text-purple-500" />,
          title: t.fullName, subtitle: 'Teacher',
          details: `${t.class?.className || 'No Class'} • ${t.subject?.subjectName || 'No Subject'}`,
          path: `/admin/teachers`, category: 'Teacher'
        });
      }
    });

    setSearchResults(results.slice(0, 10));
    setShowSearchResults(results.length > 0);
    setIsSearching(false);
  }, [allStudents, allFees, allTeachers]);

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => performSearch(query), 200);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  };

  // ================= FETCH ALL DATA & GENERATE NOTIFICATIONS =================
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let studentsOk = true, feesOk = true, teachersOk = true, marksOk = true;

      const [studentsRes, feesRes, teachersRes, marksRes] = await Promise.all([
        api.get('/students', config).catch(() => { studentsOk = false; return { data: [] }; }),
        api.get('/fees', config).catch(() => { feesOk = false; return { data: [] }; }),
        api.get('/teachers', config).catch(() => { teachersOk = false; return { data: [] }; }),
        api.get('/marks', config).catch(() => { marksOk = false; return { data: [] }; })
      ]);

      const students = studentsRes.data?.data || studentsRes.data || [];
      const fees = feesRes.data?.data || feesRes.data || [];
      const teachers = teachersRes.data?.data || teachersRes.data || [];
      const marks = marksRes.data?.data || marksRes.data || [];

      setAllStudents(Array.isArray(students) ? students : []);
      setAllFees(Array.isArray(fees) ? fees : []);
      setAllTeachers(Array.isArray(teachers) ? teachers : []);
      setAllMarks(Array.isArray(marks) ? marks : []);

      // Use the LATEST read IDs from state
      const currentReadIds = readIds;

      const notifList = [];

      // 1. Recent fee payments (only include if within 24h)
      fees.filter(f => Number(f.amountPaid || 0) > 0).slice(-8).reverse().forEach(fee => {
        const student = students.find(s => String(s.id) === String(fee.studentId));
        const amount = Number(fee.amountPaid || 0);
        const total = Number(fee.totalFee || 0);
        const balance = total - amount;
        const id = `fee-${fee.id}`;
        const time = fee.createdAt || fee.paymentDate || new Date();
        // Only include if recent
        if (isWithinLast24Hours(time)) {
          notifList.push({
            id,
            type: 'fee',
            icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
            title: '💰 Fee Payment',
            message: `${student?.fullName || 'Student'} paid ${formatCurrency(amount)}${balance > 0 ? ` (Bal: ${formatCurrency(balance)})` : ' ✅ Fully Paid'}`,
            time,
            timestamp: new Date(time).getTime(),
            read: currentReadIds.includes(id),
            action: '/admin/adminfees',
            actionLabel: 'View Fees',
            category: 'fee'
          });
        }
      });

      // 2. Recent marks entries
      marks.slice(-5).reverse().forEach(mark => {
        const student = students.find(s => String(s.id) === String(mark.studentId));
        const subject = (typeof mark.subject === 'object' ? mark.subject?.subjectName : null) || 'a subject';
        if (student) {
          const id = `mark-${mark.id}`;
          const time = mark.createdAt || new Date();
          if (isWithinLast24Hours(time)) {
            notifList.push({
              id,
              type: 'academic',
              icon: <BookOpen className="w-5 h-5 text-blue-500" />,
              title: '📝 Mark Recorded',
              message: `${student.fullName}: ${mark.score || 0}% in ${subject} (${mark.examType || 'Exam'})`,
              time,
              timestamp: new Date(time).getTime(),
              read: currentReadIds.includes(id),
              action: '/admin/analytics',
              actionLabel: 'View Analytics',
              category: 'academic'
            });
          }
        }
      });

      // 3. New student registrations
      students.slice(-5).reverse().forEach(student => {
        const id = `student-${student.id}`;
        const time = student.createdAt || new Date();
        if (isWithinLast24Hours(time)) {
          notifList.push({
            id,
            type: 'student',
            icon: <UserPlus className="w-5 h-5 text-blue-500" />,
            title: '🎓 New Student',
            message: `${student.fullName} registered in ${student.class?.className || 'School'}`,
            time,
            timestamp: new Date(time).getTime(),
            read: currentReadIds.includes(id),
            action: '/admin/students',
            actionLabel: 'View Student',
            category: 'student'
          });
        }
      });

      // 4. New teachers
      teachers.slice(-3).reverse().forEach(teacher => {
        const id = `teacher-${teacher.id}`;
        const time = teacher.createdAt || new Date();
        if (isWithinLast24Hours(time)) {
          notifList.push({
            id,
            type: 'staff',
            icon: <Award className="w-5 h-5 text-purple-500" />,
            title: '👨‍🏫 New Teacher',
            message: `${teacher.fullName || 'Teacher'} joined the staff`,
            time,
            timestamp: new Date(time).getTime(),
            read: currentReadIds.includes(id),
            action: '/admin/teachers',
            actionLabel: 'View Teacher',
            category: 'staff'
          });
        }
      });

      // 5. Unassigned teachers (only show if recently created)
      teachers.filter(t => !t.classId).forEach(teacher => {
        const id = `unassigned-teacher-${teacher.id}`;
        const time = teacher.createdAt || new Date();
        if (isWithinLast24Hours(time)) {
          notifList.push({
            id,
            type: 'warning',
            icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
            title: '⚠️ Unassigned Teacher',
            message: `${teacher.fullName || 'Teacher'} has NO class assigned`,
            time,
            timestamp: new Date(time).getTime(),
            read: currentReadIds.includes(id),
            action: '/admin/teachers',
            actionLabel: 'Assign Class',
            category: 'staff'
          });
        }
      });

      // Sort by timestamp (newest first)
      notifList.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(notifList.slice(0, 30));
      setUnreadCount(notifList.filter(n => !n.read).length);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Admin fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [readIds]);

  // ================= INITIAL FETCH + POLLING =================
  useEffect(() => {
    fetchAllData();
    intervalRef.current = setInterval(fetchAllData, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAllData]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    toast.success('Logged out');
  };

  // Load user
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  return (
    <>
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm relative z-40">
        {/* LEFT – Branding */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-gray-800">Admin Command</h1>
            <p className="text-xs text-gray-500">System Administration</p>
          </div>
        </div>

        {/* RIGHT – Actions */}
        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          {/* SEARCH */}
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <input type="text" placeholder="Search students, teachers..." value={searchQuery} onChange={handleSearchInput}
                className="pl-9 pr-4 py-2 w-40 xl:w-56 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white" />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-[400px] max-h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{searchResults.length} results</span>
                  <button onClick={() => { setShowSearchResults(false); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="overflow-y-auto max-h-[380px]">
                  {searchResults.map(result => (
                    <div key={`${result.type}-${result.id}`} onClick={() => { setShowSearchResults(false); setSearchQuery(''); navigate(result.path); }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">{result.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{result.title}</p>
                        <p className="text-xs text-gray-500">{result.subtitle} • {result.details}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* NOTIFICATIONS */}
          <div className="relative" ref={notificationRef}>
            <button onClick={toggleNotifications} className="relative p-2.5 rounded-xl hover:bg-gray-100 transition">
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold px-1 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-[95vw] max-w-[480px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    <span className="text-[10px] text-gray-400">Last 24 hours</span>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>

                <div className="overflow-y-auto max-h-[60vh]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <BellOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No notifications in the last 24 hours</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} onClick={() => { markAsRead(notif.id); if (notif.action) navigate(notif.action); }}
                        className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer transition ${!notif.read ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500 hover:bg-indigo-100/50' : 'hover:bg-gray-50'}`}>
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">{notif.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTimeAgo(notif.time)}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">{notif.category}</span>
                            {notif.actionLabel && <span className="text-[10px] text-indigo-500 font-medium">{notif.actionLabel} →</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button onClick={() => {
              const menu = document.getElementById('admin-profile-menu');
              if (menu) menu.classList.toggle('hidden');
            }} className="flex items-center gap-3 border-l pl-4 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-blue-700 text-white flex items-center justify-center font-bold shadow-md">
                {user.Fname?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block">
                <h4 className="text-sm font-semibold text-gray-800">{user.Fname || 'Admin'}</h4>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            <div id="admin-profile-menu" className="hidden absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                <p className="font-semibold text-gray-800">{user.Fname} {user.Lname}</p>
                <p className="text-xs text-gray-500">{user.Email}</p>
              </div>
              <div className="py-1">
                {[
                  { icon: <LayoutGrid className="w-4 h-4" />, label: 'Dashboard', path: '/admin' },
                  { icon: <Users className="w-4 h-4" />, label: 'Students', path: '/admin/students' },
                  { icon: <UserCog className="w-4 h-4" />, label: 'Teachers', path: '/admin/teachers' },
                  { icon: <School className="w-4 h-4" />, label: 'Classes', path: '/admin/adminclasses' },
                  { icon: <DollarSign className="w-4 h-4" />, label: 'Fees', path: '/admin/adminfees' },
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics', path: '/admin/analytics' },
                  { divider: true },
                  { icon: <Settings className="w-4 h-4" />, label: 'Settings', path: '/admin/settings' },
                  { icon: <LogOut className="w-4 h-4" />, label: 'Logout', path: 'logout', isLogout: true },
                ].map((item, idx) => {
                  if (item.divider) return <div key={idx} className="border-t border-gray-100 my-1" />;
                  return (
                    <button key={idx} onClick={() => { 
                      document.getElementById('admin-profile-menu').classList.add('hidden');
                      item.isLogout ? handleLogout() : navigate(item.path);
                    }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${item.isLogout ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                      {item.icon} {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default AdminTopbar;