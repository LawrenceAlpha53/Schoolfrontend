import {
  ClipboardCheck,
  FileText,
  Users,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Plus,
  Download,
  Printer,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle,
  X,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Save,
  XCircle,
  AlertCircle,
  Bell,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
  Sparkles,
  Brain,
  Target,
  Rocket,
  Shield,
  Zap,
  UserPlus,
  MessageSquare,
  ThumbsUp,
  Star,
  Trophy,
  Medal
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const TeacherQuickActions = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const [myStudents, setMyStudents] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    pendingMarks: 0,
    submittedMarks: 0,
    attendanceRate: 0,
    totalClasses: 0
  });

  // ================= GET CURRENT TEACHER USING TOKEN =================
  const getCurrentTeacher = useCallback(async (config) => {
    try {
      const response = await api.get('/teachers/me', config);
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.log('⚠️ /teachers/me failed, using fallback...');
      return null;
    }
  }, []);

  // ================= FETCH TEACHER DATA =================
  const fetchTeacherData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        setIsLoading(false);
        return;
      }

      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      };

      // ===== 1. GET CURRENT TEACHER =====
      let currentTeacher = null;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      try {
        const meRes = await api.get('/teachers/me', config);
        if (meRes.data?.success && meRes.data.data) {
          currentTeacher = meRes.data.data;
          console.log('✅ Found teacher via /teachers/me:', currentTeacher.id);
        }
      } catch (e) {
        console.log('⚠️ /teachers/me failed:', e.message);
      }

      if (!currentTeacher) {
        const teachersRes = await api.get('/teachers', config);
        const teachers = teachersRes.data?.data || teachersRes.data || [];
        currentTeacher = teachers.find(t => 
          t.userId === user.id || 
          t.email === user.Email || 
          t.fullName === (user.Fname + ' ' + user.Lname)
        );
        if (currentTeacher) {
          console.log('✅ Found teacher via fallback:', currentTeacher.id);
        }
      }

      if (!currentTeacher) {
        toast.error('Teacher record not found');
        setIsLoading(false);
        return;
      }

      setTeacherData(currentTeacher);

      // ===== 2. GET STUDENTS =====
      let teacherStudents = [];
      if (currentTeacher.classId) {
        try {
          const studentsRes = await api.get(`/students?classId=${currentTeacher.classId}`, config);
          teacherStudents = studentsRes.data?.data || studentsRes.data || [];
          console.log(`✅ Found ${teacherStudents.length} students in class ${currentTeacher.classId}`);
        } catch (e) {
          console.log('⚠️ Students by classId failed, trying fallback...');
          const allStudentsRes = await api.get('/students', config);
          const allStudents = allStudentsRes.data?.data || allStudentsRes.data || [];
          teacherStudents = allStudents.filter(s => s.classId === currentTeacher.classId);
          console.log(`✅ Filtered ${teacherStudents.length} students from ${allStudents.length} total`);
        }
      } else {
        console.warn('⚠️ Teacher has no class assigned');
      }
      setMyStudents(teacherStudents.filter(s => s.classId === currentTeacher.classId));

      // ===== 3. GET TEACHER'S CLASSES =====
      let teacherClasses = [];
      if (currentTeacher.classId) {
        try {
          const classRes = await api.get(`/classes/${currentTeacher.classId}`, config);
          if (classRes.data?.data) {
            teacherClasses = [classRes.data.data];
          }
        } catch (e) {
          const allClassesRes = await api.get('/classes', config);
          const allClasses = allClassesRes.data?.data || allClassesRes.data || [];
          teacherClasses = allClasses.filter(c => c.id === currentTeacher.classId);
        }
      }
      setMyClasses(teacherClasses);

      // ===== 4. GET MARKS =====
      let teacherMarks = [];
      try {
        const marksRes = await api.get(`/marks/teacher/${currentTeacher.id}`, config);
        teacherMarks = marksRes.data?.data || marksRes.data || [];
        console.log(`✅ Found ${teacherMarks.length} marks for teacher ${currentTeacher.id}`);
      } catch (e) {
        console.log('⚠️ Marks by teacher failed, trying fallback...');
        const allMarksRes = await api.get('/marks', config);
        const allMarks = allMarksRes.data?.data || allMarksRes.data || [];
        teacherMarks = allMarks.filter(m => m.teacherId === currentTeacher.id);
        console.log(`✅ Filtered ${teacherMarks.length} marks from ${allMarks.length} total`);
      }

      const pending = teacherMarks.filter(m => !m.submitted || m.score === null || m.score === undefined);
      const submitted = teacherMarks.filter(m => m.submitted && m.score !== null && m.score !== undefined);

      // ===== 5. GET ATTENDANCE – FIXED RESPONSE HANDLING =====
      let attendanceRate = 0;
      try {
        const today = new Date().toISOString().split('T')[0];
        if (currentTeacher.classId) {
          const attendanceRes = await api.get(`/attendance/class/${currentTeacher.classId}/date/${today}`, config);
          // ✅ Extract array from response (handles both {data: [...]} and direct array)
          let attendanceData = attendanceRes.data?.data || attendanceRes.data;
          // Ensure it's an array
          if (!Array.isArray(attendanceData)) {
            console.warn('Attendance data is not an array, using empty array');
            attendanceData = [];
          }
          const present = attendanceData.filter(a => a.status === 'present').length;
          const total = attendanceData.length;
          attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
          console.log(`✅ Attendance rate: ${attendanceRate}%`);
        }
      } catch (e) {
        console.log('⚠️ Attendance fetch error:', e.message);
      }

      // ===== 6. CALCULATE STATS =====
      const totalStudents = teacherStudents.filter(s => s.classId === currentTeacher.classId).length;
      const presentToday = Math.round(totalStudents * (attendanceRate / 100));
      const absentToday = totalStudents - presentToday;

      setStats({
        totalStudents,
        presentToday,
        absentToday,
        pendingMarks: pending.length,
        submittedMarks: submitted.length,
        attendanceRate,
        totalClasses: teacherClasses.length
      });

      // ===== 7. PENDING TASKS =====
      const tasks = [];
      if (pending.length > 0) {
        tasks.push({
          id: 1,
          title: 'Pending Marks Entry',
          description: `${pending.length} students need marks`,
          icon: <FileText className="w-4 h-4 text-orange-500" />,
          action: 'Enter Marks',
          priority: 'high'
        });
      }
      if (totalStudents > 0 && attendanceRate < 70 && attendanceRate > 0) {
        tasks.push({
          id: 2,
          title: 'Attendance Alert',
          description: `Class attendance at ${Math.round(attendanceRate)}%`,
          icon: <ClipboardCheck className="w-4 h-4 text-red-500" />,
          action: 'Take Attendance',
          priority: 'high'
        });
      }
      if (totalStudents === 0) {
        tasks.push({
          id: 3,
          title: 'No Students Assigned',
          description: 'Your class has no students',
          icon: <Users className="w-4 h-4 text-yellow-500" />,
          action: 'View Students',
          priority: 'medium'
        });
      }
      setPendingTasks(tasks);

      // ===== 8. RECENT ACTIVITIES =====
      const activities = [];
      if (submitted.length > 0) {
        activities.push({
          id: 1,
          title: 'Marks Submitted',
          description: `${submitted.length} marks submitted recently`,
          time: new Date(),
          icon: <CheckCircle className="w-4 h-4 text-green-500" />
        });
      }
      if (totalStudents > 0) {
        activities.push({
          id: 2,
          title: 'Class Update',
          description: `${totalStudents} students in your class`,
          time: new Date(),
          icon: <Users className="w-4 h-4 text-blue-500" />
        });
      }
      if (attendanceRate > 0) {
        activities.push({
          id: 3,
          title: 'Attendance Summary',
          description: `${attendanceRate}% attendance today`,
          time: new Date(),
          icon: <ClipboardCheck className="w-4 h-4 text-green-500" />
        });
      }
      if (activities.length === 0) {
        activities.push({
          id: 0,
          title: 'Welcome to your Dashboard',
          description: 'Start by checking your class assignments',
          time: new Date(),
          icon: <Sparkles className="w-4 h-4 text-yellow-500" />
        });
      }
      setRecentActivities(activities);

    } catch (error) {
      console.error('Fetch teacher data error:', error);
      toast.error('Failed to load your data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  // ================= ACTION HANDLERS =================
  const handleAction = (action) => {
    switch(action) {
      case 'Take Attendance':
        navigate('/teacher/attendance');
        break;
      case 'Enter Marks':
        navigate('/teacher/marks');
        break;
      case 'View Students':
        navigate('/teacher/students');
        break;
      case 'Lesson Plans':
        navigate('/teacher/lesson-plans');
        break;
      case 'Timetable':
        navigate('/teacher/timetable');
        break;
      case 'Generate Reports':
        navigate('/teacher/reports');
        break;
      case 'Contact Admin':
        navigate('/teacher/contact');
        break;
      default:
        toast.info(`Navigating to ${action}...`);
    }
  };

  const formatTimeAgo = (date) => {
    const diff = new Date() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const actions = [
    {
      title: "Take Attendance",
      icon: <ClipboardCheck size={22} />,
      description: "Record today's attendance",
      color: "blue",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      badge: stats.totalStudents > 0 ? stats.totalStudents : null,
      badgeColor: "bg-blue-500"
    },
    {
      title: "Enter Marks",
      icon: <FileText size={22} />,
      description: `${stats.pendingMarks} pending entries`,
      color: "purple",
      bgColor: "bg-purple-50",
      hoverBg: "hover:bg-purple-100",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      badge: stats.pendingMarks > 0 ? stats.pendingMarks : null,
      badgeColor: "bg-orange-500"
    },
    {
      title: "View Students",
      icon: <Users size={22} />,
      description: `${stats.totalStudents} students enrolled`,
      color: "green",
      bgColor: "bg-green-50",
      hoverBg: "hover:bg-green-100",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      badge: stats.totalStudents > 0 ? stats.totalStudents : null,
      badgeColor: "bg-green-500"
    },
    {
      title: "Lesson Plans",
      icon: <BookOpen size={22} />,
      description: "Manage lesson plans",
      color: "orange",
      bgColor: "bg-orange-50",
      hoverBg: "hover:bg-orange-100",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600"
    },
    {
      title: "Timetable",
      icon: <CalendarDays size={22} />,
      description: `${myClasses.length} classes assigned`,
      color: "indigo",
      bgColor: "bg-indigo-50",
      hoverBg: "hover:bg-indigo-100",
      borderColor: "border-indigo-200",
      iconColor: "text-indigo-600",
      badge: myClasses.length > 0 ? myClasses.length : null,
      badgeColor: "bg-indigo-500"
    },
    {
      title: "Generate Reports",
      icon: <GraduationCap size={22} />,
      description: "Class performance reports",
      color: "red",
      bgColor: "bg-red-50",
      hoverBg: "hover:bg-red-100",
      borderColor: "border-red-200",
      iconColor: "text-red-600"
    }
  ];

  const statCards = [
    {
      label: "My Students",
      value: stats.totalStudents,
      icon: <Users className="w-5 h-5" />,
      color: "blue"
    },
    {
      label: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: <ClipboardCheck className="w-5 h-5" />,
      color: "green"
    },
    {
      label: "Pending Marks",
      value: stats.pendingMarks,
      icon: <FileText className="w-5 h-5" />,
      color: "orange"
    },
    {
      label: "My Classes",
      value: myClasses.length || 0,
      icon: <BookOpen className="w-5 h-5" />,
      color: "purple"
    }
  ];

  const getStatColor = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700'
    };
    return colors[color] || colors.blue;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <span className="text-gray-500">Loading your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Quick Actions
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">
              {teacherData?.fullName || 'Teacher'}
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your classroom activities efficiently
          </p>
        </div>
        <button
          onClick={() => fetchTeacherData()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`rounded-xl p-3 border ${getStatColor(stat.color)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-75">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              <div className="w-8 h-8 bg-white/50 rounded-lg flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= PENDING TASKS ALERT ================= */}
      {pendingTasks.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200">
          <div className="flex items-center gap-3 flex-wrap">
            <Bell className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-800">Pending Tasks:</span>
            {pendingTasks.map((task, index) => (
              <div key={index} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 shadow-sm">
                {task.icon}
                <span className="text-sm text-gray-700">{task.title}</span>
                <button 
                  onClick={() => handleAction(task.action)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  {task.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ACTION BUTTONS GRID ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleAction(action.title)}
            className={`
              p-5 rounded-xl border
              ${action.bgColor}
              ${action.borderColor}
              ${action.hoverBg}
              hover:shadow-md
              transition-all
              duration-200
              text-left
              cursor-pointer
              group
              relative
              overflow-hidden
            `}
          >
            {/* Accent line */}
            <div className={`
              absolute top-0 left-0 w-1 h-full 
              bg-gradient-to-b from-${action.color}-400 to-${action.color}-600
              opacity-0 group-hover:opacity-100 transition-opacity
            `}></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className={`${action.iconColor} mb-2`}>
                  {action.icon}
                </div>
                {action.badge && (
                  <span className={`text-xs ${action.badgeColor} text-white px-2 py-0.5 rounded-full`}>
                    {action.badge}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-800 text-sm">
                {action.title}
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ================= RECENT ACTIVITY ================= */}
      {recentActivities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-400">{formatTimeAgo(activity.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= QUICK TIPS ================= */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="w-3 h-3 text-yellow-500" />
          <span>💡 Tip: Use the "Enter Marks" button to quickly record student grades</span>
        </div>
      </div>

    </div>
  );
};

export default TeacherQuickActions;