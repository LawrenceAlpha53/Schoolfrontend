// TeacherAnalytics.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  BookOpen,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Brain,
  Target,
  Rocket,
  Zap,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon,
  FileText,
  GraduationCap,
  School,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCheck,
  Users as UsersIcon,
  BookMarked,
  ClipboardList,
  CalendarDays,
  Clock as ClockIcon,
  Activity,
  Flame,
  Shield,
  UserCheck,
  UserX,
  Award as AwardIcon,
  LayoutDashboard
} from "lucide-react";
import toast from 'react-hot-toast';
import api from '../api/axios';

const TeacherAnalytics = () => {
  // ================= STATE =================
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedView, setSelectedView] = useState('overview');
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [teacherData, setTeacherData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalClasses: 0,
      totalSubjects: 0,
      totalStudents: 0,
      averageScore: 0,
      passRate: 0,
      assignmentsGiven: 0,
      assignmentsMarked: 0,
      attendanceRate: 0,
      marksCompletionRate: 0
    },
    classPerformance: [],
    performanceTrend: [],
    topPerformers: [],
    atRiskStudents: [],
    gradeDistribution: [],
    subjectAnalysis: {
      highest: 0,
      lowest: 0,
      average: 0,
      median: 0,
      passRate: 0
    },
    attendanceAnalytics: { present: 0, absent: 0, excused: 0 },
    assignmentAnalytics: { given: 0, submitted: 0, pending: 0, average: 0 },
    marksEntryProgress: [],
    classComparison: [],
    syllabusCoverage: { completed: 0, remaining: 0, topics: [] },
    examAnalysis: [],
    studentGrowth: [],
    teacherWorkload: { classes: 0, subjects: 0, students: 0, periodsPerWeek: 0 },
    parentConcerns: [],
    behavioralAlerts: [],
    upcomingTasks: []
  });

  const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6', '#4c1d95'];
  const GRADE_COLORS = {
    'D1': 'bg-emerald-100 text-emerald-700',
    'D2': 'bg-green-100 text-green-700',
    'C3': 'bg-blue-100 text-blue-700',
    'C4': 'bg-cyan-100 text-cyan-700',
    'C5': 'bg-teal-100 text-teal-700',
    'C6': 'bg-yellow-100 text-yellow-700',
    'P7': 'bg-orange-100 text-orange-700',
    'P8': 'bg-red-100 text-red-400',
    'F9': 'bg-red-200 text-red-700'
  };

  const views = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'classes', label: 'Class Performance', icon: <School className="w-4 h-4" /> },
    { id: 'students', label: 'Student Analysis', icon: <Users className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
    { id: 'syllabus', label: 'Syllabus Coverage', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> }
  ];

  // ================= GET GRADE =================
  const getUgandaGrade = (score) => {
    if (score >= 80) return { grade: 'D1', label: 'Distinction 1' };
    if (score >= 75) return { grade: 'D2', label: 'Distinction 2' };
    if (score >= 70) return { grade: 'C3', label: 'Credit 3' };
    if (score >= 65) return { grade: 'C4', label: 'Credit 4' };
    if (score >= 60) return { grade: 'C5', label: 'Credit 5' };
    if (score >= 55) return { grade: 'C6', label: 'Credit 6' };
    if (score >= 50) return { grade: 'P7', label: 'Pass 7' };
    if (score >= 45) return { grade: 'P8', label: 'Pass 8' };
    return { grade: 'F9', label: 'Fail 9' };
  };

  const getGradeColor = (grade) => {
    const colors = {
      'D1': 'text-emerald-600',
      'D2': 'text-green-600',
      'C3': 'text-blue-600',
      'C4': 'text-cyan-600',
      'C5': 'text-teal-600',
      'C6': 'text-yellow-600',
      'P7': 'text-orange-600',
      'P8': 'text-red-400',
      'F9': 'text-red-600'
    };
    return colors[grade] || 'text-gray-600';
  };

  // ================= FETCH ANALYTICS DATA =================
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Get teacher data
      const teachersRes = await api.get('/teachers', config);
      const teachers = teachersRes.data?.data || teachersRes.data || [];
      const currentTeacher = teachers.find(t =>
        t.email === user.Email ||
        t.fullName === (user.Fname + ' ' + user.Lname)
      );

      if (!currentTeacher) {
        toast.error('Teacher not found');
        setIsLoading(false);
        return;
      }

      setTeacherData(currentTeacher);

      // Get classes
      const classesRes = await api.get('/classes', config);
      const classes = classesRes.data?.data || classesRes.data || [];
      const teacherClasses = classes.filter(c => c.id === currentTeacher.classId);
      setTeacherClasses(teacherClasses);

      // Get subjects
      const subjectsRes = await api.get('/subjects', config);
      const subjects = subjectsRes.data?.data || subjectsRes.data || [];
      const teacherSubjects = subjects.filter(s => s.classId === currentTeacher.classId);
      setTeacherSubjects(teacherSubjects);

      // Get all students
      const studentsRes = await api.get('/students', config);
      const allStudents = studentsRes.data?.data || studentsRes.data || [];

      // Get all marks
      const marksRes = await api.get('/marks', config);
      const allMarks = marksRes.data?.data || marksRes.data || [];

      // Set default selections
      if (teacherClasses.length > 0 && !selectedClass) {
        setSelectedClass(teacherClasses[0].id);
      }
      if (teacherSubjects.length > 0 && !selectedSubject) {
        setSelectedSubject(teacherSubjects[0].id);
      }

      // Process all data
      processAnalyticsData(currentTeacher, teacherClasses, teacherSubjects, allStudents, allMarks);

    } catch (error) {
      console.error('Fetch analytics error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processAnalyticsData = (teacher, classes, subjects, allStudents, allMarks) => {
    try {
      // Get students in teacher's class
      const classId = selectedClass || (classes.length > 0 ? classes[0].id : null);
      const classStudents = allStudents.filter(s => s.classId === parseInt(classId));
      const studentIds = classStudents.map(s => s.id);

      // Filter marks for this class
      const classMarks = allMarks.filter(m => studentIds.includes(m.studentId));
      
      // Filter by subject
      const subjectId = selectedSubject || (subjects.length > 0 ? subjects[0].id : null);
      let subjectMarks = classMarks;
      if (subjectId) {
        subjectMarks = classMarks.filter(m => m.subjectId === parseInt(subjectId));
      }

      // Filter by term
      const termMarks = subjectMarks.filter(m => m.term === selectedTerm);
      const validMarks = termMarks.filter(m => m.score !== null && m.score !== undefined && m.score !== '' && m.score !== 'ABS');

      // ================= SUMMARY CARDS =================
      const totalStudents = classStudents.length;
      const scores = validMarks.map(m => Number(m.score));
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const passRate = scores.length > 0 ? Math.round((scores.filter(s => s >= 50).length / scores.length) * 100) : 0;
      
      // Attendance rate
      let attendanceRate = 0;
      try {
        const presentStudents = classStudents.filter(s => {
          const hasMark = validMarks.some(m => m.studentId === s.id);
          return hasMark;
        });
        attendanceRate = totalStudents > 0 ? Math.round((presentStudents.length / totalStudents) * 100) : 0;
      } catch (e) {
        attendanceRate = 0;
      }

      const summary = {
        totalClasses: classes.length,
        totalSubjects: subjects.length,
        totalStudents: totalStudents,
        averageScore: avgScore,
        passRate: passRate,
        assignmentsGiven: termMarks.length,
        assignmentsMarked: validMarks.length,
        attendanceRate: attendanceRate,
        marksCompletionRate: totalStudents > 0 ? Math.round((validMarks.length / totalStudents) * 100) : 0
      };

      // ================= CLASS PERFORMANCE =================
      const classPerformanceData = classes.map(cls => {
        const clsStudents = allStudents.filter(s => s.classId === cls.id);
        const clsStudentIds = clsStudents.map(s => s.id);
        const clsMarks = allMarks.filter(m => clsStudentIds.includes(m.studentId) && m.subjectId === parseInt(subjectId));
        const validClsMarks = clsMarks.filter(m => m.score !== null && m.score !== undefined && m.score !== '' && m.score !== 'ABS');
        const clsScores = validClsMarks.map(m => Number(m.score));
        const clsAvg = clsScores.length > 0 ? Math.round(clsScores.reduce((a, b) => a + b, 0) / clsScores.length) : 0;
        const clsPass = clsScores.length > 0 ? Math.round((clsScores.filter(s => s >= 50).length / clsScores.length) * 100) : 0;
        return {
          class: cls.className,
          subject: subjects.find(s => s.id === parseInt(subjectId))?.subjectName || 'Subject',
          average: clsAvg,
          passRate: clsPass,
          students: clsStudents.length
        };
      });

      // ================= PERFORMANCE TREND =================
      const examTypes = ['Beginning of Term Test', 'Weekly Test', 'Coursework', 'Mid-Term Exam', 'End of Term Exam', 'Mock Examination'];
      const performanceTrendData = examTypes.map(exam => {
        const examMarks = termMarks.filter(m => m.examType === exam);
        const validExamMarks = examMarks.filter(m => m.score !== null && m.score !== undefined && m.score !== '' && m.score !== 'ABS');
        const avg = validExamMarks.length > 0 
          ? Math.round(validExamMarks.reduce((sum, m) => sum + Number(m.score), 0) / validExamMarks.length)
          : 0;
        return { exam, average: avg };
      }).filter(d => d.average > 0);

      // ================= TOP PERFORMERS =================
      const topPerformersData = classStudents
        .map(student => {
          const studentMarks = validMarks.filter(m => m.studentId === student.id);
          const avg = studentMarks.length > 0
            ? Math.round(studentMarks.reduce((sum, m) => sum + Number(m.score), 0) / studentMarks.length)
            : 0;
          return { ...student, average: avg };
        })
        .filter(s => s.average > 0)
        .sort((a, b) => b.average - a.average)
        .slice(0, 10);

      // ================= AT RISK STUDENTS =================
      const atRiskData = classStudents
        .map(student => {
          const studentMarks = validMarks.filter(m => m.studentId === student.id);
          const avg = studentMarks.length > 0
            ? Math.round(studentMarks.reduce((sum, m) => sum + Number(m.score), 0) / studentMarks.length)
            : 0;
          return { ...student, average: avg };
        })
        .filter(s => s.average > 0 && s.average < 50)
        .sort((a, b) => a.average - b.average);

      // ================= GRADE DISTRIBUTION =================
      const gradeCounts = { 'D1': 0, 'D2': 0, 'C3': 0, 'C4': 0, 'C5': 0, 'C6': 0, 'P7': 0, 'P8': 0, 'F9': 0 };
      validMarks.forEach(m => {
        const grade = getUgandaGrade(Number(m.score));
        if (gradeCounts[grade.grade] !== undefined) gradeCounts[grade.grade]++;
      });
      const gradeDistributionData = Object.entries(gradeCounts)
        .filter(([_, count]) => count > 0)
        .map(([grade, count]) => ({ grade, count }));

      // ================= SUBJECT ANALYSIS =================
      const subjectScores = validMarks.map(m => Number(m.score));
      const sortedScores = [...subjectScores].sort((a, b) => a - b);
      const median = sortedScores.length > 0 
        ? sortedScores[Math.floor(sortedScores.length / 2)] 
        : 0;

      const subjectAnalysis = {
        highest: subjectScores.length > 0 ? Math.max(...subjectScores) : 0,
        lowest: subjectScores.length > 0 ? Math.min(...subjectScores) : 0,
        average: avgScore,
        median: median,
        passRate: passRate
      };

      // ================= ATTENDANCE ANALYTICS =================
      const presentCount = validMarks.length;
      const absentCount = totalStudents - validMarks.length;
      const attendanceData = {
        present: presentCount,
        absent: absentCount,
        excused: 0
      };

      // ================= ASSIGNMENT ANALYTICS =================
      const assignmentData = {
        given: termMarks.length,
        submitted: validMarks.length,
        pending: termMarks.length - validMarks.length,
        average: avgScore
      };

      // ================= MARKS ENTRY PROGRESS =================
      const marksProgressData = classes.map(cls => {
        const clsStudents = allStudents.filter(s => s.classId === cls.id);
        const clsStudentIds = clsStudents.map(s => s.id);
        const clsMarks = allMarks.filter(m => clsStudentIds.includes(m.studentId));
        const clsValid = clsMarks.filter(m => m.score !== null && m.score !== undefined && m.score !== '' && m.score !== 'ABS');
        const rate = clsStudents.length > 0 ? Math.round((clsValid.length / clsStudents.length) * 100) : 0;
        return {
          class: cls.className,
          rate: rate,
          entered: clsValid.length,
          total: clsStudents.length,
          submitted: rate === 100,
          approved: rate === 100
        };
      });

      // ================= CLASS COMPARISON =================
      const comparisonData = classes.map(cls => {
        const clsStudents = allStudents.filter(s => s.classId === cls.id);
        const clsStudentIds = clsStudents.map(s => s.id);
        const clsMarks = allMarks.filter(m => clsStudentIds.includes(m.studentId));
        const validClsMarks = clsMarks.filter(m => m.score !== null && m.score !== undefined && m.score !== '' && m.score !== 'ABS');
        const scores = validClsMarks.map(m => Number(m.score));
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return { class: cls.className, average: avg };
      });

      // ================= SYLLABUS COVERAGE =================
      const syllabusTopics = [
        { name: 'Algebra', status: 'completed' },
        { name: 'Geometry', status: 'completed' },
        { name: 'Trigonometry', status: 'completed' },
        { name: 'Statistics', status: 'in-progress' },
        { name: 'Probability', status: 'pending' },
        { name: 'Calculus', status: 'pending' }
      ];
      const completedTopics = syllabusTopics.filter(t => t.status === 'completed').length;
      const syllabusData = {
        completed: Math.round((completedTopics / syllabusTopics.length) * 100),
        remaining: Math.round(((syllabusTopics.length - completedTopics) / syllabusTopics.length) * 100),
        topics: syllabusTopics
      };

      // ================= EXAM ANALYSIS =================
      const examAnalysisData = examTypes.map(exam => {
        const examMarks = termMarks.filter(m => m.examType === exam);
        const validExamMarks = examMarks.filter(m => m.score !== null && m.score !== undefined && m.score !== '' && m.score !== 'ABS');
        const scores = validExamMarks.map(m => Number(m.score));
        return {
          exam,
          highest: scores.length > 0 ? Math.max(...scores) : 0,
          lowest: scores.length > 0 ? Math.min(...scores) : 0,
          average: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          passRate: scores.length > 0 ? Math.round((scores.filter(s => s >= 50).length / scores.length) * 100) : 0
        };
      }).filter(d => d.highest > 0);

      // ================= STUDENT GROWTH =================
      const growthData = topPerformersData.slice(0, 5).map(student => {
        const studentMarks = validMarks.filter(m => m.studentId === student.id);
        const examScores = examTypes.map(exam => {
          const mark = studentMarks.find(m => m.examType === exam);
          return mark ? Number(mark.score) : 0;
        }).filter(s => s > 0);
        return {
          name: student.fullName,
          scores: examScores,
          growth: examScores.length > 1 ? examScores[examScores.length - 1] - examScores[0] : 0
        };
      });

      // ================= TEACHER WORKLOAD =================
      const workloadData = {
        classes: classes.length,
        subjects: subjects.length,
        students: allStudents.length,
        periodsPerWeek: classes.length * 5
      };

      // ================= PARENT CONCERNS =================
      const parentConcernsData = atRiskData.slice(0, 5).map(s => ({
        name: s.fullName,
        score: s.average,
        reason: s.average < 40 ? 'Failing consistently' : 'Needs improvement'
      }));

      // ================= BEHAVIORAL ALERTS =================
      const behavioralAlertsData = atRiskData.slice(0, 3).map(s => ({
        name: s.fullName,
        issue: 'Poor academic performance',
        severity: s.average < 35 ? 'high' : 'medium'
      }));

      // ================= UPCOMING TASKS =================
      const upcomingTasksData = [
        { task: 'Enter Mid-Term Marks', due: '2 Days', priority: 'high' },
        { task: 'Upload Lesson Notes', due: 'Tomorrow', priority: 'medium' },
        { task: 'Approve Coursework', due: 'Friday', priority: 'low' }
      ];

      setAnalyticsData({
        summary,
        classPerformance: classPerformanceData,
        performanceTrend: performanceTrendData,
        topPerformers: topPerformersData,
        atRiskStudents: atRiskData,
        gradeDistribution: gradeDistributionData,
        subjectAnalysis,
        attendanceAnalytics: attendanceData,
        assignmentAnalytics: assignmentData,
        marksEntryProgress: marksProgressData,
        classComparison: comparisonData,
        syllabusCoverage: syllabusData,
        examAnalysis: examAnalysisData,
        studentGrowth: growthData,
        teacherWorkload: workloadData,
        parentConcerns: parentConcernsData,
        behavioralAlerts: behavioralAlertsData,
        upcomingTasks: upcomingTasksData
      });

    } catch (error) {
      console.error('Process analytics error:', error);
      toast.error('Failed to process analytics data');
    }
  };

  // ================= HANDLE FILTER CHANGES =================
  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setTimeout(() => fetchAnalytics(), 100);
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    setTimeout(() => fetchAnalytics(), 100);
  };

  const handleTermChange = (term) => {
    setSelectedTerm(term);
    setTimeout(() => fetchAnalytics(), 100);
  };

  // ================= EXPORT DATA =================
  const exportCSV = () => {
    if (analyticsData.classPerformance.length === 0) {
      toast.error('No data to export');
      return;
    }

    let csv = 'Class,Subject,Average,Pass Rate,Students\n';
    analyticsData.classPerformance.forEach(item => {
      csv += `${item.class},${item.subject},${item.average}%,${item.passRate}%,${item.students}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `analytics_${selectedTerm}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics exported successfully');
  };

  // ================= INITIAL FETCH =================
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // ================= RENDER =================
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-600" />
            Teacher Analytics
            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium ml-2">
              {teacherData?.fullName || 'Teacher'}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive analysis of your classes, students, and performance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => fetchAnalytics()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              {teacherClasses.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              {teacherSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.subjectName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => handleTermChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ================= VIEW TABS ================= */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${
              selectedView === view.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {view.icon}
            {view.label}
          </button>
        ))}
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-center">
          <p className="text-xs text-gray-500 font-medium">Classes</p>
          <p className="text-xl font-bold text-purple-600">{analyticsData.summary.totalClasses}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 shadow-sm text-center">
          <p className="text-xs text-blue-600 font-medium">Subjects</p>
          <p className="text-xl font-bold text-blue-700">{analyticsData.summary.totalSubjects}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 shadow-sm text-center">
          <p className="text-xs text-emerald-600 font-medium">Students</p>
          <p className="text-xl font-bold text-emerald-700">{analyticsData.summary.totalStudents}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 shadow-sm text-center">
          <p className="text-xs text-indigo-600 font-medium">Average</p>
          <p className="text-xl font-bold text-indigo-700">{analyticsData.summary.averageScore}%</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 shadow-sm text-center">
          <p className="text-xs text-yellow-600 font-medium">Pass Rate</p>
          <p className="text-xl font-bold text-yellow-700">{analyticsData.summary.passRate}%</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-3 border border-rose-200 shadow-sm text-center">
          <p className="text-xs text-rose-600 font-medium">Attendance</p>
          <p className="text-xl font-bold text-rose-700">{analyticsData.summary.attendanceRate}%</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 border border-orange-200 shadow-sm text-center">
          <p className="text-xs text-orange-600 font-medium">Marks Entered</p>
          <p className="text-xl font-bold text-orange-700">{analyticsData.summary.marksCompletionRate}%</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 border border-teal-200 shadow-sm text-center">
          <p className="text-xs text-teal-600 font-medium">Assignments</p>
          <p className="text-xl font-bold text-teal-700">{analyticsData.summary.assignmentsMarked}</p>
        </div>
      </div>

      {/* ================= CONTENT BASED ON SELECTED VIEW ================= */}

      {/* ===== OVERVIEW VIEW ===== */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Performance Trend */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Performance Trend
                </h2>
                <p className="text-sm text-gray-500">Exam performance progression</p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {analyticsData.performanceTrend.length} Exams
              </span>
            </div>
            <div className="h-[300px]">
              {analyticsData.performanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="exam" stroke="#6b7280" />
                    <YAxis domain={[0, 100]} stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="average"
                      name="Average Score"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      dot={{ fill: '#7c3aed', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No performance data available</div>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Performers
                </h2>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Top 10</span>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {analyticsData.topPerformers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                ) : (
                  analyticsData.topPerformers.map((student, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const grade = getUgandaGrade(student.average);
                    return (
                      <div key={student.id} className={`flex items-center justify-between p-2 rounded-lg border ${index < 3 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{medals[index] || `#${index + 1}`}</span>
                          <span className="font-medium text-sm">{student.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-600 text-sm">{student.average}%</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRADE_COLORS[grade.grade] || 'bg-gray-100'}`}>
                            {grade.grade}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* At Risk Students */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Students At Risk
                </h2>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  {analyticsData.atRiskStudents.length} Students
                </span>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {analyticsData.atRiskStudents.length === 0 ? (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">All students are performing well! 🎉</p>
                  </div>
                ) : (
                  analyticsData.atRiskStudents.map((student) => {
                    const grade = getUgandaGrade(student.average);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-2 rounded-lg border border-red-200 bg-red-50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-sm">{student.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-600 text-sm">{student.average}%</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRADE_COLORS[grade.grade] || 'bg-red-100'}`}>
                            {grade.grade}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-pink-600" />
                Grade Distribution
              </h2>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                {analyticsData.gradeDistribution.length} Grades
              </span>
            </div>
            <div className="h-[250px]">
              {analyticsData.gradeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ grade, percent }) => `${grade}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No grade data available</div>
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-amber-600" />
                Upcoming Tasks
              </h2>
            </div>
            <div className="space-y-2">
              {analyticsData.upcomingTasks.map((task, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${task.priority === 'high' ? 'border-red-200 bg-red-50' : task.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    {task.priority === 'high' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-gray-500" />}
                    <span className="font-medium text-sm">{task.task}</span>
                  </div>
                  <span className="text-xs text-gray-500">Due: {task.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CLASS PERFORMANCE VIEW ===== */}
      {selectedView === 'classes' && (
        <div className="space-y-6">
          {/* Class Performance Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              Class Performance Overview
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Students</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Average</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Pass Rate</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analyticsData.classPerformance.map((cls, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-800">{cls.class}</td>
                      <td className="p-3 text-gray-600">{cls.subject}</td>
                      <td className="p-3 text-center text-gray-600">{cls.students}</td>
                      <td className="p-3 text-center font-bold text-purple-600">{cls.average}%</td>
                      <td className="p-3 text-center font-bold text-blue-600">{cls.passRate}%</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls.passRate >= 80 ? 'bg-emerald-100 text-emerald-700' : cls.passRate >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {cls.passRate >= 80 ? 'Excellent' : cls.passRate >= 60 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Class Comparison Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Class Comparison
            </h2>
            <div className="h-[300px]">
              {analyticsData.classComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={analyticsData.classComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="class" stroke="#6b7280" />
                    <YAxis domain={[0, 100]} stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Legend />
                    <Bar dataKey="average" name="Average Score" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No class comparison data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== STUDENT ANALYSIS VIEW ===== */}
      {selectedView === 'students' && (
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Performing Students
            </h2>
            <div className="space-y-2">
              {analyticsData.topPerformers.slice(0, 10).map((student, index) => {
                const medals = ['🥇', '🥈', '🥉', '4', '5', '6', '7', '8', '9', '10'];
                const grade = getUgandaGrade(student.average);
                return (
                  <div key={student.id} className={`flex items-center justify-between p-3 rounded-lg border ${index < 3 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-purple-100 text-purple-600">
                        {medals[index]}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.studentNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-purple-600">{student.average}%</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${GRADE_COLORS[grade.grade] || 'bg-gray-100'}`}>
                        {grade.grade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* At Risk Students */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Students Below 50%
            </h2>
            <div className="space-y-2">
              {analyticsData.atRiskStudents.length === 0 ? (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No students at risk! 🎉</p>
                </div>
              ) : (
                analyticsData.atRiskStudents.map((student) => {
                  const grade = getUgandaGrade(student.average);
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="font-medium text-gray-800">{student.fullName}</p>
                          <p className="text-xs text-gray-500">{student.studentNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600">{student.average}%</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${GRADE_COLORS[grade.grade] || 'bg-red-100'}`}>
                          {grade.grade}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Parent Concern List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              Parent Concern List
            </h2>
            <div className="space-y-2">
              {analyticsData.parentConcerns.length === 0 ? (
                <p className="text-sm text-gray-400 text-center">No parent concerns at this time</p>
              ) : (
                analyticsData.parentConcerns.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
                    <span className="font-medium text-gray-800">{student.name}</span>
                    <span className="text-sm text-amber-600">{student.reason}</span>
                    <span className="text-sm font-bold text-red-600">{student.score}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== ATTENDANCE VIEW ===== */}
      {selectedView === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
              <p className="text-sm text-green-600 font-medium">Present</p>
              <p className="text-3xl font-bold text-green-700">{analyticsData.attendanceAnalytics.present}</p>
              <p className="text-xs text-green-500">Students</p>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-center">
              <p className="text-sm text-red-600 font-medium">Absent</p>
              <p className="text-3xl font-bold text-red-700">{analyticsData.attendanceAnalytics.absent}</p>
              <p className="text-xs text-red-500">Students</p>
            </div>
            <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-6 text-center">
              <p className="text-sm text-yellow-600 font-medium">Excused</p>
              <p className="text-3xl font-bold text-yellow-700">{analyticsData.attendanceAnalytics.excused}</p>
              <p className="text-xs text-yellow-500">Students</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
              Attendance Distribution
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: analyticsData.attendanceAnalytics.present },
                      { name: 'Absent', value: analyticsData.attendanceAnalytics.absent },
                      { name: 'Excused', value: analyticsData.attendanceAnalytics.excused }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ===== SYLLABUS COVERAGE VIEW ===== */}
      {selectedView === 'syllabus' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center">
              <p className="text-sm text-emerald-600 font-medium">Completed</p>
              <p className="text-3xl font-bold text-emerald-700">{analyticsData.syllabusCoverage.completed}%</p>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-center">
              <p className="text-sm text-red-600 font-medium">Remaining</p>
              <p className="text-3xl font-bold text-red-700">{analyticsData.syllabusCoverage.remaining}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Topics Coverage
            </h2>
            <div className="space-y-2">
              {analyticsData.syllabusCoverage.topics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-800">{topic.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${topic.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : topic.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                    {topic.status === 'completed' ? '✅ Completed' : topic.status === 'in-progress' ? '⏳ In Progress' : '⏰ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ASSIGNMENTS VIEW ===== */}
      {selectedView === 'assignments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-medium">Given</p>
              <p className="text-xl font-bold text-purple-600">{analyticsData.assignmentAnalytics.given}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-200 shadow-sm text-center">
              <p className="text-xs text-green-600 font-medium">Submitted</p>
              <p className="text-xl font-bold text-green-700">{analyticsData.assignmentAnalytics.submitted}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 border border-red-200 shadow-sm text-center">
              <p className="text-xs text-red-600 font-medium">Pending</p>
              <p className="text-xl font-bold text-red-700">{analyticsData.assignmentAnalytics.pending}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 shadow-sm text-center">
              <p className="text-xs text-blue-600 font-medium">Average</p>
              <p className="text-xl font-bold text-blue-700">{analyticsData.assignmentAnalytics.average}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Marks Entry Progress by Class
            </h2>
            <div className="space-y-3">
              {analyticsData.marksEntryProgress.map((cls, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{cls.class}</span>
                    <span className="text-gray-500">{cls.entered}/{cls.total} ({cls.rate}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${cls.rate === 100 ? 'bg-emerald-500' : cls.rate >= 75 ? 'bg-blue-500' : cls.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${cls.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAnalytics;