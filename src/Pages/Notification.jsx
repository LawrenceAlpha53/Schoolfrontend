import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Pin,
  Archive,
  Trash2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  CreditCard,
  GraduationCap,
  Award,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  School,
  BookOpen,
  CalendarDays,
  Mail,
  Zap,
  Star,
  StarOff,
  Settings,
  BellRing,
  BellOff,
  Megaphone,
  MessageSquare,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ArrowRight,
  LayoutGrid,
  Table
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Notification = () => {
  const navigate = useNavigate();
  
  // ================= STATE =================
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list, grid, compact
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, unread_first, priority

  // ================= STATISTICS =================
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    pinned: 0,
    archived: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  // ================= MODAL STATES =================
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // ================= REFS =================
  const searchInputRef = useRef(null);

  // ================= READ NOTIFICATION IDS FROM LOCAL STORAGE =================
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem('readNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ================= SAVE READ NOTIFICATIONS =================
  const saveReadNotifications = (ids) => {
    try {
      localStorage.setItem('readNotifications', JSON.stringify(ids));
      setReadNotificationIds(ids);
    } catch (error) {
      console.error('Error saving read notifications:', error);
    }
  };

  // ================= MARK NOTIFICATIONS AS READ =================
  const markAsRead = (notificationIds) => {
    const newReadIds = [...new Set([...readNotificationIds, ...notificationIds])];
    saveReadNotifications(newReadIds);
    
    setNotifications(prev => 
      prev.map(n => {
        if (notificationIds.includes(n.id)) {
          return { ...n, isRead: true, read: true };
        }
        return n;
      })
    );
    
    updateStats();
    toast.success(`${notificationIds.length} notification(s) marked as read`);
  };

  const markAsUnread = (notificationIds) => {
    const newReadIds = readNotificationIds.filter(id => !notificationIds.includes(id));
    saveReadNotifications(newReadIds);
    
    setNotifications(prev => 
      prev.map(n => {
        if (notificationIds.includes(n.id)) {
          return { ...n, isRead: false, read: false };
        }
        return n;
      })
    );
    
    updateStats();
    toast.success(`${notificationIds.length} notification(s) marked as unread`);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    markAsRead(allIds);
  };

  // ================= PIN/UNPIN =================
  const togglePin = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, isPinned: !n.isPinned, pinned: !n.pinned };
        }
        return n;
      })
    );
    toast.success('Notification pinned/unpinned');
  };

  // ================= ARCHIVE =================
  const archiveNotification = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => {
        if (n.id === notificationId) {
          return { ...n, isArchived: true, archived: true };
        }
        return n;
      })
    );
    toast.success('Notification archived');
  };

  // ================= DELETE =================
  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setNotificationToDelete(null);
    setShowDeleteConfirm(false);
    toast.success('Notification deleted');
  };

  // ================= BULK ACTIONS =================
  const handleBulkAction = (action) => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select notifications first');
      return;
    }

    switch(action) {
      case 'read':
        markAsRead(selectedNotifications);
        break;
      case 'unread':
        markAsUnread(selectedNotifications);
        break;
      case 'pin':
        selectedNotifications.forEach(id => togglePin(id));
        break;
      case 'archive':
        selectedNotifications.forEach(id => archiveNotification(id));
        break;
      case 'delete':
        setShowBulkActionModal(false);
        selectedNotifications.forEach(id => deleteNotification(id));
        break;
      default:
        break;
    }
    setSelectedNotifications([]);
    setSelectAll(false);
  };

  // ================= SELECT ALL =================
  useEffect(() => {
    if (selectAll) {
      const allIds = filteredNotifications.map(n => n.id);
      setSelectedNotifications(allIds);
    } else {
      setSelectedNotifications([]);
    }
  }, [selectAll, filteredNotifications]);

  // ================= TOGGLE SELECT =================
  const toggleSelect = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [studentsRes, feesRes, teachersRes, marksRes, classesRes] = await Promise.all([
        api.get("/students", config),
        api.get("/fees", config),
        api.get("/teachers", config),
        api.get("/marks", config),
        api.get("/classes", config)
      ]);

      const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const fees = Array.isArray(feesRes.data) ? feesRes.data : [];
      const teachers = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      const marks = Array.isArray(marksRes.data) ? marksRes.data : [];
      const classes = Array.isArray(classesRes.data) ? classesRes.data : [];

      const notificationList = [];

      const formatUGX = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount)) return "UGX 0";
        return new Intl.NumberFormat("en-UG", {
          style: "currency",
          currency: "UGX",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount || 0);
      };

      // Student registrations
      students.forEach(student => {
        const createdAt = student.createdAt || student.created_at || new Date();
        notificationList.push({
          id: `student-${student.id}`,
          type: 'student',
          icon: <UserPlus className="w-5 h-5 text-blue-500" />,
          title: 'New Student Registered',
          message: `${student.fullName || 'Student'} has been registered in ${student.class?.className || 'School'}`,
          time: createdAt,
          timestamp: new Date(createdAt).getTime(),
          isRead: readNotificationIds.includes(`student-${student.id}`),
          read: readNotificationIds.includes(`student-${student.id}`),
          isPinned: false,
          pinned: false,
          isArchived: false,
          archived: false,
          priority: 'medium',
          category: 'academic',
          action: `/secretary/students/${student.id}`,
          actionLabel: 'View Student',
          studentId: student.id,
          details: `Student ID: ${student.studentNumber || 'N/A'}`
        });
      });

      // Fee payments
      fees.forEach(fee => {
        const paid = Number(fee.amountPaid || fee.amount_paid || fee.paid || 0);
        const createdAt = fee.createdAt || fee.created_at || fee.paymentDate || new Date();
        const studentName = fee.student?.fullName || fee.student_name || 'Student';
        
        notificationList.push({
          id: `fee-${fee.id}`,
          type: 'fee',
          icon: <CreditCard className="w-5 h-5 text-purple-500" />,
          title: 'Fee Payment Received',
          message: `${formatUGX(paid)} payment received from ${studentName}`,
          time: createdAt,
          timestamp: new Date(createdAt).getTime(),
          isRead: readNotificationIds.includes(`fee-${fee.id}`),
          read: readNotificationIds.includes(`fee-${fee.id}`),
          isPinned: false,
          pinned: false,
          isArchived: false,
          archived: false,
          priority: 'high',
          category: 'fee',
          action: `/secretary/fees`,
          actionLabel: 'View Payment',
          feeId: fee.id,
          details: `Term: ${fee.term || 'N/A'}`
        });
      });

      // Marks registered
      marks.forEach(mark => {
        const createdAt = mark.createdAt || mark.created_at || new Date();
        const studentName = mark.student?.fullName || mark.student_name || 'Student';
        const subjectName = mark.subject?.subjectName || mark.subject_name || 'Subject';
        const teacherName = mark.teacher?.fullName || mark.teacher_name || 'Teacher';
        const className = mark.student?.class?.className || mark.class_name || 'Class';
        const score = mark.score || mark.marks || 0;
        
        notificationList.push({
          id: `mark-${mark.id}`,
          type: 'marks',
          icon: <GraduationCap className="w-5 h-5 text-green-500" />,
          title: 'Marks Registered',
          message: `${teacherName} registered ${score} marks for ${studentName} in ${subjectName}`,
          time: createdAt,
          timestamp: new Date(createdAt).getTime(),
          isRead: readNotificationIds.includes(`mark-${mark.id}`),
          read: readNotificationIds.includes(`mark-${mark.id}`),
          isPinned: false,
          pinned: false,
          isArchived: false,
          archived: false,
          priority: 'medium',
          category: 'academic',
          action: `/secretary/marks`,
          actionLabel: 'View Marks',
          markId: mark.id,
          details: `Class: ${className}`
        });
      });

      // New teachers
      teachers.forEach(teacher => {
        const createdAt = teacher.createdAt || teacher.created_at || new Date();
        notificationList.push({
          id: `teacher-${teacher.id}`,
          type: 'teacher',
          icon: <Award className="w-5 h-5 text-orange-500" />,
          title: 'New Teacher Joined',
          message: `${teacher.fullName || 'Teacher'} has joined as a teacher`,
          time: createdAt,
          timestamp: new Date(createdAt).getTime(),
          isRead: readNotificationIds.includes(`teacher-${teacher.id}`),
          read: readNotificationIds.includes(`teacher-${teacher.id}`),
          isPinned: false,
          pinned: false,
          isArchived: false,
          archived: false,
          priority: 'low',
          category: 'general',
          action: `/secretary/teachers`,
          actionLabel: 'View Teacher',
          teacherId: teacher.id,
          details: `Subject: ${teacher.subject?.subjectName || 'N/A'}`
        });
      });

      // System notifications
      if (students.length > 50) {
        notificationList.push({
          id: 'system-1',
          type: 'system',
          icon: <Zap className="w-5 h-5 text-emerald-500" />,
          title: 'Student Milestone Achieved',
          message: `🎉 School has reached ${students.length} students! Great job!`,
          time: new Date(),
          timestamp: new Date().getTime(),
          isRead: readNotificationIds.includes('system-1'),
          read: readNotificationIds.includes('system-1'),
          isPinned: true,
          pinned: true,
          isArchived: false,
          archived: false,
          priority: 'high',
          category: 'system',
          action: '/secretary/students',
          actionLabel: 'View Students',
          details: 'Milestone achievement'
        });
      }

      if (fees.length > 10) {
        const totalFees = fees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
        notificationList.push({
          id: 'system-2',
          type: 'system',
          icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
          title: 'Fee Collection Update',
          message: `💰 Total fees collected: ${formatUGX(totalFees)} from ${fees.length} transactions`,
          time: new Date(),
          timestamp: new Date().getTime(),
          isRead: readNotificationIds.includes('system-2'),
          read: readNotificationIds.includes('system-2'),
          isPinned: false,
          pinned: false,
          isArchived: false,
          archived: false,
          priority: 'medium',
          category: 'fee',
          action: '/secretary/fees',
          actionLabel: 'View Report',
          details: 'Fee summary'
        });
      }

      notificationList.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(notificationList);
      updateStats(notificationList);
      setIsLoading(false);

    } catch (error) {
      console.error("Fetch notifications error:", error);
      toast.error('Failed to load notifications');
      setIsLoading(false);
    }
  }, [readNotificationIds]);

  // ================= UPDATE STATS =================
  const updateStats = (notifs = notifications) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: notifs.length,
      unread: notifs.filter(n => !n.isRead).length,
      read: notifs.filter(n => n.isRead).length,
      pinned: notifs.filter(n => n.isPinned).length,
      archived: notifs.filter(n => n.isArchived).length,
      today: notifs.filter(n => new Date(n.time) >= today).length,
      thisWeek: notifs.filter(n => new Date(n.time) >= weekStart).length,
      thisMonth: notifs.filter(n => new Date(n.time) >= monthStart).length
    };
    setStats(stats);
  };

  // ================= FILTER NOTIFICATIONS =================
  useEffect(() => {
    let filtered = [...notifications];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(term) ||
        n.message?.toLowerCase().includes(term) ||
        n.details?.toLowerCase().includes(term)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.category === filterCategory);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }

    if (filterStatus === 'read') {
      filtered = filtered.filter(n => n.isRead);
    } else if (filterStatus === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filterStatus === 'pinned') {
      filtered = filtered.filter(n => n.isPinned);
    } else if (filterStatus === 'archived') {
      filtered = filtered.filter(n => n.isArchived);
    }

    switch(sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'unread_first':
        filtered.sort((a, b) => {
          if (a.isRead && !b.isRead) return 1;
          if (!a.isRead && b.isRead) return -1;
          return b.timestamp - a.timestamp;
        });
        break;
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      default:
        break;
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, searchTerm, filterType, filterCategory, filterPriority, filterStatus, sortBy]);

  // ================= PAGINATION =================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  // ================= GET PRIORITY STYLES =================
  const getPriorityStyles = (priority) => {
    switch(priority) {
      case 'urgent':
        return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Urgent' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'High' };
      case 'medium':
        return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Medium' };
      case 'low':
        return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Low' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Normal' };
    }
  };

  // ================= GET CATEGORY STYLES =================
  const getCategoryStyles = (category) => {
    const categories = {
      general: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Info className="w-3 h-3" /> },
      academic: { bg: 'bg-blue-100', text: 'text-blue-600', icon: <BookOpen className="w-3 h-3" /> },
      fee: { bg: 'bg-green-100', text: 'text-green-600', icon: <DollarSign className="w-3 h-3" /> },
      attendance: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: <Calendar className="w-3 h-3" /> },
      report: { bg: 'bg-purple-100', text: 'text-purple-600', icon: <FileText className="w-3 h-3" /> },
      event: { bg: 'bg-pink-100', text: 'text-pink-600', icon: <CalendarDays className="w-3 h-3" /> },
      system: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: <Zap className="w-3 h-3" /> }
    };
    return categories[category] || categories.general;
  };

  // ================= GET TYPE ICON =================
  const getTypeIcon = (type) => {
    const icons = {
      student: <UserPlus className="w-5 h-5" />,
      fee: <CreditCard className="w-5 h-5" />,
      marks: <GraduationCap className="w-5 h-5" />,
      teacher: <Award className="w-5 h-5" />,
      system: <Zap className="w-5 h-5" />,
      announcement: <Megaphone className="w-5 h-5" />,
      reminder: <Bell className="w-5 h-5" />
    };
    return icons[type] || <Info className="w-5 h-5" />;
  };

  // ================= GET TYPE COLORS =================
  const getTypeColor = (type) => {
    const colors = {
      student: 'text-blue-500 bg-blue-50',
      fee: 'text-purple-500 bg-purple-50',
      marks: 'text-green-500 bg-green-50',
      teacher: 'text-orange-500 bg-orange-50',
      system: 'text-emerald-500 bg-emerald-50',
      announcement: 'text-pink-500 bg-pink-50',
      reminder: 'text-yellow-500 bg-yellow-50'
    };
    return colors[type] || 'text-gray-500 bg-gray-50';
  };

  // ================= FORMAT TIME =================
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

  // ================= FORMAT DATE =================
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-UG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ================= HANDLE NOTIFICATION CLICK =================
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    if (notification.action) {
      navigate(notification.action);
    }
  };

  // ================= INITIAL FETCH =================
  useEffect(() => {
    fetchNotifications();
  }, []);

  // ================= REFRESH =================
  const refreshNotifications = () => {
    fetchNotifications();
    toast.success('Notifications refreshed');
  };

  // ================= RENDER NOTIFICATION ITEM =================
  const renderNotificationItem = (notification) => {
    const priorityStyle = getPriorityStyles(notification.priority);
    const categoryStyle = getCategoryStyles(notification.category);
    const typeColor = getTypeColor(notification.type);
    const isSelected = selectedNotifications.includes(notification.id);

    if (viewMode === 'compact') {
      return (
        <div 
          key={notification.id}
          className={`flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
            !notification.isRead ? 'bg-purple-50/20' : ''
          }`}
          onClick={() => handleNotificationClick(notification)}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(notification.id);
            }}
            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColor}`}>
            {getTypeIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                {notification.title}
              </p>
              {!notification.isRead && (
                <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></span>
              )}
              {notification.isPinned && (
                <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" />
              )}
              <span className={`text-xs px-1.5 py-0.5 rounded ${priorityStyle.bg} ${priorityStyle.text}`}>
                {priorityStyle.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{notification.message}</p>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatTimeAgo(notification.time)}
          </span>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div 
          key={notification.id}
          className={`border rounded-xl p-4 hover:shadow-md transition cursor-pointer ${
            !notification.isRead ? 'border-purple-300 bg-purple-50/10' : 'border-gray-200 bg-white'
          }`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor}`}>
              {getTypeIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                    {notification.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${categoryStyle.bg} ${categoryStyle.text}`}>
                      {notification.category}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${priorityStyle.bg} ${priorityStyle.text}`}>
                      {priorityStyle.label}
                    </span>
                  </div>
                </div>
                {notification.isPinned && (
                  <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-400">{formatTimeAgo(notification.time)}</span>
                {notification.actionLabel && (
                  <span className="text-xs text-purple-600 font-medium">
                    {notification.actionLabel} →
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default: List view
    return (
      <div 
        key={notification.id}
        className={`flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
          !notification.isRead ? 'bg-purple-50/20 border-l-4 border-l-purple-500' : ''
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelect(notification.id);
          }}
          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-2"
        />
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor}`}>
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                  {notification.title}
                </p>
                {!notification.isRead && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse flex-shrink-0"></span>
                )}
                {notification.isPinned && (
                  <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded ${priorityStyle.bg} ${priorityStyle.text}`}>
                  {priorityStyle.label}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${categoryStyle.bg} ${categoryStyle.text}`}>
                  {notification.category}
                </span>
              </div>
              <p className={`text-sm ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'} mt-0.5`}>
                {notification.message}
              </p>
              {notification.details && (
                <p className="text-xs text-gray-400 mt-0.5">{notification.details}</p>
              )}
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(notification.time)}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(notification.time)}
                </span>
                {notification.actionLabel && (
                  <span className="text-xs text-purple-600 font-medium flex items-center gap-1">
                    {notification.actionLabel}
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePin(notification.id);
            }}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition"
            title={notification.isPinned ? 'Unpin' : 'Pin'}
          >
            {notification.isPinned ? 
              <Pin className="w-4 h-4 text-yellow-500" /> : 
              <Pin className="w-4 h-4 text-gray-400" />
            }
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              archiveNotification(notification.id);
            }}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition"
            title="Archive"
          >
            <Archive className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNotificationToDelete(notification.id);
              setShowDeleteConfirm(true);
            }}
            className="p-1.5 hover:bg-red-100 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>
    );
  };

  // ================= LOADING STATE =================
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-7 h-7 text-purple-600" />
            Notification Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with all school activities and alerts
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
          <button
            onClick={refreshNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ================= STATISTICS CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-center">
          <p className="text-xs text-gray-500 font-medium">Total</p>
          <p className="text-xl font-bold text-purple-600">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 shadow-sm text-center">
          <p className="text-xs text-blue-600 font-medium">Unread</p>
          <p className="text-xl font-bold text-blue-700">{stats.unread}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 shadow-sm text-center">
          <p className="text-xs text-green-600 font-medium">Read</p>
          <p className="text-xl font-bold text-green-700">{stats.read}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 shadow-sm text-center">
          <p className="text-xs text-yellow-600 font-medium">Pinned</p>
          <p className="text-xl font-bold text-yellow-700">{stats.pinned}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 shadow-sm text-center">
          <p className="text-xs text-gray-500 font-medium">Archived</p>
          <p className="text-xl font-bold text-gray-600">{stats.archived}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 shadow-sm text-center">
          <p className="text-xs text-emerald-600 font-medium">Today</p>
          <p className="text-xl font-bold text-emerald-700">{stats.today}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 shadow-sm text-center">
          <p className="text-xs text-indigo-600 font-medium">This Week</p>
          <p className="text-xl font-bold text-indigo-700">{stats.thisWeek}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 shadow-sm text-center">
          <p className="text-xs text-purple-600 font-medium">This Month</p>
          <p className="text-xl font-bold text-purple-700">{stats.thisMonth}</p>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
          >
            <option value="all">All Types</option>
            <option value="student">Students</option>
            <option value="fee">Fees</option>
            <option value="marks">Marks</option>
            <option value="teacher">Teachers</option>
            <option value="system">System</option>
            <option value="announcement">Announcements</option>
            <option value="reminder">Reminders</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="academic">Academic</option>
            <option value="fee">Fee</option>
            <option value="attendance">Attendance</option>
            <option value="report">Report</option>
            <option value="event">Event</option>
            <option value="system">System</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="pinned">Pinned</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="unread_first">Unread First</option>
            <option value="priority">Priority</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
              title="List View"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-lg transition ${viewMode === 'compact' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
              title="Compact View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">
              {selectedNotifications.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('read')}
              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition"
            >
              Mark Read
            </button>
            <button
              onClick={() => handleBulkAction('unread')}
              className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm transition"
            >
              Mark Unread
            </button>
            <button
              onClick={() => handleBulkAction('pin')}
              className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm transition"
            >
              Pin
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
            >
              Archive
            </button>
            <button
              onClick={() => {
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition"
            >
              Delete
            </button>
            <button
              onClick={() => {
                setSelectedNotifications([]);
                setSelectAll(false);
              }}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* ================= NOTIFICATIONS LIST ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {currentItems.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No notifications found</p>
                <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              currentItems.map(renderNotificationItem)
            )}
          </div>
        ) : (
          <div>
            {currentItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No notifications found</p>
                <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              currentItems.map(renderNotificationItem)
            )}
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        {filteredNotifications.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredNotifications.length)} of {filteredNotifications.length} notifications
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded-lg text-sm transition ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {showDeleteConfirm && notificationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Notification</h3>
              <p className="text-gray-500 text-sm mb-4">
                Are you sure you want to delete this notification? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setNotificationToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteNotification(notificationToDelete)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= BULK ACTION CONFIRM MODAL ================= */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Selected Notifications</h3>
              <p className="text-gray-500 text-sm mb-4">
                Are you sure you want to delete {selectedNotifications.length} selected notifications? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkActionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;