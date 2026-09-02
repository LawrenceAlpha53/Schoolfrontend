// src/Pages/Admin/AdminClasses.jsx – with enhanced level detection
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, Clock, BookOpen, Search, Plus, Edit, Trash2,
  Eye, Download, X, Save, Loader2, RefreshCw,
  ArrowUpDown, UserCircle, Shield, ChevronLeft, ChevronRight,
  School, BookOpen as BookOpenIcon,
  Users as UsersIcon, UserCheck as UserCheckIcon,
  ClipboardList, Award, GraduationCap, AlertCircle, CheckCircle
} from 'lucide-react';
import axios from '../api/axios';
import { extractData } from '../utils/apiHelpers';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// ---------- Helpers ----------
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const StatusBadge = ({ status }) => {
  const map = {
    active: 'bg-green-100 text-green-800 border border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
    archived: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  };
  const cls = map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border border-gray-200';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${cls}`}>{status || 'Active'}</span>;
};

// ---------- Stat Card ----------
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50/60 text-blue-700 border-blue-200/80',
    green: 'bg-green-50/60 text-green-700 border-green-200/80',
    purple: 'bg-purple-50/60 text-purple-700 border-purple-200/80',
    emerald: 'bg-emerald-50/60 text-emerald-700 border-emerald-200/80',
    rose: 'bg-rose-50/60 text-rose-700 border-rose-200/80',
    amber: 'bg-amber-50/60 text-amber-700 border-amber-200/80',
  };
  return (
    <div className={`p-6 rounded-xl border ${colors[color]} bg-white transition hover:shadow-md flex flex-col items-center text-center`}>
      <div className="p-3 bg-white rounded-xl border border-inherit shadow-xs mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-2xl font-bold tracking-tight text-gray-950">{value}</div>
      <div className="text-xs font-medium text-gray-500 mt-1">{label}</div>
    </div>
  );
};

// ---------- Main Component ----------
export default function AdminClasses() {
  console.log('📌 AdminClasses: Component rendering...');

  // ---------- State ----------
  const [classes, setClasses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  // Filters & Sort
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('className');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 6;

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [detailLoading, setDetailLoading] = useState(false);

  // ================= HELPER: Get assigned teachers for a class =================
  const getAssignedTeachers = (classId) => {
    if (!classId || !teachers.length) return [];
    return teachers.filter(t => t.classId === classId);
  };

  const getAssignedTeacherNames = (classId) => {
    return getAssignedTeachers(classId).map(t => t.fullName);
  };

  // ================= Data Fetching =================
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/classes');
      const data = extractData(res);
      setClasses(data || []);
      console.log('📌 Classes loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ fetchClasses error:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await axios.get('/teachers');
      const data = extractData(res);
      setTeachers(data || []);
      console.log('📌 Teachers loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ fetchTeachers error:', error);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await axios.get('/subjects');
      const data = extractData(res);
      setSubjects(data || []);
      console.log('📌 Subjects loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ fetchSubjects error:', error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get('/students');
      const data = extractData(res);
      setStudents(data || []);
      console.log('📌 Students loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ fetchStudents error:', error);
    }
  }, []);

  // Fetch a single class by ID (for detail modal)
  const fetchClassById = useCallback(async (id) => {
    try {
      const res = await axios.get(`/classes/${id}`);
      return extractData(res);
    } catch (error) {
      console.error('❌ fetchClassById error:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
    fetchStudents();
  }, []);

  // ---------- Filter & Sort ----------
  useEffect(() => {
    let result = [...classes];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c =>
        c.className?.toLowerCase().includes(s) ||
        c.classTeacher?.toLowerCase().includes(s) ||
        getAssignedTeacherNames(c.id).some(name => name.toLowerCase().includes(s))
      );
    }
    if (statusFilter) {
      result = result.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    const field = sortBy;
    const order = sortOrder === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let va = a[field] || '';
      let vb = b[field] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return va < vb ? -1 * order : va > vb ? 1 * order : 0;
    });
    setFiltered(result);
    setPage(1);
  }, [classes, search, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ---------- CRUD Actions ----------
  const handleCreate = async (data) => {
    try {
      const res = await axios.post('/classes', data);
      const newClass = extractData(res);
      setClasses(prev => [...prev, newClass]);
      toast.success('Class created successfully');
      setShowCreate(false);
    } catch (error) {
      console.error('❌ Create error:', error);
      toast.error('Creation failed');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await axios.put(`/classes/${id}`, data);
      const updated = extractData(res);
      setClasses(prev => prev.map(c => c.id === id ? updated : c));
      toast.success('Class updated successfully');
      setShowEdit(false);
    } catch (error) {
      console.error('❌ Update error:', error);
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/classes/${id}`);
      setClasses(prev => prev.filter(c => c.id !== id));
      toast.success('Class deleted successfully');
      setShowDelete(false);
      setToDelete(null);
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast.error('Delete failed');
    }
  };

  // ---------- Detail Modal ----------
  const openDetail = async (classItem) => {
    setDetailLoading(true);
    try {
      const fullClass = await fetchClassById(classItem.id);
      const merged = { ...classItem, ...fullClass };
      console.log('🔍 Merged class item:', merged);
      setSelected(merged);
      setDetailTab('overview');
      setShowDetail(true);
    } catch (error) {
      setSelected(classItem);
      setShowDetail(true);
      toast.error('Could not load full details; showing cached data.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelected(null);
    setDetailTab('overview');
  };

  // Export Excel
  const exportExcel = () => {
    const data = filtered.map(c => ({
      'Class Name': c.className,
      'Class Teacher': c.classTeacher || 'Not Assigned',
      'Assigned Teachers': getAssignedTeacherNames(c.id).join(', ') || 'None',
      'Level': c.level || c.classLevel || c.levelName || 'N/A',
      'Students': students.filter(s => s.classId === c.id || s.class?.id === c.id).length || 0,
      'Status': c.status || 'Active',
      'Created': formatDate(c.createdAt)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Classes');
    XLSX.writeFile(wb, `Classes_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success('Exported successfully');
  };

  // Stats
  const total = classes.length;
  const activeClasses = classes.filter(c => c.status?.toLowerCase() !== 'archived').length;
  const totalStudents = students.length;
  const totalSubjects = subjects.length;
  const teachersWithClass = teachers.filter(t => t.classId).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 antialiased text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <School className="w-7 h-7 text-blue-600" />
            Classes Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage all classes, assign teachers, and track student enrollment.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchClasses(); fetchTeachers(); }} className="p-2 text-gray-500 hover:text-blue-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition shadow-sm">
            <RefreshCw className="h-4 w-4" />
          </button>
          <span className="text-xs bg-gray-100 px-3 py-1.5 rounded-md font-medium text-gray-600 border border-gray-200">
            {total} Classes Registered
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={School} label="Total Classes" value={total} color="blue" />
        <StatCard icon={BookOpenIcon} label="Subjects" value={totalSubjects} color="purple" />
        <StatCard icon={UsersIcon} label="Total Students" value={totalStudents} color="green" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={UserCheckIcon} label="Active Classes" value={activeClasses} color="emerald" />
        <StatCard icon={UserCheck} label="Teachers Assigned" value={teachersWithClass} color="amber" />
        <StatCard icon={Award} label="Unassigned Teachers" value={teachers.length - teachersWithClass} color="rose" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search classes or teachers..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="className">Sort by Name</option>
            <option value="classTeacher">Sort by Teacher</option>
            <option value="createdAt">Sort by Created</option>
          </select>
          <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition bg-white">
            <ArrowUpDown className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowCreate(true)} className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            <Plus className="h-4 w-4" /> Add Class
          </button>
          <button onClick={exportExcel} className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs text-gray-400 font-medium">Loading class data...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No classes found</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Class" to create your first class</p>
          </div>
        ) : (
          paginated.map(c => {
            const studentCount = students.filter(s => s.classId === c.id || s.class?.id === c.id).length;
            const subjectCount = subjects.filter(s => s.classId === c.id || s.class?.id === c.id).length;
            const assignedTeachers = getAssignedTeachers(c.id);
            const hasTeacher = !!c.classTeacher || assignedTeachers.length > 0;

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{c.className}</h3>
                        {hasTeacher ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Staffed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            No Teacher
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <Award className="w-4 h-4 inline mr-1" />
                        Class Teacher: {c.classTeacher || "Not Assigned"}
                      </p>
                      {assignedTeachers.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          <Users className="w-3 h-3 inline mr-1" />
                          Assigned Teachers: {assignedTeachers.map(t => t.fullName).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <Users className="w-4 h-4 text-blue-600 mx-auto mb-0.5" />
                      <p className="text-xs text-gray-500">Students</p>
                      <p className="text-sm font-bold text-blue-700">{studentCount}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <BookOpen className="w-4 h-4 text-purple-600 mx-auto mb-0.5" />
                      <p className="text-xs text-gray-500">Subjects</p>
                      <p className="text-sm font-bold text-purple-700">{subjectCount}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center">
                      <UserCheck className="w-4 h-4 text-amber-600 mx-auto mb-0.5" />
                      <p className="text-xs text-gray-500">Teachers</p>
                      <p className="text-sm font-bold text-amber-700">{assignedTeachers.length}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openDetail(c)}
                      className="flex-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition"
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => { setSelected(c); setShowEdit(true); }}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setToDelete(c); setShowDelete(true); }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} classes
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={i}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 border rounded-lg text-sm transition ${
                    p === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------- Modals ---------- */}
      {showCreate && (
        <ClassFormModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          teachers={teachers}
          title="Add New Class"
        />
      )}
      {showEdit && selected && (
        <ClassFormModal
          onClose={() => { setShowEdit(false); setSelected(null); }}
          onSubmit={(data) => handleUpdate(selected.id, data)}
          teachers={teachers}
          initialData={selected}
          title="Edit Class"
        />
      )}
      {showDelete && toDelete && (
        <DeleteModal
          onClose={() => { setShowDelete(false); setToDelete(null); }}
          onConfirm={() => handleDelete(toDelete.id)}
          className={toDelete.className}
        />
      )}
      {showDetail && selected && (
        <ClassDetailModal
          classItem={selected}
          onClose={closeDetail}
          tab={detailTab}
          setTab={setDetailTab}
          teachers={teachers}
          subjects={subjects}
          students={students}
          getAssignedTeachers={getAssignedTeachers}
          loading={detailLoading}
        />
      )}
    </div>
  );
}

// ---------- Class Form Modal ----------
const ClassFormModal = ({ onClose, onSubmit, teachers, initialData, title }) => {
  const [formData, setFormData] = useState({
    className: '',
    classTeacher: '',
    level: 'O-Level',
    status: 'Active',
    ...initialData
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <School className="h-5 w-5 text-blue-600" /> {title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Class Name *</label>
            <input
              type="text"
              name="className"
              value={formData.className}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              placeholder="e.g. Senior 1 East O-Level"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Class Teacher</label>
            <select
              name="classTeacher"
              value={formData.classTeacher}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Select a teacher</option>
              {teachers.map(t => (
                <option key={t.id} value={t.fullName}>{t.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Level</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="O-Level">O-Level</option>
              <option value="A-Level">A-Level</option>
              <option value="Primary">Primary</option>
              <option value="Nursery">Nursery</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end border-t border-gray-100 pt-3 mt-5">
            <button type="button" onClick={onClose} className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Save className="h-3.5 w-3.5" /> Save Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------- Delete Modal ----------
const DeleteModal = ({ onClose, onConfirm, className }) => {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 text-rose-600">
          <Shield className="h-5 w-5" /> Delete Class
        </h2>
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          You are about to permanently delete <span className="font-semibold text-gray-900">{className}</span>.
          This action cannot be undone and will remove all associated data.
        </p>
        <div className="flex gap-2 justify-end border-t border-gray-100 pt-3 mt-5">
          <button type="button" onClick={onClose} className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Delete Class
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Class Detail Modal (with ULTRA-SMART level detection) ----------
const ClassDetailModal = ({ classItem, onClose, tab, setTab, teachers, subjects, students, getAssignedTeachers, loading }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'students', label: 'Students', icon: UsersIcon },
    { id: 'subjects', label: 'Subjects', icon: BookOpenIcon },
    { id: 'teachers', label: 'Teachers', icon: UserCheckIcon }
  ];

  const classStudents = students.filter(s => s.classId === classItem.id || s.class?.id === classItem.id);
  const classSubjects = subjects.filter(s => s.classId === classItem.id || s.class?.id === classItem.id);
  const classTeachers = getAssignedTeachers(classItem.id);

  // ========== ULTRA-SMART LEVEL DETECTION ==========
  const getLevel = () => {
    if (!classItem) return 'Not Specified';

    // 1. Check for explicit fields (if you later add them)
    if (classItem.level) return classItem.level;
    if (classItem.classLevel) return classItem.classLevel;
    if (classItem.levelName) return classItem.levelName;
    if (classItem.academicLevel) return classItem.academicLevel;

    const name = classItem.className || '';
    const lower = name.toLowerCase().trim();

    // 2. Direct matches for "A-Level" and "O-Level"
    if (lower.includes('a-level') || lower.includes('alevel') || lower.includes('a level')) {
      return 'A-Level';
    }
    if (lower.includes('o-level') || lower.includes('olevel') || lower.includes('o level')) {
      return 'O-Level';
    }

    // 3. Detect by "Senior", "S.", "Form", "S" patterns with numbers
    // Extract digits (1-6) from the string
    const digitMatch = name.match(/\b([1-6])\b/);
    if (digitMatch) {
      const num = parseInt(digitMatch[1], 10);
      if (num >= 1 && num <= 4) return 'O-Level';
      if (num >= 5 && num <= 6) return 'A-Level';
    }

    // 4. Detect spelled-out numbers: one, two, three, four, five, six
    const wordMap = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
      'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5, 'sixth': 6
    };
    for (const [word, num] of Object.entries(wordMap)) {
      if (lower.includes(word)) {
        if (num >= 1 && num <= 4) return 'O-Level';
        if (num >= 5 && num <= 6) return 'A-Level';
      }
    }

    // 5. Check for "S" followed by number (S1, S.1, S 1)
    const sMatch = name.match(/s\.?\s*([1-6])/i);
    if (sMatch) {
      const num = parseInt(sMatch[1], 10);
      if (num >= 1 && num <= 4) return 'O-Level';
      if (num >= 5 && num <= 6) return 'A-Level';
    }

    // 6. Check for "Form" (Form 1, Form 2, etc.)
    const formMatch = name.match(/form\s*([1-6])/i);
    if (formMatch) {
      const num = parseInt(formMatch[1], 10);
      if (num >= 1 && num <= 4) return 'O-Level';
      if (num >= 5 && num <= 6) return 'A-Level';
    }

    // 7. If none matched, log and return fallback
    console.warn(`⚠️ Could not infer level for class: "${name}"`);
    return 'Not Specified';
  };

  // Log the detection for debugging
  console.log(`📚 Class: "${classItem?.className}" → Level: "${getLevel()}"`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white text-base border border-white/10 uppercase">
              {classItem?.className?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{classItem?.className}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {getLevel()} · {classItem?.status || 'Active'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-50 border-b border-gray-200 overflow-x-auto shrink-0">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-xs font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition ${
                  active
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Basic Information</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-gray-400">Class Name:</span>
                          <span className="font-semibold text-gray-900">{classItem?.className}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-gray-400">Level:</span>
                          <span className="font-semibold text-gray-900">{getLevel()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <StatusBadge status={classItem?.status || 'Active'} />
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Staff & Students</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-gray-400">Class Teacher:</span>
                          <span className="font-semibold text-gray-900">{classItem?.classTeacher || 'Not Assigned'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-gray-400">Total Students:</span>
                          <span className="font-semibold text-gray-900">{classStudents.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Subject Offered:</span>
                          <span className="font-semibold text-gray-900">{classSubjects.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Metadata</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-gray-400">Created:</span>
                          <span className="font-semibold text-gray-900">{formatDate(classItem?.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Updated:</span>
                          <span className="font-semibold text-gray-900">{formatDate(classItem?.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STUDENTS TAB */}
              {tab === 'students' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h4 className="text-xs font-bold text-gray-900 tracking-wider uppercase">
                      Enrolled Students ({classStudents.length})
                    </h4>
                  </div>
                  {classStudents.length === 0 ? (
                    <p className="text-gray-400 text-sm">No students enrolled in this class.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3">Student Name</th>
                            <th className="px-4 py-3">Student Number</th>
                            <th className="px-4 py-3">Gender</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {classStudents.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-semibold text-gray-900">{s.fullName}</td>
                              <td className="px-4 py-3 font-mono">{s.studentNumber}</td>
                              <td className="px-4 py-3">{s.gender || 'N/A'}</td>
                              <td className="px-4 py-3">
                                <StatusBadge status={s.status || 'Active'} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUBJECTS TAB */}
              {tab === 'subjects' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h4 className="text-xs font-bold text-gray-900 tracking-wider uppercase">
                      Subjects Offered ({classSubjects.length})
                    </h4>
                  </div>
                  {classSubjects.length === 0 ? (
                    <p className="text-gray-400 text-sm">No subjects assigned to this class.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3">Subject Name</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Examinable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {classSubjects.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-semibold text-gray-900">{s.subjectName}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                                  {s.category || 'Core'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.examinable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                  {s.examinable ? 'Yes' : 'No'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TEACHERS TAB */}
              {tab === 'teachers' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h4 className="text-xs font-bold text-gray-900 tracking-wider uppercase">
                      Teachers Assigned ({classTeachers.length})
                    </h4>
                  </div>
                  {classTeachers.length === 0 ? (
                    <p className="text-gray-400 text-sm">No teachers assigned to this class.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3">Teacher Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Subject</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {classTeachers.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-semibold text-gray-900">{t.fullName}</td>
                              <td className="px-4 py-3">{t.email}</td>
                              <td className="px-4 py-3">{t.phoneNumber || 'N/A'}</td>
                              <td className="px-4 py-3">{t.subject?.subjectName || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};