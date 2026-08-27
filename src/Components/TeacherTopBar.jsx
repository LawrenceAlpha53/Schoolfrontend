// TeacherTopbar.jsx – with 24‑hour notification filter
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  CalendarDays,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Sparkles,
  Clock,
  CheckCircle,
  X,
  Loader2,
  FileText,
  Users,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Calendar,
  BellOff,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TeacherTopbar = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const today = new Date();
  const currentDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ---------- 24‑hour filter ----------
  const isRecent = (notification) => {
    if (!notification.time) return true; // fallback
    const time = new Date(notification.time);
    const now = new Date();
    const diffHours = (now - time) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  // ================= GET USER ID =================
  const getUserId = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    return userData.id || null;
  };

  // ================= LOAD CACHED NOTIFICATIONS =================
  useEffect(() => {
    const cached = localStorage.getItem('teacher_notifications');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setNotifications(parsed);
        const recentUnread = parsed.filter(n => isRecent(n) && !n.read).length;
        setUnreadCount(recentUnread);
      } catch (e) {
        console.log('Cache parse error');
      }
    }
  }, []);

  // ================= SAVE NOTIFICATIONS TO CACHE =================
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('teacher_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      try {
        const response = await api.get(`/notifications/my`, config);
        
        if (response.data.success) {
          const notifs = response.data.data || [];
          const formattedNotifs = notifs.map(notif => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            time: notif.createdAt || new Date(),
            type: notif.type || 'info',
            read: notif.isRead || false,
            icon: getNotificationIcon(notif.type, notif.category),
            actionLink: notif.actionLink || null,
            actionLabel: notif.actionLabel || null,
            metadata: notif.metadata || {}
          }));
          setNotifications(formattedNotifs);
          const recentUnread = formattedNotifs.filter(n => isRecent(n) && !n.read).length;
          setUnreadCount(recentUnread);
          localStorage.setItem('teacher_notifications', JSON.stringify(formattedNotifs));
        } else {
          // fallback to cached/mock
          if (notifications.length === 0) {
            const cached = localStorage.getItem('teacher_notifications');
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                setNotifications(parsed);
                const recentUnread = parsed.filter(n => isRecent(n) && !n.read).length;
                setUnreadCount(recentUnread);
              } catch (e) {
                const mockNotifs = getMockNotifications();
                setNotifications(mockNotifs);
                const recentUnread = mockNotifs.filter(n => isRecent(n) && !n.read).length;
                setUnreadCount(recentUnread);
              }
            } else {
              const mockNotifs = getMockNotifications();
              setNotifications(mockNotifs);
              const recentUnread = mockNotifs.filter(n => isRecent(n) && !n.read).length;
              setUnreadCount(recentUnread);
              localStorage.setItem('teacher_notifications', JSON.stringify(mockNotifs));
            }
          }
        }
      } catch (error) {
        console.log('⚠️ API error, using cached/mock:', error.message);
        if (notifications.length === 0) {
          const cached = localStorage.getItem('teacher_notifications');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setNotifications(parsed);
              const recentUnread = parsed.filter(n => isRecent(n) && !n.read).length;
              setUnreadCount(recentUnread);
            } catch (e) {
              const mockNotifs = getMockNotifications();
              setNotifications(mockNotifs);
              const recentUnread = mockNotifs.filter(n => isRecent(n) && !n.read).length;
              setUnreadCount(recentUnread);
            }
          } else {
            const mockNotifs = getMockNotifications();
            setNotifications(mockNotifs);
            const recentUnread = mockNotifs.filter(n => isRecent(n) && !n.read).length;
            setUnreadCount(recentUnread);
            localStorage.setItem('teacher_notifications', JSON.stringify(mockNotifs));
          }
        }
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      if (notifications.length === 0) {
        const cached = localStorage.getItem('teacher_notifications');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setNotifications(parsed);
            const recentUnread = parsed.filter(n => isRecent(n) && !n.read).length;
            setUnreadCount(recentUnread);
          } catch (e) {
            const mockNotifs = getMockNotifications();
            setNotifications(mockNotifs);
            const recentUnread = mockNotifs.filter(n => isRecent(n) && !n.read).length;
            setUnreadCount(recentUnread);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ================= INITIAL FETCH =================
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // ================= MOCK NOTIFICATIONS =================
  const getMockNotifications = () => {
    return [
      {
        id: 'mock-1',
        title: '👋 Welcome to Teacher Portal',
        message: 'Check your timetable for upcoming classes',
        time: new Date().toISOString(),
        type: 'info',
        read: false,
        icon: 'sparkles',
        actionLink: null,
        actionLabel: null,
        metadata: {}
      }
    ];
  };

  // ================= GET NOTIFICATION ICON =================
  const getNotificationIcon = (type, category) => {
    const icons = {
      'info': <Sparkles className="w-4 h-4 text-blue-500" />,
      'success': <CheckCircle className="w-4 h-4 text-green-500" />,
      'warning': <Clock className="w-4 h-4 text-yellow-500" />,
      'error': <X className="w-4 h-4 text-red-500" />,
      'announcement': <Bell className="w-4 h-4 text-purple-500" />,
      'reminder': <Calendar className="w-4 h-4 text-orange-500" />
    };
    
    if (category === 'academic') return <BookOpen className="w-4 h-4 text-blue-500" />;
    if (category === 'fee') return <FileText className="w-4 h-4 text-green-500" />;
    if (category === 'attendance') return <BookOpen className="w-4 h-4 text-purple-500" />;
    
    return icons[type] || <Bell className="w-4 h-4 text-gray-500" />;
  };

  // ================= MARK AS READ =================
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      await api.put(`/notifications/read/${notificationId}`, {}, config);
      
      setNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        localStorage.setItem('teacher_notifications', JSON.stringify(updated));
        return updated;
      });
      // Update recent unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        localStorage.setItem('teacher_notifications', JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // ================= MARK ALL AS READ =================
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      await api.put(`/notifications/read-all`, {}, config);
      
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem('teacher_notifications', JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem('teacher_notifications', JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    }
  };

  // ================= HANDLE NOTIFICATION CLICK =================
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    setShowNotifications(false);
    
    if (notification.actionLink) {
      navigate(notification.actionLink);
    } else if (notification.metadata?.timetableId) {
      navigate('/teacher/timetable');
    }
  };

  // ================= FILTER NOTIFICATIONS (recent + search) =================
  const recentNotifications = notifications.filter(isRecent);
  const filteredNotifications = recentNotifications.filter(notif => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return notif.title.toLowerCase().includes(term) || 
           notif.message.toLowerCase().includes(term);
  });

  // ================= HANDLE LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('teacher_notifications');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // ================= CLICK OUTSIDE HANDLER =================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ================= FORMAT TIME =================
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

  // ================= RENDER =================
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm relative z-40">
      {/* LEFT – unchanged */}
      <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base lg:text-lg font-bold text-gray-800 truncate">Teacher Portal</h1>
            <p className="text-xs text-gray-500 truncate">Welcome back, {user.Fname || 'Teacher'}</p>
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-2 text-slate-500 whitespace-nowrap ml-2">
          <CalendarDays size={16} />
          <span className="text-xs">{currentDate}</span>
        </div>
      </div>

      {/* Mobile Logo */}
      <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-800 truncate max-w-[100px]">Teacher Portal</span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
        {/* SEARCH */}
        <div className="hidden lg:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-36 xl:w-48 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-white relative z-0"
          />
        </div>

        {/* Mobile Search */}
        <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition">
          <Search className="w-5 h-5 text-gray-500" />
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 lg:p-3 rounded-xl hover:bg-slate-100 transition"
          >
            <Bell size={20} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] lg:min-w-[20px] lg:h-5 rounded-full bg-red-500 text-white text-[10px] lg:text-xs flex items-center justify-center font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[90vw] max-w-[400px] sm:w-[380px] md:w-[420px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-2 min-w-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">Recent Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                    >
                      Mark all read
                    </button>
                  )}
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search within notifications */}
              <div className="p-2 sm:p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[50vh] sm:max-h-[340px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? (
                      <>
                        <Search className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No recent notifications match "{searchTerm}"</p>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No recent notifications</p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const isTimetableAssignment = notif.title.includes('Timetable') || 
                                                   notif.title.includes('Assignment') ||
                                                   notif.metadata?.timetableId;
                    
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-start gap-3 p-3 sm:p-4 border-b border-gray-100 cursor-pointer transition ${
                          !notif.read 
                            ? 'bg-purple-50/50 border-l-4 border-l-purple-500 hover:bg-purple-100/50' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50">
                          {isTimetableAssignment ? (
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                          ) : (
                            notif.icon
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-600'} break-words`}>
                            {notif.title}
                          </p>
                          <p className={`text-xs sm:text-sm ${!notif.read ? 'text-gray-700' : 'text-gray-500'} mt-0.5 line-clamp-2 break-words`}>
                            {notif.message}
                          </p>
                          {isTimetableAssignment && notif.metadata && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-gray-500">
                              {notif.metadata.dayOfWeek && (
                                <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                  <Calendar className="w-3 h-3" />
                                  {notif.metadata.dayOfWeek}
                                </span>
                              )}
                              {notif.metadata.startTime && notif.metadata.endTime && (
                                <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                  <Clock className="w-3 h-3" />
                                  {notif.metadata.startTime} - {notif.metadata.endTime}
                                </span>
                              )}
                              {notif.metadata.room && (
                                <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                  <MapPin className="w-3 h-3" />
                                  {notif.metadata.room}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(notif.time)}
                            </span>
                            {notif.actionLabel && (
                              <span className="text-[10px] sm:text-xs text-purple-600 font-medium">
                                {notif.actionLabel}
                              </span>
                            )}
                          </div>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer: View All link */}
              <div className="border-t border-gray-200 p-2 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/teacher/notifications');
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1 w-full py-1.5 hover:bg-purple-50 rounded-lg transition"
                >
                  View all notifications <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile (unchanged) */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 lg:gap-3 border-l pl-3 lg:pl-4 cursor-pointer whitespace-nowrap"
          >
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md text-sm lg:text-base">
              {user.Fname?.charAt(0) || 'T'}
            </div>
            <div className="hidden md:block">
              <h4 className="text-xs lg:text-sm font-semibold text-gray-800 truncate max-w-[80px]">
                {user.Fname || 'Teacher'}
              </h4>
              <p className="text-[10px] lg:text-xs text-slate-500">Teacher</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <p className="font-semibold text-gray-800 text-sm truncate">{user.Fname} {user.Lname}</p>
                <p className="text-xs text-gray-500 truncate">{user.Email}</p>
              </div>
              <div className="py-1 max-h-[70vh] overflow-y-auto">
                {[
                  { icon: <LayoutGrid className="w-4 h-4" />, label: 'Dashboard', path: '/teacher/dashboard' },
                  { icon: <BookOpen className="w-4 h-4" />, label: 'My Classes', path: '/teacher/myclass' },
                  { icon: <Users className="w-4 h-4" />, label: 'My Students', path: '/teacher/students' },
                  { icon: <FileText className="w-4 h-4" />, label: 'Marks Entry', path: '/teacher/marks-entry' },
                  { icon: <Calendar className="w-4 h-4" />, label: 'My Timetable', path: '/teacher/timetable' },
                  { divider: true },
                  { icon: <Settings className="w-4 h-4" />, label: 'Settings', path: '/teacher/settings' },
                  { icon: <LogOut className="w-4 h-4" />, label: 'Logout', path: 'logout', isLogout: true }
                ].map((item, idx) => {
                  if (item.divider) {
                    return <div key={idx} className="border-t border-gray-200 my-1"></div>;
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (item.isLogout) {
                          handleLogout();
                        } else {
                          navigate(item.path);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition ${
                        item.isLogout 
                          ? 'text-red-600 hover:bg-red-50' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TeacherTopbar;