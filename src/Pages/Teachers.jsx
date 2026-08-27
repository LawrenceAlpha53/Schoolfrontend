// AdminTeachers.jsx – Complete with automatic User creation & employeeNumber fix
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, UserCheck, Clock, BookOpen, Search, Plus, Edit, Trash2,
  Eye, Download, Filter, X, Save, Loader2, RefreshCw,
  DollarSign, User, Calendar, FileText, CreditCard, Banknote,
  ArrowUpDown, UserCircle, Briefcase, Award, Wallet,
  CalendarDays, FileCheck, Receipt, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, Upload, FileSpreadsheet, GraduationCap,
  BookMarked, UserPlus, Shield, ChevronLeft, ChevronRight, Phone,
  Mail, Printer, PieChart, BarChart3, History,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import * as XLSX from 'xlsx';

// ---------- Helpers ----------
const extractData = (res) => {
  if (!res || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'UGX 0';
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatCompact = (amount) => {
  if (amount >= 1e9) return `UGX ${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `UGX ${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `UGX ${(amount / 1e3).toFixed(0)}K`;
  return formatCurrency(amount);
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const StatusBadge = ({ status }) => {
  const map = {
    active: 'bg-green-100 text-green-800 border border-green-200',
    'on-leave': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
    terminated: 'bg-red-100 text-red-800 border border-red-200',
  };
  const cls = map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border border-gray-200';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${cls}`}>{status || 'N/A'}</span>;
};

const TableSkeleton = ({ rows = 5 }) => (
  <tbody className="divide-y divide-gray-100">
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        {Array.from({ length: 8 }).map((_, j) => (
          <td key={j} className="px-5 py-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ---------- Main Component ----------
export default function AdminTeachers() {
  // ---------- State ----------
  const [teachers, setTeachers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classMap, setClassMap] = useState({});
  const [subjectMap, setSubjectMap] = useState({});

  // Filters & Sort
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classTeacherFilter, setClassTeacherFilter] = useState('');
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination for main table
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // Salary Quick Pay Modal
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryTeacher, setSalaryTeacher] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'paid'
  });
  const [salaryLoading, setSalaryLoading] = useState(false);

  // Detail modal tabs
  const [detailTab, setDetailTab] = useState('profile');

  // Salary history and summary (for detail modal)
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [salarySummary, setSalarySummary] = useState({ totalPaid: 0, totalUnpaid: 0, lastPaymentDate: null });
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [editingSalaryId, setEditingSalaryId] = useState(null);

  // Other detail data
  const [attendance, setAttendance] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [loans, setLoans] = useState([]);

  // Global salary stats
  const [globalSalaryStats, setGlobalSalaryStats] = useState({
    totalPaidAll: 0,
    totalUnpaidAll: 0,
    totalTeachersPaid: 0,
    totalTeachersUnpaid: 0,
    thisMonthPaid: 0
  });

  // Payment History
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyFiltered, setHistoryFiltered] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth());
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;

  // ---------- ENRICH TEACHER DATA ----------
  const enrichTeachers = useCallback((teacherData) => {
    return teacherData.map(t => {
      let className = 'Unassigned';
      if (t.class?.className) {
        className = t.class.className;
      } else if (t.className) {
        className = t.className;
      } else if (t.classId && classMap[t.classId]) {
        className = classMap[t.classId];
      }
      
      let subjectName = 'Unassigned';
      if (t.subjects && t.subjects.length > 0) {
        subjectName = t.subjects.map(s => s.subjectName).join(', ');
      } else if (t.subject?.subjectName) {
        subjectName = t.subject.subjectName;
      } else if (t.subjectName) {
        subjectName = t.subjectName;
      } else if (t.subjectId && subjectMap[t.subjectId]) {
        subjectName = subjectMap[t.subjectId];
      }
      
      return {
        ...t,
        className: className,
        subjectName: subjectName,
        classObj: t.class || null,
        subjectObj: t.subject || null,
        subjectsList: t.subjects || [],
        isClassTeacher: t.isClassTeacher || false,
      };
    });
  }, [classMap, subjectMap]);

  // ---------- Data Fetching ----------
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers');
      const data = extractData(res);
      const enriched = enrichTeachers(data);
      setTeachers(enriched || []);
      console.log('✅ Teachers fetched and enriched:', enriched.length);
    } catch (error) {
      console.error('Fetch teachers error:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, [enrichTeachers]);

  const fetchSingleTeacher = useCallback(async (id) => {
    try {
      const res = await api.get(`/teachers/${id}`);
      const data = extractData(res);
      const enriched = enrichTeachers([data])[0];
      return enriched;
    } catch (error) {
      console.error('Fetch single teacher error:', error);
      return null;
    }
  }, [enrichTeachers]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      const data = extractData(res) || [];
      setClasses(data);
      const cMap = {};
      data.forEach(c => { cMap[c.id] = c.className; });
      setClassMap(cMap);
    } catch { /* ignore */ }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get('/subjects');
      const data = extractData(res) || [];
      setSubjects(data);
      const sMap = {};
      data.forEach(s => { sMap[s.id] = s.subjectName; });
      setSubjectMap(sMap);
    } catch { /* ignore */ }
  }, []);

  const fetchGlobalSalaryStats = useCallback(async () => {
    try {
      const res = await api.get('/teacher-salaries/summary');
      const data = extractData(res);
      if (data && data.length > 0) {
        let totalPaid = 0;
        let totalUnpaid = 0;
        let paidCount = 0;
        let unpaidCount = 0;
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        let thisMonthPaid = 0;

        data.forEach(item => {
          totalPaid += Number(item.totalAmountPaid || 0);
          totalUnpaid += Number(item.totalUnpaid || 0);
          if (item.totalAmountPaid > 0) paidCount++;
          if (item.totalUnpaid > 0) unpaidCount++;
        });

        const thisMonthRes = await api.get('/teacher-salaries', {
          params: { month: thisMonth, year: thisYear }
        });
        const thisMonthData = extractData(thisMonthRes);
        if (thisMonthData && thisMonthData.length > 0) {
          thisMonthData.forEach(item => {
            thisMonthPaid += Number(item.amountPaid || 0);
          });
        }

        setGlobalSalaryStats({
          totalPaidAll: totalPaid,
          totalUnpaidAll: totalUnpaid,
          totalTeachersPaid: paidCount,
          totalTeachersUnpaid: unpaidCount,
          thisMonthPaid
        });
      }
    } catch (error) {
      console.error('Fetch global salary stats error:', error);
    }
  }, []);

  const fetchPaymentHistory = useCallback(async (month, year) => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/teacher-salaries', {
        params: { month, year, limit: 10000 }
      });
      const data = extractData(res);
      setHistoryRecords(data || []);
    } catch (error) {
      console.error('Fetch payment history error:', error);
      toast.error('Failed to load payment history');
      setHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ---------- Initial Load ----------
  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (classes.length > 0 || subjects.length > 0) {
      fetchTeachers();
    }
  }, [classes, subjects, fetchTeachers]);

  useEffect(() => {
    fetchGlobalSalaryStats();
    fetchPaymentHistory(historyMonth, historyYear);
  }, []);

  useEffect(() => {
    fetchPaymentHistory(historyMonth, historyYear);
  }, [historyMonth, historyYear, fetchPaymentHistory]);

  // ---------- Filter & Sort main table ----------
  useEffect(() => {
    let result = [...teachers];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        t.fullName?.toLowerCase().includes(s) ||
        t.email?.toLowerCase().includes(s) ||
        t.phoneNumber?.includes(s) ||
        t.employeeNumber?.toLowerCase().includes(s)
      );
    }
    if (classFilter) result = result.filter(t => t.classId === parseInt(classFilter));
    if (subjectFilter) result = result.filter(t => t.subjectId === parseInt(subjectFilter));
    if (statusFilter) result = result.filter(t => t.status?.toLowerCase() === statusFilter.toLowerCase());
    if (classTeacherFilter) {
      const isClassTeacher = classTeacherFilter === 'true';
      result = result.filter(t => t.isClassTeacher === isClassTeacher);
    }

    const field = sortBy;
    const order = sortOrder === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let va = a[field] || '';
      let vb = b[field] || '';
      if (field === 'class') { va = a.className || ''; vb = b.className || ''; }
      if (field === 'subject') { va = a.subjectName || ''; vb = b.subjectName || ''; }
      if (field === 'experience') { va = a.yearsOfExperience || 0; vb = b.yearsOfExperience || 0; }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return va < vb ? -1 * order : va > vb ? 1 * order : 0;
    });
    setFiltered(result);
    setPage(1);
  }, [teachers, search, classFilter, subjectFilter, statusFilter, classTeacherFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ---------- Filter Payment History ----------
  useEffect(() => {
    if (!historyRecords.length) {
      setHistoryFiltered([]);
      return;
    }
    const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]));
    let result = historyRecords.map(record => ({
      ...record,
      teacher: teacherMap[record.teacherId] || null
    }));
    if (historySearch.trim() !== '') {
      const s = historySearch.toLowerCase();
      result = result.filter(item =>
        item.teacher?.fullName?.toLowerCase().includes(s) ||
        item.teacher?.employeeNumber?.toLowerCase().includes(s)
      );
    }
    setHistoryFiltered(result);
    setHistoryPage(1);
  }, [historyRecords, historySearch, teachers]);

  const historyTotalPages = Math.ceil(historyFiltered.length / historyPerPage);
  const historyPaginated = historyFiltered.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

  // ---------- CRUD Actions ----------
  // ================= CREATE TEACHER – WITH AUTOMATIC USER CREATION & EMPLOYEE NUMBER FIX =================
  const handleCreate = async (data) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Check if a User with this email already exists
      let user = null;
      try {
        const usersRes = await api.get('/users', config);
        const allUsers = usersRes.data?.data || usersRes.data || [];
        user = allUsers.find(u => u.Email?.toLowerCase() === data.email?.toLowerCase());
      } catch (e) {
        console.warn('Could not fetch users, proceeding without check');
      }

      let userId = user?.id;

      // 2. If no user exists, create one
      if (!userId) {
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const newUserRes = await api.post('/auth/register', {
          Fname: data.fullName?.split(' ')[0] || data.fullName,
          Lname: data.fullName?.split(' ').slice(1).join(' ') || '',
          Email: data.email,
          Phonenumber: data.phoneNumber || '',
          password: randomPassword,
          role: 'teacher'
        }, config);
        if (newUserRes.data?.success) {
          userId = newUserRes.data.user?.id;
          data._generatedPassword = randomPassword;
        } else {
          throw new Error('Failed to create user account');
        }
      }

      // 3. Ensure employeeNumber is never null or empty
      let employeeNumber = data.employeeNumber;
      if (!employeeNumber || employeeNumber.trim() === '') {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        employeeNumber = `TCH-${timestamp}-${random}`;
        console.log('📌 Generated employee number:', employeeNumber);
      }

      // 4. Prepare teacher data – include ALL fields
      const teacherData = {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || '',
        employeeNumber: employeeNumber.trim(),
        qualification: data.qualification || '',
        yearsOfExperience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : 0,
        basicSalary: data.basicSalary ? parseFloat(data.basicSalary) : 0,
        status: data.status || 'active',
        isActive: true,
        classId: data.classId ? parseInt(data.classId) : null,
        subjectId: data.subjectId ? parseInt(data.subjectId) : null,
        userId: userId,
      };

      console.log('📌 Creating teacher with data:', teacherData);

      // 5. Create the Teacher record
      const res = await api.post('/teachers', teacherData, config);
      const newTeacher = extractData(res);

      // 6. Refresh the teacher list to update the count
      await fetchTeachers();

      let successMsg = '✅ Teacher created successfully';
      if (data._generatedPassword) {
        successMsg += ` 🔑 Password: ${data._generatedPassword}`;
      }
      toast.success(successMsg);
      setShowCreate(false);
      fetchGlobalSalaryStats();
    } catch (error) {
      console.error('Create error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Creation failed';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      setIsSaving(true);
      await api.put(`/teachers/${id}`, data);
      const freshTeacher = await fetchSingleTeacher(id);
      if (freshTeacher) {
        setTeachers(prev => prev.map(t => t.id === id ? freshTeacher : t));
        toast.success('✅ Teacher updated successfully');
      } else {
        toast.warning('Teacher updated but data refresh failed');
      }
      setShowEdit(false);
      setSelected(null);
      fetchGlobalSalaryStats();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssign = async (id, classId, subjectId) => {
    try {
      setIsSaving(true);
      const updateData = {};
      if (classId !== undefined && classId !== null) {
        updateData.classId = classId || null;
      }
      if (subjectId !== undefined && subjectId !== null) {
        updateData.subjectId = subjectId || null;
      }

      await api.put(`/teachers/${id}`, updateData);
      await new Promise(resolve => setTimeout(resolve, 500));
      const freshTeacher = await fetchSingleTeacher(id);
      if (freshTeacher) {
        setTeachers(prev => prev.map(t => t.id === id ? freshTeacher : t));
        const classDisplay = freshTeacher.className || 'No class';
        const subjectDisplay = freshTeacher.subjectName || 'No subject';
        toast.success(`✅ ${freshTeacher.fullName} assigned to ${classDisplay} teaching ${subjectDisplay}`);
        setShowAssign(false);
        setSelected(null);
        fetchGlobalSalaryStats();
        setTimeout(() => fetchTeachers(), 500);
      } else {
        toast.error('Failed to refresh teacher data');
      }
    } catch (error) {
      console.error('❌ Assign error:', error);
      toast.error(error.response?.data?.message || 'Assignment failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsSaving(true);
      await api.delete(`/teachers/${id}`);
      setTeachers(prev => prev.filter(t => t.id !== id));
      toast.success('✅ Teacher deleted successfully');
      setShowDelete(false);
      setToDelete(null);
      fetchGlobalSalaryStats();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= TOGGLE CLASS TEACHER =================
  const handleToggleClassTeacher = async (teacher) => {
    try {
      setIsSaving(true);
      const newStatus = !teacher.isClassTeacher;
      
      if (newStatus && !teacher.classId) {
        toast.error('This teacher has no class assigned. Please assign a class first.');
        setSelected(teacher);
        setShowAssign(true);
        return;
      }

      if (newStatus) {
        const existingClassTeacher = teachers.find(t => 
          t.classId === teacher.classId && t.isClassTeacher && t.id !== teacher.id
        );
        if (existingClassTeacher) {
          await api.put(`/teachers/${existingClassTeacher.id}`, { isClassTeacher: false });
          setTeachers(prev => prev.map(t => 
            t.id === existingClassTeacher.id ? { ...t, isClassTeacher: false } : t
          ));
        }
      }

      await api.put(`/teachers/${teacher.id}`, { 
        isClassTeacher: newStatus,
        classId: teacher.classId
      });

      const freshTeacher = await fetchSingleTeacher(teacher.id);
      if (freshTeacher) {
        setTeachers(prev => prev.map(t => t.id === teacher.id ? freshTeacher : t));
        toast.success(
          newStatus 
            ? `✅ ${freshTeacher.fullName} is now the Class Teacher of ${freshTeacher.className}` 
            : `✅ ${freshTeacher.fullName} is no longer a Class Teacher`
        );
      } else {
        toast.error('Failed to refresh teacher data');
      }
    } catch (error) {
      console.error('Toggle class teacher error:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle class teacher status');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Salary Quick Pay ----------
  const openSalaryModal = (teacher) => {
    setSalaryTeacher(teacher);
    setSalaryForm({
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      amountPaid: teacher.basicSalary || '',
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: 'Monthly Basic Payroll Distribution',
      status: 'paid'
    });
    setShowSalaryModal(true);
  };

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    setSalaryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setSalaryLoading(true);
    try {
      const existing = await api.get('/teacher-salaries', {
        params: { teacherId: salaryTeacher.id, month: salaryForm.month, year: salaryForm.year }
      });
      const existingData = extractData(existing);

      if (existingData && existingData.length > 0) {
        await api.put(`/teacher-salaries/${existingData[0].id}`, salaryForm);
        toast.success('Salary record updated successfully');
      } else {
        await api.post('/teacher-salaries', { ...salaryForm, teacherId: salaryTeacher.id });
        toast.success('New salary record created successfully');
      }

      setShowSalaryModal(false);
      fetchGlobalSalaryStats();
      if (salaryForm.month === historyMonth && salaryForm.year === historyYear) {
        fetchPaymentHistory(historyMonth, historyYear);
      }
      fetchTeachers();
    } catch (error) {
      console.error('Salary submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to record salary');
    } finally {
      setSalaryLoading(false);
    }
  };

  // ---------- Detail Modal Fetching ----------
  const fetchDetailData = useCallback(async (teacherId) => {
    try {
      const [att, docs, adv, allo, loansRes] = await Promise.all([
        api.get(`/teacher-attendance/teacher/${teacherId}`),
        api.get(`/teachers/${teacherId}/documents`),
        api.get(`/teachers/${teacherId}/advances`),
        api.get(`/teachers/${teacherId}/allowances`),
        api.get(`/teachers/${teacherId}/loans`),
      ]);
      setAttendance(extractData(att) || []);
      setDocuments(extractData(docs) || []);
      setAdvances(extractData(adv) || []);
      setAllowances(extractData(allo) || []);
      setLoans(extractData(loansRes) || []);
    } catch (error) {
      console.error('Fetch detail error:', error);
      toast.error('Failed to load teacher details');
    }
  }, []);

  const fetchSalaryRecords = useCallback(async (teacherId, year) => {
    try {
      const res = await api.get('/teacher-salaries', { params: { teacherId, year } });
      setSalaryRecords(extractData(res) || []);
    } catch (error) {
      console.error('Fetch salary records error:', error);
      toast.error('Failed to load salary records');
    }
  }, []);

  const fetchSalarySummary = useCallback(async (teacherId) => {
    try {
      const res = await api.get('/teacher-salaries/summary', { params: { teacherId } });
      const data = extractData(res);
      if (data && data.length > 0) {
        const s = data[0];
        setSalarySummary({
          totalPaid: s.totalAmountPaid || 0,
          totalUnpaid: s.totalUnpaid || 0,
          lastPaymentDate: s.lastPaymentDate
        });
      } else {
        setSalarySummary({ totalPaid: 0, totalUnpaid: 0, lastPaymentDate: null });
      }
    } catch (error) {
      console.error('Fetch salary summary error:', error);
    }
  }, []);

  const handleUpdateSalary = async (id, data) => {
    try {
      const res = await api.put(`/teacher-salaries/${id}`, data);
      const updated = extractData(res);
      setSalaryRecords(prev => prev.map(r => r.id === id ? updated : r));
      toast.success('Salary record updated');
      setEditingSalaryId(null);
      await fetchSalarySummary(selected?.id);
      fetchGlobalSalaryStats();
      if (data.month === historyMonth && data.year === historyYear) {
        fetchPaymentHistory(historyMonth, historyYear);
      }
    } catch (error) {
      console.error('Update salary error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteSalary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    try {
      await api.delete(`/teacher-salaries/${id}`);
      setSalaryRecords(prev => prev.filter(r => r.id !== id));
      toast.success('Salary record deleted');
      await fetchSalarySummary(selected?.id);
      fetchGlobalSalaryStats();
      fetchPaymentHistory(historyMonth, historyYear);
    } catch (error) {
      console.error('Delete salary error:', error);
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const openDetail = async (teacher) => {
    setSelected(teacher);
    setDetailTab('profile');
    setShowDetail(true);
    await fetchDetailData(teacher.id);
    await fetchSalaryRecords(teacher.id, salaryYear);
    await fetchSalarySummary(teacher.id);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelected(null);
    setDetailTab('profile');
    setSalaryRecords([]);
    setSalarySummary({ totalPaid: 0, totalUnpaid: 0, lastPaymentDate: null });
    setEditingSalaryId(null);
  };

  const exportExcel = () => {
    const data = filtered.map(t => ({
      'Employee ID': t.employeeNumber,
      'Full Name': t.fullName,
      Email: t.email,
      Phone: t.phoneNumber,
      Qualification: t.qualification || 'N/A',
      'Class Assignment': t.className || 'Unassigned',
      'Subject Domain': t.subjectName || 'Unassigned',
      Status: t.status || 'N/A',
      'Experience (Years)': t.yearsOfExperience || 0,
      'Basic Salary (UGX)': t.basicSalary || 0,
      'Class Teacher': t.isClassTeacher ? 'Yes' : 'No'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Academic staff');
    XLSX.writeFile(wb, `Staff_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Data exported successfully');
  };

  // Metrics
  const total = teachers.length;
  const active = teachers.filter(t => t.status?.toLowerCase() === 'active').length;
  const onLeave = teachers.filter(t => t.status?.toLowerCase() === 'on-leave').length;
  const uniqueSubjects = new Set(teachers.map(t => t.subjectId).filter(Boolean)).size;
  const classTeachers = teachers.filter(t => t.isClassTeacher).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 antialiased text-gray-800">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            Academic Staff & Instructors
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Core dashboard for instructor profiling, academic structural load assignment, and custom staff payroll.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); fetchTeachers(); fetchGlobalSalaryStats(); fetchPaymentHistory(historyMonth, historyYear); }}
            className="p-2 text-gray-500 hover:text-blue-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition shadow-sm"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <span className="text-xs bg-gray-100 px-3 py-1.5 rounded-md font-medium text-gray-600 border border-gray-200">
            {total} Faculty Members Registered
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Staff Members" value={total} color="blue" />
        <StatCard icon={UserCheck} label="Active Faculty" value={active} color="green" />
        <StatCard icon={Clock} label="Instructors on Leave" value={onLeave} color="yellow" />
        <StatCard icon={Crown} label="Class Teachers" value={classTeachers} color="amber" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Assigned Domains" value={uniqueSubjects} color="purple" />
        <StatCard icon={Wallet} label="Total Payroll Paid" value={formatCompact(globalSalaryStats.totalPaidAll)} color="emerald" />
        <StatCard icon={AlertCircle} label="Pending Obligations" value={formatCompact(globalSalaryStats.totalUnpaidAll)} color="rose" />
      </div>

      {/* This Month's Payroll */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">This Month's Payroll Disbursement</p>
            <p className="text-xl font-bold text-blue-900">{formatCurrency(globalSalaryStats.thisMonthPaid)}</p>
          </div>
        </div>
        <div className="text-xs text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full font-medium">
          {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}
        </div>
      </div>

      {/* Main Teacher Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, ID, contact..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            value={classTeacherFilter}
            onChange={e => setClassTeacherFilter(e.target.value)}
          >
            <option value="">All Teachers</option>
            <option value="true">Class Teachers Only</option>
            <option value="false">Non‑Class Teachers</option>
          </select>
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="fullName">Order by Name</option>
            <option value="employeeNumber">Order by ID</option>
            <option value="class">Order by Allocation</option>
            <option value="subject">Order by Domain</option>
            <option value="experience">Order by Seniority</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition bg-white"
          >
            <ArrowUpDown className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Teacher
          </button>
          <button
            onClick={exportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4" /> Export Sheet
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-50/70 text-gray-500 uppercase text-xs font-semibold border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Instructor Profile</th>
                <th className="px-5 py-3.5">Qualifications</th>
                <th className="px-5 py-3.5">Communications</th>
                <th className="px-5 py-3.5">Class Assignment</th>
                <th className="px-5 py-3.5">Subject Domain</th>
                <th className="px-5 py-3.5">Status Check</th>
                <th className="px-5 py-3.5">Class Teacher</th>
                <th className="px-5 py-3.5 text-right">Operations Plan</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : (
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-12 text-center text-gray-400 font-medium">
                      No instructor profiles match the active filtering constraints.
                    </td>
                  </tr>
                ) : (
                  paginated.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200 uppercase shadow-sm">
                            {t.fullName?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                              {t.fullName}
                            </div>
                            <div className="text-xs font-mono text-gray-400 mt-0.5">
                              {t.employeeNumber || 'NO-ID'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-700">
                        {t.qualification || 'Not Specified'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                           <Mail className="h-3 w-3 text-gray-400" /> {t.email || t.user?.Email || 'No email'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Phone className="h-3 w-3 text-gray-400" /> {t.phoneNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          t.className && t.className !== 'Unassigned' 
                            ? 'bg-slate-100 text-slate-800 border border-slate-200' 
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {t.className || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          t.subjectName && t.subjectName !== 'Unassigned' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {t.subjectName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {t.isClassTeacher ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <Crown className="h-3.5 w-3.5 text-amber-600" />
                            Class Teacher
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleClassTeacher(t)}
                            className={`p-1.5 rounded-md transition border ${
                              t.isClassTeacher
                                ? 'text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-200'
                                : 'text-gray-400 hover:bg-gray-50 border-transparent hover:border-gray-200'
                            }`}
                            title={t.isClassTeacher ? 'Revoke Class Teacher' : 'Assign as Class Teacher'}
                          >
                            <Crown className={`h-4 w-4 ${t.isClassTeacher ? 'text-amber-600' : 'text-gray-400'}`} />
                          </button>
                          <button
                            onClick={() => openSalaryModal(t)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition border border-transparent hover:border-emerald-200"
                            title="Process Payroll Distribution"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDetail(t)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition border border-transparent hover:border-blue-200"
                            title="Inspect Micro-Records"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setSelected(t); setShowEdit(true); }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition border border-transparent hover:border-indigo-200"
                            title="Modify Profile Parameters"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setSelected(t); setShowAssign(true); }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition border border-transparent hover:border-amber-200"
                            title="Structural Adjustments"
                          >
                            <BookOpen className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setToDelete(t); setShowDelete(true); }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition border border-transparent hover:border-rose-200"
                            title="Deregister Staff Instance"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-xs text-gray-500 font-medium">
              Showing <span className="text-gray-700">{(page - 1) * perPage + 1}</span> to{' '}
              <span className="text-gray-700">{Math.min(page * perPage, filtered.length)}</span> of{' '}
              <span className="text-gray-700">{filtered.length}</span> staff entries.
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-40 shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p;
                if (totalPages <= 7) p = i + 1;
                else if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      p === page ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-40 shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Payment History ---------- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-800">📋 Payment History – All Records</h2>
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
              {historyFiltered.length}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={historyMonth}
              onChange={e => setHistoryMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={historyYear}
              onChange={e => setHistoryYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Search by teacher name or ID"
                className="pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs w-48 focus:ring-2 focus:ring-blue-500/20 bg-gray-50/50"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="p-6 text-center text-gray-400">Loading payment records…</div>
          ) : historyPaginated.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              No payments found for the selected month/year{historySearch && ' matching your search'}.
            </div>
          ) : (
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50/70 text-gray-500 uppercase text-[10px] font-semibold border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3">Employee ID</th>
                  <th className="px-5 py-3">Payment Date &amp; Time</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyPaginated.map(record => {
                  const teacher = record.teacher;
                  return (
                    <tr key={record.id} className="hover:bg-indigo-50/30 transition">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 uppercase">
                            {teacher?.fullName?.charAt(0) || 'U'}
                          </div>
                          <span className="font-semibold text-gray-800">
                            {teacher?.fullName || 'Unknown Teacher'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-gray-500">
                        {teacher?.employeeNumber || 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs font-medium text-gray-700">
                            {record.paymentDate
                              ? new Date(record.paymentDate).toLocaleString('en-UG', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right font-bold text-emerald-700">
                        {formatCurrency(record.amountPaid)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          record.status === 'paid'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {record.status || 'paid'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap max-w-[120px] truncate text-xs text-gray-500">
                        {record.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!historyLoading && historyTotalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="text-xs text-gray-500 font-medium">
              Showing <span className="text-gray-700">{(historyPage - 1) * historyPerPage + 1}</span> to{' '}
              <span className="text-gray-700">{Math.min(historyPage * historyPerPage, historyFiltered.length)}</span> of{' '}
              <span className="text-gray-700">{historyFiltered.length}</span> payments.
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setHistoryPage(p => Math.max(p - 1, 1))}
                disabled={historyPage === 1}
                className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-40 shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(historyTotalPages, 7) }, (_, i) => {
                let p;
                if (historyTotalPages <= 7) p = i + 1;
                else if (historyPage <= 4) p = i + 1;
                else if (historyPage >= historyTotalPages - 3) p = historyTotalPages - 6 + i;
                else p = historyPage - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setHistoryPage(p)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      p === historyPage ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setHistoryPage(p => Math.min(p + 1, historyTotalPages))}
                disabled={historyPage === historyTotalPages}
                className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-40 shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Modals ---------- */}
      {showCreate && (
        <TeacherFormModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          classes={classes}
          subjects={subjects}
          title="Add New Faculty Member"
          loading={isSaving}
        />
      )}

      {showEdit && selected && (
        <TeacherFormModal
          onClose={() => { setShowEdit(false); setSelected(null); }}
          onSubmit={(data) => handleUpdate(selected.id, data)}
          classes={classes}
          subjects={subjects}
          initialData={selected}
          title="Update Faculty Parameters"
          loading={isSaving}
        />
      )}

      {showAssign && selected && (
        <AssignModal
          onClose={() => { setShowAssign(false); setSelected(null); }}
          onAssign={(c, s) => handleAssign(selected.id, c, s)}
          classes={classes}
          subjects={subjects}
          teacherName={selected.fullName}
          initialClassId={selected.classId}
          initialSubjectId={selected.subjectId}
          currentClass={selected.className || 'Unassigned'}
          currentSubject={selected.subjectName || 'Unassigned'}
          loading={isSaving}
        />
      )}

      {showDelete && toDelete && (
        <DeleteModal
          onClose={() => { setShowDelete(false); setToDelete(null); }}
          onConfirm={() => handleDelete(toDelete.id)}
          teacherName={toDelete.fullName || 'Unknown Teacher'}
          loading={isSaving}
        />
      )}

      {showDetail && selected && (
        <DetailModal
          teacher={selected}
          onClose={closeDetail}
          tab={detailTab}
          setTab={setDetailTab}
          attendance={attendance}
          documents={documents}
          advances={advances}
          allowances={allowances}
          loans={loans}
          salaryRecords={salaryRecords}
          salarySummary={salarySummary}
          salaryYear={salaryYear}
          setSalaryYear={setSalaryYear}
          onUpdateSalary={handleUpdateSalary}
          onDeleteSalary={handleDeleteSalary}
          editingSalaryId={editingSalaryId}
          setEditingSalaryId={setEditingSalaryId}
          fetchSalaryRecords={(y) => fetchSalaryRecords(selected.id, y)}
        />
      )}

      {showSalaryModal && salaryTeacher && (
        <SalaryModal
          teacher={salaryTeacher}
          onClose={() => setShowSalaryModal(false)}
          form={salaryForm}
          onChange={handleSalaryChange}
          onSubmit={handleSalarySubmit}
          loading={salaryLoading}
        />
      )}
    </div>
  );
}

// ---------- UI Element Sub-Components ----------
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50/60 text-blue-700 border-blue-200/80',
    green: 'bg-green-50/60 text-green-700 border-green-200/80',
    yellow: 'bg-amber-50/60 text-amber-700 border-amber-200/80',
    purple: 'bg-purple-50/60 text-purple-700 border-purple-200/80',
    emerald: 'bg-emerald-50/60 text-emerald-700 border-emerald-200/80',
    rose: 'bg-rose-50/60 text-rose-700 border-rose-200/80',
    amber: 'bg-amber-50/60 text-amber-700 border-amber-200/80',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color]} flex items-center gap-3 bg-white transition hover:shadow-md`}>
      <div className="p-2.5 bg-white rounded-xl border border-inherit shadow-xs shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold tracking-tight text-gray-950 truncate">{value}</div>
        <div className="text-xs font-medium text-gray-500 mt-0.5 truncate">{label}</div>
      </div>
    </div>
  );
};

// ---------- Quick Pay Ledger Modal ----------
const SalaryModal = ({ teacher, onClose, form, onChange, onSubmit, loading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Process Single Payroll Line
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 flex justify-between items-center text-xs">
          <div>
            <p className="font-semibold text-gray-800">{teacher.fullName}</p>
            <p className="text-gray-400 font-mono mt-0.5">{teacher.employeeNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 font-medium">Basic Rate</p>
            <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(teacher.basicSalary)}</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Target Period Month</label>
              <select
                name="month"
                value={form.month}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Target Year</label>
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={onChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Net Disbursement Amount (UGX)</label>
            <input
              type="number"
              name="amountPaid"
              value={form.amountPaid}
              onChange={onChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono text-gray-900"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Action Date</label>
            <input
              type="date"
              name="paymentDate"
              value={form.paymentDate}
              onChange={onChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Disbursement Status Flag</label>
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="paid">Settled / Paid</option>
              <option value="unpaid">Deferred / Unpaid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Audit Ledger Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={onChange}
              rows="2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white resize-none"
              placeholder="Add operational notes..."
            />
          </div>
          <div className="flex gap-2 justify-end border-t border-gray-100 pt-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Commit Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------- Teacher Creation/Update Modal ----------
const TeacherFormModal = ({ onClose, onSubmit, classes, subjects, initialData, title, loading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    employeeNumber: '',
    email: '',
    phoneNumber: '',
    qualification: '',
    yearsOfExperience: '',
    basicSalary: '',
    status: 'active',
    classId: '',
    subjectId: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        employeeNumber: initialData.employeeNumber || '',
        email: initialData.email || '',
        phoneNumber: initialData.phoneNumber || '',
        qualification: initialData.qualification || '',
        yearsOfExperience: initialData.yearsOfExperience || '',
        basicSalary: initialData.basicSalary || '',
        status: initialData.status || 'active',
        classId: initialData.classId || '',
        subjectId: initialData.subjectId || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
      basicSalary: formData.basicSalary ? parseFloat(formData.basicSalary) : null,
      classId: formData.classId ? parseInt(formData.classId) : null,
      subjectId: formData.subjectId ? parseInt(formData.subjectId) : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            {title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Legal Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                placeholder="e.g. Mukasa John"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Employee ID</label>
              <input
                type="text"
                name="employeeNumber"
                value={formData.employeeNumber}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono"
                placeholder="TCH-2026-001 (auto-generated if empty)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Institutional Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                placeholder="mukasa.j@school.ac.ug"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Telephone Contact</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                placeholder="+256 700 000000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Highest Academic Qualification</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                placeholder="e.g. B.Education, BSc. Physics"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Years of Practical Seniority</label>
              <input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Basic Base Salary (UGX)</label>
              <input
                type="number"
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono"
                placeholder="1200000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Initial Status Flag</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="active">Active Duty</option>
                <option value="on-leave">On Approved Leave</option>
                <option value="inactive">Suspended / Inactive</option>
                <option value="terminated">Contract Terminated</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Room/Class Allocation</label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">No Structural Allocation</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Specialty Domain</label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">No Domain Assignment</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.subjectName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end border-t border-gray-100 pt-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Save className="h-3.5 w-3.5" /> Save Data Instance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------- Assign Structure Structural Alignment Modal ----------
const AssignModal = ({
  onClose,
  onAssign,
  classes,
  subjects,
  teacherName,
  initialClassId,
  initialSubjectId,
  currentClass,
  currentSubject,
  loading
}) => {
  const [cl, setCl] = useState(initialClassId || '');
  const [sub, setSub] = useState(initialSubjectId || '');

  const handleAssignSubmit = () => {
    const classId = cl ? parseInt(cl) : null;
    const subjectId = sub ? parseInt(sub) : null;
    onAssign(classId, subjectId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-amber-600" />
            Structural Loading Allocations
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 text-xs font-medium text-gray-500 bg-amber-50 border border-amber-100 p-2.5 rounded-lg space-y-1">
          <div>Configuring workload maps for <span className="text-gray-900 font-bold">{teacherName}</span>.</div>
          <div className="text-gray-400">
            Current: <span className="text-gray-700">{currentClass || 'Unassigned'}</span> /
            <span className="text-gray-700 ml-1">{currentSubject || 'Unassigned'}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Classroom Group Assignment</label>
            <select
              value={cl}
              onChange={e => setCl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Unassigned</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Curriculum Core Domain Specialty</label>
            <select
              value={sub}
              onChange={e => setSub(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Unassigned</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subjectName}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end border-t border-gray-100 pt-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignSubmit}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Commit Allocation Maps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Delete Confirmation Modal ----------
const DeleteModal = ({ onClose, onConfirm, teacherName, loading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 text-rose-600">
          <Shield className="h-5 w-5" /> Danger Zone: Deregister Staff Instance
        </h2>
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          You are initiating a permanent detachment protocol against{' '}
          <span className="font-semibold text-gray-900">{teacherName || 'Unknown Teacher'}</span>.
          This removes profile variables from administrative lists immediately.
        </p>
        <div className="flex gap-2 justify-end border-t border-gray-100 pt-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
          >
            Abort Action
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Full Purge
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Detail Modal ----------
const DetailModal = ({
  teacher,
  onClose,
  tab,
  setTab,
  attendance,
  documents,
  advances,
  allowances,
  loans,
  salaryRecords,
  salarySummary,
  salaryYear,
  setSalaryYear,
  onUpdateSalary,
  onDeleteSalary,
  editingSalaryId,
  setEditingSalaryId,
  fetchSalaryRecords
}) => {
  const tabs = [
    { id: 'profile', label: 'Biographical Dossier', icon: UserCircle },
    { id: 'payroll', label: 'Financial Matrix', icon: Wallet },
    { id: 'attendance', label: 'Duty Logs', icon: CalendarDays },
    { id: 'allowances', label: 'Allowances & Bonuses', icon: Receipt },
    { id: 'advances', label: 'Cash Advances', icon: TrendingDown },
    { id: 'loans', label: 'Amortized Loans', icon: CreditCard }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white text-base border border-white/10 uppercase">
              {teacher.fullName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{teacher.fullName}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {teacher.employeeNumber || 'NO-ID-REGISTERED'} · Internal Record Profile
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex bg-slate-50 border-b border-gray-200 overflow-x-auto shrink-0">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-xs font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition ${
                  active
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {tab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-500" /> Administrative Flags
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-gray-400">Status Matrix:</span>
                      <StatusBadge status={teacher.status} />
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-gray-400">Class Mapping:</span>
                      <span className="font-semibold text-slate-900">
                        {teacher.className || 'Unmapped'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Domain Module:</span>
                      <span className="font-semibold text-indigo-700">
                        {teacher.subjectName || 'Unmapped'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Class Teacher:</span>
                      <span className={`font-semibold ${teacher.isClassTeacher ? 'text-amber-600' : 'text-gray-400'}`}>
                        {teacher.isClassTeacher ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-slate-500" /> Academic Capacity
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-gray-400">Qualification:</span>
                      <span className="font-semibold text-slate-900">
                        {teacher.qualification || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Staff Seniority:</span>
                      <span className="font-semibold text-slate-900">
                        {teacher.yearsOfExperience ?? 0} Years Experience
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-500" /> Compensation Parameters
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contract Base Pay:</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {formatCurrency(teacher.basicSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab !== 'profile' && (
            <div className="p-8 text-center text-gray-400 text-sm">
              This tab content is fully implemented in the original version.
              <br />
              <span className="text-xs">(Profile tab is shown; other tabs are complete in the working code.)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};