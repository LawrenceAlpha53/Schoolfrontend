// AdminPayroll.jsx – Complete Payroll Management with PDF Export (Fully Fits A4)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, UserCheck, Wallet, TrendingUp, TrendingDown, Calendar, DollarSign,
  Search, Filter, Plus, Edit, Trash2, Eye, Download, X, UserX, Save, Loader2,
  RefreshCw, ChevronLeft, ChevronRight, AlertCircle, CheckCircle,
  BarChart3, History, Printer, FileText, Clock, User as UserIcon,
  Briefcase, GraduationCap, Shield, Phone, Mail, Home, CreditCard,
  Building, UserCog, UserPlus, Award, CalendarDays, FileCheck,
  Receipt, CreditCard as CreditCardIcon, Settings, UserMinus, UserCog as UserCogIcon,
  PieChart, Activity, TrendingUp as TrendingUpIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const formatCurrencyPlain = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UGX', '').trim();
};

const formatCompact = (amount) => {
  if (amount >= 1e9) return `UGX ${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `UGX ${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `UGX ${(amount / 1e3).toFixed(0)}K`;
  return formatCurrency(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = parseISO(dateStr);
    if (isNaN(d)) return dateStr;
    return format(d, 'dd MMM yyyy');
  } catch { return dateStr; }
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

const RoleBadge = ({ type }) => {
  const styles = {
    teacher: 'bg-blue-100 text-blue-800 border-blue-200',
    staff: 'bg-purple-100 text-purple-800 border-purple-200',
    secretary: 'bg-amber-100 text-amber-800 border-amber-200',
  };
  const labels = {
    teacher: 'Teacher',
    staff: 'Staff',
    secretary: 'Secretary',
  };
  const icons = {
    teacher: <GraduationCap className="h-3.5 w-3.5" />,
    staff: <Briefcase className="h-3.5 w-3.5" />,
    secretary: <FileCheck className="h-3.5 w-3.5" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
      {icons[type]}
      {labels[type] || type}
    </span>
  );
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
export default function AdminPayroll() {
  // ---------- State ----------
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [hireDateFrom, setHireDateFrom] = useState('');
  const [hireDateTo, setHireDateTo] = useState('');
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');

  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [page, setPage] = useState(1);
  const perPage = 10;

  // Staff Management Modal (CRUD for non-teaching staff)
  const [showStaffManagement, setShowStaffManagement] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffForm, setEditStaffForm] = useState({
    fullName: '',
    position: '',
    department: '',
    phoneNumber: '',
    email: '',
    hireDate: '',
    BaseSalary: '',
    status: 'Active',
    nin: '',
  });
  const [staffLoading, setStaffLoading] = useState(false);

  // Employee Payments Modal (for all employees)
  const [showEmployeePayments, setShowEmployeePayments] = useState(false);
  const [paymentEmployees, setPaymentEmployees] = useState([]);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentRoleFilter, setPaymentRoleFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedPaymentEmployee, setSelectedPaymentEmployee] = useState(null);
  const [employeePayments, setEmployeePayments] = useState([]);
  const [employeePaymentsFiltered, setEmployeePaymentsFiltered] = useState([]);
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentMonth, setPaymentMonth] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showEmployeePaymentDetail, setShowEmployeePaymentDetail] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState({ schoolName: 'School Management System' });

  // Payment History (global)
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyFiltered, setHistoryFiltered] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth());
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;

  // PDF Options Modal
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [pdfMonth, setPdfMonth] = useState(new Date().getMonth());
  const [pdfYear, setPdfYear] = useState(new Date().getFullYear());

  // Global Stats
  const [globalStats, setGlobalStats] = useState({
    totalEmployees: 0,
    totalTeachers: 0,
    totalStaff: 0,
    totalSecretaries: 0,
    totalPaidAll: 0,
    totalUnpaidAll: 0,
    thisMonthPaid: 0,
    thisMonthUnpaid: 0,
    activeCount: 0,
    onLeaveCount: 0,
    terminatedCount: 0,
  });

  // Salary Modal (quick pay)
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'paid'
  });
  const [salaryLoading, setSalaryLoading] = useState(false);

  // Edit/Delete Salary Records (global history)
  const [editingSalaryId, setEditingSalaryId] = useState(null);
  const [editingSalaryData, setEditingSalaryData] = useState(null);

  // ---------- Helper: Check if employee is paid for a given month/year ----------
  const isEmployeePaid = useCallback((employeeId, month, year) => {
    return historyRecords.some(record =>
      (record.teacherId === employeeId || record.staffId === employeeId) &&
      record.month === month &&
      record.year === year &&
      record.status === 'paid'
    );
  }, [historyRecords]);

  // ---------- Fetch School Settings ----------
  const fetchSchoolSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings/school');
      const data = res.data?.data || res.data || {};
      setSchoolSettings(data);
    } catch (error) {
      console.warn('Could not fetch school settings:', error);
      setSchoolSettings({ schoolName: 'School Management System' });
    }
  }, []);

  // ---------- Data Fetching ----------
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const [teachersRes, staffRes, usersRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/staff'),
        api.get('/users')
      ]);

      const teachers = extractData(teachersRes).map(t => ({
        ...t,
        type: 'teacher',
        basicSalary: Number(t.basicSalary) || 0,
        fullName: t.fullName || t.name || 'Unnamed',
        employeeNumber: t.employeeNumber || t.id,
        position: t.subjectName || 'Teacher',
        department: t.className || 'Academic',
        hireDate: t.startDate || t.hireDate || t.createdAt || null,
        nin: t.nationalId || null,
        status: t.status || 'active',
      }));

      const staff = extractData(staffRes).map(s => {
        const salary = Number(s.BaseSalary) || Number(s.basicSalary) || Number(s.baseSalary) || 0;
        return {
          ...s,
          type: 'staff',
          basicSalary: salary,
          fullName: s.fullName || s.name || 'Unnamed',
          employeeNumber: s.employeeNumber || s.id,
          position: s.position || 'Staff',
          department: s.department || 'General',
          hireDate: s.hireDate || s.startDate || s.createdAt || null,
          nin: s.nin || null,
          status: s.status || 'active',
        };
      });

      const allUsers = extractData(usersRes);
      const secretaries = allUsers
        .filter(u => u.role === 'secretary')
        .map(u => ({
          id: u.id,
          type: 'secretary',
          basicSalary: 0,
          fullName: `${u.Fname || ''} ${u.Lname || ''}`.trim() || 'Secretary',
          employeeNumber: `SEC-${u.id}`,
          position: 'Secretary',
          department: 'Administration',
          hireDate: u.createdAt || null,
          nin: u.nin || null,
          status: 'active',
          email: u.Email,
          phoneNumber: u.Phonenumber,
          userId: u.id,
        }));

      const merged = [...teachers, ...staff, ...secretaries];
      setEmployees(merged);

      const posSet = new Set();
      const deptSet = new Set();
      merged.forEach(emp => {
        if (emp.position) posSet.add(emp.position);
        if (emp.department) deptSet.add(emp.department);
      });
      setPositions(['all', ...Array.from(posSet).sort()]);
      setDepartments(['all', ...Array.from(deptSet).sort()]);

    } catch (error) {
      console.error('Fetch employees error:', error);
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaffList = useCallback(async () => {
    try {
      const res = await api.get('/staff');
      const data = extractData(res);
      setStaffList(data);
    } catch (error) {
      console.error('Fetch staff list error:', error);
      toast.error('Failed to load staff list');
    }
  }, []);

  const fetchEmployeePayments = useCallback(async (empId, type) => {
    setPaymentLoading(true);
    try {
      const endpoint = type === 'teacher' ? '/teacher-salaries' : '/staff-salaries';
      const idField = type === 'teacher' ? 'teacherId' : 'staffId';
      const res = await api.get(endpoint, { params: { [idField]: empId } });
      const data = extractData(res);
      setEmployeePayments(data);
    } catch (error) {
      console.error('Fetch employee payments error:', error);
      toast.error('Failed to load payment records');
      setEmployeePayments([]);
    } finally {
      setPaymentLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (month, year) => {
    setHistoryLoading(true);
    try {
      const [teacherSalariesRes, staffSalariesRes] = await Promise.all([
        api.get('/teacher-salaries', { params: { month, year, limit: 10000 } }),
        api.get('/staff-salaries', { params: { month, year, limit: 10000 } })
      ]);

      const teacherSalaries = extractData(teacherSalariesRes).map(r => ({
        ...r,
        employeeType: 'teacher'
      }));
      const staffSalaries = extractData(staffSalariesRes).map(r => ({
        ...r,
        employeeType: 'staff'
      }));

      const all = [...teacherSalaries, ...staffSalaries];
      setHistoryRecords(all);
    } catch (error) {
      console.error('Fetch history error:', error);
      toast.error('Failed to load payment history');
      setHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchGlobalStats = useCallback(async () => {
    try {
      const total = employees.length;
      const teachers = employees.filter(e => e.type === 'teacher').length;
      const staff = employees.filter(e => e.type === 'staff').length;
      const secretaries = employees.filter(e => e.type === 'secretary').length;
      const active = employees.filter(e => e.status?.toLowerCase() === 'active').length;
      const onLeave = employees.filter(e => e.status?.toLowerCase() === 'on-leave').length;
      const terminated = employees.filter(e => e.status?.toLowerCase() === 'terminated').length;

      const [teacherSummary, staffSummary] = await Promise.all([
        api.get('/teacher-salaries/summary'),
        api.get('/staff-salaries/summary'),
      ]);

      const tData = extractData(teacherSummary);
      const sData = extractData(staffSummary);

      let totalPaidAll = 0, totalUnpaidAll = 0;
      [...tData, ...sData].forEach(item => {
        totalPaidAll += Number(item.totalAmountPaid || 0);
        totalUnpaidAll += Number(item.totalUnpaid || 0);
      });

      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      const [teacherMonth, staffMonth] = await Promise.all([
        api.get('/teacher-salaries', { params: { month, year } }),
        api.get('/staff-salaries', { params: { month, year } }),
      ]);

      const tMonth = extractData(teacherMonth);
      const sMonth = extractData(staffMonth);
      let thisMonthPaid = 0, thisMonthUnpaid = 0;
      [...tMonth, ...sMonth].forEach(r => {
        if (r.status === 'paid') thisMonthPaid += Number(r.amountPaid || 0);
        else thisMonthUnpaid += Number(r.amountPaid || 0);
      });

      setGlobalStats({
        totalEmployees: total,
        totalTeachers: teachers,
        totalStaff: staff,
        totalSecretaries: secretaries,
        totalPaidAll,
        totalUnpaidAll,
        thisMonthPaid,
        thisMonthUnpaid,
        activeCount: active,
        onLeaveCount: onLeave,
        terminatedCount: terminated,
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, [employees]);

  // ---------- Initial Load ----------
  useEffect(() => {
    fetchEmployees();
    fetchSchoolSettings();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchGlobalStats();
    }
  }, [employees, fetchGlobalStats]);

  useEffect(() => {
    fetchHistory(historyMonth, historyYear);
  }, [historyMonth, historyYear, fetchHistory]);

  // ---------- Filter & Sort ----------
  useEffect(() => {
    let result = [...employees];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e =>
        e.fullName?.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s) ||
        e.phoneNumber?.includes(s) ||
        e.employeeNumber?.toLowerCase().includes(s) ||
        e.position?.toLowerCase().includes(s) ||
        e.department?.toLowerCase().includes(s) ||
        e.nin?.toLowerCase().includes(s)
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter(e => e.type === roleFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(e => e.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (positionFilter !== 'all') {
      result = result.filter(e => e.position === positionFilter);
    }

    if (departmentFilter !== 'all') {
      result = result.filter(e => e.department === departmentFilter);
    }

    if (hireDateFrom) {
      result = result.filter(e => e.hireDate && e.hireDate >= hireDateFrom);
    }
    if (hireDateTo) {
      result = result.filter(e => e.hireDate && e.hireDate <= hireDateTo);
    }

    const field = sortBy;
    const order = sortOrder === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let va = a[field] || '';
      let vb = b[field] || '';
      if (field === 'basicSalary') { va = Number(va); vb = Number(vb); }
      if (field === 'hireDate') { va = a.hireDate || ''; vb = b.hireDate || ''; }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return va < vb ? -1 * order : va > vb ? 1 * order : 0;
    });

    setFiltered(result);
    setPage(1);
  }, [employees, search, roleFilter, statusFilter, positionFilter, departmentFilter, hireDateFrom, hireDateTo, sortBy, sortOrder]);

  // ---------- Payment History Filter ----------
  useEffect(() => {
    if (!historyRecords.length) {
      setHistoryFiltered([]);
      return;
    }
    const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]));

    let result = historyRecords.map(record => {
      const emp = employeeMap[record.teacherId || record.staffId];
      return {
        ...record,
        employee: emp || null,
        employeeType: record.employeeType || (emp ? emp.type : 'unknown'),
        baseSalary: emp?.basicSalary || 0,
      };
    });

    if (historySearch.trim()) {
      const s = historySearch.toLowerCase();
      result = result.filter(r =>
        r.employee?.fullName?.toLowerCase().includes(s) ||
        r.employee?.employeeNumber?.toLowerCase().includes(s) ||
        r.employee?.position?.toLowerCase().includes(s)
      );
    }

    if (historyStatusFilter !== 'all') {
      result = result.filter(r => r.status === historyStatusFilter);
    }

    setHistoryFiltered(result);
    setHistoryPage(1);
  }, [historyRecords, historySearch, historyStatusFilter, employees]);

  const totalHistoryPages = Math.ceil(historyFiltered.length / historyPerPage);
  const historyPaginated = historyFiltered.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

  // ---------- Employee Payments Modal ----------
  const openEmployeePayments = () => {
    setShowEmployeePayments(true);
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.id] = { ...emp, payments: [] };
    });
    historyRecords.forEach(record => {
      const empId = record.teacherId || record.staffId;
      if (employeeMap[empId]) {
        employeeMap[empId].payments.push(record);
      }
    });
    const list = Object.values(employeeMap).map(emp => {
      const paid = emp.payments.filter(p => p.status === 'paid');
      const totalPaid = paid.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      const lastPayment = paid.length ? paid.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0] : null;
      return {
        ...emp,
        totalPaid,
        paymentCount: emp.payments.length,
        paidCount: paid.length,
        lastPaymentDate: lastPayment?.paymentDate || null,
      };
    });
    setPaymentEmployees(list);
  };

  const closeEmployeePayments = () => {
    setShowEmployeePayments(false);
    setSelectedPaymentEmployee(null);
    setShowEmployeePaymentDetail(false);
    setEmployeePayments([]);
  };

  const viewEmployeePaymentDetail = async (emp) => {
    setSelectedPaymentEmployee(emp);
    await fetchEmployeePayments(emp.id, emp.type);
    setShowEmployeePaymentDetail(true);
    setPaymentYear(new Date().getFullYear());
    setPaymentMonth('all');
    setPaymentStatus('all');
  };

  // Filter employee payments for detail modal
  useEffect(() => {
    if (!employeePayments.length) {
      setEmployeePaymentsFiltered([]);
      return;
    }
    let result = [...employeePayments];
    if (paymentYear) {
      result = result.filter(p => p.year === parseInt(paymentYear));
    }
    if (paymentMonth !== 'all') {
      result = result.filter(p => p.month === parseInt(paymentMonth));
    }
    if (paymentStatus !== 'all') {
      result = result.filter(p => p.status === paymentStatus);
    }
    setEmployeePaymentsFiltered(result);
  }, [employeePayments, paymentYear, paymentMonth, paymentStatus]);

  const chartData = useMemo(() => {
    const year = paymentYear || new Date().getFullYear();
    const monthPayments = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS[i].slice(0, 3),
      paid: 0,
      unpaid: 0
    }));
    employeePayments.forEach(p => {
      if (p.year === parseInt(year)) {
        if (p.status === 'paid') {
          monthPayments[p.month].paid += Number(p.amountPaid);
        } else {
          monthPayments[p.month].unpaid += Number(p.amountPaid);
        }
      }
    });
    return monthPayments;
  }, [employeePayments, paymentYear]);

  // ---------- Staff Management ----------
  const openStaffManagement = async () => {
    setShowStaffManagement(true);
    await fetchStaffList();
  };

  const closeStaffManagement = () => {
    setShowStaffManagement(false);
    setEditingStaff(null);
    setEditStaffForm({});
    setStaffSearch('');
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setEditStaffForm({
      fullName: staff.fullName || '',
      position: staff.position || '',
      department: staff.department || '',
      phoneNumber: staff.phoneNumber || '',
      email: staff.email || '',
      hireDate: staff.hireDate ? staff.hireDate.split('T')[0] : '',
      BaseSalary: staff.BaseSalary || '',
      status: staff.status || 'Active',
      nin: staff.nin || '',
    });
  };

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setEditStaffForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStaffUpdate = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setStaffLoading(true);
    try {
      await api.put(`/staff/${editingStaff.id}`, editStaffForm);
      toast.success('Staff updated successfully');
      await fetchStaffList();
      await fetchEmployees();
      setEditingStaff(null);
    } catch (error) {
      console.error('Update staff error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleStaffDelete = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member? This will also delete all their salary records.')) return;
    setStaffLoading(true);
    try {
      setStaffList(prev => prev.filter(s => s.id !== staffId));
      setEmployees(prev => prev.filter(e => !(e.type === 'staff' && e.id === staffId)));

      await api.delete(`/staff/${staffId}`);
      toast.success('Staff deleted successfully');

      await fetchStaffList();
      await fetchEmployees();
    } catch (error) {
      console.error('Delete staff error:', error);
      await fetchStaffList();
      await fetchEmployees();
      toast.error(error.response?.data?.message || 'Delete failed – please try again.');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleStaffStatusChange = async (staff, newStatus) => {
    if (!window.confirm(`Change ${staff.fullName}'s status to ${newStatus}?`)) return;
    setStaffLoading(true);
    try {
      setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, status: newStatus } : s));
      setEmployees(prev => prev.map(e => (e.type === 'staff' && e.id === staff.id) ? { ...e, status: newStatus } : e));

      await api.put(`/staff/${staff.id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      await fetchStaffList();
      await fetchEmployees();
    } catch (error) {
      console.error('Status change error:', error);
      await fetchStaffList();
      await fetchEmployees();
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setStaffLoading(false);
    }
  };

  // ---------- Salary Modal (Quick Pay) ----------
  const openSalaryModal = (employee) => {
    const defaultMonth = historyMonth !== undefined ? historyMonth : new Date().getMonth();
    const defaultYear = historyYear || new Date().getFullYear();

    setSelectedEmployee(employee);
    setSalaryForm({
      month: defaultMonth,
      year: defaultYear,
      amountPaid: employee.basicSalary || '',
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: `Monthly Payroll - ${employee.fullName}`,
      status: 'paid'
    });
    setShowSalaryModal(true);
  };

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    setSalaryForm(prev => ({ ...prev, [name]: value }));
  };

  const isSelectedEmployeePaid = useCallback((empId, month, year) => {
    return historyRecords.some(record =>
      (record.teacherId === empId || record.staffId === empId) &&
      record.month === month &&
      record.year === year &&
      record.status === 'paid'
    );
  }, [historyRecords]);

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    if (isSelectedEmployeePaid(selectedEmployee.id, salaryForm.month, salaryForm.year)) {
      toast.error('This employee is already paid for the selected month/year.');
      return;
    }

    setSalaryLoading(true);
    try {
      const type = selectedEmployee.type;
      let endpoint, idField, idValue;
      if (type === 'teacher') {
        endpoint = '/teacher-salaries';
        idField = 'teacherId';
        idValue = selectedEmployee.id;
      } else if (type === 'staff' || type === 'secretary') {
        if (type === 'secretary') {
          toast.error('Secretaries do not have a staff record yet. Please create a staff record for them first.');
          setSalaryLoading(false);
          return;
        }
        endpoint = '/staff-salaries';
        idField = 'staffId';
        idValue = selectedEmployee.id;
      }

      const payload = {
        [idField]: idValue,
        month: salaryForm.month,
        year: salaryForm.year,
        amountPaid: salaryForm.amountPaid,
        paymentDate: salaryForm.paymentDate,
        remarks: salaryForm.remarks,
        status: salaryForm.status
      };

      const existingRes = await api.get(endpoint, {
        params: { [idField]: idValue, month: salaryForm.month, year: salaryForm.year }
      });
      const existing = extractData(existingRes);

      if (existing && existing.length > 0) {
        if (existing[0].status === 'paid') {
          toast.error('Already paid for this month. Please choose a different month.');
          setSalaryLoading(false);
          return;
        }
        await api.put(`${endpoint}/${existing[0].id}`, payload);
        toast.success(`Salary updated for ${selectedEmployee.fullName}`);
      } else {
        await api.post(endpoint, payload);
        toast.success(`Salary recorded for ${selectedEmployee.fullName}`);
      }

      setShowSalaryModal(false);
      await fetchHistory(historyMonth, historyYear);
      await fetchGlobalStats();
      await fetchEmployees();
    } catch (error) {
      console.error('Salary submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to record salary');
    } finally {
      setSalaryLoading(false);
    }
  };

  // ---------- Edit/Delete Salary Records (global) ----------
  const handleEditSalary = (record) => {
    setEditingSalaryId(record.id);
    setEditingSalaryData({
      amountPaid: record.amountPaid,
      paymentDate: record.paymentDate || new Date().toISOString().split('T')[0],
      remarks: record.remarks || '',
      status: record.status || 'paid'
    });
  };

  const handleSaveSalaryEdit = async (record) => {
    if (!editingSalaryData) return;
    try {
      const endpoint = record.employeeType === 'teacher' ? '/teacher-salaries' : '/staff-salaries';
      await api.put(`${endpoint}/${record.id}`, editingSalaryData);
      toast.success('Salary record updated');
      setEditingSalaryId(null);
      setEditingSalaryData(null);
      await fetchHistory(historyMonth, historyYear);
      await fetchGlobalStats();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteSalary = async (record) => {
    if (!window.confirm(`Delete salary record for ${record.employee?.fullName || 'employee'}? This cannot be undone.`)) return;
    try {
      const endpoint = record.employeeType === 'teacher' ? '/teacher-salaries' : '/staff-salaries';
      await api.delete(`${endpoint}/${record.id}`);
      toast.success('Salary record deleted');
      await fetchHistory(historyMonth, historyYear);
      await fetchGlobalStats();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  // ---------- PDF Export (with Options Modal) ----------
  const openPDFDialog = () => {
    setPdfMonth(historyMonth);
    setPdfYear(historyYear);
    setShowPDFDialog(true);
  };

  const handlePDFConfirm = () => {
    setShowPDFDialog(false);
    generatePDF(pdfMonth, pdfYear);
  };

  // =================== IMPROVED generatePDF ===================
  const generatePDF = (month, year) => {
    const selectedMonth = MONTHS[month];
    const selectedYear = year;

    const filteredData = historyRecords.filter(record =>
      record.month === month && record.year === year
    );

    if (filteredData.length === 0) {
      toast.error(`No payment records found for ${selectedMonth} ${selectedYear}.`);
      return;
    }

    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFont('helvetica');

      const schoolName = schoolSettings.schoolName || 'School Management System';
      const period = `${selectedMonth} ${selectedYear}`;
      const generatedDate = new Date().toLocaleString('en-UG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Header
      doc.setFontSize(18);
      doc.text(schoolName, pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.text('Payroll Report', pageWidth / 2, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Period: ${period}`, pageWidth / 2, 38, { align: 'center' });
      doc.text(`Generated: ${generatedDate}`, pageWidth / 2, 44, { align: 'center' });
      doc.line(20, 50, pageWidth - 20, 50);

      const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]));

      const rows = filteredData.map((record, idx) => {
        const emp = employeeMap[record.staffId || record.teacherId];
        return {
          index: idx + 1,
          name: emp?.fullName || 'Unknown',
          id: emp?.employeeNumber || 'N/A',
          role: record.employeeType || 'N/A',
          baseSalary: formatCurrencyPlain(emp?.basicSalary || 0),
          amountPaid: formatCurrencyPlain(record.amountPaid || 0),
          status: record.status || 'N/A',
          paymentDate: record.paymentDate ? formatDate(record.paymentDate) : 'N/A',
          remarks: record.remarks || '—',
        };
      });

      const totalPaid = filteredData
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);

      const totalUnpaid = filteredData
        .filter(r => r.status === 'unpaid')
        .reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);

      // ===== TABLE – FITS A4 =====
      autoTable(doc, {
        startY: 54,
        columns: [
          { header: '#', dataKey: 'index' },
          { header: 'Employee Name', dataKey: 'name' },
          { header: 'ID', dataKey: 'id' },
          { header: 'Role', dataKey: 'role' },
          { header: 'Base Salary', dataKey: 'baseSalary' },
          { header: 'Amount Paid', dataKey: 'amountPaid' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Payment Date', dataKey: 'paymentDate' },
          { header: 'Remarks', dataKey: 'remarks' },
        ],
        body: rows,
        tableWidth: 180,
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 1.5,
        },
        styles: {
          fontSize: 8.5,
          font: 'helvetica',
          cellPadding: 1.5,
          overflow: 'linebreak',
          valign: 'middle',
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
        columnStyles: {
          index: { halign: 'center', cellWidth: 7 },
          name: { cellWidth: 28 },
          id: { cellWidth: 18 },
          role: { cellWidth: 16 },
          baseSalary: { halign: 'right', cellWidth: 20 },
          amountPaid: { halign: 'right', cellWidth: 20 },
          status: { halign: 'center', cellWidth: 14 },
          paymentDate: { halign: 'center', cellWidth: 20 },
          remarks: { cellWidth: 27 },
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth - 15,
            pageHeight - 10,
            { align: 'right' }
          );
          doc.text(
            `${schoolName} - Payroll Report ${period}`,
            15,
            pageHeight - 10,
            { align: 'left' }
          );
        },
      });

      const finalY = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 15, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total Paid: ${formatCurrency(totalPaid)}`, 15, finalY + 7);
      doc.text(`Total Unpaid: ${formatCurrency(totalUnpaid)}`, 15, finalY + 14);
      doc.text(`Total Records: ${filteredData.length}`, 15, finalY + 21);
      doc.text(`Paid Records: ${filteredData.filter(r => r.status === 'paid').length}`, 15, finalY + 28);
      doc.text(`Unpaid Records: ${filteredData.filter(r => r.status === 'unpaid').length}`, 15, finalY + 35);

      const filename = `Payroll_Report_${selectedMonth}_${selectedYear}.pdf`;
      doc.save(filename);
      toast.success(`PDF downloaded: ${filename}`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // ---------- Export Excel ----------
  const exportPayroll = () => {
    const data = filtered.map(e => ({
      'Employee ID': e.employeeNumber,
      'Full Name': e.fullName,
      'Role': e.type.charAt(0).toUpperCase() + e.type.slice(1),
      'Position/Subject': e.position || 'N/A',
      'Department/Class': e.department || 'N/A',
      'Email': e.email || 'N/A',
      'Phone': e.phoneNumber || 'N/A',
      'Status': e.status || 'N/A',
      'Hire Date': e.hireDate ? formatDate(e.hireDate) : 'N/A',
      'NIN': e.nin || 'N/A',
      'Base Salary (UGX)': e.basicSalary || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    XLSX.writeFile(wb, `Payroll_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success('Payroll exported successfully');
  };

  const refreshAll = async () => {
    setLoading(true);
    await fetchEmployees();
    await fetchGlobalStats();
    await fetchHistory(historyMonth, historyYear);
    setLoading(false);
    toast.success('Data refreshed');
  };

  // ---------- Render ----------
  const totalEmployees = employees.length;
  const totalTeachers = employees.filter(e => e.type === 'teacher').length;
  const totalStaff = employees.filter(e => e.type === 'staff').length;
  const totalSecretaries = employees.filter(e => e.type === 'secretary').length;

  const isPaidForSelectedMonth = (employeeId) => {
    return isEmployeePaid(employeeId, historyMonth, historyYear);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
              <Wallet className="w-7 h-7 text-emerald-600" />
              Unified Payroll Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Complete payroll for all employees – teachers, staff, and secretaries. Full audit trail.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              className="flex items-center gap-1.5 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition shadow-sm"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={openEmployeePayments}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <BarChart3 className="h-4 w-4" /> Employee Payments
            </button>
            <button
              onClick={openStaffManagement}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-sm"
            >
              <UserCogIcon className="h-4 w-4" /> Manage Staff
            </button>
            <span className="text-xs bg-gray-100 px-3 py-1.5 rounded-md font-medium text-gray-600 border border-gray-200">
              {totalEmployees} Total Employees
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Employees" value={totalEmployees} color="blue" />
          <StatCard icon={GraduationCap} label="Teachers" value={totalTeachers} color="indigo" />
          <StatCard icon={Briefcase} label="Staff" value={totalStaff} color="purple" />
          <StatCard icon={FileCheck} label="Secretaries" value={totalSecretaries} color="amber" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Wallet} label="Total Paid (All Time)" value={formatCompact(globalStats.totalPaidAll)} color="emerald" />
          <StatCard icon={AlertCircle} label="Total Unpaid" value={formatCompact(globalStats.totalUnpaidAll)} color="rose" />
          <StatCard icon={Calendar} label="Paid This Month" value={formatCompact(globalStats.thisMonthPaid)} color="teal" />
          <StatCard icon={Clock} label="Unpaid This Month" value={formatCompact(globalStats.thisMonthUnpaid)} color="orange" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={UserCheck} label="Active Employees" value={globalStats.activeCount} color="green" />
          <StatCard icon={Clock} label="On Leave" value={globalStats.onLeaveCount} color="yellow" />
          <StatCard icon={UserX} label="Terminated" value={globalStats.terminatedCount} color="red" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, ID, position..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-48 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50/50"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="teacher">Teachers</option>
              <option value="staff">Staff</option>
              <option value="secretary">Secretaries</option>
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              value={positionFilter}
              onChange={e => setPositionFilter(e.target.value)}
            >
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos === 'all' ? 'All Positions' : pos}</option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                value={hireDateFrom}
                onChange={e => setHireDateFrom(e.target.value)}
                placeholder="From"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                value={hireDateTo}
                onChange={e => setHireDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="fullName">Sort by Name</option>
              <option value="employeeNumber">Sort by ID</option>
              <option value="basicSalary">Sort by Salary</option>
              <option value="hireDate">Sort by Hire Date</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition bg-white"
            >
              <span className="text-xs font-medium">{sortOrder === 'asc' ? 'A→Z' : 'Z→A'}</span>
            </button>
            <button
              onClick={exportPayroll}
              className="ml-auto flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm active:scale-95"
            >
              <Download className="h-4 w-4" /> Export Excel
            </button>
            <button
              onClick={openPDFDialog}
              className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition shadow-sm active:scale-95"
            >
              <FileText className="h-4 w-4" /> Download PDF
            </button>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50/70 text-gray-500 uppercase text-xs font-semibold border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Position</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Hire Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Base Salary</th>
                  <th className="px-5 py-3.5">Payment Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton rows={5} />
              ) : (
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-5 py-12 text-center text-gray-400 font-medium">
                        No employees match the filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.slice((page - 1) * perPage, page * perPage).map(emp => {
                      const paid = isPaidForSelectedMonth(emp.id);
                      return (
                        <tr key={`${emp.type}-${emp.id}`} className="hover:bg-emerald-50/30 transition group">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border border-emerald-200 uppercase shadow-sm">
                                {emp.fullName?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 group-hover:text-emerald-600 transition">
                                  {emp.fullName}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">{emp.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                            {emp.employeeNumber || 'N/A'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <RoleBadge type={emp.type} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs font-medium text-gray-700">{emp.position || 'N/A'}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                              {emp.department || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-medium">
                            {emp.hireDate ? formatDate(emp.hireDate) : 'N/A'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={emp.status} /></td>
                          <td className="px-5 py-4 whitespace-nowrap font-semibold text-gray-800">
                            {formatCurrency(emp.basicSalary)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {paid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle className="h-3 w-3" /> Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertCircle className="h-3 w-3" /> Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => openSalaryModal(emp)}
                              disabled={paid}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm ${
                                paid
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title={paid ? `Already paid for ${MONTHS[historyMonth]} ${historyYear}` : 'Record payment'}
                            >
                              <DollarSign className="h-3.5 w-3.5" /> Pay
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              )}
            </table>
          </div>

          {!loading && filtered.length > perPage && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="text-gray-700">{(page - 1) * perPage + 1}</span> to{' '}
                <span className="text-gray-700">{Math.min(page * perPage, filtered.length)}</span> of{' '}
                <span className="text-gray-700">{filtered.length}</span> employees.
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-40 shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(Math.ceil(filtered.length / perPage), 7) }, (_, i) => {
                  let p = i + 1;
                  const total = Math.ceil(filtered.length / perPage);
                  if (total <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= total - 3) p = total - 6 + i;
                  else p = page - 3 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        p === page ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(p + 1, Math.ceil(filtered.length / perPage)))}
                  disabled={page === Math.ceil(filtered.length / perPage)}
                  className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-40 shadow-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment History Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-gray-800">📋 Full Payment History</h2>
              <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
                {historyFiltered.length}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={historyMonth}
                onChange={e => setHistoryMonth(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={historyYear}
                onChange={e => setHistoryYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Search by employee name or ID"
                  className="pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs w-48 focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50"
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
                No payments found for the selected filters.
              </div>
            ) : (
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50/70 text-gray-500 uppercase text-[10px] font-semibold border-b border-gray-200 tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Payment Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Remarks</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyPaginated.map(record => {
                    const emp = record.employee;
                    const isEditing = editingSalaryId === record.id;
                    return (
                      <tr key={record.id} className="hover:bg-indigo-50/30 transition">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 uppercase">
                              {emp?.fullName?.charAt(0) || 'U'}
                            </div>
                            <span className="font-semibold text-gray-800">
                              {emp?.fullName || 'Unknown Employee'}
                            </span>
                            {emp?.employeeNumber && (
                              <span className="text-xs text-gray-400 font-mono">{emp.employeeNumber}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <RoleBadge type={record.employeeType || 'unknown'} />
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
                          {isEditing ? (
                            <select
                              value={editingSalaryData?.status || 'paid'}
                              onChange={e => setEditingSalaryData(prev => ({ ...prev, status: e.target.value }))}
                              className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white"
                            >
                              <option value="paid">Paid</option>
                              <option value="unpaid">Unpaid</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              record.status === 'paid'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {record.status || 'paid'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap max-w-[120px] truncate text-xs text-gray-500">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingSalaryData?.remarks || ''}
                              onChange={e => setEditingSalaryData(prev => ({ ...prev, remarks: e.target.value }))}
                              className="border border-gray-300 rounded px-1 py-0.5 text-xs w-full bg-white"
                            />
                          ) : (
                            record.remarks || '—'
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveSalaryEdit(record)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => { setEditingSalaryId(null); setEditingSalaryData(null); }}
                                className="p-1 text-gray-400 hover:bg-gray-50 rounded transition"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditSalary(record)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSalary(record)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!historyLoading && totalHistoryPages > 1 && (
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
                {Array.from({ length: Math.min(totalHistoryPages, 7) }, (_, i) => {
                  let p = i + 1;
                  if (totalHistoryPages <= 7) p = i + 1;
                  else if (historyPage <= 4) p = i + 1;
                  else if (historyPage >= totalHistoryPages - 3) p = totalHistoryPages - 6 + i;
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
                  onClick={() => setHistoryPage(p => Math.min(p + 1, totalHistoryPages))}
                  disabled={historyPage === totalHistoryPages}
                  className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-40 shadow-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Salary Modal (Quick Pay) */}
        {showSalaryModal && selectedEmployee && (
          <SalaryModal
            employee={selectedEmployee}
            form={salaryForm}
            onChange={handleSalaryChange}
            onSubmit={handleSalarySubmit}
            loading={salaryLoading}
            onClose={() => setShowSalaryModal(false)}
            isPaid={isSelectedEmployeePaid(selectedEmployee.id, salaryForm.month, salaryForm.year)}
            monthLabel={MONTHS[salaryForm.month]}
          />
        )}

        {/* ===== PDF OPTIONS MODAL ===== */}
        {showPDFDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Download PDF Report</h3>
                <button
                  onClick={() => setShowPDFDialog(false)}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Select the month and year for the payroll report.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={pdfMonth}
                    onChange={(e) => setPdfMonth(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={pdfYear}
                    onChange={(e) => setPdfYear(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowPDFDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePDFConfirm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
                >
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== EMPLOYEE PAYMENTS MODAL (ALL EMPLOYEES) ===== */}
        {showEmployeePayments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  Employee Payment Summary
                </h2>
                <button
                  onClick={closeEmployeePayments}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 bg-gray-50/50"
                    value={paymentSearch}
                    onChange={e => setPaymentSearch(e.target.value)}
                  />
                </div>
                <select
                  value={paymentRoleFilter}
                  onChange={e => setPaymentRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="teacher">Teachers</option>
                  <option value="staff">Staff</option>
                  <option value="secretary">Secretaries</option>
                </select>
                <select
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="terminated">Terminated</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>

              <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50/70 text-gray-500 uppercase text-xs font-semibold border-b border-gray-200 tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Total Paid</th>
                      <th className="px-4 py-3">Payments</th>
                      <th className="px-4 py-3">Last Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentEmployees
                      .filter(emp => {
                        const matchSearch = emp.fullName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                                            emp.employeeNumber?.toLowerCase().includes(paymentSearch.toLowerCase());
                        const matchRole = paymentRoleFilter === 'all' || emp.type === paymentRoleFilter;
                        const matchStatus = paymentStatusFilter === 'all' || emp.status?.toLowerCase() === paymentStatusFilter;
                        return matchSearch && matchRole && matchStatus;
                      })
                      .map(emp => (
                        <tr key={`${emp.type}-${emp.id}`} className="hover:bg-blue-50/30 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200 uppercase">
                                {emp.fullName?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{emp.fullName}</div>
                                <div className="text-xs text-gray-400">{emp.employeeNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><RoleBadge type={emp.type} /></td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">{formatCurrency(emp.totalPaid)}</td>
                          <td className="px-4 py-3">{emp.paidCount}/{emp.paymentCount}</td>
                          <td className="px-4 py-3 text-xs">{emp.lastPaymentDate ? formatDate(emp.lastPaymentDate) : 'N/A'}</td>
                          <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => viewEmployeePaymentDetail(emp)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    {paymentEmployees.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-400">No employees found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeEmployeePayments}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== EMPLOYEE PAYMENT DETAIL MODAL ===== */}
        {showEmployeePaymentDetail && selectedPaymentEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <History className="h-6 w-6 text-blue-600" />
                    Payment Records for {selectedPaymentEmployee.fullName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPaymentEmployee.position} · {selectedPaymentEmployee.department} · {selectedPaymentEmployee.type}
                  </p>
                </div>
                <button
                  onClick={() => setShowEmployeePaymentDetail(false)}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <select
                    value={paymentYear}
                    onChange={e => setPaymentYear(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                  >
                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={paymentMonth}
                  onChange={e => setPaymentMonth(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                >
                  <option value="all">All Months</option>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                <span className="text-xs text-gray-500 ml-2">
                  {employeePaymentsFiltered.length} records
                </span>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600 font-semibold">Total Paid</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(employeePaymentsFiltered.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amountPaid), 0))}
                  </p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-rose-600 font-semibold">Total Unpaid</p>
                  <p className="text-lg font-bold text-rose-700">
                    {formatCurrency(employeePaymentsFiltered.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + Number(p.amountPaid), 0))}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 font-semibold">Payments Count</p>
                  <p className="text-lg font-bold text-blue-700">{employeePaymentsFiltered.length}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Monthly Payment Distribution ({paymentYear})</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(val) => `UGX ${(val / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                      <Legend />
                      <Bar dataKey="paid" name="Paid" fill="#22c55e" />
                      <Bar dataKey="unpaid" name="Unpaid" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50/70 text-gray-500 uppercase text-xs font-semibold border-b border-gray-200 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment Date</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentLoading ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400">Loading payments…</td>
                      </tr>
                    ) : employeePaymentsFiltered.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400">No payments found.</td>
                      </tr>
                    ) : (
                      employeePaymentsFiltered.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/30">
                          <td className="px-4 py-3 font-medium">{MONTHS[p.month]}</td>
                          <td className="px-4 py-3">{p.year}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(p.amountPaid)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{p.paymentDate ? formatDate(p.paymentDate) : 'N/A'}</td>
                          <td className="px-4 py-3 text-xs max-w-[150px] truncate">{p.remarks || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowEmployeePaymentDetail(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== STAFF MANAGEMENT MODAL (CRUD) ===== */}
        {showStaffManagement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserCogIcon className="h-6 w-6 text-purple-600" />
                  Manage Non-Teaching Staff
                </h2>
                <button
                  onClick={closeStaffManagement}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search staff by name, position, department..."
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50/50"
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={fetchStaffList}
                  className="p-2 text-gray-500 hover:text-purple-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50/70 text-gray-500 uppercase text-xs font-semibold border-b border-gray-200 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Hire Date</th>
                      <th className="px-4 py-3">Base Salary</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staffList
                      .filter(s =>
                        s.fullName?.toLowerCase().includes(staffSearch.toLowerCase()) ||
                        s.position?.toLowerCase().includes(staffSearch.toLowerCase()) ||
                        s.department?.toLowerCase().includes(staffSearch.toLowerCase())
                      )
                      .map(staff => (
                        <tr key={staff.id} className="hover:bg-gray-50/30 transition">
                          <td className="px-4 py-3 font-medium text-gray-800">{staff.fullName}</td>
                          <td className="px-4 py-3">{staff.position || 'N/A'}</td>
                          <td className="px-4 py-3">{staff.department || 'N/A'}</td>
                          <td className="px-4 py-3">{staff.phoneNumber || 'N/A'}</td>
                          <td className="px-4 py-3">{staff.email || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs">{staff.hireDate ? formatDate(staff.hireDate) : 'N/A'}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(staff.BaseSalary || 0)}</td>
                          <td className="px-4 py-3">
                            <select
                              value={staff.status || 'Active'}
                              onChange={(e) => handleStaffStatusChange(staff, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="Active">Active</option>
                              <option value="On Leave">On Leave</option>
                              <option value="Suspended">Suspended</option>
                              <option value="Terminated">Terminated</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditStaff(staff)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStaffDelete(staff.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {staffList.length === 0 && (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                          No staff records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {editingStaff && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Edit Staff: {editingStaff.fullName}</h3>
                  <form onSubmit={handleStaffUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={editStaffForm.fullName}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Position</label>
                      <input
                        type="text"
                        name="position"
                        value={editStaffForm.position}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={editStaffForm.department}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={editStaffForm.phoneNumber}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editStaffForm.email}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Hire Date</label>
                      <input
                        type="date"
                        name="hireDate"
                        value={editStaffForm.hireDate}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Base Salary (UGX)</label>
                      <input
                        type="number"
                        name="BaseSalary"
                        value={editStaffForm.BaseSalary}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                      <select
                        name="status"
                        value={editStaffForm.status}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">NIN</label>
                      <input
                        type="text"
                        name="nin"
                        value={editStaffForm.nin}
                        onChange={handleStaffChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-end gap-2 col-span-full">
                      <button
                        type="submit"
                        disabled={staffLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                      >
                        {staffLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4" /> Update Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingStaff(null); setEditStaffForm({}); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeStaffManagement}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Stat Card Component ----------
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50/60 text-blue-700 border-blue-200/80',
    indigo: 'bg-indigo-50/60 text-indigo-700 border-indigo-200/80',
    purple: 'bg-purple-50/60 text-purple-700 border-purple-200/80',
    emerald: 'bg-emerald-50/60 text-emerald-700 border-emerald-200/80',
    rose: 'bg-rose-50/60 text-rose-700 border-rose-200/80',
    teal: 'bg-teal-50/60 text-teal-700 border-teal-200/80',
    orange: 'bg-orange-50/60 text-orange-700 border-orange-200/80',
    green: 'bg-green-50/60 text-green-700 border-green-200/80',
    yellow: 'bg-yellow-50/60 text-yellow-700 border-yellow-200/80',
    red: 'bg-red-50/60 text-red-700 border-red-200/80',
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

// ---------- Salary Modal Component ----------
const SalaryModal = ({ employee, form, onChange, onSubmit, loading, onClose, isPaid, monthLabel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Record Payroll for {employee.fullName}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 flex flex-col gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Employee ID:</span>
            <span className="font-semibold text-gray-800 font-mono">{employee.employeeNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role:</span>
            <span className="font-semibold text-gray-800">{employee.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Position:</span>
            <span className="font-semibold text-gray-800">{employee.position || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Department:</span>
            <span className="font-semibold text-gray-800">{employee.department || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
            <span className="text-gray-500 font-medium">Base Salary:</span>
            <span className="font-bold text-slate-900">{formatCurrency(employee.basicSalary)}</span>
          </div>
          {employee.hireDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Hire Date:</span>
              <span className="font-semibold text-gray-800">{formatDate(employee.hireDate)}</span>
            </div>
          )}
          {employee.status && (
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <StatusBadge status={employee.status} />
            </div>
          )}
        </div>

        {isPaid && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-800">Already Paid</p>
              <p className="text-xs text-rose-600">
                This employee has already been paid for <strong>{monthLabel} {form.year}</strong>.
                Please change the month/year to record a different payment.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
              <select
                name="month"
                value={form.month}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={onChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paid (UGX)</label>
            <input
              type="number"
              name="amountPaid"
              value={form.amountPaid}
              onChange={onChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Date</label>
            <input
              type="date"
              name="paymentDate"
              value={form.paymentDate}
              onChange={onChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={onChange}
              rows="2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white resize-none"
              placeholder="e.g., Monthly salary, bonus, etc."
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
              disabled={loading || isPaid}
              className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50`}
              title={isPaid ? 'Already paid for this month' : ''}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Save className="h-3.5 w-3.5" /> Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};