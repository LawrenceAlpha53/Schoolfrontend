// TeacherNotifications.jsx – WITH ARCHIVE, UNREAD & INBOX FILTERS + FULL BACKEND PERSISTENCE

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell, CheckCircle, XCircle, AlertCircle, Info,
  Calendar, BookOpen, Users, FileText, Clock, Award,
  MessageSquare, Megaphone,
  ChevronDown, ChevronUp, Filter, Search,
  RefreshCw, Loader2,
  CheckCheck, Circle, Clock as ClockIcon,
  ArrowLeft, ArrowRight, ExternalLink, X,
  Pin, PinOff, Archive, ArchiveRestore, Trash2,
  UserPlus, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ---------- HELPERS ----------
const formatTimeAgo = (date) => {
  if (!date) return 'Just now';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-UG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getIconForType = (type, category) => {
  if (category === 'academic') return <BookOpen className="w-5 h-5 text-blue-500" />;
  if (category === 'fee') return <FileText className="w-5 h-5 text-green-500" />;
  if (category === 'attendance') return <Users className="w-5 h-5 text-amber-500" />;
  if (category === 'report') return <FileText className="w-5 h-5 text-purple-500" />;
  switch (type) {
    case 'student': return <UserPlus className="w-5 h-5 text-blue-500" />;
    case 'marks': return <GraduationCap className="w-5 h-5 text-green-500" />;
    case 'teacher': return <Award className="w-5 h-5 text-orange-500" />;
    case 'system': return <MessageSquare className="w-5 h-5 text-emerald-500" />;
    case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
    case 'announcement': return <Megaphone className="w-5 h-5 text-purple-500" />;
    case 'reminder': return <Clock className="w-5 h-5 text-orange-500" />;
    default: return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-700 animate-pulse';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'medium': return 'bg-blue-100 text-blue-700';
    case 'low': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'urgent': return 'Urgent';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Normal';
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const TeacherNotifications = () => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem('teacher_notifications');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [viewMode, setViewMode] = useState('inbox'); // inbox | unread | archived
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // ===== SYNC UNREAD COUNT (only non-archived) =====
  useEffect(() => {
    const count = notifications.filter(n => !n.read && !n.isArchived).length;
    setUnreadCount(count);
  }, [notifications]);

  // Helper for auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // ===== FETCH NOTIFICATIONS =====
  const fetchNotifications = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await api.get('/notifications/my', getAuthHeaders());
      let fetched = response.data.success ? response.data.data || [] : response.data || [];

      const formatted = fetched.map(notif => ({
        id: notif.id || notif._id,
        title: notif.title || 'Notification',
        message: notif.message || '',
        time: notif.createdAt || new Date(),
        type: notif.type || 'info',
        category: notif.category || 'general',
        priority: notif.priority || 'medium',
        read: notif.isRead || notif.read || false,
        icon: getIconForType(notif.type, notif.category),
        action: notif.actionLink || null,
        actionLabel: notif.actionLabel || null,
        metadata: notif.metadata || {},
        isPinned: notif.isPinned || false,
        isArchived: notif.isArchived || false,
      }));

      setNotifications(formatted);
      localStorage.setItem('teacher_notifications', JSON.stringify(formatted));
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load notifications');
      const cached = localStorage.getItem('teacher_notifications');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setNotifications(parsed);
        } catch (e) { /* ignore */ }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ===== STATE UPDATERS (Local Cache + Backend Persistence) =====
  const updateNotifications = (updater) => {
    setNotifications(prev => {
      const newState = updater(prev);
      localStorage.setItem('teacher_notifications', JSON.stringify(newState));
      return newState;
    });
  };

  const markAsRead = async (id) => {
    updateNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.patch(`/notifications/${id}/read`, { isRead: true }, getAuthHeaders());
    } catch (err) {
      console.error('Failed to mark read on server:', err);
    }
  };

  const markAsUnread = async (id) => {
    updateNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
    try {
      await api.patch(`/notifications/${id}/read`, { isRead: false }, getAuthHeaders());
    } catch (err) {
      console.error('Failed to mark unread on server:', err);
    }
  };

  const markAllAsRead = async () => {
    updateNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.patch('/notifications/read-all', {}, getAuthHeaders());
      toast.success('All marked as read');
    } catch (err) {
      console.error('Failed to mark all read on server:', err);
      fetchNotifications(false);
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    updateNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`, getAuthHeaders());
      toast.success('Deleted');
    } catch (err) {
      console.error('Failed to delete on server:', err);
      toast.error('Failed to delete from server');
      fetchNotifications(false);
    }
  };

  const togglePin = async (id) => {
    const target = notifications.find(n => n.id === id);
    if (!target) return;
    const newPinned = !target.isPinned;

    updateNotifications(prev => prev.map(n => n.id === id ? { ...n, isPinned: newPinned } : n));
    try {
      await api.patch(`/notifications/${id}/pin`, { isPinned: newPinned }, getAuthHeaders());
      toast.success(newPinned ? 'Notification pinned' : 'Notification unpinned');
    } catch (err) {
      console.error('Failed to toggle pin on server:', err);
      updateNotifications(prev => prev.map(n => n.id === id ? { ...n, isPinned: target.isPinned } : n));
    }
  };

  const toggleArchive = async (id) => {
    const target = notifications.find(n => n.id === id);
    if (!target) return;
    const newArchivedState = !target.isArchived;

    updateNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: newArchivedState } : n));

    try {
      await api.patch(`/notifications/${id}/archive`, { isArchived: newArchivedState }, getAuthHeaders());
      toast.success(newArchivedState ? 'Notification archived' : 'Notification restored');
    } catch (err) {
      console.error('Archive failed on server:', err);
      updateNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: target.isArchived } : n));
      toast.error('Failed to save archive state to server');
    }
  };

  // ===== BULK ACTIONS =====
  const handleSelectAll = () => {
    if (selectedIds.length === currentPageItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentPageItems.map(n => n.id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (!selectedIds.length) return toast.error('No notifications selected');
    const idsToUpdate = [...selectedIds];

    updateNotifications(prev => prev.map(n => idsToUpdate.includes(n.id) ? { ...n, read: true } : n));
    setSelectedIds([]);

    try {
      await api.patch('/notifications/bulk-read', { ids: idsToUpdate, read: true }, getAuthHeaders());
      toast.success(`${idsToUpdate.length} marked as read`);
    } catch (err) {
      console.error('Bulk read failed on server:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return toast.error('No notifications selected');
    if (!window.confirm(`Delete ${selectedIds.length} notifications?`)) return;

    const idsToDelete = [...selectedIds];
    updateNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
    setSelectedIds([]);

    try {
      await api.post('/notifications/bulk-delete', { ids: idsToDelete }, getAuthHeaders());
      toast.success(`${idsToDelete.length} deleted`);
    } catch (err) {
      console.error('Bulk delete failed on server:', err);
      fetchNotifications(false);
    }
  };

  const handleBulkArchive = async (shouldArchive = true) => {
    if (!selectedIds.length) return toast.error('No notifications selected');
    const idsToUpdate = [...selectedIds];

    updateNotifications(prev => prev.map(n => idsToUpdate.includes(n.id) ? { ...n, isArchived: shouldArchive } : n));
    setSelectedIds([]);

    try {
      await api.patch('/notifications/bulk-archive', { ids: idsToUpdate, isArchived: shouldArchive }, getAuthHeaders());
      toast.success(`${idsToUpdate.length} ${shouldArchive ? 'archived' : 'unarchived'}`);
    } catch (err) {
      console.error('Bulk archive failed on server:', err);
      fetchNotifications(false);
      toast.error('Failed to update archive state on server');
    }
  };

  // ===== FILTERING =====
  const filteredNotifications = useMemo(() => {
    let list = notifications;

    if (viewMode === 'inbox') {
      list = list.filter(n => !n.isArchived);
    } else if (viewMode === 'unread') {
      list = list.filter(n => !n.isArchived && !n.read);
    } else if (viewMode === 'archived') {
      list = list.filter(n => n.isArchived);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(n =>
        n.title?.toLowerCase().includes(term) ||
        n.message?.toLowerCase().includes(term)
      );
    }

    if (filterCategory !== 'all') list = list.filter(n => n.category === filterCategory);
    if (filterPriority !== 'all') list = list.filter(n => n.priority === filterPriority);
    if (filterType !== 'all') list = list.filter(n => n.type === filterType);

    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (sortOrder === 'desc') return new Date(b.time) - new Date(a.time);
      return new Date(a.time) - new Date(b.time);
    });

    return list;
  }, [notifications, viewMode, searchTerm, filterCategory, filterPriority, filterType, sortOrder]);

  const itemsPerPage = 10;
  const totalPagesCalc = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;
  const currentPageItems = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read && !notification.isArchived) {
      markAsRead(notification.id);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-lg font-medium text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 p-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Failed to Load Notifications</h3>
        <p className="text-gray-500 text-center max-w-md">{error}</p>
        <button
          onClick={() => fetchNotifications(true)}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Bell className="w-8 h-8 text-indigo-600" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Manage all your notifications</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium shadow-sm"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            <button
              onClick={() => fetchNotifications(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-600 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition text-sm font-medium shadow-sm ${
                showFilters
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ===== VIEW TABS ===== */}
      <div className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm flex flex-wrap gap-1">
        {[
          { key: 'inbox', label: 'Inbox', icon: Bell, count: notifications.filter(n => !n.isArchived).length },
          { key: 'unread', label: 'Unread', icon: Circle, count: unreadCount },
          { key: 'archived', label: 'Archived', icon: Archive, count: notifications.filter(n => n.isArchived).length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setViewMode(tab.key);
              setPage(1);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              viewMode === tab.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                viewMode === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== FILTERS ===== */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Search</label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="attendance">Attendance</option>
              <option value="report">Report</option>
              <option value="general">General</option>
              <option value="system">System</option>
              <option value="fee">Fee</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="student">Student</option>
              <option value="marks">Marks</option>
              <option value="teacher">Teacher</option>
              <option value="system">System</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="announcement">Announcement</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>
        </div>
      )}

      {/* ===== BULK ACTIONS ===== */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              {selectedIds.length === currentPageItems.length && currentPageItems.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            {selectedIds.length > 0 && (
              <span className="text-sm text-gray-500">{selectedIds.length} selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handleBulkMarkAsRead}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-sm font-medium"
                >
                  <CheckCheck className="w-4 h-4" /> Mark Read
                </button>
                {viewMode === 'archived' ? (
                  <button
                    onClick={() => handleBulkArchive(false)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition text-sm font-medium"
                  >
                    <ArchiveRestore className="w-4 h-4" /> Unarchive
                  </button>
                ) : (
                  <button
                    onClick={() => handleBulkArchive(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                )}
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              {bulkMode ? 'Exit Bulk Mode' : 'Enter Bulk Mode'}
            </button>
          </div>
        </div>
      )}

      {/* ===== NOTIFICATIONS LIST ===== */}
      <div className="space-y-3">
        {currentPageItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">No Notifications</h3>
            <p className="text-gray-500 mt-2">
              {viewMode === 'unread'
                ? 'You have no unread notifications'
                : viewMode === 'archived'
                ? 'No archived notifications'
                : 'You are all caught up!'}
            </p>
          </div>
        ) : (
          currentPageItems.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onMarkAsUnread={markAsUnread}
              onDelete={deleteNotification}
              onTogglePin={togglePin}
              onToggleArchive={toggleArchive}
              onClick={handleNotificationClick}
              bulkMode={bulkMode}
              selected={selectedIds.includes(notification.id)}
              onSelect={(id) => {
                setSelectedIds(prev =>
                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
              }}
              viewMode={viewMode}
            />
          ))
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPagesCalc > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPagesCalc}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPagesCalc, p + 1))}
            disabled={page === totalPagesCalc}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {selectedNotification && (
        <NotificationDetail
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={markAsRead}
          onMarkAsUnread={markAsUnread}
          onDelete={deleteNotification}
          onTogglePin={togglePin}
          onToggleArchive={toggleArchive}
        />
      )}
    </div>
  );
};

// ============================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onClick,
  bulkMode,
  selected,
  onSelect,
  viewMode,
}) => {
  const priorityColor = getPriorityStyles(notification.priority);
  const priorityLabel = getPriorityLabel(notification.priority);

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'academic': return 'bg-blue-100 text-blue-700';
      case 'fee': return 'bg-green-100 text-green-700';
      case 'attendance': return 'bg-amber-100 text-amber-700';
      case 'report': return 'bg-purple-100 text-purple-700';
      case 'general': return 'bg-gray-100 text-gray-700';
      case 'system': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const renderIcon = () => {
    if (notification.icon && React.isValidElement(notification.icon)) {
      return notification.icon;
    }
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const isArchived = notification.isArchived || false;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md cursor-pointer ${
        notification.read && !isArchived
          ? 'border-gray-100'
          : !isArchived
          ? 'border-indigo-200 bg-indigo-50/30'
          : 'border-gray-300 bg-gray-50/50'
      } ${notification.isPinned ? 'border-l-4 border-l-amber-500' : ''}`}
      onClick={() => onClick(notification)}
    >
      <div className="p-4 flex items-start gap-4">
        {bulkMode && (
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(notification.id)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        )}

        <div className="p-2.5 rounded-xl bg-gray-50 flex-shrink-0">
          {renderIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                  {notification.title}
                </h4>
                {notification.isPinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
                {!notification.read && !isArchived && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                )}
                {isArchived && (
                  <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Archived</span>
                )}
              </div>
              <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'} line-clamp-2 mt-1`}>
                {notification.message}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor}`}>
                {priorityLabel}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatTimeAgo(notification.time)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {formatDate(notification.time)}
              </span>
              {notification.category && (
                <span className={`px-2 py-0.5 rounded-full font-medium ${getCategoryColor(notification.category)}`}>
                  {notification.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {notification.action && (
                <button
                  onClick={() => window.location.href = notification.action}
                  className="px-3 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
                >
                  {notification.actionLabel || 'View Action'}
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => onTogglePin(notification.id)}
                className="p-1.5 text-gray-400 hover:text-amber-500 rounded-lg hover:bg-gray-100 transition"
                title={notification.isPinned ? "Unpin" : "Pin"}
              >
                {notification.isPinned ? <PinOff className="w-4 h-4 text-amber-500" /> : <Pin className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onToggleArchive(notification.id)}
                className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-100 transition"
                title={isArchived ? "Unarchive" : "Archive"}
              >
                {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// NOTIFICATION DETAIL MODAL COMPONENT
// ============================================================

const NotificationDetail = ({
  notification,
  onClose,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onTogglePin,
  onToggleArchive
}) => {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-5 relative">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              {getIconForType(notification.type, notification.category)}
            </div>
            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityStyles(notification.priority)}`}>
                {getPriorityLabel(notification.priority)} Priority
              </span>
              <h3 className="text-xl font-bold text-gray-800 mt-1">{notification.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {notification.message}
          </p>
          
          <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between text-xs text-gray-500">
            <span>Sent: {formatDate(notification.time)}</span>
            <span className="capitalize">Category: {notification.category}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                notification.read ? onMarkAsUnread(notification.id) : onMarkAsRead(notification.id);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              {notification.read ? 'Mark Unread' : 'Mark Read'}
            </button>
            <button
              onClick={() => {
                onToggleArchive(notification.id);
                onClose();
              }}
              className="p-2 text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded-xl transition"
              title={notification.isArchived ? "Unarchive" : "Archive"}
            >
              {notification.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                onDelete(notification.id);
                onClose();
              }}
              className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-xl transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {notification.action ? (
            <button
              onClick={() => window.location.href = notification.action}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              {notification.actionLabel || 'Go to Target'}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium text-xs rounded-xl transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherNotifications;