// Pages/Admin/AdminFees.jsx – Enterprise Fee Management (Polished)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign, Plus, Search, Download, Printer, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, X, Save, Edit, Trash2, Eye,
  BarChart3, TrendingUp, TrendingDown, Activity, Zap, Wallet,
  Users, CreditCard, Calendar, CheckCircle, AlertCircle,
  Receipt, MessageSquare, Phone, School, BookOpen,
  ArrowUpRight, ArrowDownRight, Clock, User, FileText,
  ChevronDown, ChevronUp, FileSpreadsheet, Award,
  UserCheck, Bell, ClockIcon, AlertTriangle, ThumbsUp, ThumbsDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import * as XLSX from 'xlsx';

// ---------- HELPERS ----------
const extractArray = (res) => {
  if (!res || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

// Compact currency formatter – e.g., 2.5M, 1.2B, 50K
const formatCompact = (v) => {
  if (v === null || v === undefined || isNaN(v)) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toString();
};

// Full currency (for receipts, tables)
const formatUGX = (v) =>
  v != null ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(v) : 'UGX 0';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

// ---------- STAT CARD (Compact value) ----------
const StatCard = ({ icon, label, value, color, progress, subtitle }) => {
  // Use compact value for display, but keep full for tooltip? We'll just display compact.
  const displayValue = typeof value === 'string' ? value : formatCompact(value);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center text-center hover:shadow-md transition">
      <div className={`p-2.5 rounded-lg bg-${color}-100 text-${color}-600 mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {progress !== undefined && (
        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div className={`h-full bg-${color}-500 rounded-full transition-all`} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
  );
};

// ---------- STATUS BADGE ----------
const StatusBadge = ({ fee }) => {
  const bal = Number(fee.totalFee || 0) - Number(fee.amountPaid || 0);
  if (bal === 0 && Number(fee.amountPaid || 0) > 0) return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid</span>;
  if (bal > 0 && Number(fee.amountPaid || 0) > 0) return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Partial</span>;
  return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Pending</span>;
};

// ---------- MAIN COMPONENT ----------
const AdminFees = () => {
  // ---------- STATE ----------
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showStudentHistory, setShowStudentHistory] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyFees, setHistoryFees] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form state for add/edit
  const [form, setForm] = useState({
    studentId: '', totalFee: '', amountPaid: '', term: '',
    academicYear: new Date().getFullYear().toString(),
    paymentMethod: '', referenceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    sendSms: false
  });

  // ---------- DATA FETCHING ----------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [feesRes, studentsRes, classesRes] = await Promise.all([
        api.get('/fees', config),
        api.get('/students', config),
        api.get('/classes', config)
      ]);
      setFees(extractArray(feesRes));
      setStudents(extractArray(studentsRes));
      setClasses(extractArray(classesRes));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load fee data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---------- DERIVED STATS ----------
  const stats = useMemo(() => {
    let totalCollected = 0, totalDemanded = 0;
    let paidCount = 0, partialCount = 0, pendingCount = 0;
    let uniqueStudents = new Set();
    fees.forEach(f => {
      const paid = Number(f.amountPaid || 0), total = Number(f.totalFee || 0);
      totalCollected += paid;
      totalDemanded += total;
      uniqueStudents.add(f.studentId);
      const bal = total - paid;
      if (bal === 0 && paid > 0) paidCount++;
      else if (bal > 0 && paid > 0) partialCount++;
      else if (paid === 0 && total > 0) pendingCount++;
    });
    const outstanding = Math.max(0, totalDemanded - totalCollected);
    const rate = totalDemanded > 0 ? Math.min(100, Math.round((totalCollected / totalDemanded) * 100)) : 0;
    const avgFee = uniqueStudents.size ? totalCollected / uniqueStudents.size : 0;
    return { totalCollected, totalDemanded, outstanding, rate, paidCount, partialCount, pendingCount, avgFee, uniqueStudents: uniqueStudents.size };
  }, [fees]);

  // Monthly / daily trend
  const trendData = useMemo(() => {
    const map = {};
    fees.forEach(f => {
      const d = f.paymentDate || f.createdAt;
      if (!d) return;
      const key = d.slice(0, 7); // YYYY-MM
      if (!map[key]) map[key] = { collected: 0, demanded: 0, count: 0 };
      map[key].collected += Number(f.amountPaid || 0);
      map[key].demanded += Number(f.totalFee || 0);
      map[key].count++;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([month, data]) => ({
      month,
      collected: data.collected,
      demanded: data.demanded,
      count: data.count,
      rate: data.demanded ? Math.min(100, Math.round((data.collected / data.demanded) * 100)) : 0
    }));
  }, [fees]);

  // Top payers (by amount paid)
  const topPayers = useMemo(() => {
    const map = {};
    fees.forEach(f => {
      const sid = f.studentId;
      if (!sid) return;
      if (!map[sid]) map[sid] = { studentId: sid, totalPaid: 0, count: 0 };
      map[sid].totalPaid += Number(f.amountPaid || 0);
      map[sid].count++;
    });
    return Object.values(map)
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5)
      .map(item => {
        const student = students.find(s => s.id == item.studentId);
        return { ...item, studentName: student?.fullName || 'Unknown', studentNumber: student?.studentNumber || '' };
      });
  }, [fees, students]);

  // AI Insights (enhanced)
  const insights = useMemo(() => {
    const ins = [];
    const rate = stats.rate;
    if (rate < 30) ins.push({ icon: <AlertTriangle className="w-5 h-5 text-red-600" />, text: `Critical: Only ${rate}% of fees collected. Immediate action required.`, color: 'red', severity: 'critical' });
    else if (rate < 50) ins.push({ icon: <AlertCircle className="w-5 h-5 text-yellow-600" />, text: `Warning: Collection rate is ${rate}%. Follow up with defaulters.`, color: 'yellow', severity: 'warning' });
    else if (rate >= 80) ins.push({ icon: <ThumbsUp className="w-5 h-5 text-green-600" />, text: `Great collection rate of ${rate}%! You're on track.`, color: 'green', severity: 'success' });

    if (stats.pendingCount > stats.paidCount) {
      ins.push({ icon: <Users className="w-5 h-5 text-orange-600" />, text: `More students have not paid (${stats.pendingCount}) than fully paid (${stats.paidCount}). Focus on pending.`, color: 'orange', severity: 'warning' });
    }

    const overdue = fees.filter(f => {
      const paid = Number(f.amountPaid || 0);
      if (paid > 0) return false;
      const d = f.paymentDate || f.createdAt;
      if (!d) return false;
      const diff = (new Date() - new Date(d)) / (1000 * 60 * 60 * 24);
      return diff > 30;
    }).length;
    if (overdue > 0) {
      ins.push({ icon: <ClockIcon className="w-5 h-5 text-red-500" />, text: `${overdue} payments are overdue (30+ days). Send reminders.`, color: 'red', severity: 'critical' });
    }

    if (topPayers.length > 0 && topPayers[0].totalPaid > 0) {
      const top = topPayers[0];
      ins.push({ icon: <Award className="w-5 h-5 text-amber-600" />, text: `Top payer: ${top.studentName} (${formatUGX(top.totalPaid)}).`, color: 'amber', severity: 'info' });
    }

    if (trendData.length >= 2) {
      const last = trendData[trendData.length - 1];
      const prev = trendData[trendData.length - 2];
      if (last.collected < prev.collected * 0.8) {
        ins.push({ icon: <TrendingDown className="w-5 h-5 text-rose-600" />, text: `Collection dropped ${Math.round((1 - last.collected/prev.collected)*100)}% from ${prev.month} to ${last.month}. Investigate.`, color: 'rose', severity: 'warning' });
      }
    }

    if (ins.length === 0) ins.push({ icon: <CheckCircle className="w-5 h-5 text-green-600" />, text: 'All metrics are healthy. Keep up the good work!', color: 'green', severity: 'success' });
    return ins;
  }, [stats, topPayers, trendData, fees]);

  // ---------- FILTERED LIST ----------
  const filtered = useMemo(() => {
    let list = [...fees];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(f =>
        f.student?.fullName?.toLowerCase().includes(q) ||
        f.student?.studentNumber?.toLowerCase().includes(q) ||
        f.referenceNumber?.toLowerCase().includes(q)
      );
    }
    if (filterStudent) list = list.filter(f => f.studentId == filterStudent);
    if (filterTerm) list = list.filter(f => f.term === filterTerm);
    if (filterClass) list = list.filter(f => f.student?.classId == filterClass);
    if (filterStatus) {
      list = list.filter(f => {
        const bal = Number(f.totalFee || 0) - Number(f.amountPaid || 0);
        if (filterStatus === 'Paid') return bal === 0 && Number(f.amountPaid || 0) > 0;
        if (filterStatus === 'Partial') return bal > 0 && Number(f.amountPaid || 0) > 0;
        if (filterStatus === 'Pending') return Number(f.amountPaid || 0) === 0 && Number(f.totalFee || 0) > 0;
        return true;
      });
    }
    if (filterPaymentMethod) list = list.filter(f => f.paymentMethod === filterPaymentMethod);
    if (dateRange.start) list = list.filter(f => (f.paymentDate || f.createdAt) >= dateRange.start);
    if (dateRange.end) list = list.filter(f => (f.paymentDate || f.createdAt) <= dateRange.end);

    // Sort
    list.sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case 'student': va = a.student?.fullName || ''; vb = b.student?.fullName || ''; break;
        case 'amount': va = Number(a.totalFee || 0); vb = Number(b.totalFee || 0); break;
        case 'status': {
          const statusVal = (fee) => {
            const bal = Number(fee.totalFee || 0) - Number(fee.amountPaid || 0);
            if (bal === 0 && Number(fee.amountPaid || 0) > 0) return 1;
            if (bal > 0 && Number(fee.amountPaid || 0) > 0) return 2;
            return 3;
          };
          va = statusVal(a); vb = statusVal(b);
          break;
        }
        default: // date
          va = new Date(a.paymentDate || a.createdAt || 0).getTime();
          vb = new Date(b.paymentDate || b.createdAt || 0).getTime();
      }
      const dir = sortOrder === 'asc' ? 1 : -1;
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
    return list;
  }, [fees, searchTerm, filterStudent, filterTerm, filterClass, filterStatus, filterPaymentMethod, dateRange, sortBy, sortOrder]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ---------- HELPER FUNCTIONS ----------
  const getStudentName = (id) => students.find(s => s.id == id)?.fullName || '—';
  const getClassName = (id) => {
    const s = students.find(s => s.id == id);
    return s?.class?.className || '—';
  };

  const resetForm = () => {
    setForm({
      studentId: '', totalFee: '', amountPaid: '', term: '',
      academicYear: new Date().getFullYear().toString(),
      paymentMethod: '', referenceNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      sendSms: false
    });
    setSelectedFee(null);
  };

  // ---------- CRUD OPERATIONS ----------
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.totalFee || Number(form.totalFee) <= 0) return toast.error('Fill required fields');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        studentId: parseInt(form.studentId),
        totalFee: Number(form.totalFee),
        amountPaid: Number(form.amountPaid) || 0,
        term: form.term,
        academicYear: form.academicYear,
        paymentMethod: form.paymentMethod || null,
        referenceNumber: form.referenceNumber || `REF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`,
        paymentDate: form.paymentDate
      };
      const res = await api.post('/fees', payload, config);
      const newFee = res.data?.data || res.data;
      setFees(prev => [newFee, ...prev]);
      toast.success('Payment recorded');

      // SMS
      if (form.sendSms) {
        const student = students.find(s => s.id == form.studentId);
        if (student?.parentPhone) {
          try {
            const msg = `Receipt\nStudent: ${student.fullName}\nPaid: UGX ${Number(form.amountPaid).toLocaleString()}\nTotal: UGX ${Number(form.totalFee).toLocaleString()}\nBalance: UGX ${(Number(form.totalFee) - Number(form.amountPaid)).toLocaleString()}\nRef: ${newFee.referenceNumber}\nDate: ${form.paymentDate}\nThank you.`;
            await api.post('/sms/send', { recipients: [student.parentPhone], message: msg, category: 'payment_confirmation', priority: 'normal', isBulk: false }, config);
            toast.success('SMS sent');
          } catch (smsErr) { toast.error('SMS failed'); }
        } else toast.error('No parent phone');
      }
      setShowAdd(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        studentId: parseInt(form.studentId),
        totalFee: Number(form.totalFee),
        amountPaid: Number(form.amountPaid) || 0,
        term: form.term,
        academicYear: form.academicYear,
        paymentMethod: form.paymentMethod || null,
        referenceNumber: form.referenceNumber || selectedFee.referenceNumber,
        paymentDate: form.paymentDate
      };
      const res = await api.put(`/fees/${selectedFee.id}`, payload, config);
      const updatedFee = res.data?.data || res.data;
      setFees(prev => prev.map(f => f.id === updatedFee.id ? updatedFee : f));
      toast.success('Updated');
      setShowEdit(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.delete(`/fees/${deleteTarget.id}`, config);
      setFees(prev => prev.filter(f => f.id !== deleteTarget.id));
      toast.success('Deleted');
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openEdit = (fee) => {
    setSelectedFee(fee);
    setForm({
      studentId: fee.studentId || '',
      totalFee: fee.totalFee || '',
      amountPaid: fee.amountPaid || '',
      term: fee.term || '',
      academicYear: fee.academicYear || new Date().getFullYear().toString(),
      paymentMethod: fee.paymentMethod || '',
      referenceNumber: fee.referenceNumber || '',
      paymentDate: fee.paymentDate ? fee.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      sendSms: false
    });
    setShowEdit(true);
  };

  // Student fee history
  const openStudentHistory = async (studentId) => {
    const student = students.find(s => s.id == studentId);
    if (!student) return toast.error('Student not found');
    setHistoryStudent(student);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Try dedicated endpoint first
      let res;
      try {
        res = await api.get(`/fees/student/${studentId}`, config);
      } catch {
        // Fallback: filter by studentId
        res = await api.get('/fees', { params: { studentId }, headers: { Authorization: `Bearer ${token}` } });
      }
      const data = extractArray(res);
      setHistoryFees(data);
      setShowStudentHistory(true);
    } catch (err) {
      toast.error('Failed to load student fee history');
    }
  };

  // Export (CSV with more columns)
  const exportCSV = () => {
    if (filtered.length === 0) return toast.error('No data');
    const data = filtered.map(f => ({
      Student: getStudentName(f.studentId),
      StudentNumber: f.student?.studentNumber || '',
      Class: getClassName(f.studentId),
      Term: f.term,
      Year: f.academicYear,
      'Total Fee': Number(f.totalFee || 0),
      'Amount Paid': Number(f.amountPaid || 0),
      Balance: Number(f.totalFee || 0) - Number(f.amountPaid || 0),
      Status: (Number(f.totalFee || 0) - Number(f.amountPaid || 0) === 0 && Number(f.amountPaid || 0) > 0 ? 'Paid' : Number(f.amountPaid || 0) > 0 ? 'Partial' : 'Pending'),
      Method: f.paymentMethod || '',
      Reference: f.referenceNumber || '',
      Date: f.paymentDate || f.createdAt
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fees');
    XLSX.writeFile(wb, `Admin_Fees_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success('Exported');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterStudent('');
    setFilterTerm('');
    setFilterClass('');
    setFilterStatus('');
    setFilterPaymentMethod('');
    setDateRange({ start: '', end: '' });
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // ---------- RENDER ----------
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-purple-600" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-purple-600" />
            Fee Center & Analytics
          </h1>
          <p className="text-sm text-gray-500">Complete financial overview with AI-powered insights.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => { resetForm(); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {/* ===== STATS: 2 Rows × 3 Cards (Compact values) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<Wallet className="w-5 h-5" />} label="Total Collected" value={stats.totalCollected} color="emerald" subtitle={`${stats.uniqueStudents} students`} />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Demanded" value={stats.totalDemanded} color="blue" />
        <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Outstanding" value={stats.outstanding} color="red" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Collection Rate" value={`${stats.rate}%`} color="indigo" progress={stats.rate} />
        <StatCard icon={<Users className="w-5 h-5" />} label="Fully Paid" value={stats.paidCount} color="green" subtitle={`Partial: ${stats.partialCount}`} />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Pending" value={stats.pendingCount} color="red" />
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-purple-600" /> AI‑Powered Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg bg-${ins.color}-50 border border-${ins.color}-200`}>
              <div className="mt-0.5">{ins.icon}</div>
              <p className={`text-sm text-${ins.color}-700`}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Collection Trend – Polished */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-600" /> Monthly Collection Trend</h3>
        <div className="space-y-2">
          {trendData.slice(-6).map((item, idx) => {
            const max = Math.max(...trendData.map(d => d.collected), 1);
            const barWidth = Math.max((item.collected / max) * 100, 2);
            return (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="w-16 text-gray-600 font-medium">{item.month}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-end pr-2 text-white text-[10px] font-bold transition-all"
                    style={{ width: `${barWidth}%` }}
                  >
                    {item.collected > 0 && formatCompact(item.collected)}
                  </div>
                </div>
                <span className="w-12 text-right font-bold text-purple-700">{item.rate}%</span>
              </div>
            );
          })}
          {trendData.length === 0 && <p className="text-sm text-gray-400">No data</p>}
        </div>
      </div>

      {/* Top Payers */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-600" /> Top Payers</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {topPayers.map((p, i) => (
            <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
              <p className="font-bold text-amber-700 text-sm">{p.studentName}</p>
              <p className="text-xs text-amber-600">{p.studentNumber}</p>
              <p className="text-xs font-semibold text-amber-800 mt-1">{formatUGX(p.totalPaid)}</p>
              <p className="text-xs text-amber-500">{p.count} payments</p>
            </div>
          ))}
          {topPayers.length === 0 && <p className="text-sm text-gray-400 col-span-5">No payments recorded yet.</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search student or reference..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">All Students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </select>
          <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">All Terms</option>
            <option>Term 1</option><option>Term 2</option><option>Term 3</option>
          </select>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">All Status</option>
            <option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Pending">Pending</option>
          </select>
          <select value={filterPaymentMethod} onChange={e => setFilterPaymentMethod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">All Methods</option>
            <option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Cheque</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
            <span className="text-sm text-gray-500">to</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="date">Sort by Date</option>
            <option value="student">Sort by Student</option>
            <option value="amount">Sort by Amount</option>
            <option value="status">Sort by Status</option>
          </select>
          <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50">
            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={fetchData} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Class</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Term</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Total Fee</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Paid</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageItems.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-gray-500">No fee records found. Try adjusting filters.</td></tr>
              ) : (
                pageItems.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase">
                          {getStudentName(fee.studentId).charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm cursor-pointer hover:text-purple-600" onClick={() => openStudentHistory(fee.studentId)}>
                            {getStudentName(fee.studentId)}
                          </p>
                          <p className="text-xs text-gray-400">{fee.student?.studentNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{getClassName(fee.studentId)}</td>
                    <td className="p-4 text-sm">{fee.term} / {fee.academicYear}</td>
                    <td className="p-4 text-right text-sm font-medium text-blue-600">{formatUGX(fee.totalFee)}</td>
                    <td className="p-4 text-right text-sm font-medium text-emerald-600">{formatUGX(fee.amountPaid)}</td>
                    <td className="p-4 text-right text-sm font-bold text-red-600">{formatUGX(Number(fee.totalFee || 0) - Number(fee.amountPaid || 0))}</td>
                    <td className="p-4 text-center"><StatusBadge fee={fee} /></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setSelectedFee(fee); setShowReceipt(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(fee)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setDeleteTarget(fee); setShowDelete(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        <button onClick={() => openStudentHistory(fee.studentId)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View History"><User className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > perPage && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 flex-wrap gap-2">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages} ({filtered.length} total)</p>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1 border rounded text-sm"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i+1;
                if (totalPages > 5) {
                  if (currentPage > 3) p = currentPage - 3 + i;
                  if (p > totalPages) return null;
                }
                return (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 border rounded text-sm ${currentPage===p ? 'bg-purple-600 text-white border-purple-600' : ''}`}>{p}</button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages-2 && <span className="px-2">...</span>}
              {totalPages > 5 && <button onClick={() => setCurrentPage(totalPages)} className={`px-3 py-1 border rounded text-sm ${currentPage===totalPages ? 'bg-purple-600 text-white border-purple-600' : ''}`}>{totalPages}</button>}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1 border rounded text-sm"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* Add Modal */}
      {showAdd && <FeeFormModal title="Record Payment" form={form} setForm={setForm} onSubmit={handleAdd} saving={saving} onClose={() => setShowAdd(false)} students={students} />}
      {/* Edit Modal */}
      {showEdit && <FeeFormModal title="Edit Fee Record" form={form} setForm={setForm} onSubmit={handleEdit} saving={saving} onClose={() => setShowEdit(false)} students={students} />}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Fee Record</h3>
              <p className="text-gray-500 text-sm mb-4">Are you sure you want to delete this record for <strong>{getStudentName(deleteTarget?.studentId)}</strong>?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold">Payment Receipt</h3>
                <p className="text-xs text-gray-500">Official record</p>
              </div>
              <button onClick={() => setShowReceipt(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">ACADEMIC ERP</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Reference:</span><span className="font-mono font-semibold">{selectedFee.referenceNumber || 'N/A'}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{formatDate(selectedFee.paymentDate || selectedFee.createdAt)}</span></div>
                <div className="flex justify-between"><span>Student:</span><span className="font-medium">{getStudentName(selectedFee.studentId)}</span></div>
                <div className="flex justify-between"><span>Class:</span><span>{getClassName(selectedFee.studentId)}</span></div>
                <div className="flex justify-between"><span>Term / Year:</span><span>{selectedFee.term} ({selectedFee.academicYear})</span></div>
                <div className="flex justify-between"><span>Method:</span><span>{selectedFee.paymentMethod || 'N/A'}</span></div>
              </div>
              <div className="border-t border-b py-4 space-y-2">
                <div className="flex justify-between"><span>Total Fee:</span><span className="font-semibold">{formatUGX(selectedFee.totalFee)}</span></div>
                <div className="flex justify-between text-emerald-600 font-semibold"><span>Amount Paid:</span><span>-{formatUGX(selectedFee.amountPaid)}</span></div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold">Remaining Balance:</span>
                <span className={`text-xl font-bold ${Number(selectedFee.totalFee) - Number(selectedFee.amountPaid) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatUGX(Number(selectedFee.totalFee) - Number(selectedFee.amountPaid))}
                </span>
              </div>
              <div className="text-center pt-4 text-xs text-gray-400">Thank you</div>
            </div>
            <div className="border-t p-5 bg-gray-50 flex gap-3">
              <button onClick={() => window.print()} className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print</button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 border py-2.5 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Fee History Modal */}
      {showStudentHistory && historyStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold">{historyStudent.fullName}</h3>
                <p className="text-xs text-slate-400">{historyStudent.studentNumber} · Fee History</p>
              </div>
              <button onClick={() => setShowStudentHistory(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {historyFees.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No fee records found for this student.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Total Paid</p>
                      <p className="font-bold text-emerald-700">{formatUGX(historyFees.reduce((sum, f) => sum + Number(f.amountPaid||0), 0))}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Total Balance</p>
                      <p className="font-bold text-red-700">{formatUGX(historyFees.reduce((sum, f) => sum + (Number(f.totalFee||0) - Number(f.amountPaid||0)), 0))}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Total Demanded</p>
                      <p className="font-bold text-blue-700">{formatUGX(historyFees.reduce((sum, f) => sum + Number(f.totalFee||0), 0))}</p>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr><th className="p-2 text-left">Term</th><th className="p-2 text-right">Total</th><th className="p-2 text-right">Paid</th><th className="p-2 text-right">Balance</th><th className="p-2 text-center">Status</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {historyFees.map(f => (
                        <tr key={f.id}>
                          <td className="p-2">{f.term} {f.academicYear}</td>
                          <td className="p-2 text-right font-medium">{formatUGX(f.totalFee)}</td>
                          <td className="p-2 text-right text-emerald-600">{formatUGX(f.amountPaid)}</td>
                          <td className="p-2 text-right text-red-600">{formatUGX(Number(f.totalFee)-Number(f.amountPaid))}</td>
                          <td className="p-2 text-center"><StatusBadge fee={f} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= Reusable Fee Form Modal =================
const FeeFormModal = ({ title, form, setForm, onSubmit, saving, onClose, students }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div>
            <label className="block text-sm font-medium mb-1.5">Student *</label>
            <select name="studentId" value={form.studentId} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.studentNumber})</option>)}
            </select>
            {form.studentId && (
              (() => {
                const student = students.find(s => s.id == form.studentId);
                return student?.parentPhone ? (
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Parent: {student.parentPhone}</p>
                ) : (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No parent phone</p>
                );
              })()
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Total Fee *</label><input type="number" name="totalFee" value={form.totalFee} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required min="0" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Amount Paid *</label><input type="number" name="amountPaid" value={form.amountPaid} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required min="0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Term *</label><select name="term" value={form.term} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required><option value="">Select</option><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div>
            <div><label className="block text-sm font-medium mb-1.5">Academic Year *</label><input type="text" name="academicYear" value={form.academicYear} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Payment Method</label><select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg"><option value="">Select</option><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Cheque</option></select></div>
            <div><label className="block text-sm font-medium mb-1.5">Reference Number</label><input type="text" name="referenceNumber" value={form.referenceNumber} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1.5">Payment Date</label><input type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" /></div>
          {form.studentId && students.find(s => s.id == form.studentId)?.parentPhone && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <label className="flex items-center gap-2 text-sm font-medium text-blue-800 cursor-pointer">
                <input type="checkbox" name="sendSms" checked={form.sendSms} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                Send SMS receipt to parent
              </label>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFees;