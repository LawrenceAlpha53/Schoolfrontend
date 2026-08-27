import {
  Users,
  Search,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  AlertCircle,
  RefreshCw,
  X,
  User,
  School,
  DollarSign,
  Users as UsersIcon,
  Phone
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

// ============================================================
//  CONSTANTS (unchanged)
// ============================================================
const MEDICAL_CONDITIONS = [
  "none", "allergy", "asthma", "diabetes", "epilepsy",
  "sicklecell", "heartcondition", "visualImpairment",
  "hearingImpairement", "physicalDisability", "other"
];

const STATUS_OPTIONS = ["Active", "Inactive", "Pending", "Graduated"];
const GENDER_OPTIONS = ["Male", "Female"];

// ============================================================
//  MAIN COMPONENT
// ============================================================
const StudentRecords = () => {
  const navigate = useNavigate();

  // ---------- STATE ----------
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedMedical, setSelectedMedical] = useState("All");
  const [hasParentPhone, setHasParentPhone] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------- NAVIGATION FUNCTIONS ----------
  const goToEditStudent = (studentId) => {
    navigate(`/secretary/studentedit/${studentId}`);
  };

  const goToStudentFees = (studentId) => {
    navigate(`/secretary/studentFees?studentId=${studentId}`);
  };

  const goToRegister = () => {
    navigate("/secretary/studentregistration");
  };

  // ---------- FETCH DATA ----------
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not logged in");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, classesRes] = await Promise.all([
        api.get("/students", config),
        api.get("/classes", config)
      ]);

      const studentArray = studentsRes.data?.data || studentsRes.data || [];
      const classArray = classesRes.data?.data || classesRes.data || [];

      setStudents(Array.isArray(studentArray) ? studentArray : []);
      setFilteredStudents(Array.isArray(studentArray) ? studentArray : []);
      setClasses(Array.isArray(classArray) ? classArray : []);
    } catch (error) {
      console.error("❌ Student fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to load students");
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- FILTER LOGIC ----------
  const applyFilters = () => {
    let filtered = [...students];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.fullName?.toLowerCase().includes(term) ||
        s.studentNumber?.toLowerCase().includes(term) ||
        s.parentName?.toLowerCase().includes(term) ||
        s.parentPhone?.includes(term)
      );
    }

    if (selectedClass !== "All") {
      filtered = filtered.filter(s => s.class?.className === selectedClass);
    }

    if (selectedStatus !== "All") {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }

    if (selectedGender !== "All") {
      filtered = filtered.filter(s => s.gender === selectedGender);
    }

    if (selectedMedical !== "All") {
      filtered = filtered.filter(s => s.medicalcondition === selectedMedical);
    }

    if (hasParentPhone) {
      filtered = filtered.filter(s => s.parentPhone && s.parentPhone.trim() !== "");
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter(s => new Date(s.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => new Date(s.createdAt) <= to);
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  // ---------- EFFECTS ----------
  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    searchTerm,
    selectedClass,
    selectedStatus,
    selectedGender,
    selectedMedical,
    hasParentPhone,
    dateFrom,
    dateTo,
    students
  ]);

  // ---------- PAGINATION ----------
  const totalFiltered = filteredStudents.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (page) => setCurrentPage(page);

  // ---------- HELPERS ----------
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      Active: { color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
      Inactive: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
      Pending: { color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3" /> },
      Graduated: { color: "bg-blue-100 text-blue-700", icon: <Award className="w-3 h-3" /> }
    };
    return map[status] || map.Active;
  };

  const getGenderBadge = (gender) => {
    if (gender === "Male") return "bg-blue-50 text-blue-600";
    if (gender === "Female") return "bg-pink-50 text-pink-600";
    return "bg-gray-50 text-gray-600";
  };

  const getMedicalBadge = (condition) => {
    if (!condition || condition === "none") return "bg-gray-100 text-gray-600";
    return "bg-amber-100 text-amber-700";
  };

  // ---------- EXPORT CSV ----------
  const exportCSV = () => {
    if (filteredStudents.length === 0) {
      toast.error("No students to export");
      return;
    }
    const headers = [
      "Student Number,Full Name,Gender,Class,Parent Name,Parent Phone,Address,Status,Nationality,Medical Condition,Registration Date\n"
    ];
    const rows = filteredStudents.map(s =>
      `"${s.studentNumber || ''}","${s.fullName || ''}","${s.gender || ''}","${s.class?.className || ''}","${s.parentName || ''}","${s.parentPhone || ''}","${s.address || ''}","${s.status || ''}","${s.nationality || ''}","${s.medicalcondition || ''}","${formatDate(s.createdAt)}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `students_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  // ---------- ACTIONS ----------
  const viewStudentDetails = async (student) => {
    try {
      setIsLoadingDetails(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get(`/students/${student.id}`, config);
      const fullStudent = res.data?.data || res.data || student;
      setSelectedStudent(fullStudent);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching student details:", error);
      setSelectedStudent(student);
      setShowDetailsModal(true);
      toast.error("Could not load full details, showing basic info");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      await api.delete(`/students/${studentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = students.filter(s => s.id !== studentToDelete.id);
      setStudents(updated);
      setFilteredStudents(updated);
      toast.success("Student deleted successfully");
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedClass("All");
    setSelectedStatus("All");
    setSelectedGender("All");
    setSelectedMedical("All");
    setHasParentPhone(false);
    setDateFrom("");
    setDateTo("");
  };

  // ---------- LOADING ----------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading student records...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-600" />
            Student Records
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and view all student information
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
            onClick={goToRegister}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Register Student
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students" value={totalFiltered} color="purple" />
        <StatCard label="Active" value={students.filter(s => s.status === 'Active').length} color="green" />
        <StatCard label="Classes" value={classes.length} color="blue" />
        <StatCard label="Inactive" value={students.filter(s => s.status !== 'Active').length} color="red" />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID or parent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white min-w-[130px]"
          >
            <option value="All">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.className}>{cls.className}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white min-w-[130px]"
          >
            <option value="All">All Status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white min-w-[130px]"
          >
            <option value="All">All Genders</option>
            {GENDER_OPTIONS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={selectedMedical}
            onChange={(e) => setSelectedMedical(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white min-w-[150px]"
          >
            <option value="All">All Medical</option>
            {MEDICAL_CONDITIONS.map(m => (
              <option key={m} value={m}>{m || 'None'}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasParentPhone}
              onChange={(e) => setHasParentPhone(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
            />
            Has Parent Phone
          </label>

          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            Clear Filters
          </button>

          <button
            onClick={fetchStudents}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        {/* Indicator for active filter */}
        {hasParentPhone && (
          <div className="mt-2 text-xs text-purple-600 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            Filtering: Only students with a parent phone number are shown.
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Phone</th> {/* NEW COLUMN */}
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or register a new student</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((student) => {
                  const statusBadge = getStatusBadge(student.status);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                            {student.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{student.fullName}</p>
                            <p className="text-xs text-gray-400">{formatDate(student.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-mono text-gray-600">{student.studentNumber}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {student.class?.className || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-mono text-gray-700">
                            {student.parentPhone || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getGenderBadge(student.gender)}`}>
                          {student.gender || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getMedicalBadge(student.medicalcondition)}`}>
                          {student.medicalcondition || 'none'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.icon}
                          {student.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => viewStudentDetails(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => goToEditStudent(student.id)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(student)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* PAGINATION */}
        {totalFiltered > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalFiltered)} of {totalFiltered} students
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={i}
                    onClick={() => paginate(pageNum)}
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
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= DETAILS MODAL ================= */}
      {showDetailsModal && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          isLoading={isLoadingDetails}
          onClose={() => setShowDetailsModal(false)}
          onEdit={() => {
            setShowDetailsModal(false);
            goToEditStudent(selectedStudent.id);
          }}
          onViewFees={() => {
            setShowDetailsModal(false);
            goToStudentFees(selectedStudent.id);
          }}
        />
      )}

      {/* ================= DELETE MODAL ================= */}
      {showDeleteModal && studentToDelete && (
        <DeleteConfirmationModal
          student={studentToDelete}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

// ============================================================
//  SUB-COMPONENTS (unchanged)
// ============================================================
const StatCard = ({ label, value, color }) => {
  const colorMap = {
    purple: "text-purple-700",
    green: "text-green-600",
    blue: "text-blue-600",
    red: "text-red-600"
  };
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color] || "text-gray-700"}`}>{value}</p>
    </div>
  );
};

// ============================================================
//  STUDENT DETAILS MODAL (unchanged)
// ============================================================
const StudentDetailsModal = ({ student, isLoading, onClose, onEdit, onViewFees }) => {
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }) : "N/A";

  const fees = student.fees || [];
  const totalDemanded = fees.reduce((sum, f) => sum + (f.totalFee || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const balance = totalDemanded - totalPaid;
  const marksCount = (student.marks || []).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              {student.fullName?.charAt(0) || "S"}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{student.fullName}</h3>
              <p className="text-sm text-gray-500">Student ID: {student.studentNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-500">Loading details...</span>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
            <Section title="Personal Information" icon={<User className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Full Name" value={student.fullName} />
                <InfoItem label="Student Number" value={student.studentNumber} />
                <InfoItem label="Gender" value={student.gender || "N/A"} />
                <InfoItem label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                <InfoItem label="Nationality" value={student.nationality || "N/A"} />
                <InfoItem label="Medical Condition" value={student.medicalcondition || "None"} />
                <InfoItem label="Status" value={student.status || "Active"} />
                <InfoItem label="Registration Date" value={formatDate(student.createdAt)} />
              </div>
            </Section>

            <Section title="Class & Academic" icon={<School className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Class" value={student.class?.className || "N/A"} />
                <InfoItem label="Promotion Status" value={student.promotionStatus || "N/A"} />
                <InfoItem label="Total Marks" value={marksCount} />
              </div>
            </Section>

            <Section title="Parent / Guardian" icon={<UsersIcon className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Parent Name" value={student.parentName || "N/A"} />
                <InfoItem label="Parent Phone" value={student.parentPhone || "N/A"} />
                <InfoItem label="Address" value={student.address || "N/A"} colSpan={2} />
              </div>
            </Section>

            <Section title="Fee Summary" icon={<DollarSign className="w-4 h-4" />}>
              <div className="grid grid-cols-3 gap-4">
                <InfoItem label="Total Demanded" value={`UGX ${totalDemanded.toLocaleString()}`} />
                <InfoItem label="Total Paid" value={`UGX ${totalPaid.toLocaleString()}`} />
                <InfoItem
                  label="Balance"
                  value={`UGX ${balance.toLocaleString()}`}
                  className={balance > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}
                />
              </div>
            </Section>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onEdit}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition"
              >
                Edit Student
              </button>
              <button
                onClick={onViewFees}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                View Full Fees
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }) => (
  <div>
    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
      {icon}
      {title}
    </h4>
    <div className="bg-gray-50 rounded-lg p-4">{children}</div>
  </div>
);

const InfoItem = ({ label, value, colSpan = 1, className = "" }) => (
  <div className={`${colSpan > 1 ? "col-span-2" : ""}`}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`text-sm font-medium ${className}`}>{value || "—"}</p>
  </div>
);

// ============================================================
//  DELETE CONFIRMATION MODAL (unchanged)
// ============================================================
const DeleteConfirmationModal = ({ student, onClose, onConfirm, isDeleting }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Delete</h3>
        <p className="text-gray-500 text-sm mb-4">
          Are you sure you want to delete <span className="font-semibold text-gray-700">{student.fullName}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              "Delete Student"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default StudentRecords;