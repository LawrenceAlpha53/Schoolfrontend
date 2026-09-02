// pages/TeacherProfile.jsx - COMPLETE TEACHER PROFILE MANAGEMENT
import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Award,
  BookOpen,
  School,
  Building,
  RefreshCw,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Printer,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  Clock,
  CalendarDays,
  Wallet,
  Shield,
  BadgeCheck,
  History,
  Database
} from "lucide-react";
import toast from 'react-hot-toast';
import api from '../api/axios';

const TeacherProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Teacher Advances
  const [advances, setAdvances] = useState([]);
  const [loans, setLoans] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Form states
  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    reason: '',
    category: 'emergency',
    repaymentMonths: 3,
    notes: ''
  });

  const [loanForm, setLoanForm] = useState({
    amount: '',
    interestRate: 0,
    loanTermMonths: 12,
    purpose: '',
    notes: ''
  });

  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    notes: ''
  });

  const [allowanceForm, setAllowanceForm] = useState({
    amount: '',
    reason: '',
    category: 'transport',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [editForm, setEditForm] = useState({});

  // ================= FETCH TEACHERS =================
  const fetchTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await api.get('/teachers', config);
      const data = response.data?.data || response.data || [];
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Fetch teachers error:', error);
      toast.error('Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ================= FETCH TEACHER DETAILS =================
  const fetchTeacherDetails = async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch all teacher related data
      const [advancesRes, loansRes, leavesRes, allowancesRes, documentsRes] = await Promise.all([
        api.get(`/teacher-advances?teacherId=${teacherId}`, config),
        api.get(`/teacher-loans?teacherId=${teacherId}`, config),
        api.get(`/teacher-leaves?teacherId=${teacherId}`, config),
        api.get(`/teacher-allowances?teacherId=${teacherId}`, config),
        api.get(`/teacher-documents?teacherId=${teacherId}`, config)
      ]);

      setAdvances(advancesRes.data?.data || advancesRes.data || []);
      setLoans(loansRes.data?.data || loansRes.data || []);
      setLeaves(leavesRes.data?.data || leavesRes.data || []);
      setAllowances(allowancesRes.data?.data || allowancesRes.data || []);
      setDocuments(documentsRes.data?.data || documentsRes.data || []);
    } catch (error) {
      console.error('❌ Fetch teacher details error:', error);
      toast.error('Failed to load teacher details');w
    }
  };

  // ================= HANDLE ACTIONS =================
  const handleAddAdvance = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const data = {
        teacherId: selectedTeacher.id,
        ...advanceForm,
        amount: parseFloat(advanceForm.amount)
      };

      const response = await api.post('/teacher-advances', data, config);
      if (response.data.success) {
        toast.success(`💰 Advance of UGX ${parseFloat(advanceForm.amount).toLocaleString()} added for ${selectedTeacher.fullName}`);
        setShowAdvanceModal(false);
        resetAdvanceForm();
        fetchTeacherDetails(selectedTeacher.id);
      }
    } catch (error) {
      console.error('❌ Add advance error:', error);
      toast.error(error.response?.data?.message || 'Failed to add advance');
    }
  };

  const handleAddLoan = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const data = {
        teacherId: selectedTeacher.id,
        ...loanForm,
        amount: parseFloat(loanForm.amount)
      };

      const response = await api.post('/teacher-loans', data, config);
      if (response.data.success) {
        toast.success(`🏦 Loan of UGX ${parseFloat(loanForm.amount).toLocaleString()} added for ${selectedTeacher.fullName}`);
        setShowLoanModal(false);
        resetLoanForm();
        fetchTeacherDetails(selectedTeacher.id);
      }
    } catch (error) {
      console.error('❌ Add loan error:', error);
      toast.error(error.response?.data?.message || 'Failed to add loan');
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await api.post('/teacher-leaves', { ...leaveForm, teacherId: selectedTeacher.id }, config);
      if (response.data.success) {
        toast.success(`✅ ${leaveForm.leaveType} leave added for ${selectedTeacher.fullName}`);
        setShowLeaveModal(false);
        resetLeaveForm();
        fetchTeacherDetails(selectedTeacher.id);
      }
    } catch (error) {
      console.error('❌ Add leave error:', error);
      toast.error(error.response?.data?.message || 'Failed to add leave');
    }
  };

  const handleAddAllowance = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const data = {
        teacherId: selectedTeacher.id,
        ...allowanceForm,
        amount: parseFloat(allowanceForm.amount)
      };

      const response = await api.post('/teacher-allowances', data, config);
      if (response.data.success) {
        toast.success(`💰 Allowance of UGX ${parseFloat(allowanceForm.amount).toLocaleString()} added for ${selectedTeacher.fullName}`);
        setShowAllowanceModal(false);
        resetAllowanceForm();
        fetchTeacherDetails(selectedTeacher.id);
      }
    } catch (error) {
      console.error('❌ Add allowance error:', error);
      toast.error(error.response?.data?.message || 'Failed to add allowance');
    }
  };

  // ================= RESET FORMS =================
  const resetAdvanceForm = () => {
    setAdvanceForm({
      amount: '',
      reason: '',
      category: 'emergency',
      repaymentMonths: 3,
      notes: ''
    });
  };

  const resetLoanForm = () => {
    setLoanForm({
      amount: '',
      interestRate: 0,
      loanTermMonths: 12,
      purpose: '',
      notes: ''
    });
  };

  const resetLeaveForm = () => {
    setLeaveForm({
      leaveType: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
      notes: ''
    });
  };

  const resetAllowanceForm = () => {
    setAllowanceForm({
      amount: '',
      reason: '',
      category: 'transport',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // ================= VIEW TEACHER DETAILS =================
  const viewTeacherDetails = async (teacher) => {
    setSelectedTeacher(teacher);
    await fetchTeacherDetails(teacher.id);
    setShowDetailModal(true);
  };

  // ================= FILTER TEACHERS =================
  const getFilteredTeachers = () => {
    let filtered = [...teachers];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.fullName?.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.phoneNumber?.includes(term) ||
        t.employeeNumber?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const filteredTeachers = getFilteredTeachers();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  // ================= INITIAL FETCH =================
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading teachers...</p>
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
            <Users className="w-7 h-7 text-purple-600" />
            Teacher Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete teacher profiles with attendance, advances, loans, leave, and allowances
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchTeachers()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ================= SEARCH & FILTERS ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, employee number..."
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
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Employee #</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentTeachers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No teachers found</p>
                  </td>
                </tr>
              ) : (
                currentTeachers.map((teacher, index) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 text-sm text-gray-500">{indexOfFirstItem + index + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {teacher.fullName?.charAt(0) || 'T'}
                        </div>
                        <span className="font-medium text-sm">{teacher.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{teacher.employeeNumber || '-'}</td>
                    <td className="p-3 text-sm text-gray-600">{teacher.email || '-'}</td>
                    <td className="p-3 text-sm text-gray-600">{teacher.phoneNumber || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        teacher.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => viewTeacherDetails(teacher)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        {filteredTeachers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
            <p className="text-sm text-gray-500">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredTeachers.length)} of {filteredTeachers.length}
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
      {showDetailModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-gray-200 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-2xl">
                  {selectedTeacher.fullName?.charAt(0) || 'T'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedTeacher.fullName}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {selectedTeacher.email || 'No email'}
                    <span className="mx-2">|</span>
                    <Phone className="w-4 h-4" /> {selectedTeacher.phoneNumber || 'No phone'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Employee #{selectedTeacher.employeeNumber || 'N/A'} • 
                    {selectedTeacher.specialization ? ` ${selectedTeacher.specialization}` : ' No specialization'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdvanceModal(true)}
                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition flex items-center gap-1"
                >
                  <Wallet className="w-4 h-4" /> Advance
                </button>
                <button
                  onClick={() => setShowLoanModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition flex items-center gap-1"
                >
                  <Building className="w-4 h-4" /> Loan
                </button>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition flex items-center gap-1"
                >
                  <CalendarDays className="w-4 h-4" /> Leave
                </button>
                <button
                  onClick={() => setShowAllowanceModal(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition flex items-center gap-1"
                >
                  <DollarSign className="w-4 h-4" /> Allowance
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body - Tabs or Sections */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Advances</p>
                  <p className="text-2xl font-bold text-blue-700">{advances.length}</p>
                  <p className="text-xs text-blue-500">
                    UGX {advances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Loans</p>
                  <p className="text-2xl font-bold text-green-700">{loans.length}</p>
                  <p className="text-xs text-green-500">
                    UGX {loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Allowances</p>
                  <p className="text-2xl font-bold text-purple-700">{allowances.length}</p>
                  <p className="text-xs text-purple-500">
                    UGX {allowances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                  <p className="text-sm text-amber-600 font-medium">Leave Days</p>
                  <p className="text-2xl font-bold text-amber-700">{leaves.reduce((sum, l) => sum + (l.totalDays || 0), 0)}</p>
                </div>
              </div>

              {/* Advances Section */}
              {advances.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-yellow-600" />
                    Salary Advances
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{advances.length}</span>
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {advances.map((advance) => (
                      <div key={advance.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">UGX {parseFloat(advance.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{advance.category} - {advance.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            advance.status === 'approved' ? 'bg-green-100 text-green-700' :
                            advance.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            advance.status === 'fully_repaid' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {advance.status}
                          </span>
                          <p className="text-xs text-gray-400">{new Date(advance.dateRequested).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loans Section */}
              {loans.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    Teacher Loans
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{loans.length}</span>
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {loans.map((loan) => (
                      <div key={loan.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">UGX {parseFloat(loan.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{loan.loanTermMonths} months • {loan.interestRate}% interest</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            loan.status === 'active' ? 'bg-green-100 text-green-700' :
                            loan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            loan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {loan.status}
                          </span>
                          <p className="text-xs text-gray-400">{new Date(loan.dateGranted).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leave Section */}
              {leaves.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-green-600" />
                    Leave Records
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{leaves.length}</span>
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {leaves.map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{leave.leaveType} Leave</p>
                          <p className="text-xs text-gray-500">{leave.totalDays} days • {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                            leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            leave.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {leave.status}
                          </span>
                          <p className="text-xs text-gray-400">{leave.reason || 'No reason'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Allowances Section */}
              {allowances.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    Daily Allowances
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{allowances.length}</span>
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allowances.map((allowance) => (
                      <div key={allowance.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">UGX {parseFloat(allowance.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{allowance.category} - {allowance.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            allowance.status === 'approved' ? 'bg-green-100 text-green-700' :
                            allowance.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {allowance.status}
                          </span>
                          <p className="text-xs text-gray-400">{new Date(allowance.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {documents.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Documents
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{documents.length}</span>
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-xs text-gray-500">{doc.documentType} • {doc.fileName}</p>
                        </div>
                        <div className="text-right">
                          <button className="text-xs text-blue-600 hover:text-blue-700">
                            <Download className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-gray-400">{new Date(doc.uploadedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Integrity Footer */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-700 font-medium">Data Integrity:</span>
                    <span className="text-xs text-gray-500">
                      All records stored in database with timestamps
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <History className="w-4 h-4 text-blue-500" />
                      {advances.length + loans.length + leaves.length + allowances.length} total records
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD ADVANCE MODAL ================= */}
      {showAdvanceModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-yellow-600" />
                Salary Advance for {selectedTeacher.fullName}
              </h3>
            </div>
            <form onSubmit={handleAddAdvance} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (UGX) *</label>
                <input
                  type="number"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                  placeholder="e.g., 500000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select
                  value={advanceForm.category}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                >
                  <option value="emergency">🚨 Emergency</option>
                  <option value="medical">🏥 Medical</option>
                  <option value="school_fees">📚 School Fees</option>
                  <option value="transport">🚗 Transport</option>
                  <option value="funeral">🕊️ Funeral</option>
                  <option value="wedding">💍 Wedding</option>
                  <option value="housing">🏠 Housing</option>
                  <option value="business">💼 Business</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason *</label>
                <textarea
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm resize-none"
                  placeholder="Explain the reason for the advance..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Repayment Months</label>
                <select
                  value={advanceForm.repaymentMonths}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, repaymentMonths: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={4}>4 Months</option>
                  <option value={5}>5 Months</option>
                  <option value={6}>6 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={advanceForm.notes}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm resize-none"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
                >
                  Add Advance
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD LOAN MODAL ================= */}
      {showLoanModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Building className="w-6 h-6 text-blue-600" />
                Loan for {selectedTeacher.fullName}
              </h3>
            </div>
            <form onSubmit={handleAddLoan} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (UGX) *</label>
                <input
                  type="number"
                  value={loanForm.amount}
                  onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., 1000000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={loanForm.interestRate}
                  onChange={(e) => setLoanForm({ ...loanForm, interestRate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan Term (Months)</label>
                <select
                  value={loanForm.loanTermMonths}
                  onChange={(e) => setLoanForm({ ...loanForm, loanTermMonths: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={18}>18 Months</option>
                  <option value={24}>24 Months</option>
                  <option value={36}>36 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose *</label>
                <textarea
                  value={loanForm.purpose}
                  onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="What is the loan for?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={loanForm.notes}
                  onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Add Loan
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD LEAVE MODAL ================= */}
      {showLeaveModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-green-600" />
                Leave Request for {selectedTeacher.fullName}
              </h3>
            </div>
            <form onSubmit={handleAddLeave} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Leave Type *</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="compassionate">Compassionate Leave</option>
                  <option value="study">Study Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date *</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason *</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm resize-none"
                  placeholder="Why is the leave needed?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={leaveForm.notes}
                  onChange={(e) => setLeaveForm({ ...leaveForm, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm resize-none"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  Add Leave
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD ALLOWANCE MODAL ================= */}
      {showAllowanceModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-purple-600" />
                Daily Allowance for {selectedTeacher.fullName}
              </h3>
            </div>
            <form onSubmit={handleAddAllowance} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (UGX) *</label>
                <input
                  type="number"
                  value={allowanceForm.amount}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="e.g., 50000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select
                  value={allowanceForm.category}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="transport">🚗 Transport</option>
                  <option value="lunch">🍱 Lunch</option>
                  <option value="extra_duty">💪 Extra Duty</option>
                  <option value="emergency">🚨 Emergency</option>
                  <option value="travel">✈️ Travel</option>
                  <option value="workshop">📚 Workshop</option>
                  <option value="overtime">⏰ Overtime</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                <input
                  type="date"
                  value={allowanceForm.date}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason *</label>
                <textarea
                  value={allowanceForm.reason}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, reason: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                  placeholder="Why is this allowance being given?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={allowanceForm.notes}
                  onChange={(e) => setAllowanceForm({ ...allowanceForm, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                >
                  Add Allowance
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllowanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfile;