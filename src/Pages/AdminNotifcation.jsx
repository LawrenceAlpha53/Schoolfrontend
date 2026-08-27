// Pages/Admin/AdminNotifications.jsx – WITH FULL DATE/TIME (including seconds)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellRing, CheckCircle, AlertCircle, Activity,
  MessageSquare, Calendar, DollarSign, Users, School, BookOpen,
  RefreshCw, Download, Loader2, ChevronLeft, ChevronRight,
  Search, Eye, Check, X, Trash2, Megaphone,
  Clock, UserPlus, Award, FileText, TrendingUp, ArrowLeft,
  Shield, GraduationCap, Zap, Sparkles, Filter, Hourglass
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ---------- HELPERS ----------
// Now includes seconds!
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-UG', { 
  year: 'numeric', 
  month: 'short', 
  day: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit', 
  second: '2-digit' 
}) : 'N/A';

const timeAgo = (d) => {
  if (!d) return '';
  const diff = new Date() - new Date(d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return 'UGX 0';
  if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `UGX ${(amount / 1000).toFixed(0)}K`;
  return `UGX ${amount}`;
};

// ---------- STORAGE HELPERS ----------
const STORAGE_KEY = 'admin_notification_history';
const DISMISSED_KEY = 'admin_dismissed_notifications';
const CACHE_KEY = 'admin_notification_cache';
const CACHE_TIME_KEY = 'admin_notification_cache_time';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const loadStoredNotifications = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveStoredNotifications = (notifs) => {
  try {
    const trimmed = notifs.slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
};

const loadDismissedIds = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const saveDismissedIds = (set) => {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
};

// Cache helpers
const loadCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const time = localStorage.getItem(CACHE_TIME_KEY);
    if (cached && time) {
      const age = Date.now() - parseInt(time);
      if (age < CACHE_EXPIRY_MS) {
        return JSON.parse(cached);
      }
    }
    return null;
  } catch { return null; }
};

const saveCache = (notifs) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(notifs));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch { /* ignore */ }
};

const AdminNotifications = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [notifications, setNotifications] = useState(() => {
    const cached = loadCache();
    return cached || [];
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const time = localStorage.getItem(CACHE_TIME_KEY);
    return time ? new Date(parseInt(time)) : new Date();
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // ================= DATA FETCHING =================
  const fetchAllNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      else setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, feesRes, teachersRes, marksRes, classesRes, subjectsRes, attendanceRes] = await Promise.all([
        api.get('/students', config).catch(() => ({ data: [] })),
        api.get('/fees', config).catch(() => ({ data: [] })),
        api.get('/teachers', config).catch(() => ({ data: [] })),
        api.get('/marks', config).catch(() => ({ data: [] })),
        api.get('/classes', config).catch(() => ({ data: [] })),
        api.get('/subjects', config).catch(() => ({ data: [] })),
        api.get('/attendance/my-class', config).catch(() => ({ data: [] }))
      ]);

      const extract = (res) => {
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d?.data && Array.isArray(d.data)) return d.data;
        return [];
      };

      const students = extract(studentsRes);
      const fees = extract(feesRes);
      const teachers = extract(teachersRes);
      const marks = extract(marksRes);
      const classes = extract(classesRes);
      const subjects = extract(subjectsRes);
      const attendance = extract(attendanceRes);

      const storedNotifs = loadStoredNotifications();
      const dismissedIds = loadDismissedIds();
      const storedIds = new Set(storedNotifs.map(n => n.id));

      const newNotifs = [];

      students.forEach(student => {
        const id = `student-reg-${student.id}`;
        if (!storedIds.has(id) && !dismissedIds.has(id)) {
          newNotifs.push({
            id,
            type: 'student',
            icon: 'UserPlus',
            title: '🎓 New Student Registered',
            message: `${student.fullName || 'Student'} registered in ${student.class?.className || 'School'} (${student.studentNumber || 'N/A'})`,
            category: 'student',
            priority: 'medium',
            time: student.createdAt || new Date().toISOString(),
            read: false,
            metadata: { studentId: student.id, studentName: student.fullName, classId: student.classId }
          });
        }
      });

      fees.filter(f => Number(f.amountPaid || 0) > 0).forEach(fee => {
        const id = `fee-payment-${fee.id}`;
        if (!storedIds.has(id) && !dismissedIds.has(id)) {
          const student = students.find(s => Number(s.id) === Number(fee.studentId));
          const amount = Number(fee.amountPaid || 0);
          const total = Number(fee.totalFee || 0);
          const balance = total - amount;
          newNotifs.push({
            id,
            type: 'fee',
            icon: 'DollarSign',
            title: '💰 Fee Payment Recorded',
            message: `${student?.fullName || 'Student'} paid ${formatCurrency(amount)}${balance > 0 ? ` (Balance: ${formatCurrency(balance)})` : ' ✅ Fully Paid'}`,
            category: 'fee',
            priority: 'high',
            time: fee.createdAt || fee.paymentDate || new Date().toISOString(),
            read: false,
            metadata: { studentId: fee.studentId, amount, balance, feeId: fee.id }
          });
        }
      });

      students.forEach(student => {
        const id = `nil-fee-${student.id}`;
        const studentFees = fees.filter(f => Number(f.studentId) === Number(student.id));
        if (studentFees.length === 0 && !storedIds.has(id) && !dismissedIds.has(id)) {
          newNotifs.push({
            id,
            type: 'warning',
            icon: 'AlertCircle',
            title: '⚠️ No Fee Record',
            message: `${student.fullName || 'Student'} (${student.studentNumber || 'N/A'}) has NO fee records`,
            category: 'fee',
            priority: 'high',
            time: new Date().toISOString(),
            read: false,
            metadata: { studentId: student.id }
          });
        }
      });

      marks.forEach(mark => {
        const id = `mark-entry-${mark.id}`;
        if (!storedIds.has(id) && !dismissedIds.has(id)) {
          const student = students.find(s => Number(s.id) === Number(mark.studentId));
          const subject = subjects.find(s => Number(s.id) === Number(mark.subjectId));
          if (student) {
            newNotifs.push({
              id,
              type: 'academic',
              icon: 'FileText',
              title: '📝 Mark Recorded',
              message: `${student.fullName}: ${mark.score || 0}% in ${subject?.subjectName || 'Subject'} (${mark.examType || 'Exam'})`,
              category: 'academic',
              priority: 'medium',
              time: mark.createdAt || new Date().toISOString(),
              read: false,
              metadata: { studentId: mark.studentId, score: mark.score, subjectId: mark.subjectId, examType: mark.examType }
            });
          }
        }
      });

      students.forEach(student => {
        const id = `nil-mark-${student.id}`;
        const studentMarks = marks.filter(m => Number(m.studentId) === Number(student.id));
        if (studentMarks.length === 0 && !storedIds.has(id) && !dismissedIds.has(id)) {
          newNotifs.push({
            id,
            type: 'warning',
            icon: 'FileText',
            title: '📝 No Marks Recorded',
            message: `${student.fullName || 'Student'} has NO marks recorded`,
            category: 'academic',
            priority: 'medium',
            time: new Date().toISOString(),
            read: false,
            metadata: { studentId: student.id }
          });
        }
      });

      teachers.forEach(teacher => {
        const id = `teacher-assigned-${teacher.id}`;
        if (!storedIds.has(id) && !dismissedIds.has(id)) {
          const cls = classes.find(c => Number(c.id) === Number(teacher.classId));
          const subject = subjects.find(s => Number(s.id) === Number(teacher.subjectId));
          newNotifs.push({
            id,
            type: 'staff',
            icon: 'Award',
            title: '👨‍🏫 Teacher Assignment',
            message: `${teacher.fullName || 'Teacher'} assigned to ${cls?.className || 'No Class'}${subject ? ` for ${subject.subjectName}` : ''}`,
            category: 'staff',
            priority: 'medium',
            time: teacher.createdAt || new Date().toISOString(),
            read: false,
            metadata: { teacherId: teacher.id, classId: teacher.classId, subjectId: teacher.subjectId }
          });
        }
      });

      teachers.filter(t => !t.classId).forEach(teacher => {
        const id = `unassigned-teacher-${teacher.id}`;
        if (!storedIds.has(id) && !dismissedIds.has(id)) {
          newNotifs.push({
            id,
            type: 'warning',
            icon: 'AlertCircle',
            title: '⚠️ Unassigned Teacher',
            message: `${teacher.fullName || 'Teacher'} has NO class assigned`,
            category: 'staff',
            priority: 'high',
            time: new Date().toISOString(),
            read: false,
            metadata: { teacherId: teacher.id }
          });
        }
      });

      const filteredStored = storedNotifs.filter(n => !dismissedIds.has(n.id));
      const allNotifs = [...filteredStored, ...newNotifs];
      allNotifs.sort((a, b) => new Date(b.time) - new Date(a.time));

      setNotifications(allNotifs);
      setLastUpdated(new Date());
      saveStoredNotifications(allNotifs);
      saveCache(allNotifs);

      if (!silent && newNotifs.length > 0) {
        toast.success(`${newNotifs.length} new notification${newNotifs.length > 1 ? 's' : ''} loaded`);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      const stored = loadStoredNotifications();
      const dismissed = loadDismissedIds();
      setNotifications(stored.filter(n => !dismissed.has(n.id)));
      if (!silent) toast.error('Failed to refresh notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (notifications.length === 0) {
      setLoading(true);
      fetchAllNotifications(true).then(() => setLoading(false));
    } else {
      const timer = setTimeout(() => fetchAllNotifications(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => fetchAllNotifications(true), 60000);
    return () => clearInterval(interval);
  }, [fetchAllNotifications]);

  // ================= FILTERS =================
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'student', label: 'Students' },
    { value: 'fee', label: 'Fees' },
    { value: 'academic', label: 'Academic' },
    { value: 'staff', label: 'Staff' },
    { value: 'warning', label: 'Warnings' },
  ];

  const timeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'last30min', label: 'Last 30 Minutes' },
    { value: 'last24h', label: 'Last 24 Hours' },
    { value: 'last7d', label: 'Last 7 Days' },
    { value: 'last30d', label: 'Last 30 Days' },
  ];

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(n =>
        (n.title || '').toLowerCase().includes(term) ||
        (n.message || '').toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(n => n.category === categoryFilter);
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (timeFilter) {
        case 'last30min':
          cutoff.setMinutes(now.getMinutes() - 30);
          break;
        case 'last24h':
          cutoff.setHours(now.getHours() - 24);
          break;
        case 'last7d':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'last30d':
          cutoff.setDate(now.getDate() - 30);
          break;
        default:
          break;
      }
      result = result.filter(n => new Date(n.time) >= cutoff);
    }

    return result;
  }, [notifications, searchTerm, categoryFilter, timeFilter]);

  const totalPages = Math.ceil(filteredNotifications.length / perPage) || 1;
  const currentItems = useMemo(() => {
    return filteredNotifications.slice((currentPage - 1) * perPage, currentPage * perPage);
  }, [filteredNotifications, currentPage]);

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    students: notifications.filter(n => n.category === 'student').length,
    fees: notifications.filter(n => n.category === 'fee').length,
    academic: notifications.filter(n => n.category === 'academic').length,
    staff: notifications.filter(n => n.category === 'staff').length,
    warnings: notifications.filter(n => n.category === 'warning').length,
  }), [notifications]);

  // ================= ACTIONS =================
  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveStoredNotifications(updated);
    saveCache(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
    saveCache(updated);
    toast.success('All marked as read');
  };

  const deleteNotification = (id) => {
    if (!window.confirm('Delete this notification permanently?')) return;
    const dismissed = loadDismissedIds();
    dismissed.add(id);
    saveDismissedIds(dismissed);
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveStoredNotifications(updated);
    saveCache(updated);
    toast.success('Notification deleted permanently');
  };

  const clearAll = () => {
    if (!window.confirm('Delete ALL notifications permanently?')) return;
    const dismissed = loadDismissedIds();
    notifications.forEach(n => dismissed.add(n.id));
    saveDismissedIds(dismissed);
    setNotifications([]);
    saveStoredNotifications([]);
    saveCache([]);
    toast.success('All notifications cleared');
  };

  const exportCSV = () => {
    const csv = 'Title,Message,Category,Priority,Date,Status\n' +
      filteredNotifications.map(n =>
        `"${n.title || ''}","${n.message || ''}","${n.category || ''}","${n.priority || ''}","${formatDate(n.time)}","${n.read ? 'Read' : 'Unread'}"`
      ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `notifications_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success('Exported');
  };

  const handleRefresh = () => {
    fetchAllNotifications(false);
  };

  // ================= ICON MAPPER =================
  const getIcon = (iconName) => {
    const icons = {
      UserPlus: <UserPlus className="w-4 h-4" />,
      DollarSign: <DollarSign className="w-4 h-4" />,
      FileText: <FileText className="w-4 h-4" />,
      Award: <Award className="w-4 h-4" />,
      AlertCircle: <AlertCircle className="w-4 h-4" />,
      Bell: <Bell className="w-4 h-4" />,
      GraduationCap: <GraduationCap className="w-4 h-4" />,
    };
    return icons[iconName] || <Bell className="w-4 h-4" />;
  };

  const getIconBg = (category) => {
    const colors = {
      student: 'bg-blue-100 text-blue-600',
      fee: 'bg-emerald-100 text-emerald-600',
      academic: 'bg-purple-100 text-purple-600',
      staff: 'bg-orange-100 text-orange-600',
      warning: 'bg-red-100 text-red-600',
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white rounded-lg transition text-gray-500 mb-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bell className="w-7 h-7 text-indigo-600" />
              Notification Center
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              All system activity tracked
              <span className="text-xs text-gray-400">
                • Last updated: {timeAgo(lastUpdated)}
              </span>
              {refreshing && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={markAllAsRead} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition">
              Mark All Read
            </button>
            <button onClick={clearAll} className="px-3 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 transition">
              Clear All
            </button>
            <button onClick={exportCSV} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleRefresh} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'indigo' },
            { label: 'Unread', value: stats.unread, color: 'red' },
            { label: 'Students', value: stats.students, color: 'blue' },
            { label: 'Fees', value: stats.fees, color: 'emerald' },
            { label: 'Academic', value: stats.academic, color: 'purple' },
            { label: 'Staff', value: stats.staff, color: 'orange' },
            { label: 'Warnings', value: stats.warnings, color: 'amber' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold text-${s.color}-600`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search notifications..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white">
            {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white">
            {timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <span className="text-xs text-gray-400 ml-auto">{filteredNotifications.length} items</span>
        </div>

        {/* Notification List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {currentItems.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Bell className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">No notifications match your filters</p>
              <p className="text-sm">Try adjusting search, category, or time range.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {currentItems.map(notif => (
                <div key={notif.id} className={`p-4 transition hover:bg-gray-50 ${!notif.read ? 'bg-indigo-50/30 border-l-4 border-l-indigo-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(notif.category)}`}>
                      {getIcon(notif.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          {/* 👇 NEW: Full date & time with seconds */}
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {formatDate(notif.time)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{notif.category}</span>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(notif.time)}</span>
                        {!notif.read && (
                          <button onClick={() => markAsRead(notif.id)} className="text-[10px] text-indigo-600 font-medium hover:text-indigo-800">
                            <Check className="w-3 h-3 inline mr-0.5" /> Mark read
                          </button>
                        )}
                        <button onClick={() => deleteNotification(notif.id)} className="text-[10px] text-red-500 font-medium hover:text-red-700">
                          <Trash2 className="w-3 h-3 inline mr-0.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 5 && currentPage > 3) page = currentPage - 3 + i;
                  if (page > totalPages) return null;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-1 border rounded-lg text-xs ${currentPage === page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200'}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;