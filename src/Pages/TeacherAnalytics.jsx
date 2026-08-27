// TeacherAnalytics.jsx – Complete with Real-time Updates from Marks Entry
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, ComposedChart, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Users, GraduationCap, Trophy, FileText, Calendar, TrendingUp, TrendingDown,
  Award, Clock, BookOpen, BarChart3, PieChart as PieIcon,
  Activity, CheckCircle, XCircle, AlertCircle, Eye,
  Download, RefreshCw, Filter, ChevronDown, ChevronUp,
  UserCheck, UserX, Target, Zap, Star, Crown,
  Loader2, ArrowLeft, ArrowUpRight, ArrowDownRight,
  School, Mail, Phone, MapPin, Calendar as CalendarIcon,
  Bell, BellRing
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ============================================================
// CONSTANTS & HELPERS
// ============================================================

const COLORS = ['#4F46E5', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#06B6D4'];

const GRADE_COLORS = {
  'D1': '#10B981',
  'D2': '#34D399',
  'C3': '#60A5FA',
  'C4': '#FCD34D',
  'C5': '#FBBF24',
  'C6': '#F59E0B',
  'P7': '#FB923C',
  'P8': '#F87171',
  'F9': '#EF4444'
};

const GRADE_LABELS = {
  'D1': 'Distinction 1',
  'D2': 'Distinction 2',
  'C3': 'Credit 3',
  'C4': 'Credit 4',
  'C5': 'Credit 5',
  'C6': 'Credit 6',
  'P7': 'Pass 7',
  'P8': 'Pass 8',
  'F9': 'Fail 9'
};

const getUgandaGrade = (score) => {
  if (score >= 80) return 'D1';
  if (score >= 75) return 'D2';
  if (score >= 70) return 'C3';
  if (score >= 65) return 'C4';
  if (score >= 60) return 'C5';
  if (score >= 55) return 'C6';
  if (score >= 50) return 'P7';
  if (score >= 45) return 'P8';
  return 'F9';
};

const getGradeColor = (grade) => GRADE_COLORS[grade] || '#6B7280';
const getGradeLabel = (grade) => GRADE_LABELS[grade] || grade;

// ============================================================
// MAIN COMPONENT
// ============================================================

const TeacherAnalytics = () => {
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [examFilter, setExamFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newDataAvailable, setNewDataAvailable] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ================================================================
  // 🔥 REAL-TIME UPDATE LISTENER – INTEGRATED WITH MARKS ENTRY
  // ================================================================
  useEffect(() => {
    // Listen for marks saved events from TeacherMarksEntry
    const handleMarksSaved = (event) => {
      console.log('📢 Marks saved event detected! Refreshing analytics...', event.detail);
      setNewDataAvailable(true);
      
      // Show notification
      toast.success('📊 New marks detected! Updating analytics...', {
        duration: 3000,
        icon: '📈',
      });
      
      // Auto-refresh after a short delay
      setTimeout(() => {
        fetchAnalytics(false); // silent refresh (no loading spinner)
        setNewDataAvailable(false);
      }, 500);
    };

    // Listen for custom event from TeacherMarksEntry
    window.addEventListener('marksSaved', handleMarksSaved);
    
    // Listen for localStorage changes (for cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'marksUpdated' || e.key === 'marksUpdateCount' || e.key === 'teacherMarks') {
        console.log('📢 Storage change detected:', e.key, '– refreshing analytics');
        setNewDataAvailable(true);
        setTimeout(() => {
          fetchAnalytics(false);
          setNewDataAvailable(false);
        }, 500);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('marksSaved', handleMarksSaved);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Runs once on mount

  // ===== PERIODIC AUTO-REFRESH =====
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refresh checking for updates...');
        fetchAnalytics(false);
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // ===== FETCH ANALYTICS =====
  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      console.log('📊 Fetching teacher analytics...');

      // ===== 1. GET TEACHER PROFILE =====
      let teacher = null;
      try {
        const res = await api.get('/teachers/me', config);
        teacher = res.data?.data || res.data;
        console.log('✅ Teacher found:', teacher?.fullName);
      } catch (err) {
        console.warn('⚠️ /teachers/me failed, trying fallback...');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
          const allTeachers = await api.get('/teachers', config);
          const teachers = allTeachers.data?.data || allTeachers.data || [];
          teacher = teachers.find(t => 
            Number(t.userId) === Number(user.id) || 
            t.email === user.Email
          );
          console.log('✅ Teacher found via fallback:', teacher?.fullName);
        } catch (fallbackErr) {
          console.error('❌ Fallback failed:', fallbackErr);
        }
      }

      if (!teacher) {
        throw new Error('Teacher profile not found. Please contact admin.');
      }
      setTeacherInfo(teacher);

      // ===== 2. GET STUDENTS =====
      let students = [];
      try {
        let url = '/students';
        if (teacher.classId) {
          url += `?classId=${teacher.classId}`;
        }
        const res = await api.get(url, config);
        students = res.data?.data || res.data || [];
        console.log(`✅ Found ${students.length} students`);
      } catch (err) {
        console.warn('⚠️ Failed to fetch students:', err.message);
        students = [];
      }

      // ===== 3. GET MARKS =====
      let marks = [];
      try {
        let url = `/marks/teacher/${teacher.id}`;
        const res = await api.get(url, config);
        marks = res.data?.data || res.data || [];
        console.log(`✅ Found ${marks.length} marks`);
      } catch (err) {
        console.warn('⚠️ Failed to fetch marks:', err.message);
        try {
          const res = await api.get('/marks/my-marks', config);
          marks = res.data?.data || res.data || [];
          console.log(`✅ Found ${marks.length} marks via /marks/my-marks`);
        } catch (err2) {
          console.warn('⚠️ Alternative marks endpoint failed:', err2.message);
          marks = [];
        }
      }

      // ===== 4. GET SUBJECTS =====
      let subjects = [];
      try {
        let res;
        if (teacher.subjectId) {
          res = await api.get(`/subjects/${teacher.subjectId}`, config);
          const subject = res.data?.data || res.data;
          if (subject) subjects = [subject];
        } else if (teacher.classId) {
          res = await api.get(`/subjects?classId=${teacher.classId}`, config);
          subjects = res.data?.data || res.data || [];
        }
        console.log(`✅ Found ${subjects.length} subjects`);
      } catch (err) {
        console.warn('⚠️ Failed to fetch subjects:', err.message);
        subjects = [];
      }

      // ===== 5. GET ATTENDANCE =====
      let attendance = [];
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await api.get(`/attendance/my-class?date=${today}`, config);
        attendance = res.data?.data || res.data || [];
        console.log(`✅ Found ${attendance.length} attendance records`);
      } catch (err) {
        console.warn('⚠️ Failed to fetch attendance:', err.message);
        attendance = [];
      }

      // ===== 6. GET TIMETABLE =====
      let timetable = {};
      try {
        const res = await api.get(`/timetables/teacher/${teacher.id}`, config);
        timetable = res.data?.data || res.data || {};
        console.log('✅ Timetable fetched');
      } catch (err) {
        console.warn('⚠️ Failed to fetch timetable:', err.message);
        timetable = {};
      }

      // ===== 7. GET CLASS INFO =====
      let classInfo = null;
      if (teacher.classId) {
        try {
          const res = await api.get(`/classes/${teacher.classId}`, config);
          classInfo = res.data?.data || res.data || null;
          console.log('✅ Class info fetched:', classInfo?.className);
        } catch (err) {
          console.warn('⚠️ Failed to fetch class info:', err.message);
        }
      }

      // ===== PROCESS DATA =====
      const processed = processAnalyticsData({
        teacher,
        students,
        marks,
        subjects,
        attendance,
        timetable,
        classInfo
      });

      setData(processed);
      setLastUpdated(new Date().toLocaleTimeString());
      
      // Store in localStorage for cross-tab communication
      localStorage.setItem('teacherMarks', JSON.stringify({
        count: marks.length,
        lastUpdated: new Date().toISOString()
      }));

      console.log('✅ Analytics updated at:', new Date().toLocaleTimeString());

    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message || 'Failed to load analytics data');
      toast.error(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  // ============================================================
  // DATA PROCESSING FUNCTIONS
  // ============================================================

  const processAnalyticsData = (raw) => {
    const { teacher, students, marks, subjects, attendance, timetable, classInfo } = raw;

    // Normalize marks
    const normalizedMarks = marks.map(m => ({
      id: m.id,
      studentId: Number(m.studentId || m.student_id),
      subjectId: Number(m.subjectId || m.subject_id),
      teacherId: Number(m.teacherId || m.teacher_id),
      score: Number(m.score || m.marks || 0),
      examType: m.examType || m.exam_type || 'Mid-Term',
      status: m.status || 'submitted',
      createdAt: m.createdAt || m.created_at || new Date().toISOString(),
    }));

    // Student Performance
    const studentPerformance = processStudentPerformance(students, normalizedMarks, subjects);

    // Subject Performance
    const subjectPerformance = processSubjectPerformance(normalizedMarks, subjects);

    // Grade Distribution
    const gradeDistribution = calculateGradeDistribution(studentPerformance);

    // Exam Type Performance
    const examTypePerformance = processExamTypePerformance(normalizedMarks);

    // Attendance Stats
    const attendanceStats = calculateAttendanceStats(attendance, students.length);

    // Overall Stats
    const overallStats = calculateOverallStats(students, normalizedMarks, subjects, teacher, studentPerformance, classInfo);

    return {
      teacher,
      students,
      subjects,
      marks: normalizedMarks,
      attendance,
      timetable,
      classInfo,
      studentPerformance,
      subjectPerformance,
      gradeDistribution,
      examTypePerformance,
      attendanceStats,
      overallStats,
    };
  };

  const processStudentPerformance = (students, marks, subjects) => {
    const map = {};
    marks.forEach(m => {
      if (!map[m.studentId]) {
        const student = students.find(s => Number(s.id) === Number(m.studentId));
        map[m.studentId] = {
          student: student || { id: m.studentId, fullName: 'Unknown Student' },
          scores: [],
          total: 0,
          count: 0
        };
      }
      map[m.studentId].scores.push(m.score);
      map[m.studentId].total += m.score;
      map[m.studentId].count++;
    });

    return Object.values(map).map(sp => {
      const avg = sp.count > 0 ? sp.total / sp.count : 0;
      return {
        ...sp,
        average: avg,
        grade: getUgandaGrade(avg),
        highest: sp.scores.length > 0 ? Math.max(...sp.scores) : 0,
        lowest: sp.scores.length > 0 ? Math.min(...sp.scores) : 0,
        subjectCount: new Set(marks.filter(m => Number(m.studentId) === Number(sp.student.id)).map(m => m.subjectId)).size,
        markCount: sp.count,
      };
    }).sort((a, b) => b.average - a.average);
  };

  const processSubjectPerformance = (marks, subjects) => {
    const map = {};
    marks.forEach(m => {
      if (!map[m.subjectId]) {
        const subject = subjects.find(s => Number(s.id) === Number(m.subjectId));
        map[m.subjectId] = {
          subject: subject || { id: m.subjectId, subjectName: 'Unknown Subject' },
          scores: [],
          total: 0,
          count: 0
        };
      }
      map[m.subjectId].scores.push(m.score);
      map[m.subjectId].total += m.score;
      map[m.subjectId].count++;
    });

    return Object.values(map).map(sp => {
      const avg = sp.count > 0 ? sp.total / sp.count : 0;
      return {
        ...sp,
        average: avg,
        grade: getUgandaGrade(avg),
        highest: sp.scores.length > 0 ? Math.max(...sp.scores) : 0,
        lowest: sp.scores.length > 0 ? Math.min(...sp.scores) : 0,
      };
    });
  };

  const calculateGradeDistribution = (students) => {
    const dist = { D1: 0, D2: 0, C3: 0, C4: 0, C5: 0, C6: 0, P7: 0, P8: 0, F9: 0 };
    students.forEach(s => {
      if (dist[s.grade] !== undefined) dist[s.grade]++;
    });
    return dist;
  };

  const processExamTypePerformance = (marks) => {
    const map = {};
    marks.forEach(m => {
      const type = m.examType || 'Mid-Term';
      if (!map[type]) map[type] = { scores: [], total: 0, count: 0 };
      map[type].scores.push(m.score);
      map[type].total += m.score;
      map[type].count++;
    });
    return Object.entries(map).map(([name, d]) => ({
      name,
      average: d.count > 0 ? d.total / d.count : 0,
      count: d.count,
      highest: d.scores.length > 0 ? Math.max(...d.scores) : 0,
      lowest: d.scores.length > 0 ? Math.min(...d.scores) : 0,
    }));
  };

  const calculateAttendanceStats = (records, totalStudents) => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const rate = totalStudents > 0 ? ((present + late) / totalStudents) * 100 : 0;
    return { present, absent, late, excused, rate: Math.round(rate * 10) / 10, total: totalStudents };
  };

  const calculateOverallStats = (students, marks, subjects, teacher, performance, classInfo) => {
    const avg = performance.length > 0 ? performance.reduce((s, p) => s + p.average, 0) / performance.length : 0;
    const passCount = performance.filter(p => p.average >= 50).length;
    return {
      totalStudents: students.length,
      totalMarks: marks.length,
      totalSubjects: subjects.length,
      classAverage: avg,
      passRate: performance.length > 0 ? (passCount / performance.length) * 100 : 0,
      className: classInfo?.className || teacher?.class?.className || 'Your Class',
      teacherName: teacher?.fullName || 'Teacher',
      topStudent: performance.length > 0 ? performance[0] : null,
      gradeCount: {
        distinction: performance.filter(p => p.grade === 'D1' || p.grade === 'D2').length,
        credit: performance.filter(p => ['C3', 'C4', 'C5', 'C6'].includes(p.grade)).length,
        pass: performance.filter(p => ['P7', 'P8'].includes(p.grade)).length,
        fail: performance.filter(p => p.grade === 'F9').length,
      }
    };
  };

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleRefresh = () => {
    fetchAnalytics(false);
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon!');
  };

  const handleStudentClick = (studentId) => {
    setSelectedStudent(studentId);
    setViewMode('students');
  };

  const handleSubjectClick = (subjectId) => {
    setSelectedSubject(subjectId);
    setViewMode('subjects');
  };

  const handleBack = () => {
    setSelectedStudent(null);
    setSelectedSubject(null);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled');
  };

  // ============================================================
  // RENDER LOADING / ERROR
  // ============================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-lg font-medium text-gray-600">Loading your analytics...</p>
        <p className="text-sm text-gray-400">Fetching student performance data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 p-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Failed to Load Data</h3>
        <p className="text-gray-500 text-center max-w-md">{error}</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleRefresh}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.students) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <School className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">No Data Available</h3>
        <p className="text-gray-500 text-center max-w-md">
          You don't have any students or marks recorded yet. 
          Start teaching your class to see analytics here.
        </p>
        <button
          onClick={handleRefresh}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
        >
          Refresh
        </button>
      </div>
    );
  }

  const { overallStats, studentPerformance, subjectPerformance, gradeDistribution, examTypePerformance, attendanceStats } = data;

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* ===== HEADER WITH REAL-TIME INDICATOR ===== */}
      <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                Analytics Dashboard
              </h1>
              {/* Real-time indicator */}
              {newDataAvailable && (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full animate-pulse">
                  <BellRing className="w-3 h-3" />
                  New Data
                </span>
              )}
              {autoRefresh && !newDataAvailable && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                  <Bell className="w-3 h-3" />
                  Live
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <School className="w-4 h-4" />
                {overallStats.className}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {overallStats.totalStudents} Students
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {overallStats.totalSubjects} Subjects
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                {overallStats.totalMarks} Marks
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-gray-400 text-xs">
                Updated: {lastUpdated || 'Just now'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                autoRefresh 
                  ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <Bell className="w-4 h-4" />
              {autoRefresh ? 'Auto' : 'Manual'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-600 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* ===== NEW DATA AVAILABLE BANNER ===== */}
      {newDataAvailable && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">New marks detected!</p>
              <p className="text-sm text-green-600">Analytics will update automatically in a moment...</p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchAnalytics(false);
              setNewDataAvailable(false);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-medium"
          >
            Update Now
          </button>
        </div>
      )}

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title="Total Students"
          value={overallStats.totalStudents}
          subtitle={`${studentPerformance.filter(s => s.average >= 70).length} high performers`}
          color="blue"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          title="Class Average"
          value={`${overallStats.classAverage.toFixed(1)}%`}
          subtitle={`${overallStats.passRate.toFixed(1)}% pass rate`}
          color="indigo"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          title="Total Marks"
          value={overallStats.totalMarks}
          subtitle={`${overallStats.totalSubjects} subjects`}
          color="emerald"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Grade Distribution"
          value={`${overallStats.gradeCount.distinction}D · ${overallStats.gradeCount.credit}C · ${overallStats.gradeCount.pass}P · ${overallStats.gradeCount.fail}F`}
          subtitle="D1-D2 · C3-C6 · P7-P8 · F9"
          color="amber"
        />
      </div>

      {/* ===== GRADE QUICK STATS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-l-4 border-emerald-500">
          <p className="text-2xl font-bold text-emerald-600">{overallStats.gradeCount.distinction}</p>
          <p className="text-xs text-gray-500 font-medium">Distinction (D1-D2)</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{overallStats.gradeCount.credit}</p>
          <p className="text-xs text-gray-500 font-medium">Credit (C3-C6)</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-l-4 border-amber-500">
          <p className="text-2xl font-bold text-amber-600">{overallStats.gradeCount.pass}</p>
          <p className="text-xs text-gray-500 font-medium">Pass (P7-P8)</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-l-4 border-rose-500">
          <p className="text-2xl font-bold text-rose-600">{overallStats.gradeCount.fail}</p>
          <p className="text-xs text-gray-500 font-medium">Fail (F9)</p>
        </div>
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm flex flex-wrap gap-1">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'students', label: 'Students', icon: Users },
          { key: 'subjects', label: 'Subjects', icon: BookOpen },
          { key: 'attendance', label: 'Attendance', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setViewMode(tab.key);
              if (tab.key !== 'students') setSelectedStudent(null);
              if (tab.key !== 'subjects') setSelectedSubject(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              viewMode === tab.key 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================
          VIEW: OVERVIEW
      ============================================================ */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Grade Distribution Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-500" />
              Grade Distribution
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={Object.entries(gradeDistribution).map(([grade, count]) => ({ 
                    grade, 
                    count,
                    label: getGradeLabel(grade),
                    color: getGradeColor(grade)
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="grade" 
                    fontSize={12} 
                    tick={{ fill: '#64748b' }}
                    angle={0}
                  />
                  <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(value) => [`${value} students`, 'Count']}
                    labelFormatter={(label) => `${label} - ${getGradeLabel(label)}`}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                    {Object.keys(gradeDistribution).map((grade) => (
                      <Cell key={grade} fill={getGradeColor(grade)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exam Type + Class Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exam Type Performance */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Exam Type Performance
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={examTypePerformance} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: '#64748b' }} />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Average']} />
                    <Bar dataKey="average" fill="#8B5CF6" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Class Stats */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                Class Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Class Average</span>
                  <span className="text-xl font-bold text-indigo-600">{overallStats.classAverage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Pass Rate</span>
                  <span className="text-xl font-bold text-emerald-600">{overallStats.passRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Top Student</span>
                  <span className="font-semibold text-gray-800">
                    {overallStats.topStudent?.student?.fullName || 'N/A'} 
                    <span className="text-sm text-gray-500 ml-1">
                      ({overallStats.topStudent?.average.toFixed(1)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Students Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Top Performers
              </h3>
              <span className="text-sm text-gray-500">{studentPerformance.length} students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 text-left">#</th>
                    <th className="p-4 text-left">Student</th>
                    <th className="p-4 text-center">Average</th>
                    <th className="p-4 text-center">Grade</th>
                    <th className="p-4 text-center">Subjects</th>
                    <th className="p-4 text-center">Marks</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentPerformance.slice(0, 10).map((sp, idx) => (
                    <tr key={sp.student.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="p-4 font-medium text-gray-800">{sp.student.fullName}</td>
                      <td className="p-4 text-center font-semibold">{sp.average.toFixed(1)}%</td>
                      <td className="p-4 text-center">
                        <span 
                          className="px-2.5 py-1 rounded-lg text-xs font-bold" 
                          style={{ 
                            backgroundColor: getGradeColor(sp.grade) + '20', 
                            color: getGradeColor(sp.grade) 
                          }}
                        >
                          {sp.grade}
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-500">{sp.subjectCount}</td>
                      <td className="p-4 text-center text-gray-500">{sp.markCount}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleStudentClick(sp.student.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {studentPerformance.length > 10 && (
                <div className="p-4 text-center text-sm text-gray-500 border-t">
                  Showing 10 of {studentPerformance.length} students
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW: STUDENTS
      ============================================================ */}
      {viewMode === 'students' && !selectedStudent && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> All Students
            </h3>
            <span className="text-sm text-gray-500">{studentPerformance.length} students</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 text-left">Student</th>
                  <th className="p-4 text-center">Average</th>
                  <th className="p-4 text-center">Grade</th>
                  <th className="p-4 text-center">Subjects</th>
                  <th className="p-4 text-center">Marks</th>
                  <th className="p-4 text-center">Performance</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentPerformance.map((sp) => (
                  <tr key={sp.student.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-800">{sp.student.fullName}</td>
                    <td className="p-4 text-center font-semibold">{sp.average.toFixed(1)}%</td>
                    <td className="p-4 text-center">
                      <span 
                        className="px-2.5 py-1 rounded-lg text-xs font-bold" 
                        style={{ 
                          backgroundColor: getGradeColor(sp.grade) + '20', 
                          color: getGradeColor(sp.grade) 
                        }}
                      >
                        {sp.grade}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-500">{sp.subjectCount}</td>
                    <td className="p-4 text-center text-gray-500">{sp.markCount}</td>
                    <td className="p-4 text-center">
                      {sp.average >= 70 ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : sp.average >= 50 ? (
                        <TrendingUp className="w-5 h-5 text-amber-500 mx-auto" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-rose-500 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleStudentClick(sp.student.id)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'students' && selectedStudent && (
        <StudentDetail 
          studentId={selectedStudent} 
          data={data} 
          onBack={handleBack} 
        />
      )}

      {/* ============================================================
          VIEW: SUBJECTS
      ============================================================ */}
      {viewMode === 'subjects' && !selectedSubject && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectPerformance.map((sp) => (
            <div 
              key={sp.subject.id} 
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => handleSubjectClick(sp.subject.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{sp.subject.subjectName}</h4>
                  <p className="text-sm text-gray-500">{sp.count} marks • {sp.subject.level || 'O-Level'}</p>
                </div>
                <span className="text-xl font-bold text-gray-700">{sp.average.toFixed(1)}%</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>↑ {sp.highest}%</span>
                  <span>↓ {sp.lowest}%</span>
                </div>
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ 
                    backgroundColor: getGradeColor(sp.grade) + '20', 
                    color: getGradeColor(sp.grade) 
                  }}
                >
                  {sp.grade}
                </span>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full transition-all"
                  style={{ 
                    width: `${sp.average}%`,
                    backgroundColor: sp.average >= 70 ? '#10B981' : sp.average >= 50 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </div>
            </div>
          ))}
          {subjectPerformance.length === 0 && (
            <div className="col-span-2 bg-white rounded-2xl p-8 text-center border border-gray-100">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No subjects found</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'subjects' && selectedSubject && (
        <SubjectDetail 
          subjectId={selectedSubject} 
          data={data} 
          onBack={handleBack} 
        />
      )}

      {/* ============================================================
          VIEW: ATTENDANCE
      ============================================================ */}
      {viewMode === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="text-3xl font-bold text-emerald-600">{attendanceStats.present}</p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="text-3xl font-bold text-rose-600">{attendanceStats.absent}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="text-3xl font-bold text-amber-600">{attendanceStats.late}</p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="text-3xl font-bold text-indigo-600">{attendanceStats.rate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Attendance Rate</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    className="stroke-gray-200" 
                    strokeWidth="12" 
                    fill="none" 
                    cx="50" 
                    cy="50" 
                    r="40" 
                  />
                  <circle 
                    className="stroke-indigo-600 transition-all duration-1000" 
                    strokeWidth="12" 
                    strokeLinecap="round" 
                    fill="none" 
                    cx="50" 
                    cy="50" 
                    r="40"
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * Math.min(attendanceStats.rate, 100)) / 100} 
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">{attendanceStats.rate.toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">Attendance</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-gray-800">Today's Attendance Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>{attendanceStats.present} Present</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span>{attendanceStats.absent} Absent</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>{attendanceStats.late} Late</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>{attendanceStats.excused || 0} Excused</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {attendanceStats.total} students in class
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================

const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    rose: 'bg-rose-50 border-rose-200 text-rose-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  const borderColors = {
    blue: 'border-l-blue-500',
    indigo: 'border-l-indigo-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500',
    purple: 'border-l-purple-500',
  };

  return (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm ${borderColors[color] || 'border-l-blue-500'} border-l-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color] || colors.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STUDENT DETAIL COMPONENT
// ============================================================

const StudentDetail = ({ studentId, data, onBack }) => {
  const sp = data.studentPerformance.find(s => Number(s.student.id) === Number(studentId));
  if (!sp) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <p className="text-center text-gray-500 py-8">Student not found</p>
      </div>
    );
  }

  const studentMarks = data.marks.filter(m => Number(m.studentId) === Number(studentId));
  
  const subjectBreakdown = {};
  studentMarks.forEach(m => {
    const subj = data.subjects.find(s => Number(s.id) === Number(m.subjectId)) || { subjectName: 'Unknown' };
    if (!subjectBreakdown[m.subjectId]) {
      subjectBreakdown[m.subjectId] = { 
        subject: subj, 
        marks: [], 
        total: 0, 
        count: 0,
        scores: []
      };
    }
    subjectBreakdown[m.subjectId].marks.push(m);
    subjectBreakdown[m.subjectId].scores.push(m.score);
    subjectBreakdown[m.subjectId].total += m.score;
    subjectBreakdown[m.subjectId].count++;
  });

  const examTypeBreakdown = {};
  studentMarks.forEach(m => {
    const type = m.examType || 'Mid-Term';
    if (!examTypeBreakdown[type]) {
      examTypeBreakdown[type] = { scores: [], total: 0, count: 0 };
    }
    examTypeBreakdown[type].scores.push(m.score);
    examTypeBreakdown[type].total += m.score;
    examTypeBreakdown[type].count++;
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{sp.student.fullName}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>Student #{sp.student.studentNumber || 'N/A'}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{sp.student.class?.className || 'No Class'}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{sp.subjectCount} subjects</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span 
            className="text-2xl font-bold px-4 py-1.5 rounded-xl"
            style={{ 
              backgroundColor: getGradeColor(sp.grade) + '20', 
              color: getGradeColor(sp.grade) 
            }}
          >
            {sp.grade}
          </span>
          <p className="text-sm text-gray-500 mt-1">{getGradeLabel(sp.grade)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-indigo-600">{sp.average.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Average</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-gray-700">{sp.markCount}</p>
          <p className="text-xs text-gray-500">Total Marks</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-gray-700">{sp.subjectCount}</p>
          <p className="text-xs text-gray-500">Subjects</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{sp.highest}%</p>
          <p className="text-xs text-gray-500">Highest Score</p>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" /> Subject Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-center">Average</th>
                <th className="p-3 text-center">Highest</th>
                <th className="p-3 text-center">Lowest</th>
                <th className="p-3 text-center">Grade</th>
                <th className="p-3 text-center">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.values(subjectBreakdown).map((sb, idx) => {
                const avg = sb.count > 0 ? sb.total / sb.count : 0;
                const grade = getUgandaGrade(avg);
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{sb.subject.subjectName}</td>
                    <td className="p-3 text-center font-semibold">{avg.toFixed(1)}%</td>
                    <td className="p-3 text-center text-emerald-600">{Math.max(...sb.scores)}%</td>
                    <td className="p-3 text-center text-rose-600">{Math.min(...sb.scores)}%</td>
                    <td className="p-3 text-center">
                      <span 
                        className="px-2 py-0.5 rounded-lg text-xs font-bold"
                        style={{ color: getGradeColor(grade) }}
                      >
                        {grade}
                      </span>
                    </td>
                    <td className="p-3 text-center text-gray-500">{sb.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exam Type Breakdown */}
      {Object.keys(examTypeBreakdown).length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" /> Exam Type Performance
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(examTypeBreakdown).map(([type, data]) => (
              <div key={type} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-gray-600">{type}</p>
                <p className="text-xl font-bold text-indigo-600">
                  {(data.total / data.count).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">{data.count} marks</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SUBJECT DETAIL COMPONENT
// ============================================================

const SubjectDetail = ({ subjectId, data, onBack }) => {
  const sp = data.subjectPerformance.find(s => Number(s.subject.id) === Number(subjectId));
  if (!sp) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <p className="text-center text-gray-500 py-8">Subject not found</p>
      </div>
    );
  }

  const subjectMarks = data.marks
    .filter(m => Number(m.subjectId) === Number(subjectId))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{sp.subject.subjectName}</h3>
            <p className="text-sm text-gray-500">{sp.count} marks recorded</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-700">{sp.average.toFixed(1)}%</span>
          <p className="text-sm text-gray-500">Class average</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xl font-bold text-emerald-600">{sp.highest}%</p>
          <p className="text-xs text-gray-500">Highest Score</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100">
          <p className="text-xl font-bold text-rose-600">{sp.lowest}%</p>
          <p className="text-xs text-gray-500">Lowest Score</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
          <p className="text-xl font-bold text-indigo-600">{sp.highest - sp.lowest}%</p>
          <p className="text-xs text-gray-500">Score Range</p>
        </div>
      </div>

      {/* Student Scores */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" /> Student Scores
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3 text-center">Grade</th>
                <th className="p-3 text-center">Exam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjectMarks.slice(0, 20).map((m, idx) => {
                const student = data.students.find(s => Number(s.id) === Number(m.studentId));
                const grade = getUgandaGrade(m.score);
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{student?.fullName || 'Unknown'}</td>
                    <td className="p-3 text-center font-semibold">{m.score}%</td>
                    <td className="p-3 text-center">
                      <span 
                        className="px-2 py-0.5 rounded-lg text-xs font-bold"
                        style={{ color: getGradeColor(grade) }}
                      >
                        {grade}
                      </span>
                    </td>
                    <td className="p-3 text-center text-gray-500">{m.examType || 'Mid-Term'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {subjectMarks.length > 20 && (
            <p className="p-3 text-center text-sm text-gray-400 border-t">
              Showing 20 of {subjectMarks.length} students
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EXPORT
// ============================================================

export default TeacherAnalytics;