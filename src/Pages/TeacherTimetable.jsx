// TeacherTimetable.jsx – Complete, Professional, Fully Connected
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays, BookOpen, MapPin, School, Clock, Bell, CheckCircle,
  RefreshCw, Printer, User, ChevronDown, ChevronUp, X, Info,
  AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const TeacherTimetable = () => {
  // ================= STATE =================
  const [isLoading, setIsLoading] = useState(true);
  const [timetable, setTimetable] = useState({});
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // ================= FETCH TEACHER DATA =================
  const fetchTeacherData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const teacherRes = await api.get('/teachers/me', config);
      const teacher = teacherRes.data?.data || teacherRes.data;
      if (!teacher?.id) throw new Error('Teacher profile not found');

      setTeacherInfo(teacher);
      return teacher;
    } catch (error) {
      setFetchError(error.message || 'Failed to load teacher data');
      toast.error('Could not identify teacher');
      return null;
    }
  }, []);

  // ================= FETCH TIMETABLE =================
  const fetchTimetable = useCallback(async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get(`/timetables/teacher/${teacherId}`, config);

      if (res.data?.success) {
        setTimetable(res.data.data || {});
        // Extract subjects taught
        const subjects = new Set();
        Object.values(res.data.data || {}).forEach(dayArr => {
          (dayArr || []).forEach(entry => {
            if (entry.subject) subjects.add(entry.subject);
          });
        });
        setTeacherSubjects(Array.from(subjects));
      } else {
        setTimetable({});
        setTeacherSubjects([]);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setTimetable({});
        toast('No timetable assigned yet', { icon: '📅' });
      } else {
        toast.error('Failed to load timetable');
      }
    }
  }, []);

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = useCallback(async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get(`/timetables/notifications/${teacherId}`, config);
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch (error) {
      // Notifications are optional – fail silently
      setNotifications([]);
    }
  }, []);

  // ================= MARK ALL NOTIFICATIONS READ =================
  const markAllRead = useCallback(async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.put(`/timetables/notifications/read-all/${teacherId}`, {}, config);
      setNotifications([]);
      toast.success('All notifications read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  }, []);

  // ================= INITIAL LOAD =================
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    const teacher = await fetchTeacherData();
    if (teacher) {
      await Promise.all([
        fetchTimetable(teacher.id),
        fetchNotifications(teacher.id),
      ]);
    }
    setIsLoading(false);
  }, [fetchTeacherData, fetchTimetable, fetchNotifications]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ================= COMPUTED DATA =================
  const totalWeeklyClasses = useMemo(() => {
    return Object.values(timetable).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }, [timetable]);

  const todayName = useMemo(() => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[today.getDay()];
  }, []);

  const unreadCount = notifications.length;

  // ================= LOADING / ERROR =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-500">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (fetchError && !teacherInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <p className="text-lg font-medium text-gray-700">{fetchError}</p>
        <button onClick={loadAll} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
          Retry
        </button>
      </div>
    );
  }

  const hasAnyClasses = totalWeeklyClasses > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-6 space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-indigo-600" />
            My Timetable
          </h1>
          {teacherInfo && (
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                {teacherInfo.fullName || teacherInfo.name || 'Teacher'}
              </span>
              {teacherSubjects.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                  {teacherSubjects.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-400">No new notifications</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-3 hover:bg-gray-50 rounded-xl transition">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 border-t">
                    <button
                      onClick={() => markAllRead(teacherInfo?.id)}
                      className="w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition text-sm font-medium text-gray-700"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={loadAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition text-sm font-medium text-gray-700"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* ========== SUMMARY CARDS ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase">Today's Schedule</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {timetable[todayName]?.length || 0}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase">Weekly Classes</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalWeeklyClasses}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase">Subjects</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{teacherSubjects.length}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase">Term</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {timetable[Object.keys(timetable)[0]]?.[0]?.term || 'N/A'}
          </p>
        </div>
      </div>

      {/* ========== WEEKLY SCHEDULE ========== */}
      {!hasAnyClasses ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/30 shadow-xl">
          <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No timetable assigned</h2>
          <p className="text-gray-400 mt-2">
            You haven't been assigned any classes yet. You will be notified when the secretary assigns you a class.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map(day => {
            const dayClasses = timetable[day] || [];
            if (dayClasses.length === 0) return null;
            const isExpanded = expandedDay === day;

            return (
              <div key={day} className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl overflow-hidden">
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : day)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${day === todayName ? 'text-indigo-600' : 'text-gray-700'}`}>
                      {day}
                      {day === todayName && <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Today</span>}
                    </span>
                    <span className="text-sm text-gray-500">{dayClasses.length} lessons</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-3">
                    {dayClasses
                      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                      .map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition"
                        >
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="font-mono text-sm font-semibold text-gray-800">
                              {entry.startTime?.slice(0,5) || '--:--'} – {entry.endTime?.slice(0,5) || '--:--'}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-gray-800">{entry.subject}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <School className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">{entry.class}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-gray-600">{entry.room || 'No room'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========== TERM INFO ========== */}
      {totalWeeklyClasses > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow text-center text-sm text-gray-500">
          {timetable[Object.keys(timetable)[0]]?.[0]?.term} • Academic Year {timetable[Object.keys(timetable)[0]]?.[0]?.academicYear}
        </div>
      )}
    </div>
  );
};

export default TeacherTimetable;