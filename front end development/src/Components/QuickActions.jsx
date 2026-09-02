// AdminQuickActions.jsx - COMPLETE FIXED VERSION WITH REAL DATA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import {
  Users, GraduationCap, School, BookOpen, DollarSign,
  ClipboardCheck, TrendingUp, Activity, Bell, Megaphone, Send,
  Eye, Edit, Trash2, Save, Plus, Search, Filter, X, Loader2,
  CheckCircle, XCircle, AlertCircle, Clock, CalendarDays, User,
  Mail, Phone, MapPin, Building, Briefcase, Shield, RefreshCw,
  ChevronRight, MessageSquare, FileBarChart, CreditCard, UserPlus,
  GraduationCap as GraduationCapIcon, Rocket, Sparkles, Zap,
  Flame, Crown, Medal, Trophy, Star, Gem, Diamond, Compass,
  Globe, Layers, Grid, List, ChevronDown, ChevronUp,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  Minus, ArrowUpRight, ArrowDownRight, Info, FileText, ArrowUp, ArrowDown
} from "lucide-react";

const AdminQuickActions = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ================= DASHBOARD STATS =================
  const [stats, setStats] = useState({
    totalStudents: 0, 
    totalTeachers: 0, 
    totalClasses: 0, 
    totalSubjects: 0,
    totalFeesCollected: 0, 
    totalFeesDemanded: 0,
    paidStudents: 0,
    pendingFeesStudents: 0,
    attendanceRate: 0,
    performanceRate: 0, 
    pendingMarks: 0, 
    completedMarks: 0, 
    totalUsers: 0,
    // New real stats
    totalMarks: 0,
    marksCompletionRate: 0,
    feeCollectionRate: 0,
    activeStudents: 0,
    inactiveStudents: 0
  });

  // ================= TEACHER REPORT STATUS =================
  const [teacherReports, setTeacherReports] = useState([]);
  const [reportStats, setReportStats] = useState({
    totalReports: 0, 
    completedReports: 0, 
    pendingReports: 0, 
    byClass: {}
  });

  // ================= SUBJECT & TEACHER PERFORMANCE =================
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [teacherPerformance, setTeacherPerformance] = useState([]);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [showAllTeachers, setShowAllTeachers] = useState(false);

  // ================= NOTIFICATIONS =================
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '', message: '', type: 'info', category: 'general',
    priority: 'medium', recipientType: 'all', recipientId: '',
    sendEmail: false, sendSMS: false
  });

  // ================= RECENT ACTIVITIES =================
  const [recentActivities, setRecentActivities] = useState([]);

  // ================= MODAL STATES =================
  const [showTeacherReportsModal, setShowTeacherReportsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // ================= FETCH ALL DATA =================
  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // ========== ALL API CALLS ==========
      const [
        studentsRes, teachersRes, classesRes, subjectsRes,
        feesRes, marksRes, usersRes, notificationsRes, attendanceRes
      ] = await Promise.all([
        axios.get("/students", config).catch(() => ({ data: { data: [] } })),
        axios.get("/teachers", config).catch(() => ({ data: { data: [] } })),
        axios.get("/classes", config).catch(() => ({ data: { data: [] } })),
        axios.get("/subjects", config).catch(() => ({ data: { data: [] } })),
        axios.get("/fees", config).catch(() => ({ data: { data: [] } })),
        axios.get("/marks", config).catch(() => ({ data: { data: [] } })),
        axios.get("/users", config).catch(() => ({ data: { data: [] } })),
        axios.get("/notifications/my", config).catch(() => ({ data: { data: [] } })),
        axios.get("/attendance", config).catch(() => ({ data: { data: [] } }))
      ]);

      // Extract data
      const students = studentsRes.data?.data || studentsRes.data || [];
      const teachers = teachersRes.data?.data || teachersRes.data || [];
      const classes = classesRes.data?.data || classesRes.data || [];
      const subjects = subjectsRes.data?.data || subjectsRes.data || [];
      const fees = feesRes.data?.data || feesRes.data || [];
      const marks = marksRes.data?.data || marksRes.data || [];
      const users = usersRes.data?.data || usersRes.data || [];
      const notifs = notificationsRes.data?.data || notificationsRes.data || [];
      const attendance = attendanceRes.data?.data || attendanceRes.data || [];

      console.log('📌 REAL DATA:', {
        students: students.length,
        teachers: teachers.length,
        classes: classes.length,
        subjects: subjects.length,
        fees: fees.length,
        marks: marks.length,
        users: users.length,
        attendance: attendance.length
      });

      // ========== REAL STATS CALCULATIONS ==========
      
      // 1. Fee Statistics (REAL)
      let totalFeesCollected = 0;
      let totalFeesDemanded = 0;
      let paidStudents = 0;
      let pendingFeesStudents = 0;
      
      fees.forEach(f => {
        const paid = Number(f.amountPaid || 0);
        const total = Number(f.totalFee || 0);
        totalFeesCollected += paid;
        totalFeesDemanded += total;
        const balance = total - paid;
        if (balance === 0 && paid > 0) paidStudents++;
        else if (balance > 0) pendingFeesStudents++;
      });
      
      const feeCollectionRate = totalFeesDemanded > 0 
        ? Math.round((totalFeesCollected / totalFeesDemanded) * 100) 
        : 0;

      // 2. Marks Statistics (REAL)
      const totalMarks = marks.length;
      const completedMarks = marks.filter(m => m.score !== null && m.score !== undefined && m.score !== '').length;
      const pendingMarks = totalMarks - completedMarks;
      const marksCompletionRate = totalMarks > 0 
        ? Math.round((completedMarks / totalMarks) * 100) 
        : 0;

      // 3. Performance Statistics (REAL)
      const scores = marks
        .filter(m => m.score !== null && m.score !== undefined && m.score !== '')
        .map(m => Number(m.score));
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0;

      // 4. Student Status (REAL)
      const activeStudents = students.filter(s => s.status === 'Active' || s.status === 'active').length;
      const inactiveStudents = students.length - activeStudents;

      // 5. Attendance Rate (REAL)
      let attendanceRate = 0;
      if (attendance.length > 0) {
        const present = attendance.filter(a => a.status === 'present' || a.status === 'Present').length;
        attendanceRate = Math.round((present / attendance.length) * 100);
      }

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalSubjects: subjects.length,
        totalFeesCollected: totalFeesCollected,
        totalFeesDemanded: totalFeesDemanded,
        paidStudents: paidStudents,
        pendingFeesStudents: pendingFeesStudents,
        attendanceRate: attendanceRate,
        performanceRate: avgScore,
        pendingMarks: pendingMarks,
        completedMarks: completedMarks,
        totalUsers: users.length,
        totalMarks: totalMarks,
        marksCompletionRate: marksCompletionRate,
        feeCollectionRate: feeCollectionRate,
        activeStudents: activeStudents,
        inactiveStudents: inactiveStudents
      });

      // ========== BUILD SUBJECT MAP ==========
      const subjectMap = {};
      subjects.forEach(s => {
        subjectMap[s.id] = s.subjectName || s.name || s.SubjectName || 'Unknown Subject';
      });

      // ========== BUILD TEACHER MAP ==========
      const teacherMap = {};
      teachers.forEach(t => {
        teacherMap[t.id] = t.fullName || t.name || 'Unknown Teacher';
      });

      // ========== SUBJECT PERFORMANCE (REAL) ==========
      const subjectScores = {};
      marks.forEach(m => {
        if (m.score !== null && m.score !== undefined && m.score !== '') {
          const subjId = m.subjectId || m.SubjectId;
          if (!subjId) return;
          
          const subjName = subjectMap[subjId];
          if (!subjName || subjName === 'Unknown Subject') return;

          if (!subjectScores[subjId]) {
            subjectScores[subjId] = { name: subjName, scores: [] };
          }
          subjectScores[subjId].scores.push(Number(m.score));
        }
      });
      
      const subjectList = Object.entries(subjectScores).map(([id, obj]) => ({
        id,
        name: obj.name,
        average: obj.scores.length > 0 ? Math.round(obj.scores.reduce((a, b) => a + b, 0) / obj.scores.length) : 0,
        count: obj.scores.length
      })).sort((a, b) => b.average - a.average);
      
      setSubjectPerformance(subjectList);

      // ========== TEACHER PERFORMANCE (REAL) ==========
      const teacherScores = {};
      marks.forEach(m => {
        if (m.score !== null && m.score !== undefined && m.score !== '') {
          const tId = m.teacherId || m.TeacherId;
          if (!tId) return;
          
          const tName = teacherMap[tId];
          if (!tName || tName === 'Unknown Teacher') return;

          if (!teacherScores[tId]) {
            teacherScores[tId] = { name: tName, scores: [] };
          }
          teacherScores[tId].scores.push(Number(m.score));
        }
      });
      
      const teacherList = Object.entries(teacherScores).map(([id, obj]) => ({
        id,
        name: obj.name,
        average: obj.scores.length > 0 ? Math.round(obj.scores.reduce((a, b) => a + b, 0) / obj.scores.length) : 0,
        count: obj.scores.length
      })).sort((a, b) => b.average - a.average);
      
      setTeacherPerformance(teacherList);

      // ========== TEACHER REPORTS ==========
      await fetchTeacherReports(teachers, marks, classes);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
      await fetchRecentActivities(students, fees, marks);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== fetchTeacherReports ==========
  const fetchTeacherReports = async (teachers, marks, classes) => {
    try {
      const reportData = [];
      let totalReports = 0, completedReports = 0, pendingReports = 0;
      const byClass = {};

      for (const teacher of teachers) {
        const teacherMarks = marks.filter(m => m.teacherId === teacher.id);
        const submitted = teacherMarks.filter(m => m.score !== null && m.score !== undefined && m.score !== '');
        const pending = teacherMarks.filter(m => m.score === null || m.score === undefined || m.score === '');
        const teacherClass = classes.find(c => c.id === teacher.classId);
        const className = teacherClass?.className || 'N/A';

        if (!byClass[className]) {
          byClass[className] = { total: 0, completed: 0, pending: 0 };
        }
        byClass[className].total += teacherMarks.length;
        byClass[className].completed += submitted.length;
        byClass[className].pending += pending.length;

        totalReports += teacherMarks.length;
        completedReports += submitted.length;
        pendingReports += pending.length;

        let subjectNames = 'N/A';
        if (teacher.subjects && teacher.subjects.length > 0) {
          subjectNames = teacher.subjects.map(s => s.subjectName).join(', ');
        }

        reportData.push({
          id: teacher.id,
          name: teacher.fullName || teacher.name,
          class: className,
          classId: teacher.classId,
          subject: subjectNames,
          totalStudents: teacherMarks.length,
          completed: submitted.length,
          pending: pending.length,
          completionRate: teacherMarks.length > 0
            ? Math.round((submitted.length / teacherMarks.length) * 100)
            : 0,
          lastUpdated: teacher.updatedAt || new Date()
        });
      }

      setTeacherReports(reportData.sort((a, b) => b.completionRate - a.completionRate));
      setReportStats({ totalReports, completedReports, pendingReports, byClass });
    } catch (error) {
      console.error("Error fetching teacher reports:", error);
    }
  };

  // ========== fetchRecentActivities ==========
  const fetchRecentActivities = async (students, fees, marks) => {
    const activities = [];
    
    // Recent students
    students.slice(0, 3).forEach(s => {
      activities.push({
        id: `student-${s.id}`,
        title: '📚 New Student Registered',
        description: `${s.fullName} was added to the system`,
        time: s.createdAt || new Date(),
        type: 'student',
        icon: <UserPlus className="w-4 h-4 text-blue-500" />
      });
    });
    
    // Recent fees
    fees.filter(f => f.amountPaid > 0).slice(0, 2).forEach(f => {
      const student = students.find(s => s.id === f.studentId);
      activities.push({
        id: `fee-${f.id}`,
        title: '💰 Fee Payment Recorded',
        description: `${student?.fullName || 'Student'} paid ${f.amountPaid}`,
        time: f.createdAt || new Date(),
        type: 'fee',
        icon: <CreditCard className="w-4 h-4 text-emerald-500" />
      });
    });
    
    // Recent marks
    marks.filter(m => m.score !== null && m.score !== undefined).slice(0, 2).forEach(m => {
      const student = students.find(s => s.id === m.studentId);
      activities.push({
        id: `mark-${m.id}`,
        title: '📝 Marks Entered',
        description: `${student?.fullName || 'Student'} scored ${m.score}%`,
        time: m.createdAt || new Date(),
        type: 'mark',
        icon: <FileBarChart className="w-4 h-4 text-purple-500" />
      });
    });
    
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    setRecentActivities(activities.slice(0, 10));
  };

  // ========== NOTIFICATION HANDLERS ==========
  // In AdminQuickActions.jsx - Updated handleSendNotification
const handleSendNotification = async (e) => {
  e.preventDefault();
  if (!notificationForm.title || !notificationForm.message) {
    toast.error('Please fill in both title and message');
    return;
  }
  try {
    setIsSaving(true);
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    // Create the payload with proper recipient targeting
    const payload = {
      title: notificationForm.title,
      message: notificationForm.message,
      type: notificationForm.type || 'info',
      category: notificationForm.category || 'general',
      priority: notificationForm.priority || 'medium',
      recipientType: notificationForm.recipientType, // 'all', 'teachers', 'secretary', 'admin', 'students'
      recipientId: notificationForm.recipientId || null,
      sendEmail: notificationForm.sendEmail || false,
      sendSMS: notificationForm.sendSMS || false,
      createdBy: JSON.parse(localStorage.getItem('user') || '{}').id
    };

    console.log('📤 Sending notification payload:', payload);

    const response = await axios.post('/notifications', payload, config);
    
    if (response.data?.success) {
      const sentCount = response.data?.data?.sentTo || 0;
      const recipientType = response.data?.data?.recipientType || notificationForm.recipientType;
      toast.success(`✅ Notification sent to ${sentCount} ${recipientType} users`);
      
      setShowNotificationModal(false);
      setNotificationForm({
        title: '', message: '', type: 'info', category: 'general',
        priority: 'medium', recipientType: 'all', recipientId: '',
        sendEmail: false, sendSMS: false
      });
      
      // Refresh notifications
      fetchAllData();
    } else {
      toast.error(response.data?.message || 'Failed to send notification');
    }
  } catch (error) {
    console.error('❌ Send notification error:', error);
    toast.error(error.response?.data?.message || 'Failed to send notification');
  } finally {
    setIsSaving(false);
  }
};
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/notifications/${notificationId}/read`, {}, config);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put('/notifications/read-all', {}, config);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error(error);
    }
  };

  // ========== FORMATTERS ==========
  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `UGX ${(amount / 1000).toFixed(1)}K`;
    return `UGX ${amount}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' });
  };

  // ========== LOADING STATE ==========
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Decide how many items to show
  const displayedSubjects = showAllSubjects ? subjectPerformance : subjectPerformance.slice(0, 5);
  const displayedTeachers = showAllTeachers ? teacherPerformance : teacherPerformance.slice(0, 5);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-600" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time data from your school • {stats.totalStudents} students • {stats.totalTeachers} teachers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowNotificationModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm">
            <Megaphone className="w-4 h-4" /> Send Notification
          </button>
          <button onClick={() => setShowNotificationsModal(true)} className="relative flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            <Bell className="w-4 h-4" /> Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
          <button onClick={() => setShowTeacherReportsModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm">
            <FileBarChart className="w-4 h-4" /> Teacher Reports
          </button>
          <button onClick={fetchAllData} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* ================= STATS CARDS - REAL DATA ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 font-medium">Total Students</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatNumber(stats.totalStudents)}</p>
          <p className="text-xs text-blue-500">{stats.activeStudents} active · {stats.inactiveStudents} inactive</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-600 font-medium">Total Teachers</span>
            <GraduationCapIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatNumber(stats.totalTeachers)}</p>
          <p className="text-xs text-emerald-500">Active teachers</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600 font-medium">Total Classes</span>
            <School className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-1">{formatNumber(stats.totalClasses)}</p>
          <p className="text-xs text-purple-500">Active classes</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-600 font-medium">Total Subjects</span>
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatNumber(stats.totalSubjects)}</p>
          <p className="text-xs text-amber-500">Offered</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-4 border border-teal-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-teal-600 font-medium">Fees Collected</span>
            <CreditCard className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-teal-700 mt-1">{formatCurrency(stats.totalFeesCollected)}</p>
          <p className="text-xs text-teal-500">{stats.feeCollectionRate}% collection rate · {stats.pendingFeesStudents} pending</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-4 border border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-rose-600 font-medium">Attendance</span>
            <ClipboardCheck className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-1">{stats.attendanceRate}%</p>
          <p className="text-xs text-rose-500">Current attendance rate</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-600 font-medium">Performance</span>
            <TrendingUpIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.performanceRate}%</p>
          <p className="text-xs text-indigo-500">Average score across {stats.totalMarks} marks</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-4 border border-pink-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-pink-600 font-medium">Marks Progress</span>
            <FileBarChart className="w-5 h-5 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-pink-700 mt-1">{stats.marksCompletionRate}%</p>
          <p className="text-xs text-pink-500">{stats.completedMarks} completed · {stats.pendingMarks} pending</p>
        </div>
      </div>

      {/* ================= SUBJECT PERFORMANCE ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Subject Performance
          </h3>
          <span className="text-xs text-gray-400">{subjectPerformance.length} subjects · {stats.totalMarks} marks total</span>
        </div>
        {subjectPerformance.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">No marks data available yet</p>
            <p className="text-xs text-gray-300 mt-1">Add marks to see subject performance</p>
          </div>
        ) : (
          <>
            <div className={`space-y-3 ${subjectPerformance.length > 5 ? 'max-h-64 overflow-y-auto pr-2' : ''}`}>
              {displayedSubjects.map(subj => (
                <div key={subj.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{subj.name}</span>
                      <span className="text-sm font-semibold text-gray-800 ml-2">{subj.average}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(subj.average, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{subj.count} marks recorded</p>
                  </div>
                </div>
              ))}
            </div>
            {subjectPerformance.length > 5 && (
              <button
                onClick={() => setShowAllSubjects(!showAllSubjects)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {showAllSubjects ? (
                  <>Show less <ArrowUp className="w-4 h-4" /></>
                ) : (
                  <>Show all {subjectPerformance.length} subjects <ArrowDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* ================= TEACHER PERFORMANCE ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <GraduationCapIcon className="w-5 h-5 text-emerald-600" />
            Teacher Performance
          </h3>
          <span className="text-xs text-gray-400">{teacherPerformance.length} teachers · {stats.totalMarks} marks total</span>
        </div>
        {teacherPerformance.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">No marks data available yet</p>
            <p className="text-xs text-gray-300 mt-1">Add marks to see teacher performance</p>
          </div>
        ) : (
          <>
            <div className={`space-y-3 ${teacherPerformance.length > 5 ? 'max-h-64 overflow-y-auto pr-2' : ''}`}>
              {displayedTeachers.map(teacher => (
                <div key={teacher.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{teacher.name}</span>
                      <span className="text-sm font-semibold text-gray-800 ml-2">{teacher.average}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(teacher.average, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{teacher.count} marks recorded</p>
                  </div>
                </div>
              ))}
            </div>
            {teacherPerformance.length > 5 && (
              <button
                onClick={() => setShowAllTeachers(!showAllTeachers)}
                className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                {showAllTeachers ? (
                  <>Show less <ArrowUp className="w-4 h-4" /></>
                ) : (
                  <>Show all {teacherPerformance.length} teachers <ArrowDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* ================= TEACHER REPORTS SUMMARY ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-blue-600" />
            Teacher Reports Summary
          </h3>
          <button onClick={() => setShowTeacherReportsModal(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{formatNumber(reportStats.totalReports)}</p>
            <p className="text-xs text-gray-500">Total Marks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{formatNumber(reportStats.completedReports)}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{formatNumber(reportStats.pendingReports)}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: reportStats.totalReports > 0 ? `${(reportStats.completedReports / reportStats.totalReports) * 100}%` : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {reportStats.totalReports > 0 ? `${Math.round((reportStats.completedReports / reportStats.totalReports) * 100)}% completion` : 'No reports yet'}
          </p>
        </div>
      </div>

      {/* ================= RECENT ACTIVITIES ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Recent Activities
          </h3>
          <span className="text-xs text-gray-400">Live feed</span>
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">No recent activities</div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div className="mt-0.5">{activity.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatTimeAgo(activity.time)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= QUICK LINKS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/admin/create-user?role=student')} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-4 text-center transition">
          <UserPlus className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Register Student</p>
        </button>
        <button onClick={() => navigate('/admin/create-user?role=teacher')} className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl p-4 text-center transition">
          <GraduationCapIcon className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Add Teacher</p>
        </button>
        <button onClick={() => navigate('/admin/create-class')} className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-4 text-center transition">
          <School className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Create Class</p>
        </button>
        <button onClick={() => navigate('/admin/subjects')} className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-4 text-center transition">
          <BookOpen className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Manage Subjects</p>
        </button>
      </div>

      {/* ================= MODALS ================= */}
      {showTeacherReportsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileBarChart className="w-5 h-5 text-blue-600" /> Teacher Reports Status
                </h3>
                <p className="text-sm text-gray-500">Track which teachers have submitted marks</p>
              </div>
              <button onClick={() => setShowTeacherReportsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              {teacherReports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No teacher reports available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-500">Teacher</th>
                        <th className="text-left p-3 font-semibold text-gray-500">Class</th>
                        <th className="text-left p-3 font-semibold text-gray-500">Subject</th>
                        <th className="text-center p-3 font-semibold text-gray-500">Students</th>
                        <th className="text-center p-3 font-semibold text-gray-500">Completed</th>
                        <th className="text-center p-3 font-semibold text-gray-500">Pending</th>
                        <th className="text-center p-3 font-semibold text-gray-500">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teacherReports.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50 transition">
                          <td className="p-3 font-medium text-gray-800">{teacher.name}</td>
                          <td className="p-3 text-gray-600">{teacher.class}</td>
                          <td className="p-3 text-gray-600">{teacher.subject}</td>
                          <td className="p-3 text-center text-gray-600">{teacher.totalStudents}</td>
                          <td className="p-3 text-center text-emerald-600">{teacher.completed}</td>
                          <td className="p-3 text-center text-amber-600">{teacher.pending}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${teacher.completionRate >= 80 ? 'bg-emerald-500' : teacher.completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${teacher.completionRate}%` }}></div>
                              </div>
                              <span className="text-xs font-medium">{teacher.completionRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-between items-center">
              <p className="text-xs text-gray-400">Total: {teacherReports.length} teachers</p>
              <button onClick={() => setShowTeacherReportsModal(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">{unreadCount} unread</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Mark all read</button>
                )}
                <button onClick={() => setShowNotificationsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)] space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} onClick={() => markAsRead(notif.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${!notif.isRead ? 'bg-purple-50/30 border-purple-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {notif.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                        {notif.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                        {notif.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {notif.type === 'announcement' && <Megaphone className="w-4 h-4 text-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-200 p-4">
              <button onClick={() => setShowNotificationsModal(false)} className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-purple-600" /> Send Notification
                </h3>
                <p className="text-sm text-gray-500">Send to teachers, secretary, or everyone</p>
              </div>
              <button onClick={() => setShowNotificationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input type="text" value={notificationForm.title} onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                  <textarea value={notificationForm.message} onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Type your message here..." rows="4" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm resize-none" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                    <select value={notificationForm.type} onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white">
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                    <select value={notificationForm.priority} onChange={(e) => setNotificationForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                {/* In AdminQuickActions.jsx - Recipient dropdown */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient</label>
  <select 
    value={notificationForm.recipientType} 
    onChange={(e) => setNotificationForm(prev => ({ 
      ...prev, 
      recipientType: e.target.value 
    }))}
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
  >
    <option value="all">All Users</option>
    <option value="teachers">Teachers Only</option>
    <option value="secretary">Secretary Only</option>
    <option value="admin">Admin Only</option>
    <option value="students">Students Only</option>
  </select>
  <p className="text-xs text-gray-400 mt-1">
    {notificationForm.recipientType === 'all' && '🔔 All users will receive this notification'}
    {notificationForm.recipientType === 'teachers' && '👨‍🏫 Only teachers will receive this notification'}
    {notificationForm.recipientType === 'secretary' && '📋 Only secretary will receive this notification'}
    {notificationForm.recipientType === 'admin' && '🛡️ Only admins will receive this notification'}
    {notificationForm.recipientType === 'students' && '🎓 Only students will receive this notification'}
  </p>
</div>
<div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Notification</>}
                  </button>
                  <button type="button" onClick={() => setShowNotificationModal(false)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuickActions;