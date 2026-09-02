// TeacherManagement.jsx – final with many‑to‑many assignment
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  Phone,
  School,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Loader2,
  User,
  GraduationCap,
  Building,
  MapPin,
  Calendar,
  Eye,
  UserCheck,
  BookMarked,
  Brain,
  Sparkles,
  Target,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown
} from "lucide-react";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const TeacherManagement = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [error, setError] = useState(null);
  
  // AI Analytics State
  const [aiInsights, setAiInsights] = useState(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    classId: "",
    subjectId: "",
    specialization: ""
  });

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    teacherId: "",
    subjectId: "",
    classId: ""
  });

  // ================= AI INTELLIGENCE ENGINE =================
  const generateAIInsights = useCallback((teachersData, classesData, subjectsData) => {
    const totalTeachers = teachersData.length;
    const teachersWithClass = teachersData.filter(t => t.classId || t.class).length;
    const teachersWithSubject = teachersData.filter(t => t.subjects && t.subjects.length > 0).length;
    const teachersWithBoth = teachersData.filter(t => (t.classId || t.class) && t.subjects && t.subjects.length > 0).length;
    const teachersWithoutBoth = teachersData.filter(t => !(t.classId || t.class) && !(t.subjects || t.subjects.length > 0)).length;
    
    const classCoverage = classesData.length > 0 ? (teachersWithClass / classesData.length) * 100 : 0;
    const subjectCoverage = subjectsData.length > 0 ? (teachersWithSubject / subjectsData.length) * 100 : 0;
    
    const insights = {
      summary: {
        totalTeachers,
        teachersWithClass,
        teachersWithSubject,
        teachersWithBoth,
        teachersWithoutBoth,
        classCoverage: classCoverage.toFixed(1),
        subjectCoverage: subjectCoverage.toFixed(1)
      },
      recommendations: [],
      alerts: []
    };
    
    if (teachersWithoutBoth > 0) {
      insights.recommendations.push({
        type: "warning",
        icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
        title: `${teachersWithoutBoth} teachers need assignment`,
        description: `${teachersWithoutBoth} teachers have no class or subject assigned. Consider assigning them to fill gaps.`,
        action: "View Unassigned Teachers"
      });
    }
    
    if (classCoverage < 70) {
      insights.recommendations.push({
        type: "info",
        icon: <School className="w-4 h-4 text-blue-500" />,
        title: "Class Coverage Below Target",
        description: `Only ${classCoverage.toFixed(1)}% of classes have teachers assigned. Target is 100%.`,
        action: "Assign Teachers to Classes"
      });
    }
    
    if (subjectCoverage < 70) {
      insights.recommendations.push({
        type: "info",
        icon: <BookOpen className="w-4 h-4 text-purple-500" />,
        title: "Subject Coverage Below Target",
        description: `Only ${subjectCoverage.toFixed(1)}% of subjects have teachers assigned. Target is 100%.`,
        action: "Assign Teachers to Subjects"
      });
    }
    
    if (totalTeachers === 0) {
      insights.recommendations.push({
        type: "info",
        icon: <Brain className="w-4 h-4 text-purple-500" />,
        title: "Start Building Your Team",
        description: "Your teacher roster is empty. Start by adding your first teacher to the system.",
        action: "Add Teacher"
      });
    }
    
    return insights;
  }, []);

  // ================= FETCH DATA =================
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

      const [teachersRes, classesRes, subjectsRes] = await Promise.all([
        api.get("/teachers", config),
        api.get("/classes", config),
        api.get("/subjects", config)
      ]);

      // Process Teachers
      let teachersData = teachersRes.data || [];
      if (teachersData.data && Array.isArray(teachersData.data)) {
        teachersData = teachersData.data;
      }
      if (teachersData.teachers && Array.isArray(teachersData.teachers)) {
        teachersData = teachersData.teachers;
      }
      if (!Array.isArray(teachersData)) {
        teachersData = [];
      }

      // Process Classes
      let classesData = classesRes.data || [];
      if (classesData.data && Array.isArray(classesData.data)) {
        classesData = classesData.data;
      }
      if (classesData.classes && Array.isArray(classesData.classes)) {
        classesData = classesData.classes;
      }
      if (!Array.isArray(classesData)) {
        classesData = [];
      }

      // Process Subjects
      let subjectsData = subjectsRes.data || [];
      if (subjectsData.data && Array.isArray(subjectsData.data)) {
        subjectsData = subjectsData.data;
      }
      if (subjectsData.subjects && Array.isArray(subjectsData.subjects)) {
        subjectsData = subjectsData.subjects;
      }
      if (!Array.isArray(subjectsData)) {
        subjectsData = [];
      }

      console.log("📌 Teachers fetched:", teachersData);
      console.log("📌 First teacher:", teachersData[0]);

      setTeachers(teachersData);
      setFilteredTeachers(teachersData);
      setClasses(classesData);
      setSubjects(subjectsData);

      const insights = generateAIInsights(teachersData, classesData, subjectsData);
      setAiInsights(insights);

    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to load teacher data");
      toast.error("Failed to load teacher data");
    } finally {
      setIsLoading(false);
    }
  }, [generateAIInsights]);

  // ================= INITIAL FETCH =================
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= APPLY FILTERS =================
  useEffect(() => {
    let filtered = [...teachers];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.fullName?.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        (t.phoneNumber && t.phoneNumber.includes(term))
      );
    }
    
    if (selectedClass !== "All") {
      filtered = filtered.filter(t => 
        t.classId === parseInt(selectedClass) || 
        t.class?.id === parseInt(selectedClass)
      );
    }
    
    if (selectedSubject !== "All") {
      filtered = filtered.filter(t => 
        t.subjects && t.subjects.some(s => s.id == parseInt(selectedSubject))
      );
    }
    
    setFilteredTeachers(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedSubject, teachers]);

  // ================= PAGINATION =================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  // ================= STATISTICS =================
  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    const teachersWithClass = teachers.filter(t => t.classId || t.class).length;
    const teachersWithSubject = teachers.filter(t => t.subjects && t.subjects.length > 0).length;
    const teachersWithBoth = teachers.filter(t => (t.classId || t.class) && t.subjects && t.subjects.length > 0).length;
    const teachersWithoutBoth = teachers.filter(t => !(t.classId || t.class) && !(t.subjects || t.subjects.length > 0)).length;
    
    return {
      totalTeachers,
      teachersWithClass,
      teachersWithSubject,
      teachersWithBoth,
      teachersWithoutBoth,
      classCoverage: classes.length > 0 ? ((teachersWithClass / classes.length) * 100).toFixed(1) : 0,
      subjectCoverage: subjects.length > 0 ? ((teachersWithSubject / subjects.length) * 100).toFixed(1) : 0
    };
  }, [teachers, classes, subjects]);

  // ================= HANDLE FORM CHANGE =================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm(prev => ({ ...prev, [name]: value }));
  };

  // ================= CREATE TEACHER =================
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error("Teacher name is required");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        classId: formData.classId ? parseInt(formData.classId) : null,
        // subjectId is not needed for creation; subjects assigned later via many-to-many
      };

      const response = await api.post("/teachers", payload, config);
      const newTeacher = response.data || response;
      
      setTeachers(prev => [...prev, newTeacher]);
      setFilteredTeachers(prev => [...prev, newTeacher]);
      
      toast.success("Teacher created successfully!");
      setShowAddModal(false);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        classId: "",
        subjectId: "",
        specialization: ""
      });
      
      const insights = generateAIInsights(
        [...teachers, newTeacher],
        classes,
        subjects
      );
      setAiInsights(insights);
      
    } catch (error) {
      console.error("Create error:", error);
      toast.error(error.response?.data?.message || "Failed to create teacher");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= UPDATE TEACHER =================
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error("Teacher name is required");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        classId: formData.classId ? parseInt(formData.classId) : null,
      };

      const response = await api.put(`/teachers/${selectedTeacher.id}`, payload, config);
      const updatedTeacher = response.data || response;
      
      const updatedTeachers = teachers.map(t => 
        t.id === updatedTeacher.id ? updatedTeacher : t
      );
      setTeachers(updatedTeachers);
      setFilteredTeachers(updatedTeachers);
      
      toast.success("Teacher updated successfully!");
      setShowEditModal(false);
      setSelectedTeacher(null);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        classId: "",
        subjectId: "",
        specialization: ""
      });
      
      const insights = generateAIInsights(updatedTeachers, classes, subjects);
      setAiInsights(insights);
      
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update teacher");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= DELETE TEACHER =================
  const handleDelete = async () => {
    if (!teacherToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await api.delete(`/teachers/${teacherToDelete.id}`, config);

      const updatedTeachers = teachers.filter(t => t.id !== teacherToDelete.id);
      setTeachers(updatedTeachers);
      setFilteredTeachers(updatedTeachers);
      
      toast.success("Teacher deleted successfully!");
      setShowDeleteModal(false);
      setTeacherToDelete(null);
      
      const insights = generateAIInsights(updatedTeachers, classes, subjects);
      setAiInsights(insights);
      
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete teacher");
    } finally {
      setIsDeleting(false);
    }
  };

  // ================= ASSIGN TEACHER TO SUBJECT (MANY-TO-MANY) =================
  const handleAssignTeacherSubject = async (e) => {
    e.preventDefault();
    
    if (!assignmentForm.teacherId || !assignmentForm.subjectId || !assignmentForm.classId) {
      toast.error("Please select teacher, subject, and class");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // ✅ Update class and assign subject via many‑to‑many
      // First, update the class (if needed)
      await api.put(`/teachers/${assignmentForm.teacherId}`, {
        classId: parseInt(assignmentForm.classId)
      }, config);

      // Then assign subject using many‑to‑many endpoint
      await api.post(
        `/subjects/${assignmentForm.subjectId}/teachers/${assignmentForm.teacherId}`,
        {},
        config
      );

      toast.success("Teacher assigned successfully!");
      setShowAssignmentModal(false);
      setAssignmentForm({ teacherId: "", subjectId: "", classId: "" });
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error.response?.data?.message || "Failed to assign teacher");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= OPEN MODALS =================
  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      fullName: teacher.fullName || "",
      email: teacher.email || "",
      phoneNumber: teacher.phoneNumber || "",
      classId: teacher.classId || teacher.class?.id || "",
      subjectId: "",
      specialization: teacher.specialization || ""
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailsModal(true);
  };

  const openAssignmentModal = (teacher) => {
    setSelectedTeacher(teacher);
    setAssignmentForm({
      teacherId: teacher.id,
      subjectId: "",
      classId: teacher.classId || ""
    });
    setShowAssignmentModal(true);
  };

  // ================= GET CLASS NAME =================
  const getClassName = (classId) => {
    if (!classId) return "Not Assigned";
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.className : "Not Assigned";
  };

  // ================= GET SUBJECT NAMES (from subjects array) =================
  const getSubjectNames = (teacher) => {
    if (!teacher || !teacher.subjects || teacher.subjects.length === 0) return "Not Assigned";
    return teacher.subjects.map(s => s.subjectName).join(", ");
  };

  // ================= EXPORT CSV =================
  const exportCSV = () => {
    if (filteredTeachers.length === 0) {
      toast.error("No teachers to export");
      return;
    }

    const headers = ["Full Name,Email,Phone,Class,Subjects,Status,Created Date\n"];
    const rows = filteredTeachers.map(t => {
      const subjectNames = getSubjectNames(t);
      return `"${t.fullName || ''}","${t.email || ''}","${t.phoneNumber || ''}","${getClassName(t.classId)}","${subjectNames}","${(t.classId && t.subjects && t.subjects.length > 0) ? 'Fully Assigned' : 'Partial'}","${new Date(t.createdAt).toLocaleDateString()}"\n`;
    });

    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `teachers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading teacher data...</p>
        </div>
      </div>
    );
  }

  // ================= ERROR STATE =================
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
            <Award className="w-7 h-7 text-purple-600" />
            Teacher Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage teachers, assignments, and performance analytics
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
              showAIInsights ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Brain className="w-4 h-4" />
            AI Insights
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* ================= AI INSIGHTS PANEL ================= */}
      {showAIInsights && aiInsights && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">AI Intelligence Insights</h2>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Smart Analytics</span>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-500">Total Teachers</p>
              <p className="text-xl font-bold text-purple-700">{aiInsights.summary.totalTeachers}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-500">With Class</p>
              <p className="text-xl font-bold text-blue-600">{aiInsights.summary.teachersWithClass}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-500">With Subject</p>
              <p className="text-xl font-bold text-green-600">{aiInsights.summary.teachersWithSubject}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-500">Class Coverage</p>
              <p className={`text-xl font-bold ${aiInsights.summary.classCoverage >= 70 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                {aiInsights.summary.classCoverage}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-xs text-gray-500">Subject Coverage</p>
              <p className={`text-xl font-bold ${aiInsights.summary.subjectCoverage >= 70 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                {aiInsights.summary.subjectCoverage}%
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {aiInsights.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommendations</p>
              {aiInsights.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  {rec.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                    <p className="text-xs text-gray-500">{rec.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (rec.action === "Add Teacher") setShowAddModal(true);
                      else if (rec.action === "View Unassigned Teachers") {
                        setSearchTerm("");
                        setSelectedClass("All");
                        setSelectedSubject("All");
                      }
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {rec.action} →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Teachers</p>
          <p className="text-2xl font-bold text-purple-700">{stats.totalTeachers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">With Class</p>
          <p className="text-2xl font-bold text-blue-600">{stats.teachersWithClass}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">With Subject</p>
          <p className="text-2xl font-bold text-green-600">{stats.teachersWithSubject}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Unassigned</p>
          <p className="text-2xl font-bold text-amber-600">{stats.teachersWithoutBoth}</p>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white min-w-[150px]"
          >
            <option value="All">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.className}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white min-w-[150px]"
          >
            <option value="All">All Subjects</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
            ))}
          </select>

          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ================= TEACHERS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentItems.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No teachers found</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Teacher" to create your first teacher</p>
          </div>
        ) : (
          currentItems.map((teacher) => {
            const hasClass = !!(teacher.classId || teacher.class);
            const hasSubject = !!(teacher.subjects && teacher.subjects.length > 0);
            const subjectNames = getSubjectNames(teacher);
            
            return (
              <div
                key={teacher.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                          {teacher.fullName?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-800 truncate">
                            {teacher.fullName}
                          </h3>
                          <p className="text-xs text-gray-400">{teacher.email || 'No email'}</p>
                        </div>
                      </div>
                    </div>
                    {hasClass && hasSubject ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Full
                      </span>
                    ) : (hasClass || hasSubject) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Partial
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Unassigned
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <School className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{getClassName(teacher.classId)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{subjectNames}</span>
                    </div>
                    {teacher.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{teacher.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openDetailsModal(teacher)}
                      className="flex-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition"
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      Details
                    </button>
                    <button
                      onClick={() => openAssignmentModal(teacher)}
                      className="px-2 py-1.5 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-xs font-medium text-indigo-700 transition"
                      title="Assign"
                    >
                      <UserCheck className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => openEditModal(teacher)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setTeacherToDelete(teacher);
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
      {filteredTeachers.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTeachers.length)} of {filteredTeachers.length} teachers
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
                  className={`px-3 py-1 border rounded-lg text-sm transition ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
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

      {/* ================= ADD TEACHER MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Add New Teacher</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="john.doe@school.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  placeholder="e.g., 0772 123 456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Class
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select class (optional)</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.className}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject
                </label>
                {/* Since subjects are assigned via many-to-many, we don't have a single subjectId field. 
                    We can keep this as a selection for initial assignment? Not needed. */}
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select subject (optional)</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Teacher
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TEACHER MODAL ================= */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Edit Teacher</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Class
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select class (optional)</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.className}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Teacher
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteModal && teacherToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Teacher</h3>
              <p className="text-gray-500 text-sm mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-700">{teacherToDelete.fullName}</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Teacher'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ASSIGN TEACHER MODAL (MANY-TO-MANY) ================= */}
      {showAssignmentModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Assign Teacher</h3>
                <p className="text-sm text-gray-500">Teacher: {selectedTeacher.fullName}</p>
                <p className="text-xs text-gray-400">Current subjects: {getSubjectNames(selectedTeacher)}</p>
              </div>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacherSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="classId"
                  value={assignmentForm.classId}
                  onChange={handleAssignmentChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.className}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subjectId"
                  value={assignmentForm.subjectId}
                  onChange={handleAssignmentChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Assign Teacher
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {showDetailsModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedTeacher.fullName}</h3>
                <p className="text-sm text-gray-500">Teacher Details</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.fullName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.email || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.phoneNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium text-gray-800">{getClassName(selectedTeacher.classId)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Subjects</p>
                  <p className="font-medium text-gray-800">{getSubjectNames(selectedTeacher)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium text-gray-800">
                    {(selectedTeacher.classId && selectedTeacher.subjects && selectedTeacher.subjects.length > 0) ? 'Fully Assigned' : 'Partial'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openEditModal(selectedTeacher);
                  }}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition"
                >
                  Edit Teacher
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openAssignmentModal(selectedTeacher);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
                >
                  Assign Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;