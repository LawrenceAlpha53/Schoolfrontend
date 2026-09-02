// FeesManagement.jsx – PROPER FINANCIAL LOGIC & STATS
import {
  DollarSign, Plus, Search, Filter, Download, Printer,
  ChevronLeft, ChevronRight, X, Save, Loader2, Users,
  CreditCard, Wallet, TrendingUp, TrendingDown, Calendar,
  Clock, CheckCircle, AlertCircle, RefreshCw, Eye, Edit,
  Trash2, FileText, Receipt, Banknote, Phone, Mail, User,
  School, Award, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  MessageSquare
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const FeesManagement = () => {
  const navigate = useNavigate();

  const [fees, setFees] = useState([]);
  const [filteredFees, setFilteredFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("All");
  const [selectedTerm, setSelectedTerm] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [feeToDelete, setFeeToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    studentId: "", totalFee: "", amountPaid: "", term: "",
    academicYear: new Date().getFullYear().toString(),
    paymentMethod: "", referenceNumber: "",
    paymentDate: new Date().toISOString().split('T')[0], sendSms: false
  });

  const [stats, setStats] = useState({
    totalCollected: 0, totalDemanded: 0, outstanding: 0,
    collectionRate: 0, paidCount: 0, pendingCount: 0, partialCount: 0,
    totalStudents: 0, studentsWithFees: 0, studentsWithoutFees: 0
  });

  const extractArray = (res) => {
    if (!res?.data) return [];
    const d = res.data;
    if (Array.isArray(d)) return d;
    if (d.data && Array.isArray(d.data)) return d.data;
    if (d.success && Array.isArray(d.data)) return d.data;
    return [];
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) { toast.error("Please log in"); navigate('/login'); return; }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [feesRes, studentsRes, classesRes] = await Promise.all([
        api.get("/fees", config), api.get("/students", config), api.get("/classes", config)
      ]);

      const feesData = extractArray(feesRes);
      const studentsData = extractArray(studentsRes);
      const classesData = extractArray(classesRes);

      setFees(feesData);
      setFilteredFees(feesData);
      setStudents(studentsData);
      setClasses(classesData);
      calculateStats(feesData, studentsData);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to load fees";
      setError(msg);
      toast.error(msg);
    } finally { setIsLoading(false); }
  }, [navigate]);

  // ================= PROPER STATS CALCULATION =================
  const calculateStats = useCallback((feesData, studentsData) => {
    let totalCollected = 0, totalDemanded = 0;
    let paidCount = 0, pendingCount = 0, partialCount = 0;

    // Aggregate by student to avoid double-counting
    const studentFeeMap = {};
    feesData.forEach(fee => {
      const sid = fee.studentId || fee.student?.id;
      if (!sid) return;
      if (!studentFeeMap[sid]) studentFeeMap[sid] = { demanded: 0, paid: 0 };
      studentFeeMap[sid].demanded += Number(fee.totalFee || 0);
      studentFeeMap[sid].paid += Number(fee.amountPaid || 0);
    });

    // Calculate totals from aggregated student data
    Object.values(studentFeeMap).forEach(({ demanded, paid }) => {
      totalDemanded += demanded;
      totalCollected += paid;
      const balance = demanded - paid;
      if (balance <= 0 && paid > 0) paidCount++;
      else if (balance > 0 && paid > 0) partialCount++;
      else if (paid === 0 && demanded > 0) pendingCount++;
    });

    const totalStudents = studentsData?.length || 0;
    const studentsWithFees = Object.keys(studentFeeMap).length;
    const studentsWithoutFees = Math.max(0, totalStudents - studentsWithFees);

    setStats({
      totalCollected,
      totalDemanded,
      outstanding: Math.max(0, totalDemanded - totalCollected),
      collectionRate: totalDemanded > 0 ? Number(((totalCollected / totalDemanded) * 100).toFixed(1)) : 0,
      paidCount, pendingCount, partialCount,
      totalStudents, studentsWithFees, studentsWithoutFees
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let filtered = [...fees];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(f =>
        (f.student?.fullName || '').toLowerCase().includes(term) ||
        (f.student?.studentNumber || '').toLowerCase().includes(term) ||
        (f.referenceNumber || '').toLowerCase().includes(term)
      );
    }
    if (selectedStudent !== "All") filtered = filtered.filter(f => f.studentId == selectedStudent);
    if (selectedTerm !== "All") filtered = filtered.filter(f => f.term === selectedTerm);
    if (selectedStatus !== "All") {
      filtered = filtered.filter(f => {
        const paid = Number(f.amountPaid || 0);
        const total = Number(f.totalFee || 0);
        const balance = total - paid;
        if (selectedStatus === "Paid") return balance <= 0 && paid > 0;
        if (selectedStatus === "Partial") return balance > 0 && paid > 0;
        if (selectedStatus === "Pending") return paid === 0 && total > 0;
        return true;
      });
    }
    setFilteredFees(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedStudent, selectedTerm, selectedStatus, fees]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFees.length / itemsPerPage);

  const uniqueTerms = useMemo(() => {
    const terms = new Set();
    fees.forEach(f => { if (f.term) terms.add(f.term); });
    return ["All", ...Array.from(terms)];
  }, [fees]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const getStudentById = (id) => students.find(s => s.id == id) || null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.studentId) { toast.error("Select a student"); return; }
    if (!formData.totalFee || Number(formData.totalFee) <= 0) { toast.error("Total fee required"); return; }
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        studentId: parseInt(formData.studentId), totalFee: Number(formData.totalFee),
        amountPaid: Number(formData.amountPaid || 0), term: formData.term,
        academicYear: formData.academicYear, paymentMethod: formData.paymentMethod || null,
        referenceNumber: formData.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        paymentDate: formData.paymentDate || new Date().toISOString().split('T')[0]
      };
      await api.post("/fees", payload, config);
      toast.success("Fee recorded!");
      setShowAddModal(false);
      setFormData({ studentId: "", totalFee: "", amountPaid: "", term: "", academicYear: new Date().getFullYear().toString(), paymentMethod: "", referenceNumber: "", paymentDate: new Date().toISOString().split('T')[0], sendSms: false });
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || "Failed"); }
    finally { setIsSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        studentId: parseInt(formData.studentId), totalFee: Number(formData.totalFee),
        amountPaid: Number(formData.amountPaid || 0), term: formData.term,
        academicYear: formData.academicYear, paymentMethod: formData.paymentMethod || null,
        referenceNumber: formData.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        paymentDate: formData.paymentDate || new Date().toISOString().split('T')[0]
      };
      await api.put(`/fees/${selectedFee.id}`, payload, config);
      toast.success("Updated!");
      setShowEditModal(false); setSelectedFee(null);
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || "Failed"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!feeToDelete) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.delete(`/fees/${feeToDelete.id}`, config);
      toast.success("Deleted!");
      setShowDeleteModal(false); setFeeToDelete(null);
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || "Failed"); }
    finally { setIsDeleting(false); }
  };

  const openEditModal = (fee) => {
    setSelectedFee(fee);
    setFormData({
      studentId: fee.studentId || fee.student?.id || "", totalFee: fee.totalFee || "",
      amountPaid: fee.amountPaid || "", term: fee.term || "",
      academicYear: fee.academicYear || new Date().getFullYear().toString(),
      paymentMethod: fee.paymentMethod || "", referenceNumber: fee.referenceNumber || "",
      paymentDate: fee.paymentDate ? fee.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      sendSms: false
    });
    setShowEditModal(true);
  };

  const openReceiptModal = (fee) => { setSelectedFee(fee); setShowReceiptModal(true); };
  const getStudentName = useCallback((sid) => { const s = students.find(st => st.id == sid); return s?.fullName || "Unknown"; }, [students]);
  const getStudentClass = useCallback((sid) => { const s = students.find(st => st.id == sid); return s?.class?.className || "N/A"; }, [students]);

  const formatUGX = (amount) => {
    if (!amount || isNaN(amount)) return "UGX 0";
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatCompactCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0";
    const abs = Math.abs(amount);
    if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
    return amount.toLocaleString();
  };

  const formatDate = (d) => { if (!d) return "N/A"; try { return new Date(d).toLocaleDateString("en-UG", { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return "N/A"; } };

  const getStatus = (fee) => {
    const paid = Number(fee.amountPaid || 0), total = Number(fee.totalFee || 0), balance = total - paid;
    if (balance <= 0 && paid > 0) return { label: "Paid", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> };
    if (balance > 0 && paid > 0) return { label: "Partial", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3" /> };
    return { label: "Pending", color: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3 h-3" /> };
  };

  const exportCSV = () => {
    if (!filteredFees.length) { toast.error("No data"); return; }
    const csv = "Student,Student ID,Class,Term,Year,Total Fee,Amount Paid,Balance,Status,Method,Reference,Date\n" +
      filteredFees.map(f => {
        const paid = Number(f.amountPaid || 0), total = Number(f.totalFee || 0), balance = total - paid;
        return `"${getStudentName(f.studentId)}","${f.student?.studentNumber || ''}","${getStudentClass(f.studentId)}","${f.term || ''}","${f.academicYear || ''}",${total},${paid},${balance},"${balance <= 0 && paid > 0 ? 'Paid' : balance > 0 && paid > 0 ? 'Partial' : 'Pending'}","${f.paymentMethod || ''}","${f.referenceNumber || ''}","${formatDate(f.createdAt)}"`;
      }).join('\n');
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `fees_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success("Exported");
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" /><p className="mt-4 text-gray-500">Loading fees...</p></div>;
  if (error) return <div className="flex items-center justify-center h-96"><div className="text-center max-w-md"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h3 className="text-xl font-bold text-gray-800">Error</h3><p className="text-gray-500 mb-4">{error}</p><button onClick={fetchData} className="px-6 py-2 bg-purple-600 text-white rounded-lg"><RefreshCw className="w-4 h-4 inline mr-1" />Retry</button></div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="w-7 h-7 text-purple-600" />Fees Management</h1>
          <p className="text-sm text-gray-500 mt-1">{fees.length} records • {stats.totalStudents} students • {stats.studentsWithFees} with fees • {stats.studentsWithoutFees} without</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-medium"><Download className="w-4 h-4" />Export</button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"><Plus className="w-4 h-4" />Record Payment</button>
        </div>
      </div>

      {/* STATS – FIXED LOGIC */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Demanded</p>
          <p className="text-2xl font-bold text-blue-600" title={formatUGX(stats.totalDemanded)}>{formatCompactCurrency(stats.totalDemanded)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Sum of all fee requirements</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-600" title={formatUGX(stats.totalCollected)}>{formatCompactCurrency(stats.totalCollected)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Actual payments received</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Still Owing (Debt)</p>
          <p className={`text-2xl font-bold ${stats.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`} title={formatUGX(stats.outstanding)}>{formatCompactCurrency(stats.outstanding)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Demanded - Collected</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Collection Rate</p>
          <p className={`text-2xl font-bold ${stats.collectionRate >= 70 ? 'text-emerald-600' : stats.collectionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{stats.collectionRate}%</p>
          <p className="text-[10px] text-gray-400 mt-1">Collected ÷ Demanded</p>
        </div>
      </div>

      {/* STUDENT STATUS BREAKDOWN */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-200 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-xl font-bold text-gray-800">{stats.totalStudents}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200 text-center">
          <p className="text-xs text-green-600">Fully Paid</p>
          <p className="text-xl font-bold text-green-700">{stats.paidCount}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 text-center">
          <p className="text-xs text-yellow-600">Partial</p>
          <p className="text-xl font-bold text-yellow-700">{stats.partialCount}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-center">
          <p className="text-xs text-red-600">Not Paid</p>
          <p className="text-xl font-bold text-red-700">{stats.pendingCount}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
          <p className="text-xs text-gray-500">No Fee Record</p>
          <p className="text-xl font-bold text-gray-600">{stats.studentsWithoutFees}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[150px]">
            <option value="All">All Students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </select>
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[130px]">
            {uniqueTerms.map(t => <option key={t} value={t}>{t === "All" ? "All Terms" : t}</option>)}
          </select>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[130px]">
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
          <button onClick={fetchData} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
        </div>
      </div>

      {/* TABLE */}
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
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-500"><DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No fee records found</p></td></tr>
              ) : (
                currentItems.map(fee => {
                  const paid = Number(fee.amountPaid || 0), total = Number(fee.totalFee || 0), balance = total - paid;
                  const status = getStatus(fee);
                  return (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">{getStudentName(fee.studentId).charAt(0)}</div><div><p className="font-medium text-gray-800 text-sm">{getStudentName(fee.studentId)}</p><p className="text-xs text-gray-400">{fee.student?.studentNumber || 'N/A'}</p></div></div></td>
                      <td className="p-4"><span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{getStudentClass(fee.studentId)}</span></td>
                      <td className="p-4"><p className="text-sm text-gray-700">{fee.term || 'N/A'}</p><p className="text-xs text-gray-400">{fee.academicYear || 'N/A'}</p></td>
                      <td className="p-4 text-right"><p className="text-sm font-medium text-blue-600">{formatUGX(total)}</p></td>
                      <td className="p-4 text-right"><p className="text-sm font-medium text-emerald-600">{formatUGX(paid)}</p></td>
                      <td className="p-4 text-right"><p className={`text-sm font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatUGX(balance)}</p></td>
                      <td className="p-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.icon}{status.label}</span></td>
                      <td className="p-4"><div className="flex items-center justify-center gap-2">
                        <button onClick={() => openReceiptModal(fee)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Receipt className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(fee)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setFeeToDelete(fee); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredFees.length > itemsPerPage && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">{indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredFees.length)} of {filteredFees.length}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) { if (currentPage > 3) p = currentPage - 3 + i; if (p > totalPages) return null; }
                return <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 border rounded-lg text-sm ${currentPage === p ? 'bg-purple-600 text-white border-purple-600' : ''}`}>{p}</button>;
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b"><h3 className="text-xl font-bold">Record Fee Payment</h3><button onClick={() => setShowAddModal(false)}><X className="w-6 h-6 text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Student *</label>
                <select name="studentId" value={formData.studentId} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.studentNumber})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Total Fee *</label><input type="number" name="totalFee" value={formData.totalFee} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" required min="0" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid</label><input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" min="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Term *</label><select name="term" value={formData.term} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" required><option value="">Select</option><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Year *</label><input type="text" name="academicYear" value={formData.academicYear} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label><select name="paymentMethod" value={formData.paymentMethod} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg"><option value="">Select</option><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Cheque</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Reference</label><input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label><input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50">{isSaving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <Save className="w-4 h-4 inline mr-1" />}{isSaving ? 'Saving...' : 'Record Payment'}</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b"><h3 className="text-xl font-bold">Edit Fee Record</h3><button onClick={() => setShowEditModal(false)}><X className="w-6 h-6 text-gray-400" /></button></div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Student *</label><select name="studentId" value={formData.studentId} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" required>{students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Total Fee *</label><input type="number" name="totalFee" value={formData.totalFee} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" required min="0" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid</label><input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" min="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Term *</label><select name="term" value={formData.term} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" required><option value="">Select</option><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Year *</label><input type="text" name="academicYear" value={formData.academicYear} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label><select name="paymentMethod" value={formData.paymentMethod} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg"><option value="">Select</option><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Cheque</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Reference</label><input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label><input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50">{isSaving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <Save className="w-4 h-4 inline mr-1" />}{isSaving ? 'Updating...' : 'Update'}</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && feeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div>
            <h3 className="text-xl font-bold text-gray-800">Delete Fee Record</h3>
            <p className="text-gray-500 text-sm mb-4">Delete fee for <strong>{getStudentName(feeToDelete.studentId)}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceiptModal && selectedFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between"><div><h3 className="font-bold">Receipt</h3></div><button onClick={() => setShowReceiptModal(false)}><X className="w-6 h-6 text-gray-400" /></button></div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b pb-4"><h2 className="text-xl font-bold">ACADEMIC ERP</h2><p className="text-xs text-gray-500">Official Receipt</p></div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Ref:</span><span className="font-mono font-semibold">{selectedFee.referenceNumber || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date:</span><span>{formatDate(selectedFee.createdAt)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Student:</span><span className="font-medium">{getStudentName(selectedFee.studentId)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Class:</span><span>{getStudentClass(selectedFee.studentId)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Term:</span><span>{selectedFee.term} ({selectedFee.academicYear})</span></div>
              </div>
              <div className="border-t border-b py-3 space-y-1">
                <div className="flex justify-between"><span>Total Fee:</span><span className="font-semibold">{formatUGX(Number(selectedFee.totalFee))}</span></div>
                <div className="flex justify-between text-emerald-600 font-semibold"><span>Paid:</span><span>-{formatUGX(Number(selectedFee.amountPaid))}</span></div>
              </div>
              <div className="flex justify-between items-center"><span className="font-semibold">Balance:</span><span className={`text-xl font-bold ${(Number(selectedFee.totalFee) - Number(selectedFee.amountPaid)) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatUGX(Number(selectedFee.totalFee) - Number(selectedFee.amountPaid))}</span></div>
            </div>
            <div className="border-t p-5 bg-gray-50 flex gap-3">
              <button onClick={() => window.print()} className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg font-medium"><Printer className="w-4 h-4 inline mr-1" />Print</button>
              <button onClick={() => setShowReceiptModal(false)} className="flex-1 border bg-white py-2.5 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesManagement;