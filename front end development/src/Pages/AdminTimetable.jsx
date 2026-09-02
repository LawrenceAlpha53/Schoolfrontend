// Pages/Admin/AdminTimetable.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  User,
  Plus,
  Search,
  RefreshCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  Copy,
  AlertCircle,
  CheckCircle,
  School,
  GraduationCap,
  UserCheck,
  UserX,
  FileText,
  LayoutGrid,
  List,
  MapPin,
  UserPlus,
  Bell,
  CalendarDays,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ---------- HELPERS ----------
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

// ---------- STAT CARD ----------
const StatCard = ({ icon: Icon, label, value, color, subtitle }) => {
  const colors = {
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200/30',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-200/30',
    green: 'from-green-500/10 to-green-600/5 border-green-200/30',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/30',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-200/30',
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200/30'
  };
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400/80">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-white/50 shadow-sm">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// ---------- MAIN COMPONENT ----------
const AdminTimetable = () => {
  // ================= STATE =================
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    classId: '', subjectId: '', teacherId: '', dayOfWeek: 'Monday',
    startTime: '08:00', endTime: '09:00', room: '',
    term: 'Term 1', academicYear: new Date().getFullYear().toString()
  });

  const [assignForm, setAssignForm] = useState({
    teacherId: '', classId: '', subjectId: '', dayOfWeek: 'Monday',
    startTime: '08:00', endTime: '09:00', room: '',
    term: 'Term 1', academicYear: new Date().getFullYear().toString(),
    message: ''
  });

  const [bulkEntries, setBulkEntries] = useState([]);
  const [bulkDay, setBulkDay] = useState('Monday');

  const [cloneData, setCloneData] = useState({
    fromTerm: 'Term 1', fromYear: new Date().getFullYear().toString(),
    toTerm: 'Term 2', toYear: new Date().getFullYear().toString(),
    classId: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // ================= DATA FETCHING =================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [classesRes, subjectsRes, teachersRes, timetablesRes] = await Promise.all([
        api.get('/classes', config),
        api.get('/subjects', config),
        api.get('/teachers', config),
        api.get(`/timetables?term=${selectedTerm}&academicYear=${selectedYear}`, config)
      ]);

      const extract = (res) => {
        if (!res || !res.data) return [];
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d.data && Array.isArray(d.data)) return d.data;
        if (d.success && Array.isArray(d.data)) return d.data;
        return [];
      };

      const classesData = extract(classesRes);
      const subjectsData = extract(subjectsRes);
      const teachersData = extract(teachersRes);
      let timetablesData = extract(timetablesRes);
      
      // fallback: if timetablesData is empty but data might be in different shape
      if (!timetablesData.length && timetablesRes.data) {
        const obj = timetablesRes.data;
        if (obj.timetables && Array.isArray(obj.timetables)) timetablesData = obj.timetables;
        else if (obj.rows && Array.isArray(obj.rows)) timetablesData = obj.rows;
        else if (obj.results && Array.isArray(obj.results)) timetablesData = obj.results;
      }

      setClasses(classesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setTimetables(timetablesData);

    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast.error('Failed to load timetable data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTerm, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= FILTERING & PAGINATION =================
  const getFilteredTimetables = () => {
    let filtered = [...timetables];

    if (selectedClass) {
      filtered = filtered.filter(t => t.classId === parseInt(selectedClass));
    }
    if (selectedTeacher) {
      filtered = filtered.filter(t => t.teacherId === parseInt(selectedTeacher));
    }
    if (selectedDay !== 'all') {
      filtered = filtered.filter(t => t.dayOfWeek === selectedDay);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.subject?.subjectName?.toLowerCase().includes(term) ||
        t.teacher?.fullName?.toLowerCase().includes(term) ||
        t.class?.className?.toLowerCase().includes(term) ||
        t.room?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filtered = getFilteredTimetables();
  const totalPages = Math.ceil(filtered.length / perPage);
  const currentItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ================= CRUD OPERATIONS =================
  const resetForm = () => {
    setFormData({
      classId: '', subjectId: '', teacherId: '', dayOfWeek: 'Monday',
      startTime: '08:00', endTime: '09:00', room: '',
      term: 'Term 1', academicYear: new Date().getFullYear().toString()
    });
  };

  const resetAssignForm = () => {
    setAssignForm({
      teacherId: '', classId: '', subjectId: '', dayOfWeek: 'Monday',
      startTime: '08:00', endTime: '09:00', room: '',
      term: 'Term 1', academicYear: new Date().getFullYear().toString(),
      message: ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.subjectId || !formData.teacherId) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setIsSaving(true);
      const res = await api.post('/timetables', formData);
      if (res.data.success) {
        toast.success('Timetable entry created');
        setShowAddModal(false);
        fetchData();
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.put(`/timetables/${selectedEntry.id}`, formData);
      if (res.data.success) {
        toast.success('Entry updated');
        setShowEditModal(false);
        setSelectedEntry(null);
        fetchData();
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSaving(true);
      const res = await api.delete(`/timetables/${entryToDelete.id}`);
      if (res.data.success) {
        toast.success('Entry deleted');
        setShowDeleteModal(false);
        setEntryToDelete(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignToTeacher = async (e) => {
    e.preventDefault();
    if (!assignForm.teacherId || !assignForm.classId || !assignForm.subjectId) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        teacherId: parseInt(assignForm.teacherId),
        classId: parseInt(assignForm.classId),
        subjectId: parseInt(assignForm.subjectId),
        dayOfWeek: assignForm.dayOfWeek,
        startTime: assignForm.startTime,
        endTime: assignForm.endTime,
        room: assignForm.room,
        term: assignForm.term || 'Term 1',
        academicYear: assignForm.academicYear || new Date().getFullYear().toString(),
        message: assignForm.message || `You have been assigned to teach ${assignForm.dayOfWeek} at ${assignForm.startTime} - ${assignForm.endTime}`
      };
      const res = await api.post('/timetables/assign-to-teacher', payload);
      if (res.data.success) {
        toast.success('✅ Timetable assigned to teacher!');
        setShowAssignModal(false);
        resetAssignForm();
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkEntries.length) {
      toast.error('Add at least one entry');
      return;
    }
    try {
      setIsSaving(true);
      const res = await api.post('/timetables/bulk', { entries: bulkEntries });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowBulkModal(false);
        setBulkEntries([]);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk creation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClone = async () => {
    try {
      setIsSaving(true);
      const res = await api.post('/timetables/clone', cloneData);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowCloneModal(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Clone failed');
    } finally {
      setIsSaving(false);
    }
  };

  const addBulkEntry = () => {
    if (!formData.classId || !formData.subjectId || !formData.teacherId) {
      toast.error('Select class, subject, and teacher');
      return;
    }
    setBulkEntries([...bulkEntries, {
      classId: formData.classId,
      subjectId: formData.subjectId,
      teacherId: formData.teacherId,
      dayOfWeek: bulkDay,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room,
      term: selectedTerm,
      academicYear: selectedYear
    }]);
    toast.success('Added to bulk list');
  };

  const removeBulkEntry = (index) => {
    setBulkEntries(bulkEntries.filter((_, i) => i !== index));
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setFormData({
      classId: entry.classId || '',
      subjectId: entry.subjectId || '',
      teacherId: entry.teacherId || '',
      dayOfWeek: entry.dayOfWeek || 'Monday',
      startTime: entry.startTime || '08:00',
      endTime: entry.endTime || '09:00',
      room: entry.room || '',
      term: entry.term || 'Term 1',
      academicYear: entry.academicYear || new Date().getFullYear().toString()
    });
    setShowEditModal(true);
  };

  const openViewModal = (entry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  const exportCSV = () => {
    if (!filtered.length) {
      toast.error('No data to export');
      return;
    }
    const headers = 'Class,Subject,Teacher,Day,Start,End,Room,Term,Year\n';
    const rows = filtered.map(t =>
      `${t.class?.className || 'N/A'},${t.subject?.subjectName || 'N/A'},${t.teacher?.fullName || 'N/A'},${t.dayOfWeek},${t.startTime},${t.endTime},${t.room || ''},${t.term},${t.academicYear}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `timetable_${selectedTerm}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported');
  };

  // ================= RENDER GRID VIEW =================
  const renderGridView = () => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-gray-50 border p-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">Time</th>
              {dayOrder.map(day => (
                <th key={day} className="bg-gray-50 border p-3 text-center text-xs font-semibold text-gray-500 uppercase min-w-[120px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time, index) => {
              const nextTime = timeSlots[index + 1] || '18:00';
              return (
                <tr key={time}>
                  <td className="border p-2 text-xs font-medium text-gray-500 text-center">{time}</td>
                  {dayOrder.map(day => {
                    const entry = filtered.find(t =>
                      t.dayOfWeek === day &&
                      t.startTime <= time &&
                      t.endTime > time
                    );
                    if (entry) {
                      const rowSpan = Math.ceil(
                        (new Date(`1970-01-01T${entry.endTime}`) - new Date(`1970-01-01T${entry.startTime}`)) /
                        (1000 * 60 * 30)
                      );
                      const isFirst = !filtered.some(t =>
                        t.id !== entry.id &&
                        t.dayOfWeek === day &&
                        t.startTime <= time &&
                        t.endTime > time
                      );
                      if (isFirst) {
                        return (
                          <td
                            key={`${day}-${time}`}
                            rowSpan={rowSpan}
                            className="border p-2 bg-purple-50 hover:bg-purple-100 cursor-pointer transition"
                            onClick={() => openViewModal(entry)}
                          >
                            <div className="text-sm font-medium text-purple-800">{entry.subject?.subjectName}</div>
                            <div className="text-xs text-gray-600">{entry.teacher?.fullName}</div>
                            <div className="text-xs text-gray-500">{entry.room}</div>
                          </td>
                        );
                      }
                      return null;
                    }
                    // Empty slot
                    if (!filtered.some(t => t.dayOfWeek === day && t.startTime <= time && t.endTime > time)) {
                      return (
                        <td key={`${day}-${time}`} className="border p-2 bg-gray-50 h-12">
                          <div className="text-xs text-gray-300 text-center">-</div>
                        </td>
                      );
                    }
                    return null;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ================= RENDER LIST VIEW =================
  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Day</th>
            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Room</th>
            <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No timetable entries</p>
                <p className="text-sm mt-1">Adjust filters or add a new entry</p>
              </td>
            </tr>
          ) : (
            currentItems.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50 transition">
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <School className="w-3 h-3" />
                    {entry.class?.className}
                  </span>
                </td>
                <td className="p-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    {entry.subject?.subjectName}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {entry.teacher?.fullName}
                  </div>
                </td>
                <td className="p-3 text-sm font-medium">{entry.dayOfWeek}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {entry.startTime} - {entry.endTime}
                  </div>
                </td>
                <td className="p-3">
                  {entry.room && (
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {entry.room}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openViewModal(entry)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openEditModal(entry)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { setEntryToDelete(entry); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading timetable...</p>
        </div>
      </div>
    );
  }

  // ================= MAIN RENDER =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span>Master Timetable</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Full control over school schedule · Assign, edit, and manage all entries</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition font-medium text-sm border border-emerald-200/50">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition font-medium text-sm border border-blue-200/50">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => { resetAssignForm(); setShowAssignModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium text-sm">
              <UserPlus className="w-4 h-4" /> Assign
            </button>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium text-sm">
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={CalendarDays} label="Total Entries" value={timetables.length} color="purple" />
          <StatCard icon={School} label="Classes" value={classes.length} color="blue" />
          <StatCard icon={User} label="Teachers" value={teachers.length} color="green" />
          <StatCard icon={BookOpen} label="Subjects" value={subjects.length} color="amber" />
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition bg-white">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Teacher</label>
              <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition bg-white">
                <option value="">All Teachers</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
              <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition bg-white">
                <option value="all">All Days</option>
                {days.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
              <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition bg-white">
                <option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
              <input type="text" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition bg-white" />
            </div>
            <div className="flex-1 min-w-[180px] relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <Search className="absolute left-3 top-[34px] w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Subject, teacher, room..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition bg-white" />
            </div>
            <button onClick={() => fetchData()} className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Load
            </button>
            <button onClick={() => { setSelectedClass(''); setSelectedTeacher(''); setSelectedDay('all'); setSearchTerm(''); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium text-sm">
              Clear
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">View:</span>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-gray-500 ml-auto">
              {filtered.length} entries found
            </div>
          </div>
        </div>

        {/* Timetable Display */}
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
          {viewMode === 'grid' ? renderGridView() : renderListView()}
          {filtered.length > perPage && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200/70">
              <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) page = currentPage - 3 + i;
                    if (page > totalPages) return null;
                  }
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3.5 py-1.5 border rounded-xl text-sm transition ${currentPage === page ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODALS ================= */}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200/70">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Plus className="w-5 h-5 text-purple-600" /> Add Timetable Entry</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                  <select name="classId" value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <select name="subjectId" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                  <select name="teacherId" value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Day *</label>
                  <select name="dayOfWeek" value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required>
                    {days.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                  <input type="text" name="room" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="Room 101" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" />
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200/70">
                  <button type="submit" disabled={isSaving} className="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save Entry'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedEntry && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200/70">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Edit className="w-5 h-5 text-amber-600" /> Edit Timetable Entry</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Same fields as add */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                  <select name="classId" value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <select name="subjectId" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                  <select name="teacherId" value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Day *</label>
                  <select name="dayOfWeek" value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required>
                    {days.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                  <input type="text" name="room" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="Room 101" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" />
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200/70">
                  <button type="submit" disabled={isSaving} className="flex-1 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Updating...' : 'Update Entry'}
                  </button>
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && entryToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Entry</h3>
              <p className="text-gray-500 text-sm mb-4">
                Are you sure you want to delete this entry for <span className="font-semibold text-gray-700">{entryToDelete.subject?.subjectName} - {entryToDelete.class?.className}</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-5 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleDelete} disabled={isSaving} className="flex-1 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedEntry && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between border-b border-gray-200/70 pb-4 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Entry Details</h3>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Class</span><span className="font-medium">{selectedEntry.class?.className}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Subject</span><span className="font-medium">{selectedEntry.subject?.subjectName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Teacher</span><span className="font-medium">{selectedEntry.teacher?.fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Day</span><span className="font-medium">{selectedEntry.dayOfWeek}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{selectedEntry.startTime} - {selectedEntry.endTime}</span></div>
                {selectedEntry.room && <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-medium">{selectedEntry.room}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Term</span><span className="font-medium">{selectedEntry.term}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="font-medium">{selectedEntry.academicYear}</span></div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="w-full mt-5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm">Close</button>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200/70 bg-gradient-to-r from-green-50 to-emerald-50">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" /> Assign to Teacher</h3>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-white/60 rounded-xl transition"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleAssignToTeacher} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 flex items-start gap-2">
                  <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>The teacher will receive a notification about this assignment.</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                  <select value={assignForm.teacherId} onChange={e => setAssignForm({...assignForm, teacherId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/30 outline-none transition" required>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                  <select value={assignForm.classId} onChange={e => setAssignForm({...assignForm, classId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/30 outline-none transition" required>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <select value={assignForm.subjectId} onChange={e => setAssignForm({...assignForm, subjectId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/30 outline-none transition" required>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Day *</label>
                  <select value={assignForm.dayOfWeek} onChange={e => setAssignForm({...assignForm, dayOfWeek: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/30 outline-none transition" required>
                    {days.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                    <input type="time" value={assignForm.startTime} onChange={e => setAssignForm({...assignForm, startTime: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/30 outline-none transition" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                    <input type="time" value={assignForm.endTime} onChange={e => setAssignForm({...assignForm, endTime: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/30 outline-none transition" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                  <input type="text" value={assignForm.room} onChange={e => setAssignForm({...assignForm, room: e.target.value})} placeholder="Room 101" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/30 outline-none transition" />
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200/70">
                  <button type="submit" disabled={isSaving} className="flex-1 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Assigning...' : 'Assign & Notify'}
                  </button>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200/70">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Copy className="w-5 h-5 text-blue-600" /> Bulk Add</h3>
                <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                    <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition">
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Day *</label>
                    <select value={bulkDay} onChange={e => setBulkDay(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition">
                      {days.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                    <select value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition">
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                    <select value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition">
                      <option value="">Select Teacher</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                    <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                    <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                  <input type="text" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="Room 101" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" />
                </div>
                <button type="button" onClick={addBulkEntry} className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm disabled:opacity-50" disabled={!formData.classId || !formData.subjectId || !formData.teacherId}>
                  Add to Bulk List
                </button>
                {bulkEntries.length > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 p-2 text-sm font-medium text-gray-700 flex justify-between">
                      <span>Bulk List ({bulkEntries.length} entries)</span>
                      <button onClick={() => setBulkEntries([])} className="text-red-500 hover:text-red-700 text-xs">Clear All</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {bulkEntries.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border-t border-gray-100 text-sm">
                          <span>{entry.dayOfWeek} {entry.startTime}-{entry.endTime}</span>
                          <button onClick={() => removeBulkEntry(i)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t border-gray-200/70">
                  <button onClick={handleBulkCreate} disabled={!bulkEntries.length || isSaving} className="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : `Save All (${bulkEntries.length})`}
                  </button>
                  <button type="button" onClick={() => setShowBulkModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clone Modal */}
        {showCloneModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 text-center mb-6">Clone Timetable</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">From Term *</label>
                    <select value={cloneData.fromTerm} onChange={e => setCloneData({...cloneData, fromTerm: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition">
                      <option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">From Year *</label>
                    <input type="text" value={cloneData.fromYear} onChange={e => setCloneData({...cloneData, fromYear: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">To Term *</label>
                    <select value={cloneData.toTerm} onChange={e => setCloneData({...cloneData, toTerm: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition">
                      <option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">To Year *</label>
                    <input type="text" value={cloneData.toYear} onChange={e => setCloneData({...cloneData, toYear: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class (Optional)</label>
                  <select value={cloneData.classId} onChange={e => setCloneData({...cloneData, classId: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/30 outline-none transition">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200/70">
                  <button onClick={handleClone} disabled={isSaving} className="flex-1 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    {isSaving ? 'Cloning...' : 'Clone'}
                  </button>
                  <button type="button" onClick={() => setShowCloneModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTimetable;