import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  Eye,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Award,
  Bell,
  School,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SecretaryMarksSummary = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [marksData, setMarksData] = useState({
    summary: [],
    overallStats: {},
    recentMarks: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showTeacherDetail, setShowTeacherDetail] = useState(false);
  const [teacherDetails, setTeacherDetails] = useState(null);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await api.get('/marks/summary', config);
      const data = response.data.data || {};
      
      setMarksData(data);
    } catch (error) {
      console.error('Fetch marks summary error:', error);
      toast.error('Failed to load marks summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= VIEW TEACHER DETAILS =================
  const viewTeacherDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setShowTeacherDetail(true);
  };

  // ================= FILTER DATA =================
  const getFilteredData = () => {
    let filtered = [...marksData.summary];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.teacher.fullName.toLowerCase().includes(term) ||
        item.class.toLowerCase().includes(term) ||
        item.subject.toLowerCase().includes(term)
      );
    }
    
    if (filterTeacher !== 'all') {
      filtered = filtered.filter(item => item.teacher.id === parseInt(filterTeacher));
    }
    
    return filtered;
  };

  const filteredData = getFilteredData();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // ================= EXPORT =================
  const exportCSV = () => {
    toast.success('Exporting marks summary...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading marks summary...</p>
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
            Marks Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all teacher marks entry progress
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {marksData.summary.length} Teachers
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= OVERALL STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Teachers</p>
          <p className="text-xl font-bold text-purple-600">{marksData.overallStats.totalTeachers || 0}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 shadow-sm">
          <p className="text-xs text-green-600 font-medium">Marks Entered</p>
          <p className="text-xl font-bold text-green-700">{marksData.overallStats.totalMarksEntered || 0}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 shadow-sm">
          <p className="text-xs text-yellow-600 font-medium">Pending Marks</p>
          <p className="text-xl font-bold text-yellow-700">{marksData.overallStats.totalPending || 0}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 shadow-sm">
          <p className="text-xs text-indigo-600 font-medium">Completion Rate</p>
          <p className="text-xl font-bold text-indigo-700">{marksData.overallStats.overallCompletionRate || 0}%</p>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full rounded-full ${marksData.overallStats.overallCompletionRate >= 80 ? 'bg-green-500' : marksData.overallStats.overallCompletionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(marksData.overallStats.overallCompletionRate || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by teacher, class, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ================= TEACHERS TABLE ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Students</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Entered</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Pending</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No data available</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr key={item.teacher.id} className="hover:bg-gray-50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {item.teacher.fullName?.charAt(0) || 'T'}
                        </div>
                        <span className="font-medium text-sm">{item.teacher.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{item.class}</td>
                    <td className="p-3 text-sm text-gray-600">{item.subject}</td>
                    <td className="p-3 text-center text-sm font-medium text-gray-700">{item.totalStudents}</td>
                    <td className="p-3 text-center text-sm font-medium text-green-600">{item.marksEntered}</td>
                    <td className="p-3 text-center text-sm font-medium text-yellow-600">{item.pending}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.completionRate >= 80 ? 'bg-green-500' : item.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(item.completionRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{item.completionRate}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => viewTeacherDetails(item)}
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

        {/* ================= PAGINATION ================= */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
            <p className="text-sm text-gray-500">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= TEACHER DETAIL MODAL ================= */}
      {showTeacherDetail && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-6 h-6 text-purple-600" />
                  Teacher Details
                </h3>
                <p className="text-sm text-gray-500">{selectedTeacher.teacher.fullName}</p>
              </div>
              <button
                onClick={() => setShowTeacherDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.class}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="font-medium text-gray-800">{selectedTeacher.subject}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Marks Entered</p>
                  <p className="text-2xl font-bold text-green-700">{selectedTeacher.marksEntered}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">{selectedTeacher.pending}</p>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2">Progress</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${Math.min(selectedTeacher.completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-bold text-indigo-700">{selectedTeacher.completionRate}%</span>
                </div>
                <p className="text-sm text-indigo-600 mt-2">
                  {selectedTeacher.marksEntered} of {selectedTeacher.totalStudents} students marked
                </p>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {selectedTeacher.pending > 0 
                    ? `${selectedTeacher.pending} students still need marks`
                    : '✅ All marks entered! Great job!'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={() => setShowTeacherDetail(false)}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toast.success(`Sending reminder to ${selectedTeacher.teacher.fullName}`);
                  setShowTeacherDetail(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretaryMarksSummary;