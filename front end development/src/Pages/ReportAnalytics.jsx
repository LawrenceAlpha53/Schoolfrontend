import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Award,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  Eye,
  Save,
  X,
  Filter,
  Calendar,
  Clock,
  School,
  GraduationCap,
  BookOpen,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Sparkles,
  ClipboardCheck,
  ClipboardList,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Target,
  Rocket,
  Brain,
  Users2,
  CheckSquare,
  Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const ReportAnalytics = () => {
  // ================= STATE =================
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [reportStatus, setReportStatus] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, picked, not_picked, eligible, not_eligible
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  // ================= STATISTICS =================
  const [stats, setStats] = useState({
    totalStudents: 0,
    pickedCount: 0,
    eligibleCount: 0,
    notEligibleCount: 0,
    noReportCount: 0,
    pickUpRate: 0
  });

  // ================= MODAL STATES =================
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupStudent, setPickupStudent] = useState(null);
  const [pickupRemarks, setPickupRemarks] = useState('');
  const [pickupConfirmation, setPickupConfirmation] = useState(false);

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [classesRes, statusRes] = await Promise.all([
        api.get('/classes'),
        api.get(`/report-analytics/students/status?term=${selectedTerm}&academicYear=${selectedYear}${selectedClass ? `&classId=${selectedClass}` : ''}`)
      ]);

      const classesData = classesRes.data.data || classesRes.data || [];
      const statusData = statusRes.data.data || statusRes.data || {};

      setClasses(Array.isArray(classesData) ? classesData : []);
      
      if (statusData.students) {
        setReportStatus(statusData.students);
        setStats(statusData.summary || {});
      }

    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTerm, selectedYear, selectedClass]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= FILTER REPORT STATUS =================
  const getFilteredStatus = () => {
    let filtered = [...reportStatus];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.student?.fullName?.toLowerCase().includes(term) ||
        s.student?.studentNumber?.toLowerCase().includes(term)
      );
    }

    if (filterStatus === 'picked') {
      filtered = filtered.filter(s => s.isPicked);
    } else if (filterStatus === 'not_picked') {
      filtered = filtered.filter(s => !s.isPicked);
    } else if (filterStatus === 'eligible') {
      filtered = filtered.filter(s => s.isEligible);
    } else if (filterStatus === 'not_eligible') {
      filtered = filtered.filter(s => !s.isEligible);
    }

    return filtered;
  };

  const filteredStatus = getFilteredStatus();

  // ================= PAGINATION =================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStatus.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStatus.length / itemsPerPage);

  // ================= VIEW STUDENT DETAILS =================
  const viewStudentDetails = async (studentId) => {
    try {
      const [statusRes, comboRes] = await Promise.all([
        api.get(`/report-analytics/student/${studentId}/status?term=${selectedTerm}&academicYear=${selectedYear}`),
        api.get(`/report-analytics/student/${studentId}/combination`)
      ]);

      setStudentDetails({
        status: statusRes.data.data,
        combination: comboRes.data.data
      });

      const student = reportStatus.find(s => s.student.id === studentId);
      setSelectedStudent(student);
      setShowStudentDetail(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to fetch student details');
    }
  };

  // ================= MARK REPORT AS PICKED =================
  const handleMarkPicked = async () => {
    try {
      setIsSaving(true);
      
      const response = await api.post('/report-analytics/pickup', {
        studentId: pickupStudent.student.id,
        term: selectedTerm,
        academicYear: selectedYear,
        remarks: pickupRemarks
      });

      if (response.data.success) {
        toast.success('Report marked as picked successfully!');
        setShowPickupModal(false);
        setPickupStudent(null);
        setPickupRemarks('');
        fetchData();
      }
    } catch (error) {
      console.error('Mark picked error:', error);
      toast.error(error.response?.data?.message || 'Failed to mark report as picked');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= EXPORT CSV =================
  const exportCSV = () => {
    if (filteredStatus.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Student Number,Full Name,Class,Status,Fees Status,Report Picked,Pickup Date\n'];
    const rows = filteredStatus.map(s => {
      const status = s.isPicked ? 'Picked' : s.isEligible ? 'Eligible' : 'Not Eligible';
      const feeStatus = s.isEligible ? 'Cleared' : 'Has Balance';
      return `${s.student.studentNumber},${s.student.fullName},${s.class?.className || 'N/A'},${status},${feeStatus},${s.isPicked ? 'Yes' : 'No'},${s.pickup?.pickupDate || 'N/A'}\n`;
    });

    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `report_status_${selectedTerm}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully');
  };

  // ================= PRINT =================
  const handlePrint = () => {
    window.print();
  };

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading report analytics...</p>
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
            <FileText className="w-7 h-7 text-purple-600" />
            Report & Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track report card distribution • Fee clearance • Student performance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= STATISTICS CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Students</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalStudents}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm">
          <p className="text-xs text-green-600 font-medium">Picked Reports</p>
          <p className="text-2xl font-bold text-green-700">{stats.pickedCount}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
          <p className="text-xs text-yellow-600 font-medium">Not Picked</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.totalStudents - stats.pickedCount}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
          <p className="text-xs text-blue-600 font-medium">Eligible</p>
          <p className="text-2xl font-bold text-blue-700">{stats.eligibleCount}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 shadow-sm">
          <p className="text-xs text-red-600 font-medium">Not Eligible</p>
          <p className="text-2xl font-bold text-red-700">{stats.notEligibleCount}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 shadow-sm">
          <p className="text-xs text-indigo-600 font-medium">Pickup Rate</p>
          <p className="text-2xl font-bold text-indigo-700">{stats.pickUpRate}%</p>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full rounded-full ${stats.pickUpRate >= 70 ? 'bg-green-500' : stats.pickUpRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(stats.pickUpRate || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          <div className="flex-1 min-w-[180px] relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <Search className="absolute left-3 top-[34px] w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          <div className="min-w-[130px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="all">All Students</option>
              <option value="picked">Picked</option>
              <option value="not_picked">Not Picked</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not Eligible</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Load
            </button>
          </div>
        </div>
      </div>

      {/* ================= STUDENTS TABLE ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Status</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Status</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pickup Date</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm mt-1">Adjust your filters to see results</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => {
                  const student = item.student;
                  const isPicked = item.isPicked;
                  const isEligible = item.isEligible;
                  const hasReport = item.hasReportCard;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-500">{indexOfFirstItem + index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {student.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-800">{student.fullName}</p>
                            <p className="text-xs text-gray-400">{student.studentNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <School className="w-3 h-3" />
                          {item.class?.className || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Has Balance
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isPicked ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Picked
                          </span>
                        ) : isEligible ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Blocked
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center text-sm text-gray-600">
                        {item.pickup?.pickupDate ? new Date(item.pickup.pickupDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => viewStudentDetails(student.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isPicked && isEligible && (
                            <button
                              onClick={() => {
                                setPickupStudent(item);
                                setPickupRemarks('');
                                setShowPickupModal(true);
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Mark as Picked"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        {filteredStatus.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStatus.length)} of {filteredStatus.length} students
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
      </div>

      {/* ================= STUDENT DETAIL MODAL ================= */}
      {showStudentDetail && selectedStudent && studentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                  Student Report Details
                </h3>
                <p className="text-sm text-gray-500">{selectedStudent.student.fullName} - {selectedStudent.student.studentNumber}</p>
              </div>
              <button
                onClick={() => setShowStudentDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-800">{selectedStudent.student.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Student Number</p>
                  <p className="font-medium text-gray-800">{selectedStudent.student.studentNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium text-gray-800">{selectedStudent.class?.className || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="font-medium text-gray-800">{selectedStudent.student.gender || 'N/A'}</p>
                </div>
              </div>

              {/* Fee Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  Fee Status
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Total Demanded</p>
                    <p className="font-bold text-purple-600">
                      UGX {studentDetails.status?.feeStatus?.totalDemanded?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Paid</p>
                    <p className="font-bold text-green-600">
                      UGX {studentDetails.status?.feeStatus?.totalPaid?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className={`font-bold ${studentDetails.status?.feeStatus?.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      UGX {studentDetails.status?.feeStatus?.totalBalance?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    studentDetails.status?.isEligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {studentDetails.status?.isEligible ? '✅ Eligible for Report' : '❌ Not Eligible - Has Balance'}
                  </span>
                </div>
              </div>

              {/* Combination & Subjects */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Subject Combination
                </h4>
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {studentDetails.combination?.level || 'N/A'}
                  </span>
                  {studentDetails.combination?.combination && (
                    <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {studentDetails.combination.combination.join(', ')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {studentDetails.combination?.subjects?.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                      <span className="text-sm">{sub.subject}</span>
                      <span className={`text-xs font-bold ${
                        sub.grade?.startsWith('D') ? 'text-green-600' :
                        sub.grade?.startsWith('C') ? 'text-blue-600' :
                        sub.grade?.startsWith('P') ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {sub.score || 'N/A'} {sub.grade !== 'N/A' ? `(${sub.grade})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-yellow-600" />
                  Report Status
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Report Card</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      studentDetails.status?.hasReportCard ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {studentDetails.status?.hasReportCard ? '✅ Available' : '❌ Not Available'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pickup Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      studentDetails.status?.isPicked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {studentDetails.status?.isPicked ? '✅ Picked' : '⏳ Not Picked'}
                    </span>
                  </div>
                </div>
                {studentDetails.status?.isPicked && studentDetails.status?.pickup && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Picked on: {new Date(studentDetails.status.pickup.pickupDate).toLocaleDateString()}</p>
                    <p>Time: {studentDetails.status.pickup.pickupTime}</p>
                    {studentDetails.status.pickup.remarks && (
                      <p>Remarks: {studentDetails.status.pickup.remarks}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={() => setShowStudentDetail(false)}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
              >
                Close
              </button>
              {!selectedStudent.isPicked && selectedStudent.isEligible && (
                <button
                  onClick={() => {
                    setShowStudentDetail(false);
                    setPickupStudent(selectedStudent);
                    setPickupRemarks('');
                    setShowPickupModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                >
                  <ClipboardCheck className="w-4 h-4 inline mr-2" />
                  Mark as Picked
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= PICKUP MODAL ================= */}
      {showPickupModal && pickupStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Report Pickup</h3>
              <p className="text-gray-500 text-sm mb-4">
                Are you sure you want to mark the report card for
                <span className="font-semibold text-gray-700 block mt-1">
                  {pickupStudent.student.fullName}
                </span>
                as picked?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left">
                  Remarks (Optional)
                </label>
                <textarea
                  value={pickupRemarks}
                  onChange={(e) => setPickupRemarks(e.target.value)}
                  placeholder="Add any notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                  rows="2"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPickupModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkPicked}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isSaving ? 'Processing...' : 'Confirm Pickup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportAnalytics;