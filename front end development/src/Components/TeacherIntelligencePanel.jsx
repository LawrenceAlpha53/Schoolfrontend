// TeacherIntelligencePanel.jsx – with 24‑hour expiry, pending marks list, 100% cap, real‑time updates
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Bell,
  TrendingUp,
  CalendarDays,
  Users,
  Award,
  Target,
  Sparkles,
  Brain,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Activity,
  Megaphone,
  RefreshCw,
  Loader2,
  ChevronDown,
  X,
  Search,
  Filter,
  DollarSign,
  UserPlus,
  Calendar,
  BarChart3,
  PieChart,
  Zap,
  Star,
  Flame,
  Crown,
  Trophy,
  User,
  Mail,
  Phone,
  MapPin,
  School,
  UserCheck,
  UserX,
  MessageSquare,
  ThumbsUp,
  Rocket,
  Target as TargetIcon
} from "lucide-react";
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const EXPIRY_HOURS = 24;

const TeacherIntelligencePanel = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [pendingMarks, setPendingMarks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [performance, setPerformance] = useState({ overall: 0, subjects: [] });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    pendingTasks: 0,
    completedTasks: 0
  });
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [instructions, setInstructions] = useState([]);
  const [selectedInstruction, setSelectedInstruction] = useState(null);
  const [showInstructionDetail, setShowInstructionDetail] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  const intervalRef = useRef(null);

  // ================= HELPER FUNCTIONS =================
  const getTeacherId = useCallback(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.teacherId || user?.id || null;
  }, []);

  const extractData = (res) => {
    if (!res || !res.data) return [];
    const d = res.data;
    if (Array.isArray(d)) return d;
    if (d.data && Array.isArray(d.data)) return d.data;
    if (d.success && d.data && Array.isArray(d.data)) return d.data;
    return [];
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    const diff = new Date() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { setIsLoading(false); return; }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // ===== 1. FETCH TEACHER DATA =====
      let currentTeacher = null;
      
      try {
        const meRes = await api.get('/teachers/me', config);
        if (meRes.data?.success && meRes.data.data) {
          currentTeacher = meRes.data.data;
          setTeacherId(currentTeacher.id);
        }
      } catch (e) {
        console.log('⚠️ /teachers/me failed, trying fallback...');
        const teachersRes = await api.get('/teachers', config);
        const teachers = extractData(teachersRes);
        currentTeacher = teachers.find(t => 
          t.id === getTeacherId() || 
          t.email === user.Email || 
          t.fullName === (user.Fname + ' ' + user.Lname)
        );
        if (currentTeacher) setTeacherId(currentTeacher.id);
      }

      if (!currentTeacher) {
        toast.error('Teacher not found');
        setIsLoading(false);
        return;
      }

      setTeacherData(currentTeacher);

      // ===== 2. FETCH STUDENTS =====
      const studentsRes = await api.get('/students', config);
      const allStudents = extractData(studentsRes);
      const teacherStudents = allStudents.filter(s => s.classId === currentTeacher.classId);
      const totalStudents = teacherStudents.length;

      // ===== 3. FETCH MARKS with student & subject details =====
      let teacherMarks = [];
      let allSubjectDetails = [];
      
      try {
        const marksRes = await api.get(`/marks/teacher/${currentTeacher.id}`, config);
        teacherMarks = extractData(marksRes);
      } catch (e) {
        console.log('⚠️ Marks fetch error:', e.message);
        const allMarksRes = await api.get('/marks', config);
        const allMarks = extractData(allMarksRes);
        teacherMarks = allMarks.filter(m => m.teacherId === currentTeacher.id);
      }

      try {
        const subjectsRes = await api.get('/subjects', config);
        allSubjectDetails = extractData(subjectsRes);
      } catch (e) { console.log('⚠️ Subjects fetch error:', e.message); }

      const enrichedMarks = teacherMarks.map(m => {
        const student = teacherStudents.find(s => s.id === m.studentId);
        const subject = allSubjectDetails.find(s => s.id === m.subjectId);
        return {
          ...m,
          studentName: student?.fullName || `Student ${m.studentId}`,
          subjectName: subject?.subjectName || `Subject ${m.subjectId}`,
          examType: m.examType || 'CAT',
        };
      });

      const pending = enrichedMarks.filter(m => !m.submitted || m.score === null || m.score === undefined);
      const submitted = enrichedMarks.filter(m => m.submitted && m.score !== null && m.score !== undefined);

      setPendingMarks(pending);

      const scores = submitted.map(m => Number(m.score)).filter(s => !isNaN(s));
      const avgScore = scores.length > 0 ? Math.min(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), 100) : 0; // cap at 100

      setStats({
        totalStudents,
        attendanceRate: 0,
        pendingTasks: pending.length,
        completedTasks: submitted.length
      });

      // ===== 4. FETCH TIMETABLE =====
      try {
        const timetableRes = await api.get(`/timetables/teacher/${currentTeacher.id}`, config);
        if (timetableRes.data?.success) {
          const timetableData = timetableRes.data.data || {};
          const today = new Date();
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayName = dayNames[today.getDay()];
          const todayClassesData = timetableData[todayName] || [];
          
          setTodayClasses(todayClassesData.map(cls => ({
            subject: cls.subject,
            time: `${cls.startTime} - ${cls.endTime}`,
            class: cls.class,
            room: cls.room || 'N/A'
          })));
        }
      } catch (e) { console.log('Timetable fetch error:', e.message); }

      // ===== 5. FETCH NOTIFICATIONS (with 24‑hour expiry) =====
      try {
        const notifRes = await api.get('/notifications/my', config);
        if (notifRes.data?.success) {
          const allNotifs = notifRes.data.data || [];
          const now = Date.now();
          const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
          const recentNotifs = allNotifs.filter(n => {
            const createdAt = n.createdAt ? new Date(n.createdAt).getTime() : now;
            return (now - createdAt) < expiryMs;
          });

          setNotifications(recentNotifs.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: n.createdAt || new Date(),
            read: n.isRead || false,
            category: n.category || 'general',
            icon: n.category === 'academic' ? <BookOpen className="w-4 h-4 text-purple-500" /> :
                  n.category === 'attendance' ? <ClipboardCheck className="w-4 h-4 text-blue-500" /> :
                  n.category === 'fee' ? <DollarSign className="w-4 h-4 text-emerald-500" /> :
                  <Bell className="w-4 h-4 text-gray-500" />
          })));
          setUnreadCount(recentNotifs.filter(n => !n.isRead).length);
        }
      } catch (e) { console.log('Notifications fetch error:', e.message); }

      // ===== 6. FETCH ATTENDANCE =====
      let attendanceRate = 0;
      try {
        const today = new Date().toISOString().split('T')[0];
        if (currentTeacher.classId) {
          const attendanceRes = await api.get(`/attendance/class/${currentTeacher.classId}/date/${today}`, config);
          let attendanceData = attendanceRes.data?.data || attendanceRes.data || [];
          if (attendanceData.records && Array.isArray(attendanceData.records)) {
            attendanceData = attendanceData.records;
          }
          if (Array.isArray(attendanceData)) {
            const present = attendanceData.filter(a => a.status === 'present').length;
            const total = attendanceData.length;
            attendanceRate = total > 0 ? Math.min(Math.round((present / total) * 100), 100) : 0; // cap at 100
          }
          setStats(prev => ({ ...prev, attendanceRate }));
        }
      } catch (e) { console.log('Attendance fetch error:', e.message); }

      // ===== 7. PERFORMANCE =====
      if (submitted.length > 0) {
        const subjectMap = {};
        enrichedMarks.forEach(m => {
          if (m.subjectId && m.score !== null && m.score !== undefined) {
            const score = Number(m.score);
            if (!isNaN(score)) {
              const name = m.subjectName || `Subject ${m.subjectId}`;
              if (!subjectMap[m.subjectId]) {
                subjectMap[m.subjectId] = { name, scores: [], total: 0, count: 0 };
              }
              subjectMap[m.subjectId].scores.push(score);
              subjectMap[m.subjectId].total += score;
              subjectMap[m.subjectId].count++;
            }
          }
        });

        const subjectPerformance = Object.values(subjectMap)
          .filter(s => s.count > 0)
          .map(s => ({ name: s.name, score: Math.min(Math.round(s.total / s.count), 100) })) // cap each subject
          .sort((a, b) => b.score - a.score);

        setPerformance({ overall: avgScore, subjects: subjectPerformance });
      }

      // ===== 8. ACTIVITIES =====
      const activityList = [];
      
      teacherStudents.forEach(s => {
        if (s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 86400000)) {
          activityList.push({
            id: `student-${s.id}`,
            title: `📚 New student: ${s.fullName}`,
            time: s.createdAt,
            icon: <UserPlus className="w-4 h-4 text-blue-500" />
          });
        }
      });

      submitted.slice(0, 3).forEach(m => {
        if (m.createdAt && new Date(m.createdAt) > new Date(Date.now() - 86400000)) {
          activityList.push({
            id: `mark-${m.id}`,
            title: `📝 ${m.studentName} scored ${Math.min(m.score, 100)}% in ${m.subjectName}`,
            time: m.createdAt,
            icon: <FileText className="w-4 h-4 text-orange-500" />
          });
        }
      });

      activityList.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivities(activityList.slice(0, 10));

      // ===== 9. UPCOMING EVENTS =====
      const nowDate = new Date();
      const futureEvents = notifications
        .filter(n => n.scheduledFor && new Date(n.scheduledFor) > nowDate)
        .slice(0, 5)
        .map(n => ({
          id: n.id,
          title: n.title,
          date: new Date(n.scheduledFor).toLocaleDateString('en-UG', { 
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }));
      
      if (futureEvents.length === 0) {
        setUpcomingEvents([{ id: 'no-events', title: 'No upcoming events', date: '' }]);
      } else {
        setUpcomingEvents(futureEvents);
      }

    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [getTeacherId]);

  // ================= LISTEN FOR MARKS UPDATES =================
  useEffect(() => {
    const handleMarksSaved = (event) => {
      console.log('📌 Marks saved event received, refreshing Intelligence Panel...');
      fetchData();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'marksUpdated' || e.key === 'marksUpdateCount') {
        console.log('📌 Storage change detected (marks updated), refreshing...');
        fetchData();
      }
    };

    window.addEventListener('marksSaved', handleMarksSaved);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('marksSaved', handleMarksSaved);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchData]);

  // ================= INITIAL FETCH =================
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="h-full bg-white border-l border-slate-200 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm font-medium">Loading Intelligence Center...</p>
        </div>
      </div>
    );
  }

  // ================= FILTER NOTIFICATIONS =================
  const getFilteredNotifications = () => {
    let filtered = notifications;
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  // ================= RENDER =================
  return (
    <div className="h-full bg-gradient-to-b from-slate-50 to-white border-l border-slate-200 overflow-y-auto p-4 space-y-4">
      
      {/* ================= HEADER ================= */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Intelligence Center
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-full animate-pulse font-medium">
                  {unreadCount} new
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="font-medium text-slate-700">{teacherData?.fullName || 'Teacher'}</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 hover:scale-105"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= TODAY'S CLASSES – CONDITIONALLY RENDERED ================= */}
      {todayClasses.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-300" />
                Today's Classes
              </h3>
              <p className="text-purple-200 text-sm mt-1">
                {todayClasses.length} lessons scheduled
              </p>
            </div>
            <div className="text-right bg-white/10 rounded-xl px-4 py-2">
              <p className="text-2xl font-bold">{todayClasses.length}</p>
              <p className="text-xs text-purple-200">Classes</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {todayClasses.map((cls, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2.5 transition-all duration-200">
                <span className="font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-300"></span>
                  {cls.subject}
                </span>
                <span className="text-purple-200">{cls.time}</span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">{cls.class}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= PENDING MARKS LIST ================= */}
      {pendingMarks.length > 0 && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-orange-200 bg-gradient-to-r from-orange-50/50 to-white">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              Pending Marks
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {pendingMarks.length}
              </span>
            </h4>
            <button
              onClick={() => navigate('/teacher/marks-entry')}
              className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              Enter Marks →
            </button>
          </div>
          <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
            {pendingMarks.slice(0, 10).map((mark) => (
              <div key={mark.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-all duration-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{mark.studentName}</p>
                  <p className="text-xs text-slate-500">{mark.subjectName} • {mark.examType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Pending</span>
                  <button
                    onClick={() => navigate('/teacher/marks-entry')}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Enter
                  </button>
                </div>
              </div>
            ))}
            {pendingMarks.length > 10 && (
              <div className="p-2 text-center text-xs text-slate-400">
                + {pendingMarks.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-orange-600" />
            <h4 className="text-xs font-medium text-orange-700">Pending Marks</h4>
          </div>
          <p className="text-2xl font-bold text-orange-700">{stats.pendingTasks}</p>
          <p className="text-xs text-orange-500 mt-0.5">{stats.completedTasks} completed</p>
          <div className="mt-2 w-full h-1.5 bg-orange-200 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ 
              width: stats.pendingTasks + stats.completedTasks > 0 
                ? `${Math.min((stats.completedTasks / (stats.pendingTasks + stats.completedTasks)) * 100, 100)}%` 
                : '0%' 
            }}></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-medium text-emerald-700">Students</h4>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.totalStudents}</p>
          <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1">
            <span className={`${stats.attendanceRate >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
              {stats.attendanceRate}% attendance
            </span>
          </p>
          <div className="mt-2 w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${stats.attendanceRate >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                 style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & FILTER ================= */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                filter === f 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ================= NOTIFICATIONS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50/50 to-white">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-600" />
            Notifications
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {notifications.filter(n => !n.read).length} unread
            </span>
          </h4>
          <span className="text-xs text-slate-400">{filteredNotifications.length} total</span>
        </div>
        <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              {searchTerm ? 'No matching notifications' : 'No recent notifications'}
            </div>
          ) : (
            filteredNotifications.slice(0, 6).map((notif) => (
              <div key={notif.id} className={`p-3 hover:bg-slate-50 transition-all duration-200 ${
                !notif.read ? 'bg-purple-50/30 border-l-4 border-l-purple-500' : ''
              }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{notif.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatTimeAgo(notif.time)}</p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5 animate-pulse"></span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= ACTIVITY FEED ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-white">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Activity Feed
          </h4>
          <span className="text-xs text-slate-400">{activities.length} recent</span>
        </div>
        <div className="max-h-[150px] overflow-y-auto divide-y divide-slate-100">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No recent activity</div>
          ) : (
            activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-all duration-200">
                {activity.icon}
                <span className="text-sm text-slate-700 flex-1">{activity.title}</span>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatTimeAgo(activity.time)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= PERFORMANCE – CAPPED AT 100 ================= */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-200 rounded-2xl p-4 shadow-sm">
        <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Performance Overview
        </h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-emerald-700">{Math.min(performance.overall, 100)}%</p>
            <p className="text-xs text-emerald-600">Overall Average</p>
          </div>
          <div className="flex gap-2">
            {performance.subjects.slice(0, 3).map((sub, idx) => (
              <div key={idx} className="bg-white rounded-xl px-3 py-2 shadow-sm border border-emerald-100 text-center">
                <p className="text-xs text-slate-500">{sub.name}</p>
                <p className="text-sm font-bold text-purple-600">{Math.min(sub.score, 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= UPCOMING EVENTS ================= */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-200 rounded-2xl p-4 shadow-sm">
        <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          Upcoming Events
        </h4>
        {upcomingEvents.length === 0 || upcomingEvents[0]?.id === 'no-events' ? (
          <p className="text-sm text-slate-400 text-center py-2">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event, idx) => (
              <div key={event.id || idx} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-indigo-100">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {event.title}
                </span>
                <span className="text-xs text-indigo-600 font-medium">{event.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= QUICK TIPS ================= */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl p-4 border border-purple-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-sm text-gray-700">
            💡 You have <strong className="text-purple-700">{unreadCount}</strong> unread notifications
            {stats.pendingTasks > 0 && ` and ${stats.pendingTasks} pending marks to enter`}
          </span>
        </div>
      </div>

      {/* ================= INSTRUCTION DETAIL MODAL ================= */}
      {showInstructionDetail && selectedInstruction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-purple-600" />
                  Instruction Details
                </h3>
                <p className="text-sm text-gray-500">From: {selectedInstruction.sender || 'Secretary'}</p>
              </div>
              <button
                onClick={() => setShowInstructionDetail(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedInstruction.priority === 'high' ? 'bg-red-100 text-red-700' :
                  selectedInstruction.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedInstruction.priority || 'Normal'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedInstruction.category === 'academic' ? 'bg-purple-100 text-purple-700' :
                  selectedInstruction.category === 'staff' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedInstruction.category || 'General'}
                </span>
                <span className="text-xs text-gray-400">{formatTimeAgo(selectedInstruction.date)}</span>
              </div>

              <h4 className="text-xl font-bold text-gray-800 mb-3">{selectedInstruction.title}</h4>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedInstruction.message}</p>

              {selectedInstruction.actionRequired && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Action Required: Please respond to this instruction
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4 flex gap-3">
              <button
                onClick={() => {
                  toast.success('Instruction marked as completed');
                  setShowInstructionDetail(false);
                }}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-purple-500/20"
              >
                ✓ Mark as Completed
              </button>
              <button
                onClick={() => setShowInstructionDetail(false)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition font-medium text-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherIntelligencePanel;