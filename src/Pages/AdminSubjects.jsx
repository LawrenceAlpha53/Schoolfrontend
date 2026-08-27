// AdminSubjects.jsx - Full Version with Class Information
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, X, Save, Loader2, ArrowLeft,
  RefreshCw, Search, Edit, Trash2, CheckCircle,
  XCircle, AlertCircle, Layers, Filter, Eye, Clock,
  CalendarDays, User, Building, ClipboardList,
  GraduationCap, School, Award, Star, BookMarked,
  Zap, ListChecks, Users, UserCheck, BarChart3,
  ChevronDown, ChevronUp, Info, Tag, Hash, BookMarked as BookMarkedIcon
} from 'lucide-react';

const AdminSubjects = () => {
  const navigate = useNavigate();
  
  // ================= STATE =================
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [showAssignClass, setShowAssignClass] = useState(false);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState(new Set());
  const [classMap, setClassMap] = useState({});

  // Stats
  const [stats, setStats] = useState({
    total: 0, olevel: 0, alevel: 0, compulsory: 0, elective: 0, withTeachers: 0,
    assignedToClass: 0, unassignedToClass: 0
  });

  // ================= SUBJECT FORM =================
  const [subjectForm, setSubjectForm] = useState({
    subjectName: '',
    subjectCode: '',
    level: 'olevel',
    category: 'core',
    description: '',
    isCompulsory: false,
    examinable: true,
    classId: ''
  });

  const subjectCategories = [
    { value: 'core', label: 'Core' },
    { value: 'science', label: 'Science' },
    { value: 'humanities', label: 'Humanities' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'language', label: 'Language' },
    { value: 'vocational', label: 'Vocational' },
    { value: 'practical', label: 'Practical' },
    { value: 'creative', label: 'Creative' },
    { value: 'technology', label: 'Technology' },
    { value: 'elective', label: 'Elective' }
  ];

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [subjectsRes, classesRes, teachersRes] = await Promise.all([
        api.get('/subjects', config),
        api.get('/classes', config),
        api.get('/teachers', config)
      ]);

      const extractArray = (res) => {
        if (!res || !res.data) return [];
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d.data && Array.isArray(d.data)) return d.data;
        if (d.success && Array.isArray(d.data)) return d.data;
        return [];
      };

      const subjectsData = extractArray(subjectsRes);
      const classesData = extractArray(classesRes);
      const teachersData = extractArray(teachersRes);

      // Build class map for quick lookup
      const classMapObj = {};
      classesData.forEach(c => { classMapObj[c.id] = c.className; });
      setClassMap(classMapObj);

      // Enrich subjects with class name
      const enrichedSubjects = subjectsData.map(s => ({
        ...s,
        className: s.classId ? classMapObj[s.classId] : '—'
      }));

      setSubjects(enrichedSubjects);
      setClasses(classesData);
      setTeachers(teachersData);

      // Compute stats
      const withTeachers = teachersData.filter(t => t.subjects && t.subjects.length > 0);
      const assignedToClass = subjectsData.filter(s => s.classId);
      
      setStats({
        total: subjectsData.length,
        olevel: subjectsData.filter(s => s.level === 'olevel').length,
        alevel: subjectsData.filter(s => s.level === 'alevel').length,
        compulsory: subjectsData.filter(s => s.isCompulsory).length,
        elective: subjectsData.filter(s => !s.isCompulsory).length,
        withTeachers: withTeachers.length,
        assignedToClass: assignedToClass.length,
        unassignedToClass: subjectsData.length - assignedToClass.length
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ================= HELPERS =================
  const getClassName = (classId) => {
    if (!classId) return '—';
    return classMap[classId] || '—';
  };

  const getAssignedTeachers = (subjectId) => {
    return teachers.filter(t => {
      if (t.subjects && Array.isArray(t.subjects)) {
        return t.subjects.some(s => s.id == subjectId);
      }
      return false;
    });
  };

  const toggleExpand = (subjectId) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(subjectId)) {
      newSet.delete(subjectId);
    } else {
      newSet.add(subjectId);
    }
    setExpandedSubjects(newSet);
  };

  // ================= HANDLE FORM CHANGE =================
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubjectForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ================= ADD / UPDATE SUBJECT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subjectForm.subjectName || !subjectForm.subjectCode) {
      toast.error('Subject Name and Code are required');
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const subjectData = {
        subjectName: subjectForm.subjectName.trim(),
        subjectCode: subjectForm.subjectCode.trim().toUpperCase(),
        level: subjectForm.level,
        category: subjectForm.category,
        description: subjectForm.description || '',
        isCompulsory: subjectForm.isCompulsory,
        examinable: subjectForm.examinable,
        classId: subjectForm.classId || null
      };

      if (isEditing && selectedSubject) {
        await api.put(`/subjects/${selectedSubject.id}`, subjectData, config);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/subjects', subjectData, config);
        toast.success('Subject added successfully');
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save subject');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= ASSIGN CLASS TO SUBJECT =================
  const handleAssignClass = async () => {
    if (!assignClassId) return toast.error('Select a class');
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await api.put(`/subjects/${selectedSubject.id}`, { 
        classId: assignClassId 
      }, config);
      
      toast.success('Class assigned to subject');
      setShowAssignClass(false);
      fetchData();
    } catch (error) {
      console.error('Assign class error:', error);
      toast.error(error.response?.data?.message || 'Assignment failed');
    }
  };

  // ================= REMOVE CLASS FROM SUBJECT =================
  const handleRemoveClass = async (subjectId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await api.put(`/subjects/${subjectId}`, { 
        classId: null 
      }, config);
      
      toast.success('Class removed from subject');
      fetchData();
    } catch (error) {
      console.error('Remove class error:', error);
      toast.error('Failed to remove class');
    }
  };

  // ================= ASSIGN TEACHER =================
  const openAssignTeacher = (subject) => {
    setSelectedSubject(subject);
    setAssignTeacherId('');
    setShowAssignTeacher(true);
  };

  const openAssignClass = (subject) => {
    setSelectedSubject(subject);
    setAssignClassId(subject.classId || '');
    setShowAssignClass(true);
  };

  const handleAssignTeacher = async () => {
    if (!assignTeacherId) return toast.error('Select a teacher');
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const teacher = teachers.find(t => t.id == assignTeacherId);
      if (!teacher) return toast.error('Teacher not found');
      
      const currentSubjectIds = teacher.subjects?.map(s => s.id) || [];
      const newSubjectIds = [...currentSubjectIds, parseInt(selectedSubject.id)];
      
      await api.put(`/teachers/${assignTeacherId}`, { 
        subjectIds: newSubjectIds 
      }, config);
      
      toast.success('Teacher assigned to subject');
      setShowAssignTeacher(false);
      fetchData();
    } catch (error) {
      console.error('Assign error:', error);
      toast.error(error.response?.data?.message || 'Assignment failed');
    }
  };

  const handleUnassignTeacher = async (teacherId, subjectId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const teacher = teachers.find(t => t.id == teacherId);
      if (!teacher) return toast.error('Teacher not found');
      
      const currentSubjectIds = teacher.subjects?.map(s => s.id) || [];
      const newSubjectIds = currentSubjectIds.filter(id => id != subjectId);
      
      await api.put(`/teachers/${teacherId}`, { 
        subjectIds: newSubjectIds 
      }, config);
      
      toast.success('Teacher unassigned from subject');
      fetchData();
    } catch (error) {
      console.error('Unassign error:', error);
      toast.error('Unassignment failed');
    }
  };

  // ================= EDIT SUBJECT =================
  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setIsEditing(true);
    setSubjectForm({
      subjectName: subject.subjectName || '',
      subjectCode: subject.subjectCode || '',
      level: subject.level || 'olevel',
      category: subject.category || 'core',
      description: subject.description || '',
      isCompulsory: subject.isCompulsory || false,
      examinable: subject.examinable !== false,
      classId: subject.classId || ''
    });
    document.getElementById('subject-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ================= DELETE SUBJECT =================
  const handleDelete = async () => {
    if (!subjectToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.delete(`/subjects/${subjectToDelete.id}`, config);
      toast.success('Subject deleted');
      setShowDeleteModal(false);
      setSubjectToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setSubjectForm({
      subjectName: '', subjectCode: '', level: 'olevel', category: 'core',
      description: '', isCompulsory: false, examinable: true, classId: ''
    });
    setIsEditing(false);
    setSelectedSubject(null);
  };

  // ================= FILTER SUBJECTS =================
  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = !searchTerm || sub.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || sub.level === filterLevel;
    const matchesCategory = filterCategory === 'all' || sub.category === filterCategory;
    const matchesClass = filterClass === 'all' || (filterClass === 'assigned' && sub.classId) || 
                         (filterClass === 'unassigned' && !sub.classId);
    return matchesSearch && matchesLevel && matchesCategory && matchesClass;
  });

  // ================= GET CATEGORY COLOR =================
  const getCategoryColor = (category) => {
    const colors = {
      core: 'bg-purple-100 text-purple-700 border-purple-200',
      science: 'bg-blue-100 text-blue-700 border-blue-200',
      humanities: 'bg-amber-100 text-amber-700 border-amber-200',
      commercial: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      language: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      vocational: 'bg-orange-100 text-orange-700 border-orange-200',
      practical: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      creative: 'bg-rose-100 text-rose-700 border-rose-200',
      technology: 'bg-slate-100 text-slate-700 border-slate-200',
      elective: 'bg-teal-100 text-teal-700 border-teal-200'
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getLevelLabel = (level) => level === 'alevel' ? 'A-Level' : 'O-Level';
  const getLevelColor = (level) => level === 'alevel' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-600" />
            Subject Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage all school subjects, categories, class assignments, and teacher assignments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Subjects', value: stats.total, icon: BookOpen, color: 'purple' },
          { label: 'O-Level', value: stats.olevel, icon: GraduationCap, color: 'blue' },
          { label: 'A-Level', value: stats.alevel, icon: Award, color: 'indigo' },
          { label: 'Compulsory', value: stats.compulsory, icon: Star, color: 'amber' },
          { label: 'Assigned to Class', value: stats.assignedToClass, icon: School, color: 'emerald' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 text-center">
            <div className={`inline-flex p-2 rounded-lg bg-${item.color}-100 text-${item.color}-600 mb-1`}>
              <item.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`text-xl font-bold text-${item.color}-600`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name or code..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
          </div>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[130px]">
            <option value="all">All Levels</option>
            <option value="olevel">O-Level</option>
            <option value="alevel">A-Level</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[140px]">
            <option value="all">All Categories</option>
            {subjectCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[140px]">
            <option value="all">All Subjects</option>
            <option value="assigned">Assigned to Class</option>
            <option value="unassigned">Not Assigned to Class</option>
          </select>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Subject</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-500 uppercase">Code</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-500 uppercase">Level</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-500 uppercase">Class</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-500 uppercase">Teachers</th>
                <th className="text-center p-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-slate-500">No subjects found</td></tr>
              ) : (
                filteredSubjects.map(subject => {
                  const assignedTeachers = getAssignedTeachers(subject.id);
                  const isExpanded = expandedSubjects.has(subject.id);
                  const hasClass = subject.classId && subject.className !== '—';
                  
                  return (
                    <React.Fragment key={subject.id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase">
                              {subject.subjectName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{subject.subjectName}</p>
                              {subject.description && <p className="text-xs text-slate-400 truncate max-w-[180px]">{subject.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4"><span className="text-sm font-mono text-slate-600">{subject.subjectCode}</span></td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(subject.level)}`}>{getLevelLabel(subject.level)}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(subject.category)}`}>
                            {subject.category || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {hasClass ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {subject.className}
                              </span>
                              <button 
                                onClick={() => handleRemoveClass(subject.id)}
                                className="text-red-400 hover:text-red-600 transition"
                                title="Remove class from this subject"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {assignedTeachers.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {assignedTeachers.slice(0, 2).map(t => (
                                <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  {t.fullName || t.name || 'Unknown'}
                                  <button 
                                    onClick={() => handleUnassignTeacher(t.id, subject.id)} 
                                    className="text-red-500 hover:text-red-700 transition"
                                    title="Remove teacher from this subject"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                              {assignedTeachers.length > 2 && (
                                <button 
                                  onClick={() => toggleExpand(subject.id)}
                                  className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                                >
                                  +{assignedTeachers.length - 2} more
                                </button>
                              )}
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setSelectedSubject(subject); setShowDetail(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(subject)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => openAssignClass(subject)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Assign to Class">
                              <School className="w-4 h-4" />
                            </button>
                            <button onClick={() => openAssignTeacher(subject)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Assign Teacher">
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSubjectToDelete(subject); setShowDeleteModal(true); }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded teachers row */}
                      {isExpanded && assignedTeachers.length > 2 && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="7" className="p-3 pl-16">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs text-slate-500 font-medium mr-2">All Teachers:</span>
                              {assignedTeachers.map(t => (
                                <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  {t.fullName || t.name || 'Unknown'}
                                  <button 
                                    onClick={() => handleUnassignTeacher(t.id, subject.id)} 
                                    className="text-red-500 hover:text-red-700 transition"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                              <button 
                                onClick={() => toggleExpand(subject.id)}
                                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                              >
                                Show less
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form */}
      <div id="subject-form" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Edit Subject' : 'Add New Subject'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
              <input type="text" name="subjectName" value={subjectForm.subjectName} onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
              <input type="text" name="subjectCode" value={subjectForm.subjectCode} onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm uppercase" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select name="level" value={subjectForm.level} onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="olevel">O-Level</option>
                <option value="alevel">A-Level</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={subjectForm.category} onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                {subjectCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Class</label>
              <select name="classId" value={subjectForm.classId} onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">Not Assigned</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={subjectForm.description} onChange={handleFormChange}
              rows="2" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm resize-none" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isCompulsory" checked={subjectForm.isCompulsory}
                onChange={handleFormChange} className="w-4 h-4 text-purple-600 rounded" />
              Compulsory
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="examinable" checked={subjectForm.examinable}
                onChange={handleFormChange} className="w-4 h-4 text-purple-600 rounded" />
              Examinable
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button type="submit" disabled={isSaving}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? 'Update Subject' : 'Add Subject'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">Cancel</button>
          </div>
        </form>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedSubject.subjectName}</h3>
              <button onClick={() => setShowDetail(false)} className="hover:bg-gray-100 rounded-lg p-1"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Code</p>
                <p className="font-medium">{selectedSubject.subjectCode}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Level</p>
                <p className="font-medium">{getLevelLabel(selectedSubject.level)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Category</p>
                <p className="font-medium">{selectedSubject.category || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Class</p>
                <p className="font-medium">{selectedSubject.className || '—'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Compulsory</p>
                <p className="font-medium">{selectedSubject.isCompulsory ? '✅ Yes' : '❌ No'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Examinable</p>
                <p className="font-medium">{selectedSubject.examinable ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>

            {selectedSubject.description && (
              <div className="mb-4">
                <p className="text-slate-500 text-xs mb-1">Description</p>
                <p className="text-sm text-gray-700 bg-slate-50 p-3 rounded-lg">{selectedSubject.description}</p>
              </div>
            )}

            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Assigned Teachers ({getAssignedTeachers(selectedSubject.id).length})
              </h4>
              {getAssignedTeachers(selectedSubject.id).length > 0 ? (
                <div className="space-y-1">
                  {getAssignedTeachers(selectedSubject.id).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">{t.fullName || t.name || 'Unknown'}</span>
                      <button 
                        onClick={() => handleUnassignTeacher(t.id, selectedSubject.id)} 
                        className="text-red-500 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-2">No teachers assigned</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
              <button 
                onClick={() => { setShowDetail(false); openAssignTeacher(selectedSubject); }} 
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
              >
                Assign Teacher
              </button>
              <button 
                onClick={() => { setShowDetail(false); openAssignClass(selectedSubject); }} 
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
              >
                Assign Class
              </button>
              <button onClick={() => setShowDetail(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Class Modal */}
      {showAssignClass && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Assign Class to {selectedSubject.subjectName}</h3>
            <p className="text-sm text-slate-500 mb-4">Select which class should take this subject</p>
            
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-1">Current Class: <span className="font-medium text-slate-700">{selectedSubject.className || 'Not Assigned'}</span></p>
            </div>
            
            <select 
              value={assignClassId} 
              onChange={e => setAssignClassId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.className} {c.level ? `(${c.level})` : ''}
                </option>
              ))}
            </select>
            
            <div className="flex gap-3">
              <button onClick={() => setShowAssignClass(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">
                Cancel
              </button>
              <button 
                onClick={handleAssignClass} 
                disabled={!assignClassId}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                Assign Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignTeacher && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Assign Teacher to {selectedSubject.subjectName}</h3>
            <p className="text-sm text-slate-500 mb-4">Select a teacher to teach this subject</p>
            
            <select 
              value={assignTeacherId} 
              onChange={e => setAssignTeacherId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a teacher...</option>
              {teachers.filter(t => {
                const assigned = t.subjects?.some(s => s.id == selectedSubject.id) || false;
                return !assigned;
              }).map(t => (
                <option key={t.id} value={t.id}>
                  {t.fullName || t.name} {t.className ? `(${t.className})` : ''}
                </option>
              ))}
            </select>
            
            {teachers.filter(t => {
              const assigned = t.subjects?.some(s => s.id == selectedSubject.id) || false;
              return !assigned;
            }).length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg mb-4">All teachers are already assigned to this subject</p>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setShowAssignTeacher(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">
                Cancel
              </button>
              <button 
                onClick={handleAssignTeacher} 
                disabled={!assignTeacherId}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                Assign Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && subjectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Delete Subject</h3>
            <p className="text-slate-500 text-sm mb-4">
              Are you sure you want to delete <strong>{subjectToDelete.subjectName}</strong>?
              {subjectToDelete.className && subjectToDelete.className !== '—' && (
                <span className="block text-amber-600 mt-1">This subject is currently assigned to {subjectToDelete.className}</span>
              )}
              {getAssignedTeachers(subjectToDelete.id).length > 0 && (
                <span className="block text-amber-600 mt-1">This subject has {getAssignedTeachers(subjectToDelete.id).length} teacher(s) assigned</span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubjects;