import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  DollarSign,
  Receipt,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  ListChecks,
  ClipboardList,
  PercentCircle,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

const StudentFees = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const navigate = useNavigate();

  // ---------- STATE ----------
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [filteredFees, setFilteredFees] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [filteredRequirements, setFilteredRequirements] = useState([]);

  // Fee Filters
  const [feeSearch, setFeeSearch] = useState("");
  const [feeTerm, setFeeTerm] = useState("All");
  const [feeYear, setFeeYear] = useState("All");
  const [feeStatus, setFeeStatus] = useState("All");
  const [feeDateFrom, setFeeDateFrom] = useState("");
  const [feeDateTo, setFeeDateTo] = useState("");

  // Requirement Filters
  const [reqSearch, setReqSearch] = useState("");
  const [reqStatus, setReqStatus] = useState("All");
  const [reqCategory, setReqCategory] = useState("All");

  // Pagination
  const [feePage, setFeePage] = useState(1);
  const [reqPage, setReqPage] = useState(1);
  const itemsPerPage = 5;

  // ---------- FETCH ----------
  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        toast.error("No student selected");
        navigate("/secretary/students");
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("You are not logged in");
          navigate("/login");
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [studentRes, feesRes, reqRes] = await Promise.all([
          api.get(`/students/${studentId}`, config),
          api.get(`/fees/student/${studentId}`, config),
          api.get(`/requirements/student/${studentId}`, config),
        ]);

        const studentData = studentRes.data?.data || studentRes.data || {};
        const feesData = feesRes.data?.data || feesRes.data || [];
        const reqData = reqRes.data?.data || reqRes.data || [];

        setStudent(studentData);
        setFees(feesData);
        setFilteredFees(feesData);
        setRequirements(reqData);
        setFilteredRequirements(reqData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, navigate]);

  // ---------- FEE FILTERS ----------
  useEffect(() => {
    let filtered = [...fees];

    if (feeSearch.trim()) {
      const term = feeSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (f) =>
          f.term?.toLowerCase().includes(term) ||
          f.academicYear?.toLowerCase().includes(term) ||
          f.referenceNumber?.toLowerCase().includes(term) ||
          f.paymentMethod?.toLowerCase().includes(term)
      );
    }

    if (feeTerm !== "All") filtered = filtered.filter((f) => f.term === feeTerm);
    if (feeYear !== "All") filtered = filtered.filter((f) => f.academicYear === feeYear);

    if (feeStatus !== "All") {
      filtered = filtered.filter((f) => {
        const balance = (f.totalFee || 0) - (f.amountPaid || 0);
        if (feeStatus === "paid") return balance === 0 && f.amountPaid > 0;
        if (feeStatus === "partial") return balance > 0 && f.amountPaid > 0;
        if (feeStatus === "unpaid") return f.amountPaid === 0 && f.totalFee > 0;
        return true;
      });
    }

    if (feeDateFrom) {
      const from = new Date(feeDateFrom);
      filtered = filtered.filter((f) => f.paymentDate && new Date(f.paymentDate) >= from);
    }
    if (feeDateTo) {
      const to = new Date(feeDateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((f) => f.paymentDate && new Date(f.paymentDate) <= to);
    }

    setFilteredFees(filtered);
    setFeePage(1);
  }, [fees, feeSearch, feeTerm, feeYear, feeStatus, feeDateFrom, feeDateTo]);

  // ---------- REQUIREMENT FILTERS ----------
  useEffect(() => {
    let filtered = [...requirements];

    if (reqSearch.trim()) {
      const term = reqSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.requirement?.requirementName?.toLowerCase().includes(term) ||
          r.requirement?.category?.toLowerCase().includes(term)
      );
    }

    if (reqStatus !== "All") {
      filtered = filtered.filter((r) => r.status === reqStatus);
    }

    if (reqCategory !== "All") {
      filtered = filtered.filter((r) => r.requirement?.category === reqCategory);
    }

    setFilteredRequirements(filtered);
    setReqPage(1);
  }, [requirements, reqSearch, reqStatus, reqCategory]);

  // ---------- HELPERS ----------
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `UGX ${Number(amount || 0).toLocaleString()}`;
  };

  const getStatusBadge = (fee) => {
    const balance = (fee.totalFee || 0) - (fee.amountPaid || 0);
    if (balance === 0 && fee.amountPaid > 0)
      return { label: "Paid", color: "bg-green-100 text-green-700" };
    if (balance > 0 && fee.amountPaid > 0)
      return { label: "Partial", color: "bg-amber-100 text-amber-700" };
    if (fee.amountPaid === 0 && fee.totalFee > 0)
      return { label: "Unpaid", color: "bg-red-100 text-red-700" };
    return { label: "N/A", color: "bg-gray-100 text-gray-500" };
  };

  const getReqStatusBadge = (status) => {
    const map = {
      Completed: { color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
      Partial: { color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" /> },
      Pending: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
    };
    return map[status] || map.Pending;
  };

  // ---------- PAGINATION ----------
  const paginate = (data, page, setPage) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return { items: data.slice(start, end), totalPages };
  };

  const feePagination = paginate(filteredFees, feePage, setFeePage);
  const reqPagination = paginate(filteredRequirements, reqPage, setReqPage);

  // ---------- CLEAR FILTERS ----------
  const clearFeeFilters = () => {
    setFeeSearch("");
    setFeeTerm("All");
    setFeeYear("All");
    setFeeStatus("All");
    setFeeDateFrom("");
    setFeeDateTo("");
  };

  const clearReqFilters = () => {
    setReqSearch("");
    setReqStatus("All");
    setReqCategory("All");
  };

  // ---------- ACTIONS ----------
  // Navigate to Student Edit page (the one you already built)
  const goToEditStudent = () => {
    navigate(`/secretary/studentedit/${studentId}`);
  };

  // Add payment - navigate to your add fee page (or open modal)
  const handleAddPayment = () => {
    // Navigate to add fee page or open modal
    toast.success("Redirect to add fee payment for " + student?.fullName);
    // navigate(`/secretary/fees/add?studentId=${studentId}`);
  };

  // Delete a fee record
  const handleDeleteFee = async (fee) => {
    if (!window.confirm(`Delete fee record ${fee.referenceNumber}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/fees/${fee.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Fee record deleted");
      // Refresh fees list
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get(`/fees/student/${studentId}`, config);
      const feesData = res.data?.data || res.data || [];
      setFees(feesData);
      setFilteredFees(feesData);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete fee");
    }
  };

  // ---------- LOADING ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading student data...</p>
        </div>
      </div>
    );
  }

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/secretary/students")}
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Receipt className="w-7 h-7 text-purple-600" />
                Student Profile
              </h1>
              {student && (
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-gray-700 font-medium">{student.fullName}</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{student.studentNumber}</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                    {student.class?.className || "N/A"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={goToEditStudent}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
          >
            <Edit className="w-4 h-4" /> Edit Student
          </button>
        </div>

        {/* Summary Cards - NOW BASED ON FILTERED FEES */}
        <FeeSummaryCards fees={filteredFees} />

        {/* ============================================================
            FEES SECTION
            ============================================================ */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">Fee Records</h2>
              <span className="text-sm text-gray-400 ml-2">({filteredFees.length} records)</span>
            </div>
            <button
              onClick={handleAddPayment}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Payment
            </button>
          </div>

          {/* Fee Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[180px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by term, year, ref, or method..."
                  value={feeSearch}
                  onChange={(e) => setFeeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
              <select
                value={feeTerm}
                onChange={(e) => setFeeTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
              >
                <option value="All">All Terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
              <select
                value={feeYear}
                onChange={(e) => setFeeYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
              >
                <option value="All">All Years</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <select
                value={feeStatus}
                onChange={(e) => setFeeStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
              >
                <option value="All">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={feeDateFrom}
                  onChange={(e) => setFeeDateFrom(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  value={feeDateTo}
                  onChange={(e) => setFeeDateTo(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={clearFeeFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Fee Table - Premium Design */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-indigo-600">
                    <th className="text-left p-4 text-xs font-semibold text-white uppercase tracking-wider">Term</th>
                    <th className="text-left p-4 text-xs font-semibold text-white uppercase tracking-wider">Year</th>
                    <th className="text-right p-4 text-xs font-semibold text-white uppercase tracking-wider">Total</th>
                    <th className="text-right p-4 text-xs font-semibold text-white uppercase tracking-wider">Paid</th>
                    <th className="text-right p-4 text-xs font-semibold text-white uppercase tracking-wider">Balance</th>
                    <th className="text-left p-4 text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-white uppercase tracking-wider">Method</th>
                    <th className="text-left p-4 text-xs font-semibold text-white uppercase tracking-wider">Date</th>
                    <th className="text-left p-4 text-xs font-semibold text-white uppercase tracking-wider">Ref</th>
                    <th className="text-center p-4 text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feePagination.items.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-12 text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No fee records match filters</p>
                      </td>
                    </tr>
                  ) : (
                    feePagination.items.map((fee, index) => {
                      const statusBadge = getStatusBadge(fee);
                      const balance = (fee.totalFee || 0) - (fee.amountPaid || 0);
                      const progress = fee.totalFee > 0 ? ((fee.amountPaid || 0) / fee.totalFee) * 100 : 0;

                      return (
                        <tr
                          key={fee.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="p-4 text-sm font-semibold text-gray-800">{fee.term || "N/A"}</td>
                          <td className="p-4 text-sm text-gray-600">{fee.academicYear || "N/A"}</td>
                          <td className="p-4 text-sm text-gray-700 text-right font-mono">
                            {formatCurrency(fee.totalFee)}
                          </td>
                          <td className="p-4 text-sm text-gray-700 text-right font-mono">
                            {formatCurrency(fee.amountPaid)}
                          </td>
                          <td className="p-4 text-sm font-mono text-right">
                            <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
                              {formatCurrency(balance)}
                            </span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  progress >= 100 ? "bg-green-500" : progress > 50 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{fee.paymentMethod || "N/A"}</td>
                          <td className="p-4 text-sm text-gray-600">{formatDate(fee.paymentDate)}</td>
                          <td className="p-4 text-sm font-mono text-gray-400">
                            {fee.referenceNumber || "—"}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => goToEditStudent()}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded transition"
                                title="Edit Student"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFee(fee)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete Fee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Fee Pagination */}
            {filteredFees.length > itemsPerPage && (
              <PaginationBar
                currentPage={feePage}
                totalPages={feePagination.totalPages}
                totalItems={filteredFees.length}
                setPage={setFeePage}
                start={(feePage - 1) * itemsPerPage + 1}
                end={Math.min(feePage * itemsPerPage, filteredFees.length)}
              />
            )}
          </div>
        </div>

        {/* ============================================================
            REQUIREMENTS SECTION
            ============================================================ */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">Requirements</h2>
            <span className="text-sm text-gray-400 ml-2">({filteredRequirements.length} items)</span>
          </div>

          {/* Requirement Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[180px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requirements..."
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
              <select
                value={reqStatus}
                onChange={(e) => setReqStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </select>
              <select
                value={reqCategory}
                onChange={(e) => setReqCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="All">All Categories</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Academic">Academic</option>
                <option value="Boarding">Boarding</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Personal">Personal</option>
                <option value="Sports">Sports</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Library">Library</option>
                <option value="Others">Others</option>
              </select>
              <button
                onClick={clearReqFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Requirements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reqPagination.items.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No requirements found</p>
              </div>
            ) : (
              reqPagination.items.map((req) => {
                const status = getReqStatusBadge(req.status);
                const progress = req.requiredQuantity > 0
                  ? Math.round((req.quantityReceived / req.requiredQuantity) * 100)
                  : 0;

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {req.requirement?.requirementName || "Requirement"}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {req.requirement?.category || "General"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.icon}
                        {req.status || "Pending"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Required: {req.requiredQuantity}</span>
                        <span>Received: {req.quantityReceived}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Balance: {req.balance}</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            progress >= 100
                              ? "bg-green-500"
                              : progress >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      {req.condition && (
                        <div className="text-xs text-gray-400 mt-1">
                          Condition: {req.condition}
                        </div>
                      )}
                      {req.remarks && (
                        <div className="text-xs text-gray-400 mt-1">
                          {req.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Requirement Pagination */}
          {filteredRequirements.length > itemsPerPage && (
            <div className="mt-4">
              <PaginationBar
                currentPage={reqPage}
                totalPages={reqPagination.totalPages}
                totalItems={filteredRequirements.length}
                setPage={setReqPage}
                start={(reqPage - 1) * itemsPerPage + 1}
                end={Math.min(reqPage * itemsPerPage, filteredRequirements.length)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
//  SUB-COMPONENTS
// ============================================================

const FeeSummaryCards = ({ fees }) => {
  let totalDemanded = 0,
    totalPaid = 0,
    paidCount = 0,
    pendingCount = 0,
    partialCount = 0;

  fees.forEach((fee) => {
    const demanded = fee.totalFee || 0;
    const paid = fee.amountPaid || 0;
    totalDemanded += demanded;
    totalPaid += paid;
    if (demanded > 0 && paid === 0) pendingCount++;
    else if (paid > 0 && paid < demanded) partialCount++;
    else if (paid > 0 && paid >= demanded) paidCount++;
  });

  const balance = totalDemanded - totalPaid;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <SummaryCard
        title="Total Demanded"
        value={`UGX ${totalDemanded.toLocaleString()}`}
        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        bg="bg-blue-50 border-blue-200"
        text="text-blue-700"
      />
      <SummaryCard
        title="Total Paid"
        value={`UGX ${totalPaid.toLocaleString()}`}
        icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        bg="bg-green-50 border-green-200"
        text="text-green-700"
      />
      <SummaryCard
        title="Balance"
        value={`UGX ${balance.toLocaleString()}`}
        icon={balance > 0 ? <AlertCircle className="w-5 h-5 text-orange-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
        bg={balance > 0 ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"}
        text={balance > 0 ? "text-orange-700" : "text-emerald-700"}
      />
      <PaymentStatusCard paid={paidCount} partial={partialCount} unpaid={pendingCount} />
    </div>
  );
};

const SummaryCard = ({ title, value, icon, bg, text }) => (
  <div className={`p-5 rounded-xl border ${bg} shadow-sm transition hover:shadow-md`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className={`text-xl font-bold mt-1 ${text}`}>{value}</p>
      </div>
      <div className="p-2 bg-white rounded-full shadow-sm">{icon}</div>
    </div>
  </div>
);

const PaymentStatusCard = ({ paid, partial, unpaid }) => (
  <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
      <BarChart3 className="w-4 h-4 text-purple-500" />
      Payment Status
    </p>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" /> Paid
        </span>
        <span className="font-semibold text-green-600">{paid}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-amber-500" /> Partial
        </span>
        <span className="font-semibold text-amber-600">{partial}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-gray-600">
          <XCircle className="w-4 h-4 text-red-500" /> Unpaid
        </span>
        <span className="font-semibold text-red-600">{unpaid}</span>
      </div>
    </div>
  </div>
);

const PaginationBar = ({ currentPage, totalPages, totalItems, setPage, start, end }) => (
  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
    <p className="text-sm text-gray-500">
      Showing {start} to {end} of {totalItems} records
    </p>
    <div className="flex gap-1">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        let pageNum;
        if (totalPages <= 5) pageNum = i + 1;
        else if (currentPage <= 3) pageNum = i + 1;
        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
        else pageNum = currentPage - 2 + i;
        return (
          <button
            key={i}
            onClick={() => setPage(pageNum)}
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
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default StudentFees;