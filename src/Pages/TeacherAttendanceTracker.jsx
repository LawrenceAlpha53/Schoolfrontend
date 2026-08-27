// TeacherAttendanceTracker.jsx – FULL FILE: BACKGROUND REFRESH, CARD HIDE, 5AM RESET
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, RefreshCw, Loader2, Printer, Download,
  ChevronLeft, ChevronRight, LogIn, LogOut, AlertOctagon,
  History, Database, Search, UserCheck, DollarSign, X, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const TeacherAttendanceTracker = () => {
  // ----- states -----
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form fields
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [signInForm, setSignInForm] = useState({ teacherId: '' });
  const [emergencyForm, setEmergencyForm] = useState({ reason: '' });
  const [allowanceForm, setAllowanceForm] = useState({ amount: '' });

  // History
  const [historyTeacher, setHistoryTeacher] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const [stats, setStats] = useState({
    totalTeachers: 0, signedIn: 0, signedOut: 0, emergency: 0, absent: 0,
    attendanceRate: 0, totalAllowances: 0, totalHours: 0
  });

  // ----- FETCH DATA (silent after first load) -----
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsInitialLoading(true);
    else setIsBackgroundLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [teachersRes, attendanceRes] = await Promise.all([
        api.get('/teachers', config).catch(() => ({ data: [] })),
        api.get(`/teacher-attendance?date=${selectedDate}`, config).catch(() => ({ data: [] }))
      ]);

      const teachersData = teachersRes.data?.data || teachersRes.data || [];
      let attendanceData = attendanceRes.data?.data || attendanceRes.data || [];
      if (!Array.isArray(attendanceData)) attendanceData = [];

      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setAttendanceRecords(attendanceData);

      // Compute stats
      const signedIn = attendanceData.filter(a => a.status === 'signed_in' || a.status === 'present').length;
      const signedOut = attendanceData.filter(a => a.status === 'signed_out').length;
      const emergency = attendanceData.filter(a => a.status === 'emergency_signed_out').length;
      const total = teachersData.length;
      let totalHours = 0;
      attendanceData.forEach(a => { if (a.hoursWorked) totalHours += Number(a.hoursWorked); });
      const totalAllowances = attendanceData.reduce((sum, a) => sum + Number(a.allowance || 0), 0);

      setStats({
        totalTeachers: total,
        signedIn,
        signedOut,
        emergency,
        absent: Math.max(0, total - attendanceData.length),
        attendanceRate: total > 0 ? Math.round(((signedIn + signedOut) / total) * 100) : 0,
        totalAllowances,
        totalHours: Math.round(totalHours * 10) / 10
      });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsInitialLoading(false);
      setIsBackgroundLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(false); }, [fetchData]);

  // Background poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refetch when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchData]);

  // Auto-switch to today at 5 AM
  useEffect(() => {
    const checkNewDay = () => {
      const now = new Date();
      if (now.getHours() >= 5) {
        const todayStr = now.toISOString().split('T')[0];
        if (selectedDate !== todayStr) setSelectedDate(todayStr);
      }
    };
    checkNewDay();
    const timer = setInterval(checkNewDay, 60000);
    return () => clearInterval(timer);
  }, [selectedDate]);

  // ----- CONDITIONS -----
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;
  const allTeachersHaveRecord = isToday && stats.totalTeachers > 0 && teachers.every(t =>
    attendanceRecords.some(r => r.teacherId === t.id)
  );
  const showSignInButton = !allTeachersHaveRecord;

  // Cards to show: only total teachers when all processed, otherwise full set
  const cardSet = allTeachersHaveRecord
    ? [{ label: 'Total Teachers', value: stats.totalTeachers, color: 'text-indigo-600', bg: 'bg-indigo-50' }]
    : [
        { label: 'Total Teachers', value: stats.totalTeachers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Signed In', value: stats.signedIn, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Signed Out', value: stats.signedOut, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Emergency', value: stats.emergency, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Absent', value: stats.absent, color: 'text-gray-600', bg: 'bg-gray-100' },
        { label: 'Rate', value: `${stats.attendanceRate}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Hours', value: `${stats.totalHours}h`, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Allowances', value: `UGX ${stats.totalAllowances.toLocaleString()}`, color: 'text-teal-600', bg: 'bg-teal-50' },
      ];

  // ----- HELPERS -----
  const resetView = () => { setCurrentPage(1); setSearchTerm(''); };

  const getTeacherName = (tid) => teachers.find(t => t.id === tid)?.fullName || `#${tid}`;

  const getStatusBadge = (status) => {
    const map = {
      signed_in: 'bg-blue-100 text-blue-700',
      signed_out: 'bg-emerald-100 text-emerald-700',
      emergency_signed_out: 'bg-red-100 text-red-700',
      present: 'bg-emerald-100 text-emerald-700',
      allowance: 'bg-amber-100 text-amber-700',
    };
    const labels = {
      signed_in: 'Signed In',
      signed_out: 'Signed Out',
      emergency_signed_out: 'Emergency',
      present: 'Present',
      allowance: 'Allowance'
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
  };

  // ----- SIGN IN (optimistic) -----
  const handleSignIn = async (e) => {
    e.preventDefault();
    const teacherId = parseInt(signInForm.teacherId);
    if (!teacherId) { toast.error('Select a teacher'); return; }
    if (attendanceRecords.find(r => r.teacherId === teacherId && (r.status === 'signed_in' || r.status === 'present'))) {
      toast.error('Already signed in today'); return;
    }
    setIsSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const now = new Date();
      const checkInTime = now.toTimeString().slice(0, 8);
      const response = await api.post('/teacher-attendance', {
        teacherId, status: 'signed_in', date: selectedDate, checkInTime,
        notes: `Signed in at ${checkInTime}`
      }, config);
      if (response.data?.success) {
        toast.success(`Signed in at ${checkInTime}`);
        // Optimistic row
        const opt = {
          id: Date.now(), teacherId, date: selectedDate, status: 'signed_in',
          checkInTime, checkOutTime: null, hoursWorked: null, allowance: 0,
          notes: `Signed in at ${checkInTime}`, teacher: teachers.find(t => t.id === teacherId)
        };
        setAttendanceRecords(prev => [opt, ...prev]);
        setShowSignInModal(false);
        setSignInForm({ teacherId: '' });
        resetView();
        fetchData(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally { setIsSaving(false); }
  };

  // ----- SIGN OUT (optimistic one‑click) -----
  const handleSignOutClick = async (record) => {
    if (!record) return;
    setIsSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const now = new Date();
      const checkOutTime = now.toTimeString().slice(0, 8);
      const response = await api.put(`/teacher-attendance/${record.id}`, {
        status: 'signed_out', checkOutTime, notes: `Signed out at ${checkOutTime}`
      }, config);
      if (response.data?.success) {
        toast.success(`Signed out (${response.data.data?.hoursWorked || 0}h)`);
        setAttendanceRecords(prev => prev.map(r =>
          r.id === record.id ? { ...r, status: 'signed_out', checkOutTime, hoursWorked: response.data.data?.hoursWorked || 0 } : r
        ));
        resetView();
        fetchData(true);
      }
    } catch (error) {
      toast.error('Failed');
    } finally { setIsSaving(false); }
  };

  // ----- EMERGENCY -----
  const handleEmergency = async (e) => {
    e.preventDefault();
    if (!selectedRecord || !emergencyForm.reason) { toast.error('Reason required'); return; }
    setIsSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const now = new Date();
      const checkOutTime = now.toTimeString().slice(0, 8);
      await api.put(`/teacher-attendance/${selectedRecord.id}`, {
        status: 'emergency_signed_out', checkOutTime, emergencyReason: emergencyForm.reason,
        notes: `EMERGENCY: ${emergencyForm.reason}`
      }, config);
      toast.warning(`Emergency sign out: ${emergencyForm.reason}`);
      setShowEmergencyModal(false);
      setSelectedRecord(null);
      setEmergencyForm({ reason: '' });
      resetView();
      fetchData(true);
    } catch (error) {
      toast.error('Failed');
    } finally { setIsSaving(false); }
  };

  // ----- ALLOWANCE -----
  const handleAllowance = async (e) => {
    e.preventDefault();
    if (!allowanceForm.amount || !selectedTeacher) { toast.error('Enter amount'); return; }
    setIsSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await api.post('/teacher-attendance/allowances', {
        teacherId: selectedTeacher.id, amount: parseFloat(allowanceForm.amount), date: selectedDate
      }, config);
      toast.success(`Allowance added`);
      setShowAllowanceModal(false);
      setAllowanceForm({ amount: '' });
      setSelectedTeacher(null);
      resetView();
      fetchData(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally { setIsSaving(false); }
  };

  // ----- HISTORY -----
  const openHistory = (teacher) => {
    setHistoryTeacher(teacher);
    setHistoryStartDate('');
    setHistoryEndDate('');
    setHistoryRecords([]);
    setShowHistoryModal(true);
  };

  const fetchHistory = async () => {
    if (!historyTeacher) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const params = { teacherId: historyTeacher.id };
      if (historyStartDate && historyEndDate) {
        params.startDate = historyStartDate;
        params.endDate = historyEndDate;
      }
      const response = await api.get(`/teacher-attendance/teacher/${historyTeacher.id}`, {
        ...config, params
      });
      setHistoryRecords(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch history');
    }
  };

  const printHistory = () => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html><head><title>History - ${historyTeacher?.fullName}</title></head>
      <body><h2>Attendance History for ${historyTeacher?.fullName}</h2>
      <table border="1" cellpadding="5">
        <tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Allowance</th></tr>
        ${historyRecords.map(r => `
          <tr>
            <td>${r.date}</td><td>${r.status}</td>
            <td>${r.checkInTime || '-'}</td><td>${r.checkOutTime || '-'}</td>
            <td>${r.hoursWorked || '-'}</td>
            <td>${r.allowance ? 'UGX ' + Number(r.allowance).toLocaleString() : '-'}</td>
          </tr>`).join('')}
      </table></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // ----- FILTERING / PAGINATION -----
  const filtered = attendanceRecords.filter(r =>
    !searchTerm || getTeacherName(r.teacherId).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const csv = 'Teacher,Status,Check In,Check Out,Hours,Date,Allowance\n' +
      filtered.map(r => `${getTeacherName(r.teacherId)},${r.status},${r.checkInTime || '-'},${r.checkOutTime || '-'},${r.hoursWorked || '-'},${r.date},${r.allowance || 0}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `teacher-attendance-${selectedDate}.csv`; a.click();
    toast.success('Exported');
  };

  // ----- INITIAL LOADING -----
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Subtle background loading bar */}
      {isBackgroundLoading && <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 animate-pulse z-50" />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-indigo-600" /> Teacher Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            <Database className="w-4 h-4 inline mr-1" />
            {stats.totalTeachers} teachers • {selectedDate}
            {allTeachersHaveRecord && <span className="ml-2 text-emerald-600 font-medium">✅ All processed</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showSignInButton && (
            <button onClick={() => { setSignInForm({ teacherId: '' }); setShowSignInModal(true); }}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium">
              <LogIn className="w-4 h-4 inline mr-1" /> Sign In Teacher
            </button>
          )}
          <button onClick={exportCSV} className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200">
            <Download className="w-4 h-4 inline mr-1" /> Export
          </button>
          <button onClick={() => window.print()} className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-200">
            <Printer className="w-4 h-4 inline mr-1" /> Print
          </button>
          <button onClick={() => fetchData(true)} className="px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 inline mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* Cards – only Total Teachers when all processed, otherwise full set */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cardSet.map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border border-gray-100 shadow-sm text-center`}>
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Date & Search */}
      <div className="bg-white rounded-xl p-4 border shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search teacher..." className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Teacher</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Check In</th>
                <th className="p-4 text-center">Check Out</th>
                <th className="p-4 text-center">Hours</th>
                <th className="p-4 text-center">Allowance</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-gray-400">No records for this date</td></tr>
              ) : (
                currentItems.map((record, idx) => {
                  const teacher = teachers.find(t => t.id === record.teacherId);
                  const hoursDisplay = record.hoursWorked ? `${record.hoursWorked}h` : '—';
                  const allowanceDisplay = record.allowance ? `UGX ${Number(record.allowance).toLocaleString()}` : '—';
                  const showAllowanceBtn = !record.allowance || Number(record.allowance) === 0;
                  const showSignOutBtns = record.status === 'signed_in';
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="p-4 font-medium">{teacher?.fullName || `#${record.teacherId}`}</td>
                      <td className="p-4 text-center">{getStatusBadge(record.status)}</td>
                      <td className="p-4 text-center text-sm">{record.checkInTime || '—'}</td>
                      <td className="p-4 text-center text-sm">{record.checkOutTime || '—'}</td>
                      <td className="p-4 text-center font-medium">{hoursDisplay}</td>
                      <td className="p-4 text-center font-medium text-emerald-600">{allowanceDisplay}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          {showSignOutBtns && (
                            <button onClick={() => handleSignOutClick(record)} disabled={isSaving}
                              className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200">
                              <LogOut className="w-3 h-3 inline mr-0.5" /> Sign Out
                            </button>
                          )}
                          {showSignOutBtns && (
                            <button onClick={() => { setSelectedRecord(record); setEmergencyForm({ reason: '' }); setShowEmergencyModal(true); }}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                              Emergency
                            </button>
                          )}
                          {showAllowanceBtn && (
                            <button onClick={() => { setSelectedTeacher(teacher); setAllowanceForm({ amount: '' }); setShowAllowanceModal(true); }}
                              className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200">
                              <DollarSign className="w-3 h-3 inline mr-0.5" /> Allowance
                            </button>
                          )}
                          <button onClick={() => openHistory(teacher || { id: record.teacherId, fullName: getTeacherName(record.teacherId) })}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100">
                            <History className="w-3 h-3 inline mr-0.5" /> History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > itemsPerPage && (
          <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
            <span className="text-sm text-gray-500">{((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 border rounded-lg text-sm ${p === currentPage ? 'bg-indigo-600 text-white' : ''}`}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- MODALS ---------- */}

      {/* 1. SIGN IN MODAL */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Sign In Teacher</h3>
              <button onClick={() => setShowSignInModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSignIn} className="space-y-4">
              <select value={signInForm.teacherId} onChange={e => setSignInForm({ teacherId: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl text-sm" required>
                <option value="">Select teacher...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName || t.name}</option>)}
              </select>
              <button type="submit" disabled={isSaving}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null} Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. EMERGENCY MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-600">🚨 Emergency Sign Out</h3>
              <button onClick={() => setShowEmergencyModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEmergency} className="space-y-4">
              <p className="text-sm text-gray-600">Teacher: <strong>{getTeacherName(selectedRecord?.teacherId)}</strong></p>
              <textarea value={emergencyForm.reason} onChange={e => setEmergencyForm({ reason: e.target.value })}
                placeholder="Reason for emergency..." className="w-full px-4 py-2.5 border rounded-xl text-sm" rows={3} required />
              <button type="submit" disabled={isSaving}
                className="w-full py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium disabled:opacity-50">
                Confirm Emergency
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ALLOWANCE MODAL */}
      {showAllowanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Allowance</h3>
              <button onClick={() => setShowAllowanceModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAllowance} className="space-y-4">
              <p className="text-sm text-gray-600">Teacher: <strong>{selectedTeacher?.fullName || 'N/A'}</strong></p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (UGX)</label>
                <input type="number" value={allowanceForm.amount} onChange={e => setAllowanceForm({ amount: e.target.value })}
                  placeholder="Enter amount" className="w-full px-4 py-2.5 border rounded-xl text-sm" required />
              </div>
              <button type="submit" disabled={isSaving}
                className="w-full py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null} Add Allowance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. HISTORY MODAL */}
      {showHistoryModal && historyTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Attendance History</h3>
                <p className="text-sm text-gray-500">{historyTeacher.fullName || historyTeacher.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={printHistory} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium flex items-center gap-1">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowHistoryModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={historyEndDate} onChange={e => setHistoryEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm" />
                </div>
                <div className="flex items-end">
                  <button onClick={fetchHistory} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">Search</button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh] border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Check In</th>
                      <th className="p-3 text-center">Check Out</th>
                      <th className="p-3 text-center">Hours</th>
                      <th className="p-3 text-center">Allowance</th>
                      <th className="p-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyRecords.length === 0 ? (
                      <tr><td colSpan={7} className="p-6 text-center text-gray-400">No records found</td></tr>
                    ) : (
                      historyRecords.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="p-3">{r.date}</td>
                          <td className="p-3 text-center">{getStatusBadge(r.status)}</td>
                          <td className="p-3 text-center">{r.checkInTime || '—'}</td>
                          <td className="p-3 text-center">{r.checkOutTime || '—'}</td>
                          <td className="p-3 text-center">{r.hoursWorked || '—'}</td>
                          <td className="p-3 text-center">{r.allowance ? `UGX ${Number(r.allowance).toLocaleString()}` : '—'}</td>
                          <td className="p-3 text-xs text-gray-500">{r.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceTracker;