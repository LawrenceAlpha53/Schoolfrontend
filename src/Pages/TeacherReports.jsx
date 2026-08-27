import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Download,
  Printer,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherReports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState([
    {
      id: 1,
      title: 'Class Performance Report - Term 1',
      type: 'Performance',
      date: '2024-01-15',
      status: 'completed',
      students: 45,
      average: '78%',
      topStudent: 'John Doe'
    },
    {
      id: 2,
      title: 'Attendance Summary - Term 1',
      type: 'Attendance',
      date: '2024-01-14',
      status: 'completed',
      students: 45,
      average: '92%',
      topStudent: 'Jane Smith'
    },
    {
      id: 3,
      title: 'Grade Distribution - Term 1',
      type: 'Grades',
      date: '2024-01-13',
      status: 'pending',
      students: 45,
      average: 'N/A',
      topStudent: 'N/A'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDetail, setShowReportDetail] = useState(false);

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const viewReport = (report) => {
    setSelectedReport(report);
    setShowReportDetail(true);
  };

  const downloadReport = (report) => {
    toast.success(`Downloading: ${report.title}`);
  };

  const generateReport = () => {
    toast.success('Generating new report...');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Report generated successfully!');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-purple-600" />
            Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and view class performance reports
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Reports</p>
          <p className="text-xl font-bold text-purple-600">{reports.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 shadow-sm">
          <p className="text-xs text-green-600 font-medium">Completed</p>
          <p className="text-xl font-bold text-green-700">
            {reports.filter(r => r.status === 'completed').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 shadow-sm">
          <p className="text-xs text-yellow-600 font-medium">Pending</p>
          <p className="text-xl font-bold text-yellow-700">
            {reports.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 shadow-sm">
          <p className="text-xs text-blue-600 font-medium">Students</p>
          <p className="text-xl font-bold text-blue-700">
            {reports.reduce((sum, r) => sum + (r.students || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Report Title</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No reports found</p>
                    <button
                      onClick={generateReport}
                      className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm"
                    >
                      Generate your first report
                    </button>
                  </td>
                </tr>
              ) : (
                currentItems.map((report, index) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 text-sm text-gray-500">{indexOfFirstItem + index + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-800">{report.title}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        report.type === 'Performance' ? 'bg-purple-100 text-purple-700' :
                        report.type === 'Attendance' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{report.date}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {report.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewReport(report)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadReport(report)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredReports.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
            <p className="text-sm text-gray-500">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredReports.length)} of {filteredReports.length}
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

      {/* Report Detail Modal */}
      {showReportDetail && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Report Details
                </h3>
                <p className="text-sm text-gray-500">{selectedReport.title}</p>
              </div>
              <button
                onClick={() => setShowReportDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium text-gray-800">{selectedReport.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium text-gray-800">{selectedReport.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`font-medium ${
                    selectedReport.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {selectedReport.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Students</p>
                  <p className="font-medium text-gray-800">{selectedReport.students}</p>
                </div>
                {selectedReport.average && (
                  <div>
                    <p className="text-xs text-gray-500">Average Score</p>
                    <p className="font-medium text-gray-800">{selectedReport.average}</p>
                  </div>
                )}
                {selectedReport.topStudent && selectedReport.topStudent !== 'N/A' && (
                  <div>
                    <p className="text-xs text-gray-500">Top Student</p>
                    <p className="font-medium text-gray-800">{selectedReport.topStudent}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Report Summary</h4>
                <p className="text-sm text-gray-600">
                  This report contains detailed information about student performance,
                  attendance, and grade distribution for the selected term.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={() => downloadReport(selectedReport)}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
              <button
                onClick={() => setShowReportDetail(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherReports;