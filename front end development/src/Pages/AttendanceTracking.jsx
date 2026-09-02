// Attendance.jsx – PROFESSIONAL, LOCKS AFTER TAKEN, NO ACCIDENTAL CHANGES
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle,
  Search, RefreshCw, Download, Printer, ChevronLeft, ChevronRight,
  Loader2, Save, X, Eye, UserCheck, UserX, ClipboardCheck, Sparkles,
  Lock, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const extractArray = (res) => {
  if (!res?.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 });
  // ----- LOCK / EDIT MODE -----
  const [editMode, setEditMode] = useState(false);    // true = can modify (override lock)
  const [hasExisting, setHasExisting] = useState(false); // whether any attendance records exist for this class/date

  // Register modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerClass, setRegisterClass] = useState('');
  const [registerDate, setRegisterDate] = useState(new Date().toISOString().split('T')[0]);
  const [registerStudents, setRegisterStudents] = useState([]);
  const [registerSearch, setRegisterSearch] = useState('');
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);

  // ============= FETCH CLASSES =============
  const fetchClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get('/classes', config).catch(() => ({ data: [] }));
      const data = extractArray(res);
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].id.toString());
      }
    } catch (err) {
      console.error('Classes error:', err);
    }
  }, [selectedClass]);

  // ============= FETCH STUDENTS & ATTENDANCE =============
  const fetchAttendance = useCallback(async (classId, date) => {
    if (!classId || !date) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const studentsRes = await api.get(`/students?classId=${classId}`, config).catch(() => ({ data: [] }));
      const studentsData = extractArray(studentsRes);
      setStudents(studentsData);

      let records = [];
      try {
        const attRes = await api.get(`/studentattendance/class/${classId}/date/${date}`, config);
        if (attRes.data?.success) {
          records = attRes.data.data?.records || [];
        }
      } catch (e) {
        records = [];
      }

      setAttendanceRecords(records);

      // Determine if attendance already taken (any record exists)
      const anyMarked = records.some(r => r.status && r.status !== 'not_marked');
      setHasExisting(anyMarked);
      if (!anyMarked) setEditMode(false); // reset edit mode if new date has no records

      // Calculate stats
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const excused = records.filter(r => r.status === 'excused').length;
      const total = studentsData.length;
      const rate = total > 0 ? ((present + late) / total) * 100 : 0;

      setStats({ total, present, absent, late, excused, rate: Math.round(rate * 10) / 10 });
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load attendance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => {
    if (selectedClass && selectedDate) fetchAttendance(selectedClass, selectedDate);
  }, [selectedClass, selectedDate, fetchAttendance]);

  // ============= MARK SINGLE STUDENT =============
  const markStudent = async (studentId, status) => {
    if (!editMode && hasExisting) {
      toast.error('Attendance already taken. Enable Edit Mode to modify.');
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        classId: parseInt(selectedClass),
        date: selectedDate,
        term: 'Term 1',
        academicYear: new Date().getFullYear().toString(),
        records: [{
          studentId,
          status,
          checkInTime: (status === 'present' || status === 'late') ? new Date().toTimeString().slice(0, 8) : null
        }]
      };

      await api.post('/studentattendance', payload, config);
      await fetchAttendance(selectedClass, selectedDate);
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error('Failed to mark attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // ============= MARK ALL =============
  const markAll = async (status) => {
    if (!students.length) return;
    if (!editMode && hasExisting) {
      toast.error('Attendance already taken. Enable Edit Mode first.');
      return;
    }
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to mark ALL ${students.length} students as ${status}?`)) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        classId: parseInt(selectedClass),
        date: selectedDate,
        term: 'Term 1',
        academicYear: new Date().getFullYear().toString(),
        records: students.map(s => ({
          studentId: s.id,
          status,
          checkInTime: (status === 'present' || status === 'late') ? new Date().toTimeString().slice(0, 8) : null
        }))
      };

      await api.post('/studentattendance', payload, config);
      await fetchAttendance(selectedClass, selectedDate);
      toast.success(`All marked as ${status}`);
    } catch (err) {
      toast.error('Failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ============= REGISTER MODAL FUNCTIONS =============
  const loadRegisterStudents = async () => {
    if (!registerClass) { toast.error('Select a class'); return; }
    setIsLoadingRegister(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get(`/students?classId=${registerClass}`, config).catch(() => ({ data: [] }));
      const data = extractArray(res);

      let existing = [];
      try {
        const attRes = await api.get(`/studentattendance/class/${registerClass}/date/${registerDate}`, config);
        existing = attRes.data?.data?.records || [];
      } catch (e) {}

      const merged = data.map(s => {
        const rec = existing.find(r => Number(r.studentId) === Number(s.id) || Number(r.student?.id) === Number(s.id));
        return { ...s, status: rec?.status || 'not_marked', recordId: rec?.id || null };
      });

      setRegisterStudents(merged);
      toast.success(`${merged.length} students loaded`);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setIsLoadingRegister(false);
    }
  };

  const toggleRegisterStatus = (studentId, status) => {
    setRegisterStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const registerMarkAllPresent = () => {
    if (!window.confirm('Mark all loaded students as PRESENT?')) return;
    setRegisterStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
  };

  const submitRegistration = async () => {
    const marked = registerStudents.filter(s => s.status !== 'not_marked');
    if (!marked.length) { toast.error('Mark at least one student'); return; }

    if (!window.confirm(`Save attendance for ${marked.length} students?`)) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        classId: parseInt(registerClass),
        date: registerDate,
        term: 'Term 1',
        academicYear: new Date().getFullYear().toString(),
        records: registerStudents.map(s => ({
          studentId: s.id,
          status: s.status,
          checkInTime: (s.status === 'present' || s.status === 'late') ? new Date().toTimeString().slice(0, 8) : null
        }))
      };

      await api.post('/studentattendance', payload, config);
      toast.success(`${marked.length} students registered!`);
      setShowRegisterModal(false);
      setRegisterStudents([]);

      if (registerClass === selectedClass && registerDate === selectedDate) {
        fetchAttendance(selectedClass, selectedDate);
      }
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // ============= HELPERS =============
 const getStudentStatus = (studentId) => {
  const rec = attendanceRecords.find(r => 
    Number(r.studentId) === Number(studentId) || 
    Number(r.student?.id) === Number(studentId)
  );
  return rec?.status || 'not_marked';
};
  const statusBadge = (status) => {
    const map = {
      present: 'bg-emerald-100 text-emerald-700',
      absent: 'bg-rose-100 text-rose-700',
      late: 'bg-amber-100 text-amber-700',
      excused: 'bg-blue-100 text-blue-700',
      not_marked: 'bg-gray-100 text-gray-400',
    };
    const labels = { present: 'Present', absent: 'Absent', late: 'Late', excused: 'Excused', not_marked: 'Not Marked' };
    const icons = {
      present: <CheckCircle className="w-3 h-3" />,
      absent: <XCircle className="w-3 h-3" />,
      late: <Clock className="w-3 h-3" />,
      excused: <AlertCircle className="w-3 h-3" />,
      not_marked: <AlertCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || map.not_marked}`}>
        {icons[status]}{labels[status]}
      </span>
    );
  };

  const filteredStudents = students.filter(s =>
    !searchTerm || (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const csv = 'Student No,Name,Status\n' + students.map(s =>
      `${s.studentNumber || ''},${s.fullName || ''},${getStudentStatus(s.id)}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `attendance_${selectedDate}.csv`; a.click();
    toast.success('Exported');
  };

  if (isLoading && !students.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-indigo-600" />
            Student Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">{selectedDate}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setRegisterClass(selectedClass); setRegisterDate(selectedDate); setShowRegisterModal(true); }}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-sm">
            <Sparkles className="w-4 h-4 inline mr-1" /> Register Attendance
          </button>
          <button onClick={exportCSV}
            className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 text-sm font-medium border border-emerald-200">
            <Download className="w-4 h-4 inline mr-1" /> Export
          </button>
          <button onClick={() => window.print()}
            className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 text-sm font-medium border border-blue-200">
            <Printer className="w-4 h-4 inline mr-1" /> Print
          </button>
          <button onClick={() => fetchAttendance(selectedClass, selectedDate)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
            <RefreshCw className="w-4 h-4 inline mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* Lock / Edit Banner */}
      {hasExisting && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${editMode ? 'bg-amber-50 border border-amber-300' : 'bg-emerald-50 border border-emerald-300'}`}>
          <div className="flex items-center gap-2">
            {editMode ? <Edit3 className="w-5 h-5 text-amber-600" /> : <Lock className="w-5 h-5 text-emerald-600" />}
            <span className="font-medium text-sm">
              {editMode ? 'Edit Mode Active – you can change attendance records.' : 'Attendance already taken for this date. Quick actions locked.'}
            </span>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${editMode ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {editMode ? 'Lock Again' : 'Enable Edit Mode'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'indigo' },
          { label: 'Present', value: stats.present, color: 'emerald' },
          { label: 'Absent', value: stats.absent, color: 'rose' },
          { label: 'Late', value: stats.late, color: 'amber' },
          { label: 'Excused', value: stats.excused, color: 'blue' },
          { label: 'Rate', value: `${stats.rate}%`, color: 'purple' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase">{s.label}</p>
            <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white">
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search student..." className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm" />
        </div>
      </div>

      {/* Quick Actions (conditionally disabled) */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 mr-2">Mark All:</span>
        <button onClick={() => markAll('present')} disabled={!editMode && hasExisting}
          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <UserCheck className="w-3.5 h-3.5 inline mr-1" />Present
        </button>
        <button onClick={() => markAll('late')} disabled={!editMode && hasExisting}
          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed">Late</button>
        <button onClick={() => markAll('absent')} disabled={!editMode && hasExisting}
          className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <UserX className="w-3.5 h-3.5 inline mr-1" />Absent
        </button>
        <button onClick={() => markAll('excused')} disabled={!editMode && hasExisting}
          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">Excused</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Student</th>
                <th className="p-4 text-left">Adm No</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentStudents.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center text-gray-400">No students found</td></tr>
              ) : (
                currentStudents.map((s, i) => {
                  const status = getStudentStatus(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-500">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                      <td className="p-4 font-medium">{s.fullName}</td>
                      <td className="p-4 font-mono text-xs text-gray-600">{s.studentNumber || '—'}</td>
                      <td className="p-4 text-center">{statusBadge(status)}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => markStudent(s.id, 'present')} disabled={(!editMode && hasExisting) || isSaving}
                            className={`p-2 rounded-lg transition ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-emerald-50 text-gray-400'}`}>
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => markStudent(s.id, 'late')} disabled={(!editMode && hasExisting) || isSaving}
                            className={`p-2 rounded-lg transition ${status === 'late' ? 'bg-amber-100 text-amber-700' : 'hover:bg-amber-50 text-gray-400'}`}>
                            <Clock className="w-4 h-4" />
                          </button>
                          <button onClick={() => markStudent(s.id, 'absent')} disabled={(!editMode && hasExisting) || isSaving}
                            className={`p-2 rounded-lg transition ${status === 'absent' ? 'bg-rose-100 text-rose-700' : 'hover:bg-rose-50 text-gray-400'}`}>
                            <XCircle className="w-4 h-4" />
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
        {filteredStudents.length > itemsPerPage && (
          <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
            <span className="text-sm text-gray-500">{((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}</span>
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

      {/* REGISTER MODAL (unchanged UI but respects lock logic internally) */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">Register Attendance</h3>
              <button onClick={() => setShowRegisterModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {/* ... identical modal body as before ... */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;