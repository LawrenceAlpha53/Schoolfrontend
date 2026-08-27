import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Users,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  GraduationCap,
  School,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Bell,
  Star,
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Rocket,
  Target,
  Brain,
  Zap,
  Settings,
  Users as UsersIcon,
  BookOpen as BookOpenIcon,
  Calendar,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  UserPlus,
  UserMinus,
  CheckCheck,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Link,
  Copy,
  ExternalLink,
  MoreVertical,
  Grid,
  List,
  LayoutGrid,
  Table,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const MyClasses = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid, list, detailed
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [teacherData, setTeacherData] = useState(null);
  const [classStats, setClassStats] = useState({});
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showClassDetail, setShowClassDetail] = useState(false);
  const [selectedClassForDetail, setSelectedClassForDetail] = useState(null);

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Fetch teacher data
      const teachersRes = await api.get("/teachers", config);
      const teachers = teachersRes.data.data || teachersRes.data || [];
      const currentTeacher = teachers.find(
        (t) =>
          t.email === user.Email ||
          t.fullName === user.Fname + " " + user.Lname,
      );

      if (currentTeacher) {
        setTeacherData(currentTeacher);

        // Fetch classes
        const classesRes = await api.get("/classes", config);
        const allClasses = classesRes.data.data || classesRes.data || [];
        const teacherClasses = allClasses.filter(
          (c) => c.id === currentTeacher.classId,
        );
        setClasses(teacherClasses);

        // Fetch students for each class
        const studentsRes = await api.get("/students", config);
        const allStudents = studentsRes.data.data || studentsRes.data || [];
        const classStudents = allStudents.filter(
          (s) => s.classId === currentTeacher.classId,
        );
        setStudents(classStudents);

        // Calculate stats for each class
        const stats = {};
        teacherClasses.forEach((cls) => {
          const classStudentsList = allStudents.filter(
            (s) => s.classId === cls.id,
          );
          stats[cls.id] = {
            totalStudents: classStudentsList.length,
            male: classStudentsList.filter((s) => s.gender === "Male").length,
            female: classStudentsList.filter((s) => s.gender === "Female")
              .length,
            active: classStudentsList.filter((s) => s.status === "Active")
              .length,
            attendanceRate: Math.floor(Math.random() * 30 + 70), // Mock for now
          };
        });
        setClassStats(stats);

        // Set first class as selected if any
        if (teacherClasses.length > 0 && !selectedClass) {
          setSelectedClass(teacherClasses[0]);
          setSelectedClassForDetail(teacherClasses[0]);
        }
      }
    } catch (error) {
      console.error("Fetch classes error:", error);
      toast.error("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= FILTER CLASSES =================
  const getFilteredClasses = () => {
    let filtered = [...classes];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.className?.toLowerCase().includes(term) ||
          c.classTeacher?.toLowerCase().includes(term),
      );
    }
    return filtered;
  };

  const filteredClasses = getFilteredClasses();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClasses = filteredClasses.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  // ================= VIEW STUDENT DETAILS =================
  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  // ================= VIEW CLASS DETAILS =================
  const viewClassDetails = (cls) => {
    setSelectedClassForDetail(cls);
    setShowClassDetail(true);
  };

  // ================= GET GRADE =================
  const getGrade = (score) => {
    if (score >= 80) return { grade: "D1", color: "text-emerald-600" };
    if (score >= 75) return { grade: "D2", color: "text-green-600" };
    if (score >= 70) return { grade: "C3", color: "text-blue-600" };
    if (score >= 65) return { grade: "C4", color: "text-cyan-600" };
    if (score >= 60) return { grade: "C5", color: "text-teal-600" };
    if (score >= 55) return { grade: "C6", color: "text-yellow-600" };
    if (score >= 50) return { grade: "P7", color: "text-orange-600" };
    if (score >= 45) return { grade: "P8", color: "text-red-400" };
    return { grade: "F9", color: "text-red-600" };
  };

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-600" />
            My Classes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all your classes and students
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {classes.length} Classes • {students.length} Students
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-white shadow-sm text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${viewMode === "list" ? "bg-white shadow-sm text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`p-1.5 rounded-lg transition ${viewMode === "detailed" ? "bg-white shadow-sm text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
              title="Detailed View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes by name or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredClasses.length} class
            {filteredClasses.length !== 1 ? "es" : ""} found
          </div>
        </div>
      </div>

      {/* ================= CLASSES GRID ================= */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentClasses.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <School className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No classes found</p>
              <p className="text-sm mt-1">
                You don't have any classes assigned yet
              </p>
            </div>
          ) : (
            currentClasses.map((cls) => {
              const stats = classStats[cls.id] || {
                totalStudents: 0,
                male: 0,
                female: 0,
                active: 0,
                attendanceRate: 0,
              };
              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-bold text-lg">
                          {cls.className?.charAt(0) || "C"}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-purple-600 transition">
                            {cls.className}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Teacher: {cls.classTeacher || "N/A"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {stats.totalStudents} Students
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-blue-600">Male</p>
                        <p className="text-lg font-bold text-blue-700">
                          {stats.male}
                        </p>
                      </div>
                      <div className="bg-pink-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-pink-600">Female</p>
                        <p className="text-lg font-bold text-pink-700">
                          {stats.female}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-green-600">Active</p>
                        <p className="text-lg font-bold text-green-700">
                          {stats.active}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${stats.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {stats.attendanceRate}%
                        </span>
                      </div>
                      <button
                        onClick={() => viewClassDetails(cls)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= LIST VIEW ================= */}
      {viewMode === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                    Class
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                    Teacher
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">
                    Students
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">
                    Attendance
                  </th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentClasses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
                      No classes found
                    </td>
                  </tr>
                ) : (
                  currentClasses.map((cls) => {
                    const stats = classStats[cls.id] || {
                      totalStudents: 0,
                      attendanceRate: 0,
                    };
                    return (
                      <tr key={cls.id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                              {cls.className?.charAt(0) || "C"}
                            </div>
                            <span className="font-medium text-gray-800">
                              {cls.className}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {cls.classTeacher || "N/A"}
                        </td>
                        <td className="p-4 text-center text-sm font-medium text-gray-700">
                          {stats.totalStudents}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${stats.attendanceRate}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {stats.attendanceRate}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => viewClassDetails(cls)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= DETAILED VIEW ================= */}
      {viewMode === "detailed" && selectedClassForDetail && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedClassForDetail.className}
                </h3>
                <p className="text-sm text-gray-500">
                  Class Teacher: {selectedClassForDetail.classTeacher || "N/A"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.info("Class report generated")}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  Report
                </button>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Total Students</p>
                <p className="text-xl font-bold text-purple-600">
                  {
                    students.filter(
                      (s) => s.classId === selectedClassForDetail.id,
                    ).length
                  }
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600">Male</p>
                <p className="text-xl font-bold text-blue-700">
                  {
                    students.filter(
                      (s) =>
                        s.classId === selectedClassForDetail.id &&
                        s.gender === "Male",
                    ).length
                  }
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-3 text-center">
                <p className="text-xs text-pink-600">Female</p>
                <p className="text-xl font-bold text-pink-700">
                  {
                    students.filter(
                      (s) =>
                        s.classId === selectedClassForDetail.id &&
                        s.gender === "Female",
                    ).length
                  }
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600">Active</p>
                <p className="text-xl font-bold text-green-700">
                  {
                    students.filter(
                      (s) =>
                        s.classId === selectedClassForDetail.id &&
                        s.status === "Active",
                    ).length
                  }
                </p>
              </div>
            </div>

            <h4 className="font-semibold text-gray-700 mb-3">Students List</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                      #
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                      Number
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                      Gender
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.filter(
                    (s) => s.classId === selectedClassForDetail.id,
                  ).length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-8 text-gray-500"
                      >
                        No students in this class
                      </td>
                    </tr>
                  ) : (
                    students
                      .filter((s) => s.classId === selectedClassForDetail.id)
                      .map((student, index) => (
                        <tr
                          key={student.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="p-3 text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                                {student.fullName?.charAt(0) || "S"}
                              </div>
                              <span className="font-medium text-sm">
                                {student.fullName}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {student.studentNumber}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                student.gender === "Male"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-pink-100 text-pink-700"
                              }`}
                            >
                              {student.gender || "N/A"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {student.status === "Active" ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {student.status || "Active"}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => viewStudentDetails(student)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {filteredClasses.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2 mt-6">
          <p className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredClasses.length)} of{" "}
            {filteredClasses.length} classes
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) return null;
              }
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded-lg text-sm transition ${
                    currentPage === pageNum
                      ? "bg-purple-600 text-white border-purple-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STUDENT DETAIL MODAL ================= */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Student Details
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedStudent.fullName} - {selectedStudent.studentNumber}
                </p>
              </div>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Student Number</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.studentNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.gender || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.status || "Active"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Parent Name</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.parentName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Parent Phone</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.parentPhone || "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.address || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Quick Actions
                </h4>
                <div className="flex flex-wrap gap-3">
                  {/* <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Message Parent
                  </button> */}
                  <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition">
                    <FileText className="w-4 h-4 inline mr-1" />
                    View Reports
                  </button>
                  <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition">
                    <ClipboardCheck className="w-4 h-4 inline mr-1" />
                    Marks
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => setShowStudentModal(false)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CLASS DETAIL MODAL ================= */}
      {showClassDetail && selectedClassForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <School className="w-6 h-6 text-purple-600" />
                  Class Details
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedClassForDetail.className}
                </p>
              </div>
              <button
                onClick={() => setShowClassDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600">Class</p>
                  <p className="text-lg font-bold text-purple-700">
                    {selectedClassForDetail.className}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Teacher</p>
                  <p className="text-lg font-bold text-blue-700">
                    {selectedClassForDetail.classTeacher || "N/A"}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Students</p>
                  <p className="text-lg font-bold text-green-700">
                    {
                      students.filter(
                        (s) => s.classId === selectedClassForDetail.id,
                      ).length
                    }
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-600">Attendance</p>
                  <p className="text-lg font-bold text-yellow-700">
                    {classStats[selectedClassForDetail.id]?.attendanceRate || 0}
                    %
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-gray-700 mb-3">
                Students in this Class
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                        #
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                        Number
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                        Gender
                      </th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.filter(
                      (s) => s.classId === selectedClassForDetail.id,
                    ).length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-8 text-gray-500"
                        >
                          No students in this class
                        </td>
                      </tr>
                    ) : (
                      students
                        .filter((s) => s.classId === selectedClassForDetail.id)
                        .map((student, index) => (
                          <tr
                            key={student.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="p-3 text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                                  {student.fullName?.charAt(0) || "S"}
                                </div>
                                <span className="font-medium text-sm">
                                  {student.fullName}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {student.studentNumber}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  student.gender === "Male"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-pink-100 text-pink-700"
                                }`}
                              >
                                {student.gender || "N/A"}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => {
                                  setShowClassDetail(false);
                                  viewStudentDetails(student);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={() => setShowClassDetail(false)}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toast.success("Class report generated");
                  setShowClassDetail(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClasses;
