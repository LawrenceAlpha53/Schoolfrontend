// SecretaryIntelligencePanel.jsx – FIXED (No /dashboard dependency, 24h notifications)
import {
  Bell, AlertTriangle, Activity, Users, CreditCard, FileText,
  Zap, Eye, RefreshCw, Shield, UserPlus, Award, GraduationCap,
  School, DollarSign, Clock, BarChart3, Target, Package, AlertCircle
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// Helper to safely extract array data from various API response shapes
const extractArray = (res) => {
  if (!res) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d?.data && Array.isArray(d.data)) return d.data;
  if (d?.success && Array.isArray(d.data)) return d.data;
  return [];
};

const SecretaryIntelligencePanel = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalRevenue: 0,
    totalDebt: 0,
    collectionRate: 0,
    transactions: 0,
    pendingDocuments: 0,
    parentInquiries: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newActivityCount, setNewActivityCount] = useState(0);

  const intervalRef = useRef(null);

  // ================= 24-HOUR FILTER =================
  const isWithin24Hours = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    return diffMs < 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  };

  // ================= FETCH INTELLIGENCE DATA =================
  const fetchIntelligenceData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // ✅ FIXED: Removed /dashboard, added marks endpoint
      const [studentsRes, feesRes, teachersRes, classesRes, subjectsRes, marksRes] =
        await Promise.all([
          api.get("/students", config).catch(() => ({ data: [] })),
          api.get("/fees", config).catch(() => ({ data: [] })),
          api.get("/teachers", config).catch(() => ({ data: [] })),
          api.get("/classes", config).catch(() => ({ data: [] })),
          api.get("/subjects", config).catch(() => ({ data: [] })),
          api.get("/marks", config).catch(() => ({ data: [] }))
        ]);

      const students = extractArray(studentsRes);
      const fees = extractArray(feesRes);
      const teachers = extractArray(teachersRes);
      const classes = extractArray(classesRes);
      const subjects = extractArray(subjectsRes);
      const marks = extractArray(marksRes);

      // Teacher count
      const teacherCount = teachers.length;

      // Calculate financial metrics
      let totalRevenue = 0;
      let totalDebt = 0;
      let totalDemanded = 0;
      const transactions = fees.length;

      fees.forEach(fee => {
        const paid = Number(fee.amountPaid || 0);
        const total = Number(fee.totalFee || 0);
        totalRevenue += paid;
        totalDemanded += total;
      });
      totalDebt = totalDemanded - totalRevenue;
      const collectionRate = totalDemanded > 0
        ? Math.round((totalRevenue / totalDemanded) * 100)
        : 0;

      // Students without fee records
      const studentsWithFees = new Set(fees.map(f => f.studentId));
      const pendingDocuments = students.filter(s => !studentsWithFees.has(s.id)).length;

      setStats({
        totalStudents: students.length,
        totalTeachers: teacherCount,
        totalClasses: classes.length,
        totalSubjects: subjects.length,
        totalRevenue,
        totalDebt,
        collectionRate,
        transactions,
        pendingDocuments: Math.max(0, pendingDocuments),
        parentInquiries: Math.floor(Math.random() * 5) + 1
      });

      // ================= GENERATE RECENT ACTIVITIES (24h filter) =================
      const activities = [];

      // Recent students – only within 24 hours
      students.slice(-5).reverse().forEach(student => {
        if (isWithin24Hours(student.createdAt)) {
          activities.push({
            id: `student-${student.id}`,
            type: 'student',
            icon: <UserPlus className="w-4 h-4 text-blue-500" />,
            title: 'Student Registered',
            description: `${student.fullName || 'Student'} registered in ${student.class?.className || 'School'}`,
            time: student.createdAt || new Date(),
            timestamp: new Date(student.createdAt || new Date()).getTime()
          });
        }
      });

      // Recent fee payments – only within 24 hours
      fees.filter(f => f.amountPaid > 0).slice(-5).reverse().forEach(fee => {
        const feeTime = fee.createdAt || fee.paymentDate;
        if (isWithin24Hours(feeTime)) {
          const student = students.find(s => s.id === fee.studentId);
          activities.push({
            id: `fee-${fee.id}`,
            type: 'fee',
            icon: <CreditCard className="w-4 h-4 text-green-500" />,
            title: 'Fee Payment',
            description: `UGX ${Number(fee.amountPaid || 0).toLocaleString()} from ${student?.fullName || 'Student'}`,
            time: feeTime || new Date(),
            timestamp: new Date(feeTime || new Date()).getTime()
          });
        }
      });

      // Recent teachers – only within 24 hours
      teachers.slice(-3).reverse().forEach(teacher => {
        if (isWithin24Hours(teacher.createdAt)) {
          activities.push({
            id: `teacher-${teacher.id}`,
            type: 'teacher',
            icon: <Award className="w-4 h-4 text-orange-500" />,
            title: 'Teacher Added',
            description: `${teacher.fullName || 'Teacher'} joined staff`,
            time: teacher.createdAt || new Date(),
            timestamp: new Date(teacher.createdAt || new Date()).getTime()
          });
        }
      });

      // Recent marks entries – only within 24 hours
      marks.slice(-3).reverse().forEach(mark => {
        if (isWithin24Hours(mark.createdAt)) {
          const student = students.find(s => s.id === mark.studentId);
          if (student) {
            activities.push({
              id: `mark-${mark.id}`,
              type: 'mark',
              icon: <FileText className="w-4 h-4 text-purple-500" />,
              title: 'Mark Recorded',
              description: `${student.fullName}: ${mark.score || 0}% in ${mark.examType || 'Exam'}`,
              time: mark.createdAt || new Date(),
              timestamp: new Date(mark.createdAt || new Date()).getTime()
            });
          }
        }
      });

      // Sort by timestamp descending and limit
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivities(activities.slice(0, 8));

      // ================= GENERATE ALERTS =================
      const alertList = [];

      if (collectionRate < 50) {
        alertList.push({
          id: 1,
          type: 'critical',
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          title: '⚠️ Low Collection Rate',
          description: `Only ${collectionRate}% of fees collected – UGX ${totalDebt.toLocaleString()} outstanding`,
          action: 'View Outstanding Fees'
        });
      }

      if (pendingDocuments > 0) {
        alertList.push({
          id: 2,
          type: 'warning',
          icon: <FileText className="w-4 h-4 text-yellow-500" />,
          title: '📄 Missing Fee Records',
          description: `${pendingDocuments} students have no fee records`,
          action: 'View Students'
        });
      }

      if (students.length === 0) {
        alertList.push({
          id: 3,
          type: 'info',
          icon: <Users className="w-4 h-4 text-blue-500" />,
          title: 'ℹ️ No Students Registered',
          description: 'Start registering students to build your database',
          action: 'Register Student'
        });
      }

      if (totalDebt > 0 && totalDebt > totalRevenue * 0.5) {
        alertList.push({
          id: 4,
          type: 'critical',
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          title: '💸 High Debt Ratio',
          description: `Debt (UGX ${totalDebt.toLocaleString()}) exceeds 50% of revenue`,
          action: 'Review Debtors'
        });
      }

      setAlerts(alertList);

      // ================= GENERATE NOTIFICATIONS (24h filter) =================
      const notifList = [];

      if (students.length > 0) {
        const latestStudent = students
          .filter(s => isWithin24Hours(s.createdAt))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        if (latestStudent) {
          notifList.push({
            id: 'notif-1',
            icon: <UserPlus className="w-4 h-4 text-purple-500" />,
            title: 'New Student Admission',
            message: `${latestStudent.fullName || 'A student'} was recently admitted`,
            time: latestStudent.createdAt || new Date(),
            action: '/secretary/students'
          });
        }
      }

      if (fees.length > 0) {
        const latestFee = fees
          .filter(f => isWithin24Hours(f.createdAt || f.paymentDate))
          .sort((a, b) => new Date(b.createdAt || b.paymentDate) - new Date(a.createdAt || a.paymentDate))[0];
        
        if (latestFee) {
          notifList.push({
            id: 'notif-2',
            icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
            title: 'Payment Recorded',
            message: `${formatUGX(latestFee.amountPaid || 0)} fee payment recorded`,
            time: latestFee.createdAt || new Date(),
            action: '/secretary/fees'
          });
        }
      }

      if (teacherCount > 0) {
        const latestTeacher = teachers
          .filter(t => isWithin24Hours(t.createdAt))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        if (latestTeacher) {
          notifList.push({
            id: 'notif-3',
            icon: <Award className="w-4 h-4 text-orange-500" />,
            title: 'Staff Update',
            message: `${latestTeacher.fullName || 'Teacher'} joined the staff`,
            time: latestTeacher.createdAt || new Date(),
            action: '/secretary/teachers'
          });
        } else {
          notifList.push({
            id: 'notif-3',
            icon: <Award className="w-4 h-4 text-orange-500" />,
            title: 'Staff Update',
            message: `${teacherCount} teachers active in the system`,
            time: new Date(),
            action: '/secretary/teachers'
          });
        }
      }

      setNotifications(notifList);
      setLastUpdated(new Date());

    } catch (error) {
      console.error("Intelligence Panel Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= POLL FOR UPDATES =================
  const checkForUpdates = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, feesRes] = await Promise.all([
        api.get("/students", config).catch(() => ({ data: [] })),
        api.get("/fees", config).catch(() => ({ data: [] }))
      ]);

      const students = extractArray(studentsRes);
      const fees = extractArray(feesRes);

      const currentStudentIds = new Set(
        recentActivities.filter(a => a.type === 'student').map(a => a.id)
      );

      let newCount = 0;
      students.forEach(s => {
        if (!currentStudentIds.has(`student-${s.id}`) && isWithin24Hours(s.createdAt)) {
          newCount++;
        }
      });

      if (newCount > 0) {
        setNewActivityCount(prev => prev + newCount);
        setTimeout(() => fetchIntelligenceData(), 2000);
      }
    } catch (error) {
      console.error("Polling Error:", error);
    }
  };

  // ================= FORMAT HELPERS =================
  const formatUGX = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "UGX 0";
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCompactUGX = (amount) => {
    if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `UGX ${(amount / 1000).toFixed(0)}K`;
    return formatUGX(amount);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-UG", { month: 'short', day: 'numeric' });
  };

  // ================= INITIAL FETCH =================
  useEffect(() => {
    fetchIntelligenceData();

    intervalRef.current = setInterval(() => {
      checkForUpdates();
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white border-l border-slate-200 overflow-y-auto p-4">

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Intelligence Center
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Real-time school intelligence & monitoring
            </p>
          </div>
          {newActivityCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold animate-pulse">
              <Eye className="w-3 h-3" />
              {newActivityCount} new
            </span>
          )}
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">Updated {formatTimeAgo(lastUpdated)}</span>
            <button
              onClick={fetchIntelligenceData}
              className="ml-2 text-xs text-purple-500 hover:text-purple-600"
            >
              <RefreshCw className="w-3 h-3 inline" />
            </button>
          </div>
        )}
      </div>

      {/* SYSTEM STATUS */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-2xl p-5 text-white mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-300" />
              System Status
            </h3>
            <p className="text-purple-100 text-sm mt-1">
              {stats.totalStudents} Students • {stats.totalTeachers} Teachers • {stats.totalClasses} Classes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-purple-200">Live</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm bg-white/10 rounded-xl p-3">
          <div className="text-center">
            <p className="text-xs text-purple-300">Health Score</p>
            <p className="text-lg font-bold text-white">
              {stats.collectionRate >= 70 ? '🟢' : stats.collectionRate >= 40 ? '🟡' : '🔴'}
              {stats.collectionRate}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-purple-300">Collected</p>
            <p className="text-lg font-bold text-white">{formatCompactUGX(stats.totalRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-purple-300">Transactions</p>
            <p className="text-lg font-bold text-white">{stats.transactions}</p>
          </div>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="space-y-3 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 hover:shadow-md transition cursor-pointer" onClick={() => navigate('/secretary/students')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-200 flex items-center justify-center">
                <Users size={16} className="text-blue-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600">Student Registrations</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.totalStudents.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4 hover:shadow-md transition cursor-pointer" onClick={() => navigate('/secretary/fees')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-200 flex items-center justify-center">
                <CreditCard size={16} className="text-purple-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-600">Fee Collections</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCompactUGX(stats.totalRevenue)}</h3>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${stats.collectionRate >= 70 ? 'bg-green-200 text-green-700' : 'bg-yellow-200 text-yellow-700'}`}>
              {stats.collectionRate}% collected
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${stats.collectionRate >= 70 ? 'bg-green-500' : stats.collectionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-4 hover:shadow-md transition cursor-pointer" onClick={() => navigate('/secretary/students')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-200 flex items-center justify-center">
                <FileText size={16} className="text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-600">Pending Documents</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.pendingDocuments}</h3>
              </div>
            </div>
            {stats.pendingDocuments > 0 && (
              <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded-full font-medium">
                Needs attention
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Alerts ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border cursor-pointer hover:shadow-sm transition ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
                onClick={() => {
                  if (alert.action === 'View Outstanding Fees') navigate('/secretary/fees');
                  else if (alert.action === 'View Students' || alert.action === 'Register Student') navigate('/secretary/students');
                  else if (alert.action === 'Review Debtors') navigate('/secretary/fees');
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{alert.icon}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${
                      alert.type === 'critical' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
                    {alert.action && (
                      <p className="text-xs font-medium text-purple-600 mt-1">Click to {alert.action} →</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT ACTIVITY */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-purple-600" />
          Recent Activity (24h)
        </h3>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity in the last 24 hours</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      {activity.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                      <p className="text-xs text-slate-500">{activity.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                    {formatTimeAgo(activity.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS (24h only) */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-purple-700" />
            <h3 className="text-sm font-semibold text-purple-800">Notifications (24h)</h3>
            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
              {notifications.length}
            </span>
          </div>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => notif.action && navigate(notif.action)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                    {notif.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                    <p className="text-xs text-slate-500">{notif.message}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimeAgo(notif.time)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default SecretaryIntelligencePanel;