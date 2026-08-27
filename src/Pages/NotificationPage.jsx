import {
  Bell,
  Clock,
  UserPlus,
  CreditCard,
  GraduationCap,
  Award,
  FileText,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  School,
  BookOpen,
  DollarSign,
  ArrowLeft,
  Eye
} from "lucide-react";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// ---------- HELPER: Extract data from API response ----------
const extractData = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (d?.data && Array.isArray(d.data)) return d.data;
  if (d?.success === true && Array.isArray(d?.data)) return d.data;
  if (d?.results && Array.isArray(d.results)) return d.results;
  return [];
};

// ---------- FORMAT HELPERS ----------
const formatUGX = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "UGX 0";
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-UG", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  
  // ================= STATE =================
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // ================= READ STATUS (localStorage) =================
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('secretary_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const saveReadIds = (ids) => {
    try {
      localStorage.setItem('secretary_read_notifications', JSON.stringify(ids));
      setReadIds(ids);
    } catch (e) { /* ignore */ }
  };

  // ================= FETCH ALL NOTIFICATIONS =================
  const fetchAllNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setIsLoading(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, feesRes, teachersRes, marksRes, classesRes] = await Promise.all([
        api.get("/students", config),
        api.get("/fees", config),
        api.get("/teachers", config),
        api.get("/marks", config),
        api.get("/classes", config)
      ]);

      const students = extractData(studentsRes);
      const fees = extractData(feesRes);
      const teachers = extractData(teachersRes);
      const marks = extractData(marksRes);
      const classes = extractData(classesRes);

      const notificationList = [];

      // 1. All Student Registrations
      students.forEach(student => {
        const createdAt = student.createdAt || student.created_at || new Date();
        const id = `student-${student.id}`;
        notificationList.push({
          id,
          type: 'student',
          icon: <UserPlus className="w-5 h-5 text-blue-500" />,
          title: '🎓 Student Registered',
          message: `${student.fullName || 'Student'} was registered in ${student.class?.className || 'School'}`,
          time: createdAt,
          timestamp: new Date(createdAt).getTime(),
          read: readIds.includes(id),
          action: `/secretary/students/${student.id}`,
          actionLabel: 'View Student',
          studentId: student.id,
          details: {
            student: student.fullName,
            class: student.class?.className,
            studentNumber: student.studentNumber,
            parentName: student.parentName,
            parentPhone: student.parentPhone
          }
        });
      });

      // 2. All Fee Payments
      fees.forEach(fee => {
        const paid = Number(fee.amountPaid || fee.amount_paid || fee.paid || 0);
        if (paid === 0) return;
        const createdAt = fee.createdAt || fee.created_at || fee.paymentDate || new Date();
        const studentName = fee.student?.fullName || fee.student_name || 'Student';
        const id = `fee-${fee.id}`;
        notificationList.push({
          id,
          type: 'fee',
          icon: <CreditCard className="w-5 h-5 text-purple-500" />,
          title: '💰 Fee Payment Received',
          message: `${formatUGX(paid)} payment received from ${studentName}`,
          time: createdAt,
          timestamp: new Date(createdAt).getTime(),
          read: readIds.includes(id),
          action: `/secretary/fees/${fee.id}`,
          actionLabel: 'View Payment',
          feeId: fee.id,
          details: {
            student: studentName,
            amount: formatUGX(paid),
            totalFee: formatUGX(fee.totalFee || 0),
            balance: formatUGX(fee.balance || 0),
            term: fee.term,
            academicYear: fee.academicYear,
            paymentMethod: fee.paymentMethod || fee.payment_method || 'Cash'
          }
        });
      });

      // 3. All Marks Registrations
      marks.forEach(mark => {
        const createdAt = mark.createdAt || mark.created_at || new Date();
        const studentName = mark.student?.fullName || mark.student_name || 'Student';
        const subjectName = mark.subject?.subjectName || mark.subject_name || 'Subject';
        const teacherName = mark.teacher?.fullName || mark.teacher_name || 'Teacher';
        const className = mark.student?.class?.className || mark.class_name || 'Class';
        const id = `mark-${mark.id}`;
        notificationList.push({
          id,
          type: 'marks',
          icon: <GraduationCap className="w-5 h-5 text-green-500" />,
          title: '📝 Marks Recorded',
          message: `${teacherName} recorded marks for ${studentName} in ${subjectName} (${className})`,
          time: createdAt,
          timestamp: new Date(createdAt).getTime(),
          read: readIds.includes(id),
          action: `/secretary/marks/${mark.id}`,
          actionLabel: 'View Marks',
          markId: mark.id,
          details: {
            student: studentName,
            subject: subjectName,
            teacher: teacherName,
            class: className,
            score: mark.score,
            examType: mark.examType
          }
        });
      });

      // 4. All Teacher Registrations
      teachers.forEach(teacher => {
        const createdAt = teacher.createdAt || teacher.created_at || new Date();
        const id = `teacher-${teacher.id}`;
        notificationList.push({
          id,
          type: 'teacher',
          icon: <Award className="w-5 h-5 text-orange-500" />,
          title: '👨‍🏫 Teacher Joined',
          message: `${teacher.fullName || 'Teacher'} joined as a teacher`,
          time: createdAt,
          timestamp: new Date(createdAt).getTime(),
          read: readIds.includes(id),
          action: `/secretary/teachers/${teacher.id}`,
          actionLabel: 'View Teacher',
          teacherId: teacher.id,
          details: {
            name: teacher.fullName,
            email: teacher.email,
            phone: teacher.phoneNumber,
            subject: teacher.subject?.subjectName,
            class: teacher.class?.className
          }
        });
      });

      // Sort by timestamp (newest first)
      notificationList.sort((a, b) => b.timestamp - a.timestamp);

      setTotalCount(notificationList.length);
      setNotifications(notificationList);
      setFilteredNotifications(notificationList);
      
      const unread = notificationList.filter(n => !n.read).length;
      setUnreadCount(unread);

      setIsLoading(false);

    } catch (error) {
      console.error("Notifications fetch error:", error);
      setIsLoading(false);
    }
  }, [readIds]);

  // ================= APPLY FILTERS =================
  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    if (filterType !== "all") {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (filterDate !== "all") {
      const now = Date.now();
      const oneDay = 86400000;
      const oneWeek = oneDay * 7;
      const oneMonth = oneDay * 30;
      const oneYear = oneDay * 365;

      filtered = filtered.filter(n => {
        const diff = now - n.timestamp;
        if (filterDate === "today") return diff < oneDay;
        if (filterDate === "week") return diff < oneWeek;
        if (filterDate === "month") return diff < oneMonth;
        if (filterDate === "year") return diff < oneYear;
        return true;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term) ||
        n.type.toLowerCase().includes(term)
      );
    }

    if (sortOrder === "newest") {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      filtered.sort((a, b) => a.timestamp - b.timestamp);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, filterType, filterDate, sortOrder]);

  // ================= MARK AS READ =================
  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      saveReadIds(newReadIds);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // ================= VIEW DETAILS =================
  const viewDetails = (notification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  // ================= GET STYLES =================
  const getIconBg = (type) => {
    switch(type) {
      case 'student': return 'bg-blue-50 text-blue-600';
      case 'marks': return 'bg-green-50 text-green-600';
      case 'fee': return 'bg-purple-50 text-purple-600';
      case 'teacher': return 'bg-orange-50 text-orange-600';
      case 'system': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'student': return 'Student';
      case 'marks': return 'Marks';
      case 'fee': return 'Payment';
      case 'teacher': return 'Teacher';
      case 'system': return 'System';
      default: return 'Other';
    }
  };

  // ================= EFFECTS =================
  useEffect(() => {
    fetchAllNotifications();
  }, [fetchAllNotifications]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => navigate('/secretary/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-600" />
            All Notifications
          </h1>
          <p className="text-gray-500 mt-1">
            {totalCount} notifications • {unreadCount} unread
          </p>
        </div>
        <button
          onClick={fetchAllNotifications}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="student">Students</option>
            <option value="fee">Payments</option>
            <option value="marks">Marks</option>
            <option value="teacher">Teachers</option>
          </select>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <span className="text-sm text-gray-500 whitespace-nowrap">
            {filteredNotifications.length} results
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">No notifications found</h3>
            <p className="text-gray-400 mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-purple-500 bg-purple-50/5' : ''
                }`}
                onClick={() => viewDetails(notification)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)}`}>
                  {notification.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {getTypeLabel(notification.type)}
                    </span>
                    {!notification.read && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"></span>
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(notification.time)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(notification.time)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewDetails(notification);
                  }}
                  className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Showing {filteredNotifications.length} of {totalCount} notifications</span>
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getIconBg(selectedNotification.type)}`}>
                  {selectedNotification.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedNotification.title}</h3>
                  <p className="text-sm text-gray-500">{getTypeLabel(selectedNotification.type)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Date & Time</p>
                    <p className="text-sm font-medium text-gray-700">{formatDate(selectedNotification.time)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time Ago</p>
                    <p className="text-sm font-medium text-gray-700">{formatTimeAgo(selectedNotification.time)}</p>
                  </div>
                </div>

                {selectedNotification.details && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Details</p>
                    <div className="space-y-2">
                      {Object.entries(selectedNotification.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-gray-700 font-medium">{value || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNotification.action && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate(selectedNotification.action);
                    }}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                  >
                    {selectedNotification.actionLabel || 'View Details'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;