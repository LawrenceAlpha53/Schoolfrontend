import {
  School, Plus, Edit, Trash2, Search, Users, BookOpen,
  Award, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Download, Printer, ChevronLeft, ChevronRight,
  X, Save, Loader2, UserPlus, GraduationCap, Building,
  Mail, Phone, UserCheck, ClipboardList, BookMarked
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const ClassManagement = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [error, setError] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    teacherId: "",
    subjectId: "",
    classId: ""
  });

  // Form state
  const [formData, setFormData] = useState({
    className: "",
    classTeacher: ""
  });

  // ================= DATA FETCHING =================
  const fetchData = async () => {
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

      const [classesRes, teachersRes, subjectsRes] = await Promise.all([
        api.get("/classes", config).catch(() => ({ data: [] })),
        api.get("/teachers", config).catch(() => ({ data: [] })),
        api.get("/subjects", config).catch(() => ({ data: [] }))
      ]);

      // Safe array extraction
      const extractArray = (res) => {
        if (!res || !res.data) return [];
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d.data && Array.isArray(d.data)) return d.data;
        if (d.success && Array.isArray(d.data)) return d.data;
        return [];
      };

      const classesData = extractArray(classesRes);
      const teachersData = extractArray(teachersRes);
      const subjectsData = extractArray(subjectsRes);

      setClasses(classesData);
      setFilteredClasses(classesData);
      setTeachers(teachersData);
      setSubjects(subjectsData);

    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= SEARCH FILTER =================
  useEffect(() => {
    let filtered = [...classes];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.className?.toLowerCase().includes(term) ||
        (c.classTeacher && c.classTeacher.toLowerCase().includes(term))
      );
    }
    setFilteredClasses(filtered);
    setCurrentPage(1);
  }, [searchTerm, classes]);

  // ================= PAGINATION =================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  // ================= HELPER FUNCTIONS =================
  // Get list of teacher names assigned to a specific class & subject (via teacher record)
  const getAssignedTeacherNames = (classId) => {
    return teachers
      .filter(t => t.classId === classId)
      .map(t => t.fullName);
  };

  // ================= FORM HANDLERS =================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm(prev => ({ ...prev, [name]: value }));
  };

  // ================= CREATE CLASS =================
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.className.trim()) {
      toast.error("Class name is required");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        className: formData.className.trim(),
        classTeacher: formData.classTeacher || null   // teacher's full name
      };

      const response = await api.post("/classes", payload, config);
      const newClass = response.data?.data || response.data || response;

      setClasses(prev => [...prev, newClass]);
      setFilteredClasses(prev => [...prev, newClass]);

      toast.success("Class created successfully!");
      setShowAddModal(false);
      setFormData({ className: "", classTeacher: "" });

    } catch (error) {
      console.error("Create error:", error);
      toast.error(error.response?.data?.message || "Failed to create class");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= UPDATE CLASS =================
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.className.trim()) {
      toast.error("Class name is required");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        className: formData.className.trim(),
        classTeacher: formData.classTeacher || null
      };

      const response = await api.put(`/classes/${selectedClass.id}`, payload, config);
      const updatedClass = response.data?.data || response.data || response;

      setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
      setFilteredClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));

      toast.success("Class updated successfully!");
      setShowEditModal(false);
      setSelectedClass(null);
      setFormData({ className: "", classTeacher: "" });

    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update class");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= DELETE CLASS =================
  const handleDelete = async () => {
    if (!classToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await api.delete(`/classes/${classToDelete.id}`, config);

      setClasses(prev => prev.filter(c => c.id !== classToDelete.id));
      setFilteredClasses(prev => prev.filter(c => c.id !== classToDelete.id));

      toast.success("Class deleted successfully!");
      setShowDeleteModal(false);
      setClassToDelete(null);

    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete class");
    } finally {
      setIsDeleting(false);
    }
  };

  // ================= ASSIGN TEACHER TO SUBJECT (UPDATE TEACHER RECORD) =================
  const handleAssignTeacherSubject = async (e) => {
    e.preventDefault();

    if (!assignmentForm.teacherId || !assignmentForm.subjectId || !assignmentForm.classId) {
      toast.error("Please select teacher, subject, and class");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Update the teacher's subjectId and classId
      await api.put(`/teachers/${assignmentForm.teacherId}`, {
        subjectId: parseInt(assignmentForm.subjectId),
        classId: parseInt(assignmentForm.classId)
      }, config);

      // Refresh the teachers list to reflect the change
      const teachersRes = await api.get("/teachers", config);
      const updatedTeachers = teachersRes.data?.data || teachersRes.data || [];
      setTeachers(Array.isArray(updatedTeachers) ? updatedTeachers : []);

      toast.success("Teacher assigned successfully!");
      setShowAssignmentModal(false);
      setAssignmentForm({ teacherId: "", subjectId: "", classId: "" });

    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error.response?.data?.message || "Failed to assign teacher");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= MODAL HELPERS =================
  const openEditModal = (cls) => {
    setSelectedClass(cls);
    setFormData({
      className: cls.className || "",
      classTeacher: cls.classTeacher || ""   // string (teacher's name)
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (cls) => {
    setSelectedClass(cls);
    setShowDetailsModal(true);
  };

  const openAssignmentModal = (cls) => {
    setSelectedClass(cls);
    setAssignmentForm({
      teacherId: "",
      subjectId: "",
      classId: cls.id
    });
    setShowAssignmentModal(true);
  };

  // ================= EXPORT CSV =================
  const exportCSV = () => {
    if (filteredClasses.length === 0) {
      toast.error("No classes to export");
      return;
    }

    const headers = ["Class Name,Class Teacher,Students Count,Subjects Count,Created Date\n"];
    const rows = filteredClasses.map(c =>
      `"${c.className || ''}","${c.classTeacher || 'Not Assigned'}","${c.students?.length || 0}","${c.subjects?.length || 0}","${new Date(c.createdAt).toLocaleDateString()}"\n`
    );

    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `classes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  // ================= LOADING / ERROR STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading class data...</p>
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
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
          <div className="text-xs text-gray-400 mt-4">
            <p>Make sure your server is running at http://localhost:5000</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <School className="w-7 h-7 text-purple-600" />
            Class Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage classes, teachers, subjects, and assignments
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => { setFormData({ className: "", classTeacher: "" }); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Classes</p>
          <p className="text-2xl font-bold text-purple-700">{classes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Teachers</p>
          <p className="text-2xl font-bold text-blue-600">{teachers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Subjects</p>
          <p className="text-2xl font-bold text-green-600">{subjects.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Assigned Teachers</p>
          <p className="text-2xl font-bold text-amber-600">{teachers.filter(t => t.subjectId).length}</p>
        </div>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by class name or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
        </div>
      </div>

      {/* ================= CLASSES GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentItems.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
            <School className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No classes found</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Class" to create your first class</p>
          </div>
        ) : (
          currentItems.map((cls) => {
            const studentCount = cls.students?.length || 0;
            const subjectCount = cls.subjects?.length || 0;
            const hasTeacher = !!cls.classTeacher;   // classTeacher is a string (name)
            const assignedTeachers = getAssignedTeacherNames(cls.id); // teachers with this classId

            return (
              <div
                key={cls.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{cls.className}</h3>
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
                        Class Teacher: {cls.classTeacher || "Not Assigned"}
                      </p>
                      {assignedTeachers.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          <Users className="w-3 h-3 inline mr-1" />
                          Teachers: {assignedTeachers.join(", ")}
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
                      onClick={() => openDetailsModal(cls)}
                      className="flex-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openAssignmentModal(cls)}
                      className="flex-1 px-2 py-1.5 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-xs font-medium text-indigo-700 transition"
                    >
                      <UserCheck className="w-3 h-3 inline mr-1" />
                      Assign
                    </button>
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setClassToDelete(cls);
                        setShowDeleteModal(true);
                      }}
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

      {/* ================= PAGINATION ================= */}
      {filteredClasses.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredClasses.length)} of {filteredClasses.length} classes
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded-lg text-sm transition ${currentPage === pageNum
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= ADD CLASS MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Add New Class</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Name <span className="text-red-500">*</span></label>
                <input type="text" name="className" value={formData.className} onChange={handleFormChange} placeholder="e.g., Senior One" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Teacher</label>
                <select name="classTeacher" value={formData.classTeacher} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="">Not Assigned</option>
                  {teachers.map(t => <option key={t.id} value={t.fullName}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Creating...' : 'Create Class'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT CLASS MODAL ================= */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Edit Class</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Name <span className="text-red-500">*</span></label>
                <input type="text" name="className" value={formData.className} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Teacher</label>
                <select name="classTeacher" value={formData.classTeacher} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="">Not Assigned</option>
                  {teachers.map(t => <option key={t.id} value={t.fullName}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Updating...' : 'Update Class'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ASSIGN TEACHER TO SUBJECT MODAL (UPDATED) ================= */}
      {showAssignmentModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Assign Teacher to Subject</h3>
                <p className="text-sm text-gray-500">Class: {selectedClass.className}</p>
              </div>
              <button onClick={() => setShowAssignmentModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAssignTeacherSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher <span className="text-red-500">*</span></label>
                <select name="teacherId" value={assignmentForm.teacherId} onChange={handleAssignmentChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" required>
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
                <select name="subjectId" value={assignmentForm.subjectId} onChange={handleAssignmentChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" required>
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  {isSaving ? 'Assigning...' : 'Assign Teacher'}
                </button>
                <button type="button" onClick={() => setShowAssignmentModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteModal && classToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Class</h3>
              <p className="text-gray-500 text-sm mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-700">{classToDelete.className}</span>?
                This will also remove all associated student and subject records.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm">Cancel</button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {showDetailsModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedClass.className}</h3>
                <p className="text-sm text-gray-500">Class Details</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Class Name</p>
                  <p className="font-medium text-gray-800">{selectedClass.className}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Class Teacher</p>
                  <p className="font-medium text-gray-800">{selectedClass.classTeacher || "Not Assigned"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Students Enrolled</p>
                  <p className="font-medium text-gray-800">{selectedClass.students?.length || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Subjects Offered</p>
                  <p className="font-medium text-gray-800">{selectedClass.subjects?.length || 0}</p>
                </div>
              </div>
              {/* Teacher-Subject Assignments */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-purple-600" />
                  Assigned Teachers
                </h4>
                {getAssignedTeacherNames(selectedClass.id).length === 0 ? (
                  <p className="text-sm text-gray-500">No teachers assigned to this class yet</p>
                ) : (
                  <div className="space-y-2">
                    {getAssignedTeacherNames(selectedClass.id).map((name, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm py-2 px-3 bg-gray-50 rounded-lg">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-700">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => { setShowDetailsModal(false); openAssignmentModal(selectedClass); }} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">Assign Teacher</button>
                <button onClick={() => { setShowDetailsModal(false); openEditModal(selectedClass); }} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition">Edit Class</button>
                <button onClick={() => { setShowDetailsModal(false); navigate(`/secretary/students?class=${selectedClass.id}`); }} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">View Students</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;