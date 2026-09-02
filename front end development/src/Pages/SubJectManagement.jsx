// SubjectManagement.jsx – FIXED with correct many‑to‑many assignment
import {
  BookOpen, Plus, Edit, Trash2, Search, School,
  Users, Award, Clock, CheckCircle, AlertCircle,
  RefreshCw, Download, ChevronLeft, ChevronRight,
  X, Save, Loader2, BookMarked, Eye, Filter,
  UserCheck, UserX, User
} from "lucide-react";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const SubjectManagement = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [error, setError] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subject form data
  const [formData, setFormData] = useState({
    subjectName: "",
    subjectCode: "",
    classId: "",
    level: "olevel",
    category: "core",
    description: "",
    isCompulsory: false,
    examinable: true
  });

  // Teacher assignment form
  const [assignForm, setAssignForm] = useState({
    teacherId: "",
    subjectId: ""
  });

  // ================= HELPER: Get teacher display name =================
  const getTeacherName = (teacher) => {
    if (!teacher) return 'Unnamed';
    if (teacher.user && (teacher.user.Fname || teacher.user.Lname)) {
      return `${teacher.user.Fname || ''} ${teacher.user.Lname || ''}`.trim();
    }
    if (teacher.fullName) return teacher.fullName;
    if (teacher.name) return teacher.name;
    return `Teacher #${teacher.id}`;
  };

  // ================= DATA FETCHING =================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const [subjectsRes, classesRes, teachersRes] = await Promise.all([
        api.get("/subjects", config).catch(() => ({ data: [] })),
        api.get("/classes", config).catch(() => ({ data: [] })),
        api.get("/teachers", config).catch(() => ({ data: [] }))
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
      let teachersData = extractArray(teachersRes);

      // Ensure teachers have user info accessible
      teachersData = teachersData.map(t => ({
        ...t,
        fullName: getTeacherName(t)
      }));

      setSubjects(subjectsData);
      setFilteredSubjects(subjectsData);
      setClasses(classesData);
      setTeachers(teachersData);

    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to load subject data");
      toast.error("Failed to load subject data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= FILTERING =================
  useEffect(() => {
    let filtered = [...subjects];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        (s.subjectName || '').toLowerCase().includes(term) ||
        (s.subjectCode || '').toLowerCase().includes(term)
      );
    }

    if (selectedClass !== "All") {
      filtered = filtered.filter(s => {
        if (s.classes && s.classes.length > 0) {
          return s.classes.some(c => c.id == selectedClass);
        }
        return s.classId == selectedClass;
      });
    }

    setFilteredSubjects(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedClass, subjects]);

  // ================= PAGINATION =================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

  // ================= HELPERS =================
  const getClassName = (classId) => {
    if (!classId) return "Not Assigned";
    const cls = classes.find(c => c.id == classId);
    return cls ? cls.className : "Not Assigned";
  };

  const getSubjectClassNames = (subject) => {
    if (subject.classes && subject.classes.length > 0) {
      return subject.classes.map(c => c.className).join(", ");
    }
    return getClassName(subject.classId);
  };

  // ================= FORM HANDLERS =================
  const resetForm = () => {
    setFormData({
      subjectName: "",
      subjectCode: "",
      classId: "",
      level: "olevel",
      category: "core",
      description: "",
      isCompulsory: false,
      examinable: true
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setAssignForm(prev => ({ ...prev, [name]: value }));
  };

  // ================= CRUD OPERATIONS =================
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.subjectName.trim() || !formData.subjectCode.trim()) {
      toast.error("Subject name and code are required");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        subjectName: formData.subjectName.trim(),
        subjectCode: formData.subjectCode.trim().toUpperCase(),
        classIds: formData.classId ? [parseInt(formData.classId)] : [],
        level: formData.level,
        category: formData.category,
        description: formData.description,
        isCompulsory: formData.isCompulsory,
        examinable: formData.examinable
      };

      await api.post("/subjects", payload, config);
      toast.success("Subject created successfully!");
      setShowAddModal(false);
      resetForm();
      fetchData();

    } catch (error) {
      console.error("Create error:", error);
      toast.error(error.response?.data?.message || "Failed to create subject");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.subjectName.trim() || !formData.subjectCode.trim()) {
      toast.error("Subject name and code are required");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        subjectName: formData.subjectName.trim(),
        subjectCode: formData.subjectCode.trim().toUpperCase(),
        classIds: formData.classId ? [parseInt(formData.classId)] : [],
        level: formData.level,
        category: formData.category,
        description: formData.description,
        isCompulsory: formData.isCompulsory,
        examinable: formData.examinable
      };

      await api.put(`/subjects/${selectedSubject.id}`, payload, config);
      toast.success("Subject updated successfully!");
      setShowEditModal(false);
      setSelectedSubject(null);
      resetForm();
      fetchData();

    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update subject");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await api.delete(`/subjects/${subjectToDelete.id}`, config);
      toast.success("Subject deleted successfully!");
      setShowDeleteModal(false);
      setSubjectToDelete(null);
      fetchData();

    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete subject");
    } finally {
      setIsDeleting(false);
    }
  };

  // ================= TEACHER ASSIGNMENT (FIXED) =================
  const openAssignModal = (subject) => {
    setSelectedSubject(subject);
    setAssignForm({ teacherId: "", subjectId: subject.id });
    setShowAssignModal(true);
  };

  // ✅ FIXED: Use the many‑to‑many endpoint: POST /subjects/:subjectId/teachers/:teacherId
  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!assignForm.teacherId) {
      toast.error("Please select a teacher");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Correct endpoint for many‑to‑many assignment
      await api.post(
        `/subjects/${selectedSubject.id}/teachers/${assignForm.teacherId}`,
        {},
        config
      );

      toast.success("Teacher assigned successfully!");
      // Re‑fetch to get updated subject.teachers arrays
      await fetchData();

      setShowAssignModal(false);
      setAssignForm({ teacherId: "", subjectId: "" });

    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error.response?.data?.message || "Failed to assign teacher");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ FIXED: Use the DELETE endpoint to unassign
  const handleUnassignTeacher = async (teacherId, subjectId) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await api.delete(`/subjects/${subjectId}/teachers/${teacherId}`, config);

      toast.success("Teacher unassigned from subject");
      await fetchData();

    } catch (error) {
      console.error("Unassign error:", error);
      toast.error(error.response?.data?.message || "Failed to unassign teacher");
    }
  };

  // ================= MODAL HELPERS =================
  const openEditModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      subjectName: subject.subjectName || "",
      subjectCode: subject.subjectCode || "",
      classId: subject.classId || (subject.classes && subject.classes.length > 0 ? subject.classes[0].id : ""),
      level: subject.level || "olevel",
      category: subject.category || "core",
      description: subject.description || "",
      isCompulsory: subject.isCompulsory || false,
      examinable: subject.examinable !== false
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (subject) => {
    setSelectedSubject(subject);
    setShowDetailsModal(true);
  };

  // ================= EXPORT CSV =================
  const exportCSV = () => {
    if (filteredSubjects.length === 0) return;
    const headers = ["Subject Name,Code,Class,Level,Category,Compulsory,Teachers,Created Date\n"];
    const rows = filteredSubjects.map(s => {
      const assignedNames = (s.teachers || []).map(t => getTeacherName(t)).join("; ");
      return `"${s.subjectName}","${s.subjectCode}","${getSubjectClassNames(s)}","${s.level}","${s.category}","${s.isCompulsory ? 'Yes' : 'No'}","${assignedNames || 'None'}","${new Date(s.createdAt).toLocaleDateString()}"\n`;
    });
    const blob = new Blob([...headers, ...rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `subjects_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  // ================= LOADING / ERROR =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading subjects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchData} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium">
            <RefreshCw className="w-4 h-4 inline mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ================= RENDER =================
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-600" /> Subject Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage subjects and teacher assignments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Subjects</p>
          <p className="text-2xl font-bold text-purple-700">{subjects.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Assigned Teachers</p>
          <p className="text-2xl font-bold text-green-600">
            {subjects.reduce((acc, s) => acc + (s.teachers ? s.teachers.length : 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Unassigned Teachers</p>
          <p className="text-2xl font-bold text-amber-600">
            {teachers.filter(t => !t.subjectId).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Classes</p>
          <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm" />
          </div>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[150px]">
            <option value="All">All Classes</option>
            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.className}</option>)}
          </select>
          <button onClick={fetchData} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentItems.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No subjects found</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Subject" to create your first subject</p>
          </div>
        ) : (
          currentItems.map((subject) => {
            const assignedTeachers = subject.teachers || [];
            return (
              <div key={subject.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-purple-600" />
                        <h3 className="text-base font-bold text-gray-800 truncate">{subject.subjectName}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Code: {subject.subjectCode}</p>
                      <p className="text-xs text-gray-500">{getSubjectClassNames(subject)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${assignedTeachers.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      <CheckCircle className="w-3 h-3" /> {assignedTeachers.length > 0 ? `${assignedTeachers.length} teacher(s)` : 'No Teacher'}
                    </span>
                  </div>

                  {assignedTeachers.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Teachers:</span>{' '}
                      {assignedTeachers.map(t => getTeacherName(t)).join(", ")}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => openDetailsModal(subject)} className="flex-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition">
                      <Eye className="w-3 h-3 inline mr-1" /> Details
                    </button>
                    <button onClick={() => openAssignModal(subject)} className="flex-1 px-2 py-1.5 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-xs font-medium text-indigo-700 transition">
                      <UserCheck className="w-3 h-3 inline mr-1" /> Assign
                    </button>
                    <button onClick={() => openEditModal(subject)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setSubjectToDelete(subject); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
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
      {filteredSubjects.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubjects.length)} of {filteredSubjects.length} subjects</p>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
              }
              return (
                <button key={i} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1 border rounded-lg text-sm ${currentPage === pageNum ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 hover:bg-gray-50'}`}>
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ================= ADD/EDIT SUBJECT MODAL ================= */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">{showAddModal ? 'Add New Subject' : 'Edit Subject'}</h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={showAddModal ? handleCreate : handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Name *</label>
                  <input type="text" name="subjectName" value={formData.subjectName} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Code *</label>
                  <input type="text" name="subjectCode" value={formData.subjectCode} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
                  <select name="level" value={formData.level} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="olevel">O-Level</option>
                    <option value="alevel">A-Level</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select name="category" value={formData.category} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="core">Core</option>
                    <option value="science">Science</option>
                    <option value="humanities">Humanities</option>
                    <option value="language">Language</option>
                    <option value="vocational">Vocational</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                <select name="classId" value={formData.classId} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Not Assigned</option>
                  {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.className}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea name="description" value={formData.description} onChange={handleFormChange} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isCompulsory" checked={formData.isCompulsory} onChange={handleFormChange} className="w-4 h-4" /> Compulsory
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="examinable" checked={formData.examinable} onChange={handleFormChange} className="w-4 h-4" /> Examinable
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : showAddModal ? 'Create Subject' : 'Update Subject'}
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ASSIGN TEACHER MODAL (FIXED) ================= */}
      {showAssignModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Assign Teacher</h3>
                <p className="text-sm text-gray-500">Subject: {selectedSubject.subjectName}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAssignTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                <select
                  name="teacherId"
                  value={assignForm.teacherId}
                  onChange={handleAssignChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select a teacher</option>
                  {/* Show only teachers not already assigned to this subject */}
                  {teachers
                    .filter(t => !(selectedSubject.teachers || []).some(st => st.id === t.id))
                    .map(t => (
                      <option key={t.id} value={t.id}>{getTeacherName(t)}</option>
                    ))}
                </select>
                {(selectedSubject.teachers || []).length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedSubject.teachers.length} teacher(s) already assigned to this subject.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  {isSaving ? 'Assigning...' : 'Assign Teacher'}
                </button>
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {showDeleteModal && subjectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Subject</h3>
              <p className="text-gray-500 text-sm mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-700">{subjectToDelete.subjectName}</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Subject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {showDetailsModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedSubject.subjectName}</h3>
                <p className="text-sm text-gray-500">Subject Details</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-500">Subject Code</p><p className="font-medium text-gray-800">{selectedSubject.subjectCode}</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-500">Level</p><p className="font-medium text-gray-800">{selectedSubject.level}</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-500">Category</p><p className="font-medium text-gray-800">{selectedSubject.category}</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-500">Class</p><p className="font-medium text-gray-800">{getSubjectClassNames(selectedSubject)}</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-500">Compulsory</p><p className="font-medium text-gray-800">{selectedSubject.isCompulsory ? 'Yes' : 'No'}</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-500">Examinable</p><p className="font-medium text-gray-800">{selectedSubject.examinable ? 'Yes' : 'No'}</p></div>
                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="font-medium text-gray-800">{selectedSubject.description || 'No description'}</p>
                </div>
              </div>

              {/* Assigned Teachers */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" /> Assigned Teachers
                </h4>
                {(selectedSubject.teachers || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No teachers assigned</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedSubject.teachers || []).map(teacher => (
                      <div key={teacher.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-700">{getTeacherName(teacher)}</span>
                        </div>
                        <button
                          onClick={() => handleUnassignTeacher(teacher.id, selectedSubject.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                          title="Unassign teacher"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => { setShowDetailsModal(false); openAssignModal(selectedSubject); }} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">
                  <UserCheck className="w-4 h-4 inline mr-1" /> Assign Teacher
                </button>
                <button onClick={() => { setShowDetailsModal(false); openEditModal(selectedSubject); }} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition">
                  Edit Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;