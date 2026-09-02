// TeacherAttendance.jsx – CLEAN WHITE DESIGN, DATE‑FILTERED STUDENT HISTORY
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck, Users, Search, RefreshCw, Loader2,
  CheckCircle, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight,
  UserCheck, UserX, TrendingUp, Eye, X, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// Robust array extraction helper
const extractArray = (res) => {
  if (!res || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

const TeacherAttendance = () => {
  // ---------- States ----------
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingIds, setSavingIds] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, attendanceRate: 0 });

  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [term, setTerm] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // ---------- Fetch user & classes ----------
  const fetchUserAndClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      let teacherData = null;
      try { const res = await api.get('/teachers/me', config); teacherData = res.data?.data || res.data; } catch {}
      if (!teacherData) {
        try {
          const allRes = await api.get('/teachers', config);
          const allTeachers = extractArray(allRes);
          teacherData = allTeachers.find(t => Number(t.userId) === Number(user.id) || Number(t.id) === Number(user.id) || t.email === user.Email);
        } catch {}
      }

      if (teacherData) {
        setTeacher(teacherData);
        if (teacherData.classId) setSelectedClass(Number(teacherData.classId));
      }
      try {
        const classesRes = await api.get('/classes', config);
        const classesData = extractArray(classesRes);
        setClasses(classesData);
        if (classesData.length > 0 && !teacherData?.classId) setSelectedClass(Number(classesData[0].id));
      } catch {}
    } catch { toast.error('Failed to load user data'); }
  }, []);

  // ---------- Load students & attendance ----------
  const loadAttendance = useCallback(async (classId, date) => {
    if (!classId) return;
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const studentsRes = await api.get(`/students?classId=${classId}`, config);
      const studentsData = extractArray(studentsRes);
      setStudents(studentsData);

      let records = [];
      try {
        const attRes = await api.get(`/attendance/class/${classId}/date/${date}`, config);
        const raw = attRes.data?.data || attRes.data || {};
        if (raw.records && Array.isArray(raw.records)) records = raw.records;
        else if (Array.isArray(raw)) records = raw;
      } catch {}
      setAttendanceRecords(records);
    } catch { toast.error('Failed to load attendance'); }
  }, []);

  // Stats recalculation
  useEffect(() => {
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const total = students.length;
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;
    setStats({ total, present, absent, late, attendanceRate: Math.round(rate * 10) / 10 });
  }, [attendanceRecords, students]);

  // Initialization
  useEffect(() => { const init = async () => { setIsLoading(true); await fetchUserAndClasses(); setIsLoading(false); }; init(); }, [fetchUserAndClasses]);
  useEffect(() => { if (selectedClass) loadAttendance(selectedClass, selectedDate); }, [selectedClass, selectedDate, loadAttendance]);

  // 5 AM auto‑reset
  useEffect(() => {
    const checkNewDay = () => { const now = new Date(); if (now.getHours() >= 5) { const todayStr = now.toISOString().split('T')[0]; if (selectedDate !== todayStr) setSelectedDate(todayStr); } };
    checkNewDay(); const timer = setInterval(checkNewDay, 60000); return () => clearInterval(timer);
  }, [selectedDate]);

  // ---------- Save attendance (database‑first) ----------
  const saveAttendance = async (recordsToSave) => {
    if (!selectedClass || recordsToSave.length === 0) return;
    const targetIds = recordsToSave.map(r => Number(r.studentId));
    if (targetIds.some(id => savingIds.includes(id)) || isSaving) return;
    setSavingIds(prev => [...prev, ...targetIds]); setIsSaving(true);
    try {
      const token = localStorage.getItem('token'); const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { classId: Number(selectedClass), date: selectedDate, term, academicYear, records: recordsToSave.map(r => ({ studentId: Number(r.studentId), status: r.status })) };
      await api.post('/attendance', payload, config);
      await loadAttendance(selectedClass, selectedDate);
      toast.success('Attendance updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSavingIds(prev => prev.filter(id => !targetIds.includes(id))); setIsSaving(false); }
  };

  const markSingle = (studentId, status) => { if (savingIds.includes(Number(studentId))) return; saveAttendance([{ studentId: Number(studentId), status }]); };
  const markAll = (status) => { if (!students.length || isSaving || savingIds.length > 0) return; saveAttendance(students.map(s => ({ studentId: Number(s.id), status }))); };

  const getStudentStatus = (studentId) => {
    const record = attendanceRecords.find(r => Number(r.studentId) === Number(studentId) || Number(r.student?.id) === Number(studentId) || Number(r.attendance?.studentId) === Number(studentId));
    return record?.status || 'not_marked';
  };

  // ---------- Student history with date filter ----------
  const openStudentHistory = (student) => {
    setHistoryStudent(student);
    setHistoryRecords([]);
    setHistoryStartDate('');
    setHistoryEndDate('');
    setShowHistoryModal(true);
    fetchStudentHistory(student.id); // initial fetch without dates
  };

  const fetchStudentHistory = async (studentId = historyStudent?.id) => {
    if (!studentId) return;
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token'); const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = {};
      if (historyStartDate && historyEndDate) {
        params.startDate = historyStartDate;
        params.endDate = historyEndDate;
      }
      const res = await api.get(`/attendance/student/${studentId}`, { ...config, params });
      const data = res.data?.data || res.data || {};
      setHistoryRecords(data.attendance || []);
    } catch { toast.error('Failed to load history'); } finally { setHistoryLoading(false); }
  };

  const filterHistory = () => {
    fetchStudentHistory(historyStudent?.id);
  };

  const printStudentHistory = () => {
    const win = window.open('', '_blank');
    const html = `<html><head><title>History - ${historyStudent?.fullName}</title></head><body><h2>${historyStudent?.fullName}</h2><table border="1" cellpadding="5"><tr><th>Date</th><th>Status</th><th>Term</th><th>Year</th></tr>${historyRecords.map(r => `<tr><td>${r.date}</td><td>${r.status}</td><td>${r.term||'—'}</td><td>${r.academicYear||'—'}</td></tr>`).join('')}</table></body></html>`;
    win.document.write(html); win.document.close(); win.print();
  };

  // ---------- UI Mappings ----------
  const statusColor = {
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    absent: 'bg-rose-50 text-rose-700 border-rose-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    not_marked: 'bg-slate-50 text-slate-400 border-slate-200',
  };
  const statusLabel = { present: 'Present', absent: 'Absent', late: 'Late', not_marked: 'Not Marked' };

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase();
    return students.filter(s => (s.fullName||'').toLowerCase().includes(q) || (s.studentNumber||'').toLowerCase().includes(q));
  }, [students, searchTerm]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const currentStudents = useMemo(() => filteredStudents.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage), [filteredStudents, currentPage]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-white"><Loader2 className="w-12 h-12 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* -------- Header -------- */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <ClipboardCheck className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Attendance</h1>
              <p className="text-sm text-gray-500 mt-1">
                {teacher ? `${teacher.fullName || teacher.name} · ` : ''}
                {classes.find(c => c.id === selectedClass)?.className || 'Class'} · {selectedDate}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} disabled={isSaving || students.length===0}
              className="px-4 py-2.5 bg-white border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> All Present
            </button>
            <button onClick={() => markAll('absent')} disabled={isSaving || students.length===0}
              className="px-4 py-2.5 bg-white border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
              <UserX className="w-4 h-4" /> All Absent
            </button>
            <button onClick={() => loadAttendance(selectedClass, selectedDate)} disabled={isSaving || !selectedClass}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
              <RefreshCw className={`w-5 h-5 ${isSaving ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* -------- Settings Bar -------- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {classes.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Class</label>
              <select value={selectedClass||''} onChange={e => setSelectedClass(Number(e.target.value))} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-200 outline-none">
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
              </select>
            </div>
          )}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-200 outline-none">
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Year</label>
            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
          </div>
        </div>

        {/* -------- Stats Cards -------- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label:'Enrolled', value:stats.total },
            { label:'Present', value:stats.present },
            { label:'Absent', value:stats.absent },
            { label:'Late', value:stats.late },
            { label:'Rate', value:`${stats.attendanceRate}%` },
          ].map((card,i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
          ))}
        </div>

        {/* -------- Search -------- */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search students by name or admission number..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
          </div>
        </div>

        {/* -------- Student Table -------- */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 text-center w-16">#</th>
                  <th className="p-4 text-left">Student</th>
                  <th className="p-4 text-left">Adm No</th>
                  <th className="p-4 text-center w-40">Status</th>
                  <th className="p-4 text-center w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentStudents.length === 0 ? (
                  <tr><td colSpan={5} className="p-16 text-center text-gray-400">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" /> No students found.
                  </td></tr>
                ) : (
                  currentStudents.map((student, idx) => {
                    const currentStatus = getStudentStatus(student.id);
                    const isRecordMarked = currentStatus !== 'not_marked';
                    const isItemProcessing = savingIds.includes(Number(student.id));
                    return (
                      <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${isRecordMarked ? 'bg-gray-50/50' : ''}`}>
                        <td className="p-4 text-center text-gray-400 font-mono text-xs">{(currentPage-1)*itemsPerPage + idx + 1}</td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{student.fullName || student.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">ID: #{student.id}</div>
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-500">{student.studentNumber || '—'}</td>
                        <td className="p-4 text-center">
                          {isItemProcessing ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" /> : (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusColor[currentStatus]}`}>
                              {currentStatus==='present'&&<CheckCircle className="w-3.5 h-3.5"/>}
                              {currentStatus==='absent'&&<XCircle className="w-3.5 h-3.5"/>}
                              {currentStatus==='late'&&<Clock className="w-3.5 h-3.5"/>}
                              {currentStatus==='not_marked'&&<AlertCircle className="w-3.5 h-3.5"/>}
                              {statusLabel[currentStatus]}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {isItemProcessing ? <span className="text-xs text-indigo-600 animate-pulse">Saving…</span> :
                           isRecordMarked ? (
                            <button onClick={() => openStudentHistory(student)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-xs font-medium">
                              <Eye className="w-4 h-4" /> History
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => markSingle(student.id, 'present')} disabled={isSaving}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition" title="Present">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => markSingle(student.id, 'late')} disabled={isSaving}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition" title="Late">
                                <Clock className="w-4 h-4" />
                              </button>
                              <button onClick={() => markSingle(student.id, 'absent')} disabled={isSaving}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition" title="Absent">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {filteredStudents.length > itemsPerPage && (
            <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {((currentPage-1)*itemsPerPage)+1} – {Math.min(currentPage*itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
              </span>
              <div className="flex gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${p===currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>
          )}
        </div>

        {/* -------- Student History Modal (with date filter) -------- */}
        {showHistoryModal && historyStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{historyStudent.fullName || historyStudent.name}</h3>
                  <p className="text-sm text-gray-500">{historyStudent.studentNumber}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={printStudentHistory} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-1 text-gray-700"><Printer className="w-4 h-4"/> Print</button>
                  <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><X className="w-5 h-5"/></button>
                </div>
              </div>

              {/* Date filter */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={historyEndDate} onChange={e => setHistoryEndDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                </div>
                <button onClick={filterHistory} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Apply Filter</button>
              </div>

              {/* History table */}
              <div className="flex-1 overflow-y-auto p-6">
                {historyLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600"/></div>
                ) : historyRecords.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">No attendance records found.</div>
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
                      {historyRecords.map((r,i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-3 text-gray-900">{r.date}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[r.status]||'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                          </td>
                          <td className="p-3 text-center text-gray-600">{r.term||'—'}</td>
                          <td className="p-3 text-center text-gray-600">{r.academicYear||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;