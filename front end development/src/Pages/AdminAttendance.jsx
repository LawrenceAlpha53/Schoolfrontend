// AdminAttendance.jsx – STUDENT HISTORY MODAL ADDED, DATE FILTERING, FULL TRACKING
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle,
  Search, RefreshCw, Download, Printer, ChevronLeft, ChevronRight,
  Loader2, BarChart3, User, UserCheck, Eye, Brain, Lightbulb, X, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// Helper to safely extract array from student/class responses
const extractArray = (res) => {
  if (!res || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

const AdminAttendance = () => {
  // ================= COMMON STATE =================
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [activeTab, setActiveTab] = useState('students');

  // ================= STUDENT ATTENDANCE STATE =================
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0, attendanceRate: 0 });
  const [termSummary, setTermSummary] = useState([]);
  const [chartTerm, setChartTerm] = useState('Term 1');
  const [chartYear, setChartYear] = useState(new Date().getFullYear().toString());

  // ================= TEACHER ATTENDANCE STATE =================
  const [teacherDate, setTeacherDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherFilterId, setTeacherFilterId] = useState('');
  const [teacherAttendanceList, setTeacherAttendanceList] = useState([]);
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [teacherStats, setTeacherStats] = useState({
    signedIn: 0, signedOut: 0, absent: 0, total: 0,
    totalAllowance: 0, totalHours: 0, earlyBirds: [], allProcessed: false
  });
  const [expectedCheckInTime, setExpectedCheckInTime] = useState('07:00');

  // History modal (teacher)
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTeacherId, setHistoryTeacherId] = useState('');
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // ================= STUDENT HISTORY MODAL STATE =================
  const [showStudentHistory, setShowStudentHistory] = useState(false);
  const [studentHistoryId, setStudentHistoryId] = useState('');
  const [studentHistoryRecords, setStudentHistoryRecords] = useState([]);
  const [studentHistoryStart, setStudentHistoryStart] = useState('');
  const [studentHistoryEnd, setStudentHistoryEnd] = useState('');
  const [studentHistoryLoading, setStudentHistoryLoading] = useState(false);
  const [studentHistoryName, setStudentHistoryName] = useState('');

  // ================= FETCH BASE DATA =================
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [classesRes, teachersRes] = await Promise.all([
          api.get('/classes'),
          api.get('/teachers')
        ]);
        setClasses(extractArray(classesRes));
        setTeachers(extractArray(teachersRes));
      } catch (err) {
        console.error('Failed to load base data', err);
      }
    };
    fetchBaseData();
  }, []);

  // ================= STUDENT DATA FETCHING (FIXED) =================
  const fetchStudentAttendance = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;
    setLoadingStudent(true);
    try {
      // 1. Fetch all students of the class
      const studentsRes = await api.get(`/students?classId=${selectedClass}`);
      const classRoster = extractArray(studentsRes);
      setStudents(classRoster);

      // 2. Fetch attendance records (merged – contains every student with status)
      let mergedRecords = [];
      try {
        const attRes = await api.get(`/attendance/class/${selectedClass}/date/${selectedDate}`);
        const data = attRes.data?.data || attRes.data || {};
        if (data.records && Array.isArray(data.records)) {
          mergedRecords = data.records;
        } else if (Array.isArray(data)) {
          mergedRecords = data;
        }
      } catch (attErr) {
        console.warn('Attendance fetch failed – showing all as not marked:', attErr.message);
      }
      setAttendanceRecords(mergedRecords);

      // 3. Calculate stats from merged records
      const present = mergedRecords.filter(r => r.status === 'present').length;
      const absent  = mergedRecords.filter(r => r.status === 'absent').length;
      const late    = mergedRecords.filter(r => r.status === 'late').length;
      const excused = mergedRecords.filter(r => r.status === 'excused').length;
      const total   = classRoster.length;
      const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      setStats({ present, absent, late, excused, total, attendanceRate: rate });
    } catch (error) {
      console.error('Fetch student data error:', error);
      toast.error('Failed to load student roster');
    } finally {
      setLoadingStudent(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (selectedClass && activeTab === 'students') {
      fetchStudentAttendance();
    }
  }, [selectedClass, selectedDate, activeTab, fetchStudentAttendance]);

  const fetchTermSummary = async () => {
    try {
      const res = await api.get(`/attendance/term-summary?term=${chartTerm}&academicYear=${chartYear}`);
      setTermSummary(res.data?.data || []);
    } catch (err) {
      console.error('Term summary error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') fetchTermSummary();
  }, [chartTerm, chartYear, activeTab]);

  // ================= TEACHER DATA =================
  const fetchTeacherAttendance = useCallback(async () => {
    setLoadingTeacher(true);
    try {
      const params = { date: teacherDate };
      if (teacherFilterId) params.teacherId = teacherFilterId;
      const res = await api.get('/teacher-attendance', { params });
      const list = res.data?.data || [];
      setTeacherAttendanceList(Array.isArray(list) ? list : []);

      const lower = (s) => (s || '').toLowerCase();
      const signedIn = list.filter(a => a.checkInTime).length;
      const signedOut = list.filter(a => lower(a.status) === 'signed_out').length;
      const absent = list.filter(a => lower(a.status) === 'absent').length;
      const total = list.length;
      let totalAllowance = 0, totalHours = 0;
      const expected = new Date(`${teacherDate}T${expectedCheckInTime}:00`);
      const earlyBirds = [];

      list.forEach(record => {
        if (record.allowance) totalAllowance += parseFloat(record.allowance);
        if (record.hoursWorked) totalHours += parseFloat(record.hoursWorked);
        if (record.checkInTime) {
          const ci = new Date(`${teacherDate}T${record.checkInTime}`);
          if (ci < expected) {
            earlyBirds.push({
              id: record.teacherId,
              name: teachers.find(t => t.id === record.teacherId)?.fullName || 'Unknown',
              checkInTime: record.checkInTime,
              earlyByMins: Math.round((expected - ci) / 60000)
            });
          }
        }
      });

      const allProcessed = teachers.length > 0 && teachers.every(teacher => {
        const record = list.find(r => r.teacherId === teacher.id);
        return record && lower(record.status) === 'signed_out' && parseFloat(record.allowance) > 0;
      });

      setTeacherStats({
        signedIn, signedOut, absent, total, totalAllowance,
        totalHours: Math.round(totalHours * 10) / 10,
        earlyBirds: earlyBirds.sort((a, b) => b.earlyByMins - a.earlyByMins).slice(0, 5),
        allProcessed
      });
    } catch (err) {
      console.error('Teacher fetch error:', err);
      toast.error('Failed to load teacher attendance');
    } finally {
      setLoadingTeacher(false);
    }
  }, [teacherDate, teacherFilterId, expectedCheckInTime, teachers]);

  useEffect(() => {
    if (activeTab === 'teachers' && teachers.length > 0) fetchTeacherAttendance();
  }, [activeTab, teachers.length, fetchTeacherAttendance]);

  useEffect(() => {
    if (activeTab !== 'teachers') return;
    const interval = setInterval(() => fetchTeacherAttendance(), 30000);
    return () => clearInterval(interval);
  }, [activeTab, fetchTeacherAttendance]);

  // ================= AUTO‑RESET DATES AT 5 AM =================
  useEffect(() => {
    const checkNewDay = () => {
      const now = new Date();
      if (now.getHours() >= 5) {
        const todayStr = now.toISOString().split('T')[0];
        if (selectedDate !== todayStr) setSelectedDate(todayStr);
        if (teacherDate !== todayStr) setTeacherDate(todayStr);
      }
    };
    checkNewDay();
    const timer = setInterval(checkNewDay, 60000);
    return () => clearInterval(timer);
  }, [selectedDate, teacherDate]);

  // ================= STUDENT HISTORY =================
  const openStudentHistory = (student) => {
    setStudentHistoryId(student.id);
    setStudentHistoryName(student.fullName || student.name);
    setStudentHistoryRecords([]);
    setStudentHistoryStart('');
    setStudentHistoryEnd('');
    setShowStudentHistory(true);
    fetchStudentHistory(student.id);
  };

  const fetchStudentHistory = async (studentId = studentHistoryId) => {
    if (!studentId) return;
    setStudentHistoryLoading(true);
    try {
      const params = {};
      if (studentHistoryStart && studentHistoryEnd) {
        params.startDate = studentHistoryStart;
        params.endDate = studentHistoryEnd;
      }
      const res = await api.get(`/attendance/student/${studentId}`, { params });
      const data = res.data?.data || res.data || {};
      setStudentHistoryRecords(data.attendance || []);
    } catch (err) {
      toast.error('Failed to load student history');
    } finally {
      setStudentHistoryLoading(false);
    }
  };

  const printStudentHistory = () => {
    const win = window.open('', '_blank');
    const html = `
      <html>
        <head><title>History - ${studentHistoryName}</title></head>
        <body>
          <h2>Attendance History for ${studentHistoryName}</h2>
          <table border="1" cellpadding="5">
            <tr><th>Date</th><th>Status</th><th>Term</th><th>Year</th></tr>
            ${studentHistoryRecords.map(r => `
              <tr>
                <td>${r.date}</td>
                <td>${r.status}</td>
                <td>${r.term || '—'}</td>
                <td>${r.academicYear || '—'}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  // ================= TEACHER HISTORY =================
  const fetchTeacherHistory = async (teacherId = historyTeacherId) => {
    if (!teacherId) return;
    setHistoryLoading(true);
    try {
      const params = {};
      if (historyStartDate && historyEndDate) {
        params.startDate = historyStartDate;
        params.endDate = historyEndDate;
      }
      const res = await api.get(`/teacher-attendance/teacher/${teacherId}`, { params });
      setHistoryRecords(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load teacher history');
    } finally { setHistoryLoading(false); }
  };

  const openHistoryModal = (teacherId) => {
    setHistoryTeacherId(teacherId);
    setHistoryRecords([]);
    setHistoryStartDate(''); setHistoryEndDate('');
    setShowHistoryModal(true);
    fetchTeacherHistory(teacherId);
  };

  // ================= EXPORT =================
  const exportStudentCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = 'Student Number,Full Name,Status\n';
    const rows = filteredStudents.map(s => {
      const rec = attendanceRecords.find(r => (r.student?.id || r.studentId) === s.id);
      return `${s.studentNumber},${s.fullName},${rec?.status || 'Not Marked'}`;
    });
    const blob = new Blob([headers, ...rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `student_attendance_${selectedDate}.csv`; a.click();
  };

  const exportTeacherCSV = () => {
    if (teacherAttendanceList.length === 0) return;
    const headers = 'Teacher Name,Phone,Status,Check In,Check Out,Hours Worked,Allowance,Remarks\n';
    const rows = teacherAttendanceList.map(t => {
      const teacher = teachers.find(tec => tec.id === t.teacherId) || t.teacher || {};
      return `${teacher.fullName || ''},${teacher.phoneNumber || ''},${t.status},${t.checkInTime || ''},${t.checkOutTime || ''},${t.hoursWorked || ''},${t.allowance || ''},${t.notes || ''}`;
    });
    const blob = new Blob([headers, ...rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `teacher_attendance_${teacherDate}.csv`; a.click();
  };

  // ================= HELPERS =================
  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    const colors = {
      present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700', excused: 'bg-blue-100 text-blue-700',
      signed_in: 'bg-green-100 text-green-700', signed_out: 'bg-gray-100 text-gray-700',
      not_marked: 'bg-gray-100 text-gray-400'
    };
    return colors[s] || 'bg-gray-100 text-gray-400';
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    const labels = {
      present: 'Present', absent: 'Absent', late: 'Late', excused: 'Excused',
      signed_in: 'Signed In', signed_out: 'Signed Out', not_marked: 'Not Marked'
    };
    return labels[s] || status;
  };

  // ================= STUDENT FILTERING =================
  const filteredStudents = useMemo(() => {
    let list = [...students];
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(s => (s.fullName || '').toLowerCase().includes(q) || (s.studentNumber || '').toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') {
      list = list.filter(s => {
        const rec = attendanceRecords.find(r => (r.student?.id || r.studentId) === s.id);
        return (rec?.status || 'not_marked').toLowerCase() === filterStatus.toLowerCase();
      });
    }
    if (sortBy === 'name') list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    else if (sortBy === 'number') list.sort((a, b) => (a.studentNumber || '').localeCompare(b.studentNumber || ''));
    return list;
  }, [students, studentSearch, filterStatus, sortBy, attendanceRecords]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // ================= RENDER =================
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-purple-600" />
            Attendance Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor student and staff attendance across all terms</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => activeTab === 'students' ? exportStudentCSV() : exportTeacherCSV()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 mb-6">
        <div className="flex gap-1">
          <button onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'students' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Users className="w-4 h-4" /> Students
          </button>
          <button onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'teachers' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'}`}>
            <UserCheck className="w-4 h-4" /> Teachers
          </button>
        </div>
      </div>

      {/* ================= STUDENT TAB ================= */}
      {activeTab === 'students' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Class</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm shadow-sm" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500 block mb-1 font-medium">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name or admission number..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm">
                  <option value="all">All</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                  <option value="not_marked">Not Marked</option>
                </select>
              </div>
              <button onClick={fetchStudentAttendance}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                <RefreshCw className="w-4 h-4" /> Load
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-purple-700">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm text-center">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Present</p>
              <p className="text-2xl font-bold text-green-700">{stats.present}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 shadow-sm text-center">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Absent</p>
              <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm text-center">
              <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Late</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 shadow-sm text-center">
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Rate</p>
              <p className="text-2xl font-bold text-indigo-700">{stats.attendanceRate?.toFixed(1)}%</p>
            </div>
          </div>

          {/* Students Table with History Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admission No.</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingStudent ? (
                    <tr><td colSpan="5" className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></td></tr>
                  ) : currentStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No students found</p>
                        <p className="text-sm mt-1">Select a class and click Load to view the roster</p>
                      </td>
                    </tr>
                  ) : (
                    currentStudents.map((student, idx) => {
                      const rec = attendanceRecords.find(r => (r.student?.id || r.studentId) === student.id);
                      const status = (rec?.status || 'not_marked').toLowerCase();
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm text-gray-600">{indexOfFirst + idx + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase">
                                {student.fullName?.charAt(0)}
                              </div>
                              <span className="font-medium text-sm text-gray-800">{student.fullName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{student.studentNumber}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                              {status === 'present' && <CheckCircle className="w-3.5 h-3.5" />}
                              {status === 'absent' && <XCircle className="w-3.5 h-3.5" />}
                              {status === 'late' && <Clock className="w-3.5 h-3.5" />}
                              {status === 'excused' && <AlertCircle className="w-3.5 h-3.5" />}
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => openStudentHistory(student)}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs font-medium flex items-center gap-1 mx-auto"
                            >
                              <History className="w-4 h-4" /> History
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredStudents.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredStudents.length)} of {filteredStudents.length}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 border rounded text-sm ${currentPage === i + 1 ? 'bg-purple-600 text-white border-purple-600' : 'hover:bg-gray-100'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Term Summary Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Term Attendance Summary
              </h3>
              <div className="flex items-center gap-2">
                <select value={chartTerm} onChange={e => setChartTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm">
                  <option>Term 1</option>
                  <option>Term 2</option>
                  <option>Term 3</option>
                </select>
                <input type="text" value={chartYear} onChange={e => setChartYear(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm" />
                <button onClick={fetchTermSummary}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition">
                  <RefreshCw className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
            {termSummary.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No attendance data for the selected term/year.</p>
            ) : (
              <div className="space-y-3">
                {termSummary.map(item => {
                  const maxVal = Math.max(item.total, 1);
                  return (
                    <div key={item.className} className="flex items-center gap-3">
                      <span className="w-24 text-sm font-medium text-gray-700 truncate">{item.className}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden flex">
                        {item.present > 0 && (
                          <div style={{ width: `${(item.present / maxVal) * 100}%` }}
                            className="bg-green-400 h-full flex items-center justify-center text-[10px] text-white font-medium"
                            title={`Present: ${item.present}`}>
                            {item.present}
                          </div>
                        )}
                        {item.late > 0 && (
                          <div style={{ width: `${(item.late / maxVal) * 100}%` }}
                            className="bg-yellow-400 h-full flex items-center justify-center text-[10px] text-white font-medium"
                            title={`Late: ${item.late}`}>
                            {item.late}
                          </div>
                        )}
                        {item.absent > 0 && (
                          <div style={{ width: `${(item.absent / maxVal) * 100}%` }}
                            className="bg-red-400 h-full flex items-center justify-center text-[10px] text-white font-medium"
                            title={`Absent: ${item.absent}`}>
                            {item.absent}
                          </div>
                        )}
                        {item.excused > 0 && (
                          <div style={{ width: `${(item.excused / maxVal) * 100}%` }}
                            className="bg-blue-400 h-full flex items-center justify-center text-[10px] text-white font-medium"
                            title={`Excused: ${item.excused}`}>
                            {item.excused}
                          </div>
                        )}
                      </div>
                      <span className="w-12 text-sm font-semibold text-right">{item.attendanceRate}%</span>
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded-full" /> Present</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded-full" /> Late</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded-full" /> Absent</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded-full" /> Excused</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= TEACHER TAB ================= */}
      {activeTab === 'teachers' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Date</label>
                <input type="date" value={teacherDate} onChange={e => setTeacherDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm shadow-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Teacher</label>
                <select value={teacherFilterId} onChange={e => setTeacherFilterId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm">
                  <option value="">All Teachers</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-medium">Expected Arrival</label>
                <input type="time" value={expectedCheckInTime} onChange={e => setExpectedCheckInTime(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm shadow-sm" />
              </div>
              <button onClick={fetchTeacherAttendance}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                <RefreshCw className="w-4 h-4" /> Load
              </button>
            </div>
          </div>

          {/* AI Summary Panel */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-indigo-800 flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" /> AI Attendance Insight
                </h2>
                {teacherStats.total === 0 ? (
                  <p className="text-sm text-indigo-600">No teacher data for today yet. Please load attendance records.</p>
                ) : (
                  <div className="space-y-2 text-sm text-indigo-700">
                    <p>
                      Today, <strong>{teacherStats.signedIn}</strong> out of <strong>{teacherStats.total}</strong> teachers signed in.
                      {teacherStats.signedOut > 0 && ` ${teacherStats.signedOut} have already signed out.`}
                    </p>
                    {teacherStats.earlyBirds.length > 0 && (
                      <p>
                        🌟 <strong>Early risers:</strong>{' '}
                        {teacherStats.earlyBirds.map((eb, i) => (
                          <span key={i}>
                            {eb.name}{i < teacherStats.earlyBirds.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}
                    <p>
                      💰 <strong>Total allowance given today:</strong> UGX {teacherStats.totalAllowance.toLocaleString()}
                    </p>
                    <p>
                      ⏱️ <strong>Total hours worked:</strong> {teacherStats.totalHours} hours
                    </p>
                    {teacherStats.allProcessed ? (
                      <p className="text-green-700 font-semibold mt-2">
                        ✅ All teachers have been signed out and received their allowances. Great job!
                      </p>
                    ) : (
                      <p className="text-amber-700 mt-2">
                        ⚠️ Not all teachers are fully processed yet. Please ensure every teacher signs out and receives their allowance.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Records</p>
              <p className="text-2xl font-bold text-purple-700">{teacherStats.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm text-center">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Signed In</p>
              <p className="text-2xl font-bold text-green-700">{teacherStats.signedIn}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm text-center">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Signed Out</p>
              <p className="text-2xl font-bold text-gray-700">{teacherStats.signedOut}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 shadow-sm text-center">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Absent</p>
              <p className="text-2xl font-bold text-red-700">{teacherStats.absent}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-sm text-center">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Allowance</p>
              <p className="text-2xl font-bold text-amber-700">UGX {teacherStats.totalAllowance.toLocaleString()}</p>
            </div>
          </div>

          {/* Teacher Attendance Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Allowance</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingTeacher ? (
                    <tr><td colSpan="9" className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></td></tr>
                  ) : teacherAttendanceList.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-12 text-gray-500">No teacher attendance records for this date.</td></tr>
                  ) : (
                    teacherAttendanceList.map((record, idx) => {
                      const teacher = teachers.find(t => t.id === record.teacherId) || record.teacher || {};
                      const hoursDisplay = record.hoursWorked ? `${record.hoursWorked}h` : '—';
                      const allowanceDisplay = record.allowance ? `UGX ${Number(record.allowance).toLocaleString()}` : '—';
                      const statusLower = (record.status || '').toLowerCase();
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase">
                                {teacher.fullName?.charAt(0) || 'T'}
                              </div>
                              <span className="font-medium text-sm text-gray-800">{teacher.fullName || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{teacher.phoneNumber || '—'}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(statusLower)}`}>
                              {getStatusLabel(statusLower)}
                            </span>
                          </td>
                          <td className="p-4 text-center text-sm text-gray-600">{record.checkInTime || '—'}</td>
                          <td className="p-4 text-center text-sm text-gray-600">{record.checkOutTime || '—'}</td>
                          <td className="p-4 text-center text-sm font-medium text-gray-800">{hoursDisplay}</td>
                          <td className="p-4 text-center text-sm font-medium text-emerald-600">{allowanceDisplay}</td>
                          <td className="p-4 text-sm text-gray-600 max-w-[150px] truncate">{record.notes || '—'}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => openHistoryModal(record.teacherId)}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 flex items-center gap-1 mx-auto"
                            >
                              <Eye className="w-3 h-3" /> History
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= STUDENT HISTORY MODAL ================= */}
      {showStudentHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
              <h3 className="text-lg font-bold text-indigo-800">
                Student History – {studentHistoryName}
              </h3>
              <div className="flex gap-2">
                <button onClick={printStudentHistory}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-1">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => setShowStudentHistory(false)}
                  className="p-1 hover:bg-white rounded-lg text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={studentHistoryStart}
                    onChange={e => setStudentHistoryStart(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={studentHistoryEnd}
                    onChange={e => setStudentHistoryEnd(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={() => fetchStudentHistory(studentHistoryId)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Search
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] border rounded-xl">
                {studentHistoryLoading ? (
                  <div className="p-6 text-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>
                ) : studentHistoryRecords.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">No records found</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Term</th>
                        <th className="p-3 text-center">Year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentHistoryRecords.map((r, i) => {
                        const statusLower = (r.status || '').toLowerCase();
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-3">{r.date}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(statusLower)}`}>
                                {getStatusLabel(statusLower)}
                              </span>
                            </td>
                            <td className="p-3 text-center">{r.term || '—'}</td>
                            <td className="p-3 text-center">{r.academicYear || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TEACHER HISTORY MODAL ================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
              <h3 className="text-lg font-bold text-indigo-800">
                Teacher History – {teachers.find(t => t.id === historyTeacherId)?.fullName || ''}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 hover:bg-white rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Teacher</label>
                  <select
                    value={historyTeacherId}
                    onChange={e => {
                      setHistoryTeacherId(e.target.value);
                      fetchTeacherHistory(e.target.value);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={e => setHistoryStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={e => setHistoryEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={() => fetchTeacherHistory(historyTeacherId)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Search
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] border rounded-xl">
                {historyLoading ? (
                  <div className="p-6 text-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>
                ) : historyRecords.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">No records found</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Check In</th>
                        <th className="p-3 text-center">Check Out</th>
                        <th className="p-3 text-center">Hours</th>
                        <th className="p-3 text-center">Allowance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyRecords.map((r, i) => {
                        const statusLower = (r.status || '').toLowerCase();
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-3">{r.date}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(statusLower)}`}>
                                {getStatusLabel(statusLower)}
                              </span>
                            </td>
                            <td className="p-3 text-center">{r.checkInTime || '—'}</td>
                            <td className="p-3 text-center">{r.checkOutTime || '—'}</td>
                            <td className="p-3 text-center">{r.hoursWorked || '—'}</td>
                            <td className="p-3 text-center font-medium text-emerald-600">
                              {r.allowance ? `UGX ${Number(r.allowance).toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;