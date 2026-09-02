// IntelligencePanel.jsx – All data visible for 24 hours only
import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import {
  Activity, Users, GraduationCap, TrendingUp,
  Bell, RefreshCw, Loader2, Clock, UserPlus,
  FileText, DollarSign, AlertCircle, School,
  Brain, AlertTriangle, X, Trophy,
} from 'lucide-react';

const IntelligencePanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [drillData, setDrillData] = useState([]);
  const [selectedDrillDown, setSelectedDrillDown] = useState(null);

  const [stats, setStats] = useState({
    totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalSubjects: 0,
    feesCollected: 0, feesOutstanding: 0, performance: 0,
    totalMarks: 0, collectionRate: 0,
    genderRatio: { male: 0, female: 0 },
    classDistribution: [], monthlyGrowth: 0,
    pendingFeesCount: 0, pendingMarksCount: 0,
    teachersWithoutClass: 0, emptyClasses: 0
  });

  // ================= 24-HOUR DATA STATE =================
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [topPerformingStudents, setTopPerformingStudents] = useState([]);
  const [recentTeachers, setRecentTeachers] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  
  // ================= 24-HOUR TIMESTAMP =================
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [dataAge, setDataAge] = useState(0);
  
  const intervalRef = useRef(null);

  const extractData = (res) => {
    if (!res?.data) return [];
    const d = res.data;
    if (Array.isArray(d)) return d;
    if (d.data !== undefined && Array.isArray(d.data)) return d.data;
    return [];
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const diffMs = Date.now() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `UGX ${(amount / 1000).toFixed(1)}K`;
    return `UGX ${amount}`;
  };

  // ================= CHECK IF WITHIN 24 HOURS =================
  const isWithin24Hours = (dateString) => {
    if (!dateString) return false;
    const diffMs = Date.now() - new Date(dateString);
    return diffMs < 86400000; // 24 hours in milliseconds
  };

  // ================= GET DATA AGE =================
  const getDataAge = () => {
    if (!lastFetchTime) return 0;
    return Math.floor((Date.now() - lastFetchTime) / 60000); // minutes
  };

  const fetchIntelligenceData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, teachersRes, classesRes, subjectsRes, feesRes, marksRes] = await Promise.all([
        axios.get("/students", config).catch(() => ({ data: [] })),
        axios.get("/teachers", config).catch(() => ({ data: [] })),
        axios.get("/classes", config).catch(() => ({ data: [] })),
        axios.get("/subjects", config).catch(() => ({ data: [] })),
        axios.get("/fees", config).catch(() => ({ data: [] })),
        axios.get("/marks", config).catch(() => ({ data: [] })),
      ]);

      const students = extractData(studentsRes);
      const teachers = extractData(teachersRes);
      const classes = extractData(classesRes);
      const subjects = extractData(subjectsRes);
      const fees = extractData(feesRes);
      const marks = extractData(marksRes);

      // ========== STATS (always from database) ==========
      let totalCollected = 0, totalDemanded = 0;
      fees.forEach(f => {
        totalCollected += Number(f.amountPaid || 0);
        totalDemanded += Number(f.totalFee || 0);
      });
      const totalOutstanding = totalDemanded - totalCollected;
      const collectionRate = totalDemanded > 0 ? Math.round((totalCollected / totalDemanded) * 100) : 0;

      const allScores = marks.filter(m => m.score != null).map(m => Number(m.score));
      const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

      const male = students.filter(s => s.gender === 'Male' || s.gender === 'male').length;
      const female = students.filter(s => s.gender === 'Female' || s.gender === 'female').length;

      const classDist = classes.map(c => ({
        name: c.className,
        count: students.filter(s => s.classId === c.id).length
      }));

      const now = new Date();
      const thisMonth = students.filter(s => {
        const d = new Date(s.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      const lastMonth = students.filter(s => {
        const d = new Date(s.createdAt);
        const lm = new Date(now.getFullYear(), now.getMonth() - 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }).length;
      const monthlyGrowth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;

      const pendingFeesCount = fees.filter(f => (f.totalFee - f.amountPaid) > 0).length;
      const pendingMarksCount = marks.filter(m => !m.submitted || m.score == null).length;
      const teachersWithoutClass = teachers.filter(t => !t.classId).length;
      const emptyClasses = classes.filter(c => !students.some(s => s.classId === c.id)).length;

      setStats({
        totalStudents: students.length, totalTeachers: teachers.length,
        totalClasses: classes.length, totalSubjects: subjects.length,
        feesCollected: totalCollected, feesOutstanding: totalOutstanding,
        performance: avgScore, totalMarks: marks.length,
        collectionRate, genderRatio: { male, female },
        classDistribution: classDist, monthlyGrowth,
        pendingFeesCount, pendingMarksCount,
        teachersWithoutClass, emptyClasses
      });

      // ========== TOP STUDENTS (from database, always) ==========
      const studentMarks = {};
      marks.forEach(m => {
        if (m.studentId && m.score != null) {
          if (!studentMarks[m.studentId]) studentMarks[m.studentId] = { scores: [], name: '' };
          studentMarks[m.studentId].scores.push(Number(m.score));
          const s = students.find(st => st.id === m.studentId);
          if (s) studentMarks[m.studentId].name = s.fullName;
        }
      });
      setTopPerformingStudents(
        Object.entries(studentMarks)
          .map(([id, d]) => ({ id: Number(id), name: d.name || 'Unknown', avg: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0 }))
          .filter(s => s.avg > 0).sort((a, b) => b.avg - a.avg).slice(0, 5)
      );

      // ========== RECENT STUDENTS & TEACHERS (ONLY LAST 24 HOURS) ==========
      const recentStudentsList = students
        .filter(s => isWithin24Hours(s.createdAt))
        .slice(0, 3);
      const recentTeachersList = teachers
        .filter(t => isWithin24Hours(t.createdAt))
        .slice(0, 3);
      
      setRecentStudents(recentStudentsList);
      setRecentTeachers(recentTeachersList);

      // ========== ALERTS (ONLY FROM LAST 24 HOURS DATA) ==========
      const alertList = [];
      // Only show alerts if they're based on current data
      if (pendingFeesCount > 10) alertList.push({ id: 'fees', title: `${pendingFeesCount} students have pending fees`, time: new Date().toISOString() });
      if (pendingMarksCount > 20) alertList.push({ id: 'marks', title: `${pendingMarksCount} marks entries pending`, time: new Date().toISOString() });
      if (emptyClasses > 0) alertList.push({ id: 'empty', title: `${emptyClasses} classes are empty`, time: new Date().toISOString() });
      if (teachersWithoutClass > 2) alertList.push({ id: 'tchr', title: `${teachersWithoutClass} teachers without class`, time: new Date().toISOString() });
      
      // Only show alerts that were created in the last 24 hours
      const recentAlerts = alertList.filter(a => isWithin24Hours(a.time));
      setAlerts(recentAlerts);

      // ========== PENDING ACTIONS (always show if they exist) ==========
      const pending = [];
      if (pendingFeesCount > 0) pending.push({ id: 'fees', label: 'Pending Fees', value: pendingFeesCount, icon: <DollarSign className="w-5 h-5 text-yellow-500" />, color: 'yellow' });
      if (pendingMarksCount > 0) pending.push({ id: 'marks', label: 'Pending Marks', value: pendingMarksCount, icon: <FileText className="w-5 h-5 text-blue-500" />, color: 'blue' });
      if (teachersWithoutClass > 0) pending.push({ id: 'tchr', label: 'Unassigned Teachers', value: teachersWithoutClass, icon: <GraduationCap className="w-5 h-5 text-orange-500" />, color: 'orange' });
      if (emptyClasses > 0) pending.push({ id: 'empty', label: 'Empty Classes', value: emptyClasses, icon: <School className="w-5 h-5 text-red-500" />, color: 'red' });
      setPendingActions(pending);

      // ========== ACTIVITIES (ONLY LAST 24 HOURS) ==========
      const actList = [];
      
      // Recent students (last 24 hours)
      students.filter(s => isWithin24Hours(s.createdAt)).slice(0, 3).forEach(s => {
        actList.push({ 
          id: `s-${s.id}`, 
          title: `New student: ${s.fullName}`, 
          time: s.createdAt, 
          icon: <UserPlus className="w-4 h-4 text-blue-500" /> 
        });
      });
      
      // Recent teachers (last 24 hours)
      teachers.filter(t => isWithin24Hours(t.createdAt)).slice(0, 3).forEach(t => {
        actList.push({ 
          id: `t-${t.id}`, 
          title: `New teacher: ${t.fullName || 'Teacher'}`, 
          time: t.createdAt, 
          icon: <GraduationCap className="w-4 h-4 text-purple-500" /> 
        });
      });
      
      // Recent fees (last 24 hours)
      fees.filter(f => isWithin24Hours(f.createdAt) && f.amountPaid > 0).slice(0, 3).forEach(f => {
        const student = students.find(s => s.id === f.studentId);
        actList.push({ 
          id: `f-${f.id}`, 
          title: `Fee payment: ${student?.fullName || 'Student'} paid ${f.amountPaid}`, 
          time: f.createdAt, 
          icon: <DollarSign className="w-4 h-4 text-emerald-500" /> 
        });
      });
      
      // Recent marks (last 24 hours)
      marks.filter(m => isWithin24Hours(m.createdAt) && m.score != null).slice(0, 3).forEach(m => {
        const student = students.find(s => s.id === m.studentId);
        actList.push({ 
          id: `m-${m.id}`, 
          title: `Marks entered: ${student?.fullName || 'Student'} scored ${m.score}%`, 
          time: m.createdAt, 
          icon: <FileText className="w-4 h-4 text-purple-500" /> 
        });
      });
      
      actList.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivities(actList.slice(0, 10));

      // ========== NOTIFICATIONS (ONLY LAST 24 HOURS) ==========
      try {
        const notifRes = await axios.get("/notifications/my", config).catch(() => ({ data: [] }));
        const notifs = extractData(notifRes);
        
        // Only show notifications from last 24 hours
        const recentNotifs = notifs
          .filter(n => isWithin24Hours(n.createdAt))
          .slice(0, 5)
          .map(n => ({ 
            id: n.id, 
            title: n.title, 
            message: n.message, 
            time: n.createdAt, 
            read: n.isRead || false 
          }));
        
        setNotifications(recentNotifs);
      } catch { 
        setNotifications([]); 
      }

      // ========== UPDATE LAST FETCH TIME ==========
      setLastFetchTime(Date.now());
      setDataAge(0);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= UPDATE DATA AGE EVERY MINUTE =================
  useEffect(() => {
    const ageInterval = setInterval(() => {
      setDataAge(getDataAge());
    }, 60000);
    return () => clearInterval(ageInterval);
  }, [lastFetchTime]);

  // ================= AUTO-REFRESH EVERY 5 MINUTES =================
  useEffect(() => {
    fetchIntelligenceData();
    intervalRef.current = setInterval(fetchIntelligenceData, 5 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 bg-gray-50 min-h-screen">

      {/* Header with Data Age Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-600" />
            Mission Control
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span>Real-time admin intelligence & insights</span>
            {lastFetchTime && (
              <span className="text-xs text-gray-400">
                • Updated {dataAge}m ago
              </span>
            )}
          </p>
        </div>
        <button onClick={fetchIntelligenceData} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-600 shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards – 2 PER ROW (always visible) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xs font-medium text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
          <p className="text-[10px] text-gray-400">{stats.monthlyGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.monthlyGrowth)}% this month</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-xs font-medium text-gray-500">Teachers</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalTeachers}</p>
          <p className="text-[10px] text-gray-400">{stats.teachersWithoutClass} unassigned</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xs font-medium text-gray-500">Collection Rate</p>
          <p className="text-2xl font-bold text-gray-800">{stats.collectionRate}%</p>
          <p className="text-[10px] text-gray-400">{formatCurrency(stats.feesCollected)} collected</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-xs font-medium text-gray-500">Avg Performance</p>
          <p className="text-2xl font-bold text-gray-800">{stats.performance}%</p>
          <p className="text-[10px] text-gray-400">{stats.totalMarks} marks recorded</p>
        </div>
      </div>

      {/* Alerts - Only show if from last 24 hours */}
      {alerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-rose-700">Critical Alerts</h3>
            <span className="text-xs bg-rose-200 text-rose-700 px-2 py-0.5 rounded-full ml-auto">{alerts.length}</span>
          </div>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-rose-100 text-sm text-gray-700">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                {alert.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-800 text-lg">Pending Actions</h3>
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full ml-auto font-medium">{pendingActions.length}</span>
        </div>
        {pendingActions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">✅ All clear — no pending actions</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingActions.map(action => (
              <div key={action.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center hover:bg-gray-100 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
                  {action.icon}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{action.label}</p>
                <p className="text-xl font-bold text-gray-700">{action.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gender + Class Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Gender Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Male</span><span className="font-medium">{stats.genderRatio.male}</span></div>
              <div className="w-full h-3 bg-blue-100 rounded-full"><div className="h-3 bg-blue-500 rounded-full" style={{ width: `${stats.totalStudents > 0 ? (stats.genderRatio.male / stats.totalStudents) * 100 : 0}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Female</span><span className="font-medium">{stats.genderRatio.female}</span></div>
              <div className="w-full h-3 bg-pink-100 rounded-full"><div className="h-3 bg-pink-500 rounded-full" style={{ width: `${stats.totalStudents > 0 ? (stats.genderRatio.female / stats.totalStudents) * 100 : 0}%` }} /></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Class Distribution</h3>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {stats.classDistribution.slice(0, 5).map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{item.name}</span><span className="font-medium">{item.count}</span></div>
                <div className="w-full h-2 bg-gray-100 rounded-full"><div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${stats.totalStudents > 0 ? (item.count / stats.totalStudents) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Students – ONLY SHOW IF THEY HAVE RECENT MARKS (24 HOURS) */}
      {topPerformingStudents.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Top Performers
            <span className="text-xs text-gray-400 font-normal ml-2">(All time)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topPerformingStudents.map((s, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-5 text-center border transition hover:shadow-md ${
                  idx === 0 ? 'bg-yellow-50 border-yellow-200' :
                  idx === 1 ? 'bg-gray-50 border-gray-200' :
                  idx === 2 ? 'bg-orange-50 border-orange-200' :
                  'bg-gray-50 border-gray-100'
                }`}
              >
                <p className="text-2xl mb-2">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </p>
                <p className="text-sm font-semibold text-gray-800 truncate">{s.name || 'Student'}</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{s.avg}%</p>
                <p className="text-xs text-gray-400 mt-1">average score</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Students & Teachers - ONLY LAST 24 HOURS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" /> Recent Students <span className="text-xs text-gray-400">(24h)</span>
          </h3>
          {recentStudents.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No new students in 24h</p>
          ) : (
            <div className="space-y-3">
              {recentStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {s.fullName?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{s.fullName}</p>
                    <p className="text-xs text-gray-400">{formatTimeAgo(s.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" /> Recent Teachers <span className="text-xs text-gray-400">(24h)</span>
          </h3>
          {recentTeachers.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No new teachers in 24h</p>
          ) : (
            <div className="space-y-3">
              {recentTeachers.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
                    {t.fullName?.charAt(0) || 'T'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{t.fullName}</p>
                    <p className="text-xs text-gray-400">{formatTimeAgo(t.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed - ONLY LAST 24 HOURS */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" /> Recent Activity <span className="text-xs text-gray-400">(24h)</span>
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No activity in the last 24 hours</p>
          ) : (
            activities.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                {a.icon}
                <span className="flex-1 text-gray-700">{a.title}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(a.time)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notifications - ONLY LAST 24 HOURS */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-800">Notifications <span className="text-xs text-gray-400">(24h)</span></h3>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{notifications.filter(n => !n.read).length} new</span>
          )}
        </div>
        <div className="space-y-2 max-h-36 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No notifications in the last 24 hours</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-xl text-sm ${!n.read ? 'bg-purple-50 border-l-2 border-purple-500' : 'bg-gray-50'}`}>
                <p className="font-medium text-gray-700">{n.title}</p>
                <p className="text-xs text-gray-500">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(n.time)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Data Expiry Notice */}
      <div className="text-center text-[10px] text-gray-400 py-2 border-t border-gray-100">
        <span>Data refreshes every 5 minutes • </span>
        <span className="text-indigo-500">24-hour rolling window</span>
        <span> • {dataAge}m ago</span>
      </div>
    </div>
  );
};

export default IntelligencePanel;