// AdminStudents.jsx - FULL COMPLETE CODE (No Placeholders)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Filter, Eye, Edit, Trash2, 
  Download, Upload, RefreshCw, Loader2, X, Save, 
  ChevronLeft, ChevronRight, User, Mail, Phone, 
  MapPin, Calendar, BookOpen, School, GraduationCap,
  UserCheck, UserX, AlertCircle, CheckCircle, Clock,
  Award, Star, TrendingUp, DollarSign, CreditCard,
  FileText, Printer, BarChart3, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Minus, Menu, Grid,
  List, ChevronDown, ChevronUp, Info, BookMarked,
  FolderOpen, Users as UsersIcon, UserPlus as UserPlusIcon,
  UserMinus, UserCheck as UserCheckIcon, CalendarDays,
  Building, MapPin as MapPinIcon, Phone as PhoneIcon,
  Mail as MailIcon, Briefcase, Shield, Zap, Sparkles,
  UserCog, UserX as UserXIcon, History, RotateCcw,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  Filter as FilterIcon, Layers, Database, BarChart,
  Calendar as CalendarIcon, Clock as ClockIcon, CheckSquare, Square,
  ChevronsLeft, ChevronsRight, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import * as XLSX from 'xlsx';

// Helper: format currency
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'UGX 0';
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper: extract array from API response
const extractData = (res) => {
  if (!res || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

const AdminStudents = () => {
  const navigate = useNavigate();
  
  // ================= STATE =================
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [showInactive, setShowInactive] = useState(false);
  const [currentTerm] = useState('Term 1');
  const [currentAcademicYear] = useState('2026');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTermStatsModal, setShowTermStatsModal] = useState(false);
  const [showFeesModal, setShowFeesModal] = useState(false);
  
  // Selected student
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToChangeStatus, setStudentToChangeStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('Active');
  
  // Form data
  const [formData, setFormData] = useState({
    studentNumber: '',
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    classId: '',
    parentName: '',
    parentPhone: '',
    address: '',
    nationality: 'Ugandan',
    medicalcondition: 'none',
    status: 'Active',
    inactiveReason: '',
    inactiveDate: '',
    term: 'Term 1',
    academicYear: '2026',
    enrollmentDate: '',
    returnDate: ''
  });

  // Bulk import
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  // View mode
  const [viewMode, setViewMode] = useState('table');

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setError('No token found. Please login again.');
        toast.error('Please login again');
        return;
      }
      
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, classesRes, feesRes] = await Promise.all([
        api.get('/students', config),
        api.get('/classes', config),
        api.get('/fees', config)
      ]);

      const studentsData = extractData(studentsRes);
      const classesData = extractData(classesRes);
      const feesData = extractData(feesRes);

      const classMap = {};
      classesData.forEach(c => { classMap[c.id] = c.className; });

      const feesMap = {};
      feesData.forEach(f => {
        if (!feesMap[f.studentId]) feesMap[f.studentId] = [];
        feesMap[f.studentId].push(f);
      });

      const now = new Date();
      const fourMonthsAgo = new Date(now);
      fourMonthsAgo.setMonth(now.getMonth() - 4);

      const enrichedStudents = studentsData.map(s => {
        const studentFees = feesMap[s.id] || [];
        studentFees.sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));
        const lastPayment = studentFees.length > 0 ? new Date(studentFees[0].paymentDate || studentFees[0].createdAt) : null;
        const hasRecentPayment = lastPayment && lastPayment >= fourMonthsAgo;
        
        let computedStatus = s.status || 'Active';
        if (s.status && s.status.toLowerCase() === 'inactive') {
          computedStatus = 'Inactive (Manual)';
        } else if (!hasRecentPayment && studentFees.length > 0) {
          computedStatus = 'Inactive (Auto)';
        } else if (studentFees.length === 0) {
          computedStatus = 'Inactive (No Fees)';
        } else {
          computedStatus = 'Active';
        }

        const isActive = computedStatus === 'Active' || computedStatus === 'Active (Manual)';

        return {
          ...s,
          className: classMap[s.classId] || 'Not Assigned',
          status: s.status || 'Active',
          computedStatus,
          isActive,
          term: s.term || 'Term 1',
          academicYear: s.academicYear || '2026',
          fees: studentFees,
          lastPaymentDate: lastPayment,
          feeCount: studentFees.length,
          totalPaid: studentFees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0),
          totalFee: studentFees.reduce((sum, f) => sum + Number(f.totalFee || 0), 0),
          balance: studentFees.reduce((sum, f) => sum + (Number(f.totalFee || 0) - Number(f.amountPaid || 0)), 0)
        };
      });

      setStudents(enrichedStudents);
      setClasses(classesData);
      setFees(feesData);
      
      const filtered = applyFilters(enrichedStudents);
      setFilteredStudents(filtered);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data');
      toast.error('Failed to load students data');
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= APPLY FILTERS =================
  const applyFilters = useCallback((data) => {
    let result = data || students;
    if (!result || result.length === 0) return [];
    
    if (!showInactive) {
      result = result.filter(s => s.isActive);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.fullName?.toLowerCase() || '').includes(term) ||
        (s.studentNumber?.toLowerCase() || '').includes(term) ||
        (s.parentName?.toLowerCase() || '').includes(term)
      );
    }
    
    if (classFilter) result = result.filter(s => s.classId === parseInt(classFilter));
    if (genderFilter) result = result.filter(s => s.gender?.toLowerCase() === genderFilter.toLowerCase());
    if (statusFilter) {
      if (statusFilter === 'active') result = result.filter(s => s.isActive);
      else if (statusFilter === 'inactive') result = result.filter(s => !s.isActive);
    }
    if (termFilter) result = result.filter(s => s.term === termFilter);
    
    return result;
  }, [students, searchTerm, classFilter, genderFilter, statusFilter, termFilter, showInactive]);

  useEffect(() => {
    const filtered = applyFilters();
    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [applyFilters]);

  // ================= STATS =================
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.isActive).length;
    const inactive = total - active;
    const male = students.filter(s => s.gender?.toLowerCase() === 'male').length;
    const female = students.filter(s => s.gender?.toLowerCase() === 'female').length;
    const currentTermStudents = students.filter(s => s.term === currentTerm && s.academicYear === currentAcademicYear).length;
    const returningStudents = students.filter(s => s.returnDate).length;
    return { total, active, inactive, male, female, currentTermStudents, returningStudents };
  }, [students, currentTerm, currentAcademicYear]);

  const classAnalytics = useMemo(() => {
    const analytics = {};
    students.forEach(s => {
      const className = s.className || 'Not Assigned';
      if (!analytics[className]) {
        analytics[className] = { total: 0, active: 0, inactive: 0 };
      }
      analytics[className].total++;
      if (s.isActive) analytics[className].active++;
      else analytics[className].inactive++;
    });
    return analytics;
  }, [students]);

  const termAnalytics = useMemo(() => {
    const analytics = {};
    students.forEach(s => {
      const termKey = `${s.term} ${s.academicYear}`;
      if (!analytics[termKey]) {
        analytics[termKey] = { total: 0, active: 0, inactive: 0, byClass: {} };
      }
      analytics[termKey].total++;
      if (s.isActive) analytics[termKey].active++;
      else analytics[termKey].inactive++;
      const className = s.className || 'Not Assigned';
      if (!analytics[termKey].byClass[className]) {
        analytics[termKey].byClass[className] = 0;
      }
      analytics[termKey].byClass[className]++;
    });
    return analytics;
  }, [students]);

  // ================= PAGINATION =================
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // ================= CRUD OPERATIONS =================
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const data = {
        ...formData,
        classId: formData.classId || null,
        status: 'Active',
        term: currentTerm,
        academicYear: currentAcademicYear,
        enrollmentDate: new Date().toISOString().split('T')[0]
      };
      await api.post('/students', data, config);
      toast.success('Student added successfully');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Add student error:', error);
      toast.error(error.response?.data?.message || 'Failed to add student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const data = {
        ...formData,
        classId: formData.classId || null
      };
      await api.put(`/students/${selectedStudent.id}`, data, config);
      toast.success('Student updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Update student error:', error);
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!studentToChangeStatus) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const updateData = {
        status: newStatus,
        ...(newStatus !== 'Active' && {
          inactiveReason: formData.inactiveReason || 'Student left school',
          inactiveDate: formData.inactiveDate || new Date().toISOString().split('T')[0],
          leftTerm: currentTerm,
          leftYear: currentAcademicYear
        }),
        ...(newStatus === 'Active' && {
          returnDate: new Date().toISOString().split('T')[0],
          status: 'Active'
        })
      };
      await api.put(`/students/${studentToChangeStatus.id}`, updateData, config);
      toast.success(`Student ${newStatus === 'Active' ? 'reactivated' : 'marked as inactive'}`);
      setShowStatusModal(false);
      setStudentToChangeStatus(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Change status error:', error);
      toast.error(error.response?.data?.message || 'Failed to change status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReactivate = async (student) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.put(`/students/${student.id}`, { status: 'Active', returnDate: new Date().toISOString().split('T')[0] }, config);
      toast.success(`${student.fullName} has been reactivated`);
      fetchData();
    } catch (error) {
      console.error('Reactivate error:', error);
      toast.error(error.response?.data?.message || 'Failed to reactivate student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.delete(`/students/${studentToDelete.id}`, config);
      toast.success('Student deleted successfully');
      setShowDeleteModal(false);
      setStudentToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Delete student error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student');
    }
  };

  // ================= BULK IMPORT =================
  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          if (data.length === 0) {
            toast.error('File is empty');
            return;
          }
          const token = localStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          setImportProgress(0);
          const results = { success: 0, failed: 0, errors: [] };
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
              const studentData = {
                studentNumber: row['Student Number'] || row['studentNumber'] || `STU-${Date.now().toString().slice(-6)}-${i}`,
                fullName: row['Full Name'] || row['fullName'] || '',
                gender: row['Gender'] || row['gender'] || 'Male',
                dateOfBirth: row['Date of Birth'] || row['dateOfBirth'] || null,
                classId: row['Class ID'] || row['classId'] || null,
                parentName: row['Parent Name'] || row['parentName'] || '',
                parentPhone: row['Parent Phone'] || row['parentPhone'] || '',
                address: row['Address'] || row['address'] || '',
                status: row['Status'] || row['status'] || 'Active',
                term: row['Term'] || row['term'] || 'Term 1',
                academicYear: row['Academic Year'] || row['academicYear'] || '2026'
              };
              await api.post('/students', studentData, config);
              results.success++;
            } catch (err) {
              results.failed++;
              results.errors.push({ row: i + 1, error: err.message });
            }
            setImportProgress(((i + 1) / data.length) * 100);
          }
          setImportResults(results);
          toast.success(`Imported ${results.success} students, ${results.failed} failed`);
          setShowBulkImportModal(false);
          setImportFile(null);
          setImportProgress(0);
          fetchData();
        } catch (err) {
          console.error('Import error:', err);
          toast.error('Failed to import file');
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import');
    }
  };

  // ================= EXPORT =================
  const handleExport = () => {
    try {
      const data = filteredStudents.map(s => ({
        'Student Number': s.studentNumber,
        'Full Name': s.fullName,
        'Gender': s.gender,
        'Class': s.className || 'Not Assigned',
        'Parent Name': s.parentName,
        'Parent Phone': s.parentPhone,
        'Address': s.address,
        'Status': s.status,
        'Computed Status': s.computedStatus,
        'Term': s.term || 'Term 1',
        'Academic Year': s.academicYear || '2026',
        'Total Paid': s.totalPaid || 0,
        'Balance': s.balance || 0,
        'Last Payment Date': s.lastPaymentDate ? new Date(s.lastPaymentDate).toLocaleDateString() : 'Never'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, `Students_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    }
  };

  // ================= FORM HELPERS =================
  const resetForm = () => {
    setFormData({
      studentNumber: '',
      fullName: '',
      gender: 'Male',
      dateOfBirth: '',
      classId: '',
      parentName: '',
      parentPhone: '',
      address: '',
      nationality: 'Ugandan',
      medicalcondition: 'none',
      status: 'Active',
      inactiveReason: '',
      inactiveDate: '',
      term: currentTerm,
      academicYear: currentAcademicYear,
      enrollmentDate: '',
      returnDate: ''
    });
    setSelectedStudent(null);
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      studentNumber: student.studentNumber || '',
      fullName: student.fullName || '',
      gender: student.gender || 'Male',
      dateOfBirth: student.dateOfBirth || '',
      classId: student.classId || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      address: student.address || '',
      nationality: student.nationality || 'Ugandan',
      medicalcondition: student.medicalcondition || 'none',
      status: student.status || 'Active',
      inactiveReason: student.inactiveReason || '',
      inactiveDate: student.inactiveDate || '',
      term: student.term || currentTerm,
      academicYear: student.academicYear || currentAcademicYear,
      enrollmentDate: student.enrollmentDate || '',
      returnDate: student.returnDate || ''
    });
    setShowEditModal(true);
  };

  const openDetailModal = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const openFeesModal = (student) => {
    setSelectedStudent(student);
    setShowFeesModal(true);
  };

  // ================= FORMAT HELPERS =================
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      'inactive (auto)': 'bg-orange-100 text-orange-700 border-orange-200',
      'inactive (no fees)': 'bg-red-100 text-red-700 border-red-200',
      'inactive (manual)': 'bg-gray-100 text-gray-700 border-gray-200',
      graduated: 'bg-blue-100 text-blue-700 border-blue-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
      'on-leave': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    const key = status?.toLowerCase() || 'inactive';
    return colors[key] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getGenderIcon = (gender) => {
    if (gender?.toLowerCase() === 'male') return <User className="w-4 h-4 text-blue-500" />;
    if (gender?.toLowerCase() === 'female') return <User className="w-4 h-4 text-pink-500" />;
    return <User className="w-4 h-4 text-gray-400" />;
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchData();
  }, []);

  // ================= RENDER =================
  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {[...Array(7)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl p-4 h-24"></div>)}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
              <p className="mt-2 text-gray-400 text-sm">Loading students...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Error Loading Students</h3>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">Retry</button>
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
            Student Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">{students.length} students • {stats.active} active • {stats.inactive} inactive</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium">
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
          <button onClick={() => setShowBulkImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm font-medium">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowTermStatsModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium">
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'purple' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'emerald' },
          { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'gray' },
          { label: 'Male', value: stats.male, icon: User, color: 'blue' },
          { label: 'Female', value: stats.female, icon: User, color: 'pink' },
          { label: 'This Term', value: stats.currentTermStudents, icon: Calendar, color: 'indigo' },
          { label: 'Returned', value: stats.returningStudents, icon: RotateCcw, color: 'amber' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 text-center hover:shadow-md transition">
            <div className={`inline-flex p-2 rounded-lg bg-${item.color}-100 text-${item.color}-600 mb-1`}>
              <item.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`text-xl font-bold text-${item.color}-600`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* ================= CLASS ANALYTICS ================= */}
      {Object.keys(classAnalytics).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <School className="w-4 h-4 text-purple-600" />
              Class Population
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(classAnalytics).slice(0, 8).map(([className, data]) => (
              <div key={className} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <p className="text-xs font-medium text-gray-700 truncate">{className}</p>
                <div className="flex gap-2 mt-0.5 text-[10px]">
                  <span className="text-emerald-600">A: {data.active}</span>
                  <span className="text-gray-400">I: {data.inactive}</span>
                  <span className="text-blue-600">T: {data.total}</span>
                </div>
                <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.total > 0 ? (data.active / data.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 mb-6">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[150px] relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
          </div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white min-w-[100px]">
            <option value="">All Classes</option>
            {classes.slice(0, 10).map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
          <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white min-w-[90px]">
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white min-w-[90px]">
            <option value="">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={() => setShowInactive(!showInactive)} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition ${showInactive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
            {showInactive ? <CheckCircle className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            Show Inactive
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}>
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-lg transition ${viewMode === 'cards' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}>
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= STUDENTS TABLE / CARDS ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-600">No Students Found</p>
            <p className="text-sm mt-1">There are no students registered in the system yet.</p>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium inline-flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add Your First Student
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium">No students match your filters</p>
            <p className="text-xs mt-1">Try adjusting your search or filter criteria</p>
            <button onClick={() => { setSearchTerm(''); setClassFilter(''); setGenderFilter(''); setStatusFilter(''); setTermFilter(''); }} className="mt-3 px-4 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Class</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Gender</th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Parent</th>
                      <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">Term</th>
                      <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50 transition group">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border uppercase ${student.isActive ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              {student.fullName?.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-medium text-sm ${student.isActive ? 'text-slate-800' : 'text-gray-400'}`}>
                                {student.fullName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-xs font-mono text-slate-600">{student.studentNumber}</td>
                        <td className="p-3 text-sm text-slate-600">{student.className || 'Not Assigned'}</td>
                        <td className="p-3 text-sm text-slate-600">{student.gender || 'N/A'}</td>
                        <td className="p-3"><p className="text-sm text-slate-600">{student.parentName || 'N/A'}</p></td>
                        <td className="p-3 text-center text-xs text-slate-500">{student.term || 'Term 1'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(student.computedStatus)}`}>
                            {student.isActive ? 'Active' : student.computedStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => openDetailModal(student)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => openEditModal(student)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => openFeesModal(student)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition"><Receipt className="w-3.5 h-3.5" /></button>
                            {student.isActive ? (
                              <button onClick={() => { setStudentToChangeStatus(student); setNewStatus('Inactive'); setFormData(prev => ({ ...prev, inactiveReason: 'Student left school', inactiveDate: new Date().toISOString().split('T')[0] })); setShowStatusModal(true); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition" title="Mark Inactive">
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button onClick={() => handleReactivate(student)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition" title="Reactivate">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => { setStudentToDelete(student); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                {paginatedStudents.map(student => (
                  <div key={student.id} className={`rounded-lg border p-3 hover:shadow-md transition ${student.isActive ? 'bg-white border-slate-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border uppercase ${student.isActive ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>
                        {student.fullName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${student.isActive ? 'text-slate-800' : 'text-gray-400'}`}>{student.fullName}</p>
                        <p className="text-[10px] text-slate-400">{student.studentNumber}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(student.computedStatus)}`}>
                        {student.isActive ? 'Active' : student.computedStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div><p className="text-[10px] text-slate-400">Class</p><p className="text-slate-700 truncate">{student.className || 'Not Assigned'}</p></div>
                      <div><p className="text-[10px] text-slate-400">Term</p><p className="text-slate-700">{student.term || 'Term 1'}</p></div>
                    </div>
                    <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
                      <button onClick={() => openDetailModal(student)} className="flex-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition">View</button>
                      <button onClick={() => openEditModal(student)} className="flex-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded text-xs font-medium transition">Edit</button>
                      <button onClick={() => openFeesModal(student)} className="flex-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-xs font-medium transition">Fees</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500">{startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length}</div>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 transition disabled:opacity-40">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 py-1 text-xs text-slate-600">{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 transition disabled:opacity-40">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= ADD STUDENT MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-600" /> Add New Student</h3>
                <p className="text-sm text-gray-500">Fill in the student details below</p>
              </div>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddStudent} className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="fullName" value={formData.fullName} onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Student Number *</label><input type="text" name="studentNumber" value={formData.studentNumber} onChange={e => setFormData(prev => ({ ...prev, studentNumber: e.target.value }))} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm font-mono" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select name="gender" value={formData.gender} onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Class</label><select name="classId" value={formData.classId} onChange={e => setFormData(prev => ({ ...prev, classId: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Term</label><select name="term" value={formData.term || currentTerm} onChange={e => setFormData(prev => ({ ...prev, term: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"><option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label><input type="text" name="parentName" value={formData.parentName} onChange={e => setFormData(prev => ({ ...prev, parentName: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Phone</label><input type="text" name="parentPhone" value={formData.parentPhone} onChange={e => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea name="address" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} rows="2" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm resize-none" /></div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button type="submit" disabled={isSaving} className="flex-1 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Add Student
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT STUDENT MODAL ================= */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-yellow-50">
              <div><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Edit className="w-5 h-5 text-amber-600" /> Edit {selectedStudent.fullName}</h3><p className="text-sm text-gray-500">Update student information</p></div>
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEditStudent} className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="fullName" value={formData.fullName} onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Student Number *</label><input type="text" name="studentNumber" value={formData.studentNumber} onChange={e => setFormData(prev => ({ ...prev, studentNumber: e.target.value }))} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm font-mono" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select name="gender" value={formData.gender} onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-white"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Class</label><select name="classId" value={formData.classId} onChange={e => setFormData(prev => ({ ...prev, classId: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-white"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select name="status" value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm bg-white"><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Graduated">Graduated</option><option value="Suspended">Suspended</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label><input type="text" name="parentName" value={formData.parentName} onChange={e => setFormData(prev => ({ ...prev, parentName: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Phone</label><input type="text" name="parentPhone" value={formData.parentPhone} onChange={e => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea name="address" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} rows="2" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm resize-none" /></div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button type="submit" disabled={isSaving} className="flex-1 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Update Student
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); resetForm(); }} className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= STUDENT DETAIL MODAL ================= */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-6 text-white ${selectedStudent.isActive ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-gray-600 to-gray-700'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30 uppercase ${selectedStudent.isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                    {selectedStudent.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.fullName}</h3>
                    <p className={`text-sm ${selectedStudent.isActive ? 'text-white/80' : 'text-gray-400'}`}>{selectedStudent.studentNumber}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Full Name</p><p className="text-sm font-medium text-slate-800">{selectedStudent.fullName}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Student Number</p><p className="text-sm font-medium text-slate-800 font-mono">{selectedStudent.studentNumber}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Gender</p><p className="text-sm font-medium text-slate-800">{selectedStudent.gender || 'N/A'}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Date of Birth</p><p className="text-sm font-medium text-slate-800">{formatDate(selectedStudent.dateOfBirth)}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Class</p><p className="text-sm font-medium text-slate-800">{selectedStudent.className || 'Not Assigned'}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Status</p><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedStudent.computedStatus)}`}>{selectedStudent.isActive ? 'Active' : selectedStudent.computedStatus}</span></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Term</p><p className="text-sm font-medium text-slate-800">{selectedStudent.term || 'Term 1'} {selectedStudent.academicYear || ''}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Enrollment Date</p><p className="text-sm font-medium text-slate-800">{formatDate(selectedStudent.enrollmentDate)}</p></div>
                {!selectedStudent.isActive && (
                  <>
                    <div className="bg-slate-50 p-4 rounded-xl md:col-span-2"><p className="text-xs text-slate-400">Inactive Reason</p><p className="text-sm font-medium text-slate-800">{selectedStudent.inactiveReason || 'Not specified'}</p></div>
                    <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Inactive Date</p><p className="text-sm font-medium text-slate-800">{formatDate(selectedStudent.inactiveDate)}</p></div>
                    {selectedStudent.returnDate && <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Return Date</p><p className="text-sm font-medium text-slate-800">{formatDate(selectedStudent.returnDate)}</p></div>}
                  </>
                )}
                <div className="bg-slate-50 p-4 rounded-xl md:col-span-2"><p className="text-xs text-slate-400">Parent/Guardian</p><p className="text-sm font-medium text-slate-800">{selectedStudent.parentName || 'N/A'}</p><p className="text-sm text-slate-600">{selectedStudent.parentPhone || ''}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl md:col-span-2"><p className="text-xs text-slate-400">Address</p><p className="text-sm font-medium text-slate-800">{selectedStudent.address || 'N/A'}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Nationality</p><p className="text-sm font-medium text-slate-800">{selectedStudent.nationality || 'N/A'}</p></div>
                <div className="bg-slate-50 p-4 rounded-xl"><p className="text-xs text-slate-400">Medical Condition</p><p className="text-sm font-medium text-slate-800 capitalize">{selectedStudent.medicalcondition || 'None'}</p></div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button onClick={() => { setShowDetailModal(false); openEditModal(selectedStudent); }} className="flex-1 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" /> Edit Student
                </button>
                <button onClick={() => openFeesModal(selectedStudent)} className="flex-1 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                  <Receipt className="w-4 h-4" /> View Fees
                </button>
                {!selectedStudent.isActive && (
                  <button onClick={() => { setShowDetailModal(false); handleReactivate(selectedStudent); }} className="flex-1 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Reactivate
                  </button>
                )}
                <button onClick={() => setShowDetailModal(false)} className="flex-1 px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STATUS CHANGE MODAL ================= */}
      {showStatusModal && studentToChangeStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${newStatus === 'Active' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
              {newStatus === 'Active' ? <UserCheck className="w-8 h-8 text-emerald-600" /> : <UserX className="w-8 h-8 text-orange-600" />}
            </div>
            <h3 className="text-xl font-bold text-center mb-2">{newStatus === 'Active' ? 'Reactivate Student' : 'Mark Student Inactive'}</h3>
            <p className="text-slate-500 text-sm text-center mb-4">
              {newStatus === 'Active' ? `Reactivate ${studentToChangeStatus.fullName} and bring them back to active status` : `Mark ${studentToChangeStatus.fullName} as inactive. They will be excluded from active student lists.`}
            </p>
            {newStatus !== 'Active' && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason for Inactivation</label>
                  <select name="inactiveReason" value={formData.inactiveReason || ''} onChange={e => setFormData(prev => ({ ...prev, inactiveReason: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm bg-white">
                    <option value="Student left school">Student left school</option>
                    <option value="Transferred to another school">Transferred to another school</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Inactive Date</label>
                  <input type="date" name="inactiveDate" value={formData.inactiveDate || new Date().toISOString().split('T')[0]} onChange={e => setFormData(prev => ({ ...prev, inactiveDate: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowStatusModal(false); setStudentToChangeStatus(null); resetForm(); }} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">Cancel</button>
              <button onClick={handleChangeStatus} disabled={isSaving} className={`flex-1 px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 ${newStatus === 'Active' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Delete Student</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete {studentToDelete.fullName}? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setStudentToDelete(null); }} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">Cancel</button>
              <button onClick={handleDeleteStudent} disabled={isSaving} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BULK IMPORT MODAL ================= */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-emerald-600" /> Bulk Import Students</h3>
              <button onClick={() => { setShowBulkImportModal(false); setImportFile(null); setImportProgress(0); setImportResults(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>
            {importResults ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm font-medium text-slate-800">Import Results</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div><p className="text-xs text-slate-400">Successful</p><p className="text-xl font-bold text-emerald-600">{importResults.success}</p></div>
                    <div><p className="text-xs text-slate-400">Failed</p><p className="text-xl font-bold text-red-600">{importResults.failed}</p></div>
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto">
                      <p className="text-xs text-slate-400 mb-1">Errors:</p>
                      {importResults.errors.map((err, i) => <p key={i} className="text-xs text-red-500">Row {err.row}: {err.error}</p>)}
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowBulkImportModal(false); setImportFile(null); setImportProgress(0); setImportResults(null); }} className="w-full px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">Close</button>
              </div>
            ) : (
              <>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-4">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Drop your Excel file here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv</p>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files[0])} className="mt-3 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100" />
                </div>
                {importProgress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Importing...</span><span>{Math.round(importProgress)}%</span></div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} /></div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={handleBulkImport} disabled={!importFile || isSaving} className="flex-1 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Import
                  </button>
                  <button onClick={() => { setShowBulkImportModal(false); setImportFile(null); setImportProgress(0); setImportResults(null); }} className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= TERM ANALYTICS MODAL ================= */}
      {showTermStatsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Term Analytics</h3>
                <p className="text-sm text-gray-500">Student enrollment and retention statistics</p>
              </div>
              <button onClick={() => setShowTermStatsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100">
                <h4 className="font-semibold text-indigo-800 mb-3">Current Term: {currentTerm} {currentAcademicYear}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-indigo-600">{students.filter(s => s.term === currentTerm && s.academicYear === currentAcademicYear).length}</p><p className="text-xs text-slate-500">Total Enrolled</p></div>
                  <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-emerald-600">{students.filter(s => s.term === currentTerm && s.academicYear === currentAcademicYear && s.isActive).length}</p><p className="text-xs text-slate-500">Active</p></div>
                  <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-gray-600">{students.filter(s => !s.isActive).length}</p><p className="text-xs text-slate-500">Inactive</p></div>
                  <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-blue-600">{students.filter(s => s.returnDate).length}</p><p className="text-xs text-slate-500">Returned</p></div>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Term History</h4>
                <div className="space-y-3">
                  {Object.entries(termAnalytics).sort((a, b) => b[0].localeCompare(a[0])).map(([termKey, data]) => (
                    <div key={termKey} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-2"><span className="font-medium text-slate-700">{termKey}</span><span className="text-sm text-slate-500">Total: {data.total}</span></div>
                      <div className="flex gap-4 text-xs"><span className="text-emerald-600">Active: {data.active}</span><span className="text-gray-400">Inactive: {data.inactive}</span></div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(data.byClass).map(([className, count]) => (
                          <span key={className} className="px-2 py-0.5 bg-white rounded-full text-xs border border-slate-200">{className}: {count}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowTermStatsModal(false)} className="w-full mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FEES MODAL ================= */}
      {showFeesModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Fee History - {selectedStudent.fullName}
                </h3>
                <p className="text-sm text-gray-500">Student Number: {selectedStudent.studentNumber}</p>
              </div>
              <button onClick={() => setShowFeesModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-400">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedStudent.totalPaid || 0)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-400">Total Fee</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedStudent.totalFee || 0)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-400">Balance</p>
                  <p className={`text-lg font-bold ${(selectedStudent.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedStudent.balance || 0)}
                  </p>
                </div>
              </div>

              {selectedStudent.fees && selectedStudent.fees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-2 text-xs font-semibold text-slate-500 uppercase">Date</th>
                        <th className="text-left p-2 text-xs font-semibold text-slate-500 uppercase">Term</th>
                        <th className="text-left p-2 text-xs font-semibold text-slate-500 uppercase">Year</th>
                        <th className="text-right p-2 text-xs font-semibold text-slate-500 uppercase">Amount Paid</th>
                        <th className="text-right p-2 text-xs font-semibold text-slate-500 uppercase">Total Fee</th>
                        <th className="text-right p-2 text-xs font-semibold text-slate-500 uppercase">Balance</th>
                        <th className="text-center p-2 text-xs font-semibold text-slate-500 uppercase">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudent.fees.map((fee, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="p-2 text-xs">{formatDate(fee.paymentDate || fee.createdAt)}</td>
                          <td className="p-2 text-xs">{fee.term || '—'}</td>
                          <td className="p-2 text-xs">{fee.academicYear || '—'}</td>
                          <td className="p-2 text-right text-xs font-medium text-emerald-600">{formatCurrency(fee.amountPaid)}</td>
                          <td className="p-2 text-right text-xs text-slate-600">{formatCurrency(fee.totalFee)}</td>
                          <td className="p-2 text-right text-xs font-medium text-red-600">{formatCurrency(fee.balance || 0)}</td>
                          <td className="p-2 text-center text-xs text-slate-500">{fee.paymentMethod || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p>No fee records found for this student.</p>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button onClick={() => setShowFeesModal(false)} className="flex-1 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;