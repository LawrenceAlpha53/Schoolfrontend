import api from "../api/axios"

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  CreditCard, 
  Download, 
  Search, 
  X,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  MessageSquare
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const ManageFeesPRO = () => {
  // --- Core State Engine ---
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // NEW: SMS toggle
  const [sendSms, setSendSms] = useState(false);

  const [form, setForm] = useState({
    amountPaid: "",
    totalFee: "",
    term: "",
    academicYear: new Date().getFullYear().toString(),
    paymentMethod: "",
    referenceNumber: ""
  });

  // --- Initial Data Loader ---
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        setLoading(true);
        const [studentsRes, feesRes] = await Promise.all([
          api.get("/students"),
          api.get("/fees")
        ]);
        
        // Ensure students is an array
        let studentsData = studentsRes.data || [];
        if (studentsData.data && Array.isArray(studentsData.data)) {
          studentsData = studentsData.data;
        }
        if (!Array.isArray(studentsData)) {
          studentsData = [];
        }
        setStudents(studentsData);
        
        let feesData = feesRes.data || [];
        if (feesData.data && Array.isArray(feesData.data)) {
          feesData = feesData.data;
        }
        if (feesData.fees && Array.isArray(feesData.fees)) {
          feesData = feesData.fees;
        }
        if (!Array.isArray(feesData)) {
          feesData = [];
        }
        
        setFees(feesData);
      } catch (err) {
        console.error("ERP Load Error: ", err);
        toast.error("⚠️ Failed to synchronize financial ledger data.");
        setFees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSystemData();
  }, []);

  // --- Helper Formatting Utilities for UGX ---
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "UGX 0";
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "UGX 0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount).replace("UGX", "UGX");
  };

  const formatCompactCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "UGX 0";
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "UGX 0";
    
    if (numAmount >= 1000000) {
      return `UGX ${(numAmount / 1000000).toFixed(1)}M`;
    }
    if (numAmount >= 1000) {
      return `UGX ${(numAmount / 1000).toFixed(0)}K`;
    }
    return `UGX ${numAmount.toLocaleString()}`;
  };

  // --- Monthly Chart Data Processing for Recharts ---
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = [];

    if (!fees || fees.length === 0) {
      return months.map(month => ({ month, demanded: 0, paid: 0 }));
    }

    // Initialize data for each month
    months.forEach(month => {
      chartData.push({ month, demanded: 0, paid: 0 });
    });

    fees.forEach((fee) => {
      const createdAt = fee.createdAt || fee.created_at;
      if (createdAt) {
        const date = new Date(createdAt);
        const monthIndex = date.getMonth();
        const year = date.getFullYear().toString();
        
        // Only include data for selected year
        if (year === selectedYear) {
          const totalFee = parseFloat(fee.totalFee || fee.total_fee || fee.fee_amount || fee.amount || 0);
          const amountPaid = parseFloat(fee.amountPaid || fee.amount_paid || fee.paid || 0);
          
          if (!isNaN(totalFee) && totalFee > 0) {
            chartData[monthIndex].demanded += totalFee;
          }
          if (!isNaN(amountPaid) && amountPaid > 0) {
            chartData[monthIndex].paid += amountPaid;
          }
        }
      }
    });

    return chartData;
  }, [fees, selectedYear]);

  // Custom tooltip for recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="mb-1">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get unique years from fees for year filter
  const availableYears = useMemo(() => {
    const years = new Set();
    if (fees && fees.length > 0) {
      fees.forEach((fee) => {
        const createdAt = fee.createdAt || fee.created_at;
        if (createdAt) {
          const year = new Date(createdAt).getFullYear().toString();
          years.add(year);
        }
        const academicYear = fee.academicYear || fee.academic_year;
        if (academicYear) {
          years.add(academicYear.toString());
        }
      });
    }
    // Add current year if no data
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
      years.add((new Date().getFullYear() - 1).toString());
    }
    return Array.from(years).sort().reverse();
  }, [fees]);

  // --- Student Search Engine ---
  const filteredStudents = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();
    if (!cleanSearch) return [];
    return (students || []).filter(
      (s) =>
        s.fullName?.toLowerCase().includes(cleanSearch) ||
        s.studentNumber?.toLowerCase().includes(cleanSearch)
    );
  }, [search, students]);

  // --- Contextual Selection Handler ---
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearch(student.fullName);
    
    const historicalRecord = fees.find((f) => f.studentId === student.id || f.student?.id === student.id);
    
    setForm((prev) => ({
      ...prev,
      totalFee: historicalRecord ? historicalRecord.totalFee.toString() : "1500000",
      amountPaid: ""
    }));
  };

  // --- Form Mutation Interceptor ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Advanced Intelligence/Stats Engine ---
  const metrics = useMemo(() => {
    let revenue = 0;
    let debt = 0;
    let completelyPaidCount = 0;
    let partialPaymentCount = 0;

    if (!fees || fees.length === 0) {
      return {
        revenue: 0,
        debt: 0,
        completelyPaidCount: 0,
        partialPaymentCount: 0,
        totalTransactions: 0
      };
    }

    fees.forEach((f) => {
      const paid = parseFloat(f.amountPaid || f.amount_paid || f.paid || 0);
      const target = parseFloat(f.totalFee || f.total_fee || f.fee_amount || f.amount || 0);
      const remainingBalance = target - paid;

      if (!isNaN(paid) && paid > 0) {
        revenue += paid;
      }
      
      if (!isNaN(remainingBalance) && remainingBalance > 0) {
        debt += remainingBalance;
        partialPaymentCount++;
      } else if (!isNaN(target) && target > 0 && remainingBalance <= 0) {
        completelyPaidCount++;
      }
    });

    return {
      revenue: isNaN(revenue) ? 0 : revenue,
      debt: isNaN(debt) ? 0 : debt,
      completelyPaidCount: completelyPaidCount || 0,
      partialPaymentCount: partialPaymentCount || 0,
      totalTransactions: fees.length || 0
    };
  }, [fees]);

  // --- History Filtering Engine ---
  const processedTimeline = useMemo(() => {
    if (!fees || fees.length === 0) return [];
    
    return fees.filter((f) => {
      const studentName = (f.student?.fullName || f.student_name || "").toLowerCase();
      const classLevel = (f.student?.class?.className || f.class_name || "").toLowerCase();
      const matchesSearch = studentName.includes(historySearch.toLowerCase()) || classLevel.includes(historySearch.toLowerCase());
      
      const paymentMethod = f.paymentMethod || f.payment_method || f.method || "";
      const matchesMethod = filterMethod === "All" || paymentMethod === filterMethod;
      
      const paid = parseFloat(f.amountPaid || f.amount_paid || f.paid || 0);
      const target = parseFloat(f.totalFee || f.total_fee || f.fee_amount || f.amount || 0);
      const remainingBalance = target - paid;
      const isDebt = remainingBalance > 0;
      const matchesStatus =
        filterStatus === "All" ||
        (filterStatus === "Paid" && !isDebt) ||
        (filterStatus === "Debt" && isDebt);

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [fees, historySearch, filterMethod, filterStatus]);

  // --- Transaction Ledger Poster (UPDATED with SMS) ---
  const handlePaymentSubmission = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error("Process aborted: Valid student node context must be active.");
      return;
    }
    if (!form.amountPaid || Number(form.amountPaid) <= 0) {
      toast.error("Validation error: Entry field [Amount Paid] must be greater than zero.");
      return;
    }

    try {
      setLoading(true);
      const submissionPayload = {
        studentId: selectedStudent.id,
        amountPaid: Number(form.amountPaid),
        totalFee: Number(form.totalFee),
        term: form.term,
        academicYear: form.academicYear,
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber || `REF-${Date.now().toString().slice(-6)}`
      };

      const response = await api.post("/fees", submissionPayload);
      
      const verifiedRecord = {
        ...response.data?.data,
        student: response.data?.data?.student || selectedStudent,
        createdAt: response.data?.data?.createdAt || new Date().toISOString(),
        amountPaid: Number(form.amountPaid),
        totalFee: Number(form.totalFee)
      };

      toast.success("Transaction committed successfully to database.");
      setFees((prevFees) => [verifiedRecord, ...(prevFees || [])]);
      
      // --- Send SMS if checkbox is ticked ---
      if (sendSms && selectedStudent.parentPhone) {
        try {
          const paidAmount = Number(form.amountPaid);
          const totalFee = Number(form.totalFee);
          const newBalance = totalFee - paidAmount;
          const smsMessage = `Dear Parent, ${formatCurrency(paidAmount)} has been received as fee payment for ${selectedStudent.fullName} (${selectedStudent.studentNumber}). New balance: ${formatCurrency(newBalance)}. Thank you.`;

          await api.post("/sms/send", {
            recipients: [selectedStudent.parentPhone],
            message: smsMessage,
            category: "payment_confirmation",
            priority: "normal",
            recipientType: "parents",
            recipientIds: [selectedStudent.id],
            isBulk: false,
          });

          toast.success("📱 SMS sent to parent successfully!");
        } catch (smsError) {
          console.error("SMS error:", smsError);
          toast.error("Payment recorded but SMS failed. Please check SMS settings.");
        }
      } else if (sendSms && !selectedStudent.parentPhone) {
        toast.warning("Parent phone number not available. SMS not sent.");
      }
      
      setForm({
        amountPaid: "",
        totalFee: "",
        term: "",
        academicYear: new Date().getFullYear().toString(),
        paymentMethod: "",
        referenceNumber: ""
      });
      setSelectedStudent(null);
      setSearch("");
      setSendSms(false); // Reset checkbox
    } catch (err) {
      console.error(err);
      toast.error("Critical System Rejection: Processing pipeline failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- Export Engine (CSV Utility) ---
  const exportToCSV = () => {
    if (processedTimeline.length === 0) {
      toast.error("Export Error: Current filtered ledger dataset is empty.");
      return;
    }
    const headers = ["Transaction Date,Student Name,Class,Term,Year,Method,Ref,Total Due,Paid,Balance\n"];
    const rows = processedTimeline.map((f) => {
      const paid = parseFloat(f.amountPaid || f.amount_paid || f.paid || 0);
      const target = parseFloat(f.totalFee || f.total_fee || f.fee_amount || f.amount || 0);
      const balance = target - paid;
      const studentName = f.student?.fullName || f.student_name || "";
      const className = f.student?.class?.className || f.class_name || "N/A";
      const term = f.term || "";
      const academicYear = f.academicYear || f.academic_year || "";
      const paymentMethod = f.paymentMethod || f.payment_method || f.method || "";
      const referenceNumber = f.referenceNumber || f.reference_number || "N/A";
      const createdAt = f.createdAt || f.created_at || new Date();
      
      return `"${new Date(createdAt).toLocaleDateString()}","${studentName}","${className}","${term}","${academicYear}","${paymentMethod}","${referenceNumber}",${target},${paid},${balance}\n`;
    });
    
    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `ERP_FINANCIAL_REPORT_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Statement exported successfully.");
  };

  // Calculate summary for chart
  const totalDemanded = monthlyChartData.reduce((sum, item) => sum + item.demanded, 0);
  const totalPaid = monthlyChartData.reduce((sum, item) => sum + item.paid, 0);
  const collectionRate = totalDemanded > 0 ? ((totalPaid / totalDemanded) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* ================= HEADER ================= */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                Finance Ledger
              </h1>
              <p className="text-gray-500 text-sm mt-1">Track student payments, monitor balances, and generate receipts</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200 self-start sm:self-center">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-green-700">System Active</span>
            </div>
          </div>
        </div>

        {/* ================= METRICS CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-lg md:text-xl font-bold text-green-600 mt-2 break-words">
              {formatCompactCurrency(metrics.revenue)}
            </p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Money Collected
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</p>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-lg md:text-xl font-bold text-red-600 mt-2 break-words">
              {formatCompactCurrency(metrics.debt)}
            </p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              Money Still Owed
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fully Paid</p>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-blue-600 mt-2">{metrics.completelyPaidCount}</p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Accounts Settled
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Plans</p>
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-yellow-600 mt-2">{metrics.partialPaymentCount}</p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
              With Balance Due
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transactions</p>
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-purple-600 mt-2">{metrics.totalTransactions}</p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Total Records
            </p>
          </div>
        </div>

        {/* ================= MONTHLY CHART SECTION using Recharts ================= */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Monthly Fee Tracking
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Comparison of demanded vs paid fees per month</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="p-5">
            {/* Chart Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600 font-medium">Total Demanded ({selectedYear})</p>
                <p className="text-lg font-bold text-blue-700">{formatCompactCurrency(totalDemanded)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600 font-medium">Total Collected ({selectedYear})</p>
                <p className="text-lg font-bold text-green-700">{formatCompactCurrency(totalPaid)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-600 font-medium">Collection Rate</p>
                <p className="text-lg font-bold text-purple-700">{collectionRate}%</p>
              </div>
            </div>
            
            {/* Chart using Recharts */}
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => formatCompactCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                    formatter={(value) => <span className="text-gray-700">{value}</span>}
                  />
                  <Bar 
                    dataKey="demanded" 
                    name="Total Fees Demanded (UGX)"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="paid" 
                    name="Total Fees Paid (UGX)"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Chart Legend Explanation */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Total Fees Demanded (What students owe)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Total Fees Paid (What has been collected)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TWO COLUMN LAYOUT FOR MAIN CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* LEFT COLUMN - Student Search */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Student Registry
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Search and select students</p>
              </div>
              <div className="p-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Search by name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                {search && filteredStudents.length === 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No students found
                  </div>
                )}

                {filteredStudents.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudent(s)}
                        className="p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200"
                      >
                        <p className="font-medium text-gray-900 text-sm">{s.fullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">ID: {s.studentNumber}</p>
                        <p className="text-xs text-gray-500">Class: {s.class?.className || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedStudent && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-medium text-green-700">✓ Currently Selected</p>
                    <p className="font-medium text-gray-900 text-sm mt-1">{selectedStudent.fullName}</p>
                    <button
                      onClick={() => { setSelectedStudent(null); setSearch(""); }}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear Selection
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Process Payment
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Record new financial transaction</p>
              </div>
              <div className="p-5">
                <form onSubmit={handlePaymentSubmission}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Fee (UGX)</label>
                      <input
                        name="totalFee"
                        type="number"
                        step="1000"
                        placeholder="0"
                        value={form.totalFee}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid (UGX)</label>
                      <input
                        name="amountPaid"
                        type="number"
                        step="1000"
                        placeholder="0"
                        value={form.amountPaid}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Term</label>
                      <select
                        name="term"
                        value={form.term}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        required
                      >
                        <option value="">Select term</option>
                        <option value="Term 1">Term 1 (Michaelmas)</option>
                        <option value="Term 2">Term 2 (Lent)</option>
                        <option value="Term 3">Term 3 (Trinity)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
                      <input
                        name="academicYear"
                        placeholder="e.g., 2024"
                        value={form.academicYear}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                      <select
                        name="paymentMethod"
                        value={form.paymentMethod}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        required
                      >
                        <option value="">Select method</option>
                        <option value="Cash">Cash</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference Number</label>
                      <input
                        name="referenceNumber"
                        placeholder="Optional - Auto generated"
                        value={form.referenceNumber}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* NEW: SMS Checkbox */}
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendSms"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="sendSms" className="text-sm font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      Send SMS notification to parent
                    </label>
                    {selectedStudent?.parentPhone && (
                      <span className="text-xs text-gray-400 ml-auto">
                        Parent: {selectedStudent.parentPhone}
                      </span>
                    )}
                    {selectedStudent && !selectedStudent.parentPhone && (
                      <span className="text-xs text-amber-500 ml-auto">
                        No parent phone recorded
                      </span>
                    )}
                  </div>

                  {form.totalFee && form.amountPaid && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Remaining Balance:</span>
                        <span className={`text-lg font-bold ${Number(form.totalFee) - Number(form.amountPaid) > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(Number(form.totalFee) - Number(form.amountPaid))}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !selectedStudent}
                    className="mt-5 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Submit Payment Record
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FILTERS BAR ================= */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Transaction History
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Filter and view records</p>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student or class..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="All">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
              <div className="flex gap-2">
                {["All", "Paid", "Debt"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filterStatus === status
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= TRANSACTIONS TABLE ================= */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">{processedTimeline.length} record(s) found</p>
          </div>
          
          {processedTimeline.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Paid</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {processedTimeline.map((f) => {
                    const paid = parseFloat(f.amountPaid || f.amount_paid || f.paid || 0);
                    const target = parseFloat(f.totalFee || f.total_fee || f.fee_amount || f.amount || 0);
                    const balance = target - paid;
                    
                    return (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(f.createdAt || f.created_at || new Date()).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {f.referenceNumber || f.reference_number || `TX-${String(f.id || '').slice(0,6)}`}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900 text-sm">{f.student?.fullName || f.student_name || "Unknown"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{f.student?.class?.className || f.class_name || "N/A"}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-gray-700">{f.term || "—"}</p>
                          <p className="text-xs text-gray-500">{f.academicYear || f.academic_year || "—"}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{f.paymentMethod || f.payment_method || f.method || "—"}</p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-semibold text-green-600 text-sm">{formatCompactCurrency(paid)}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${balance <= 0 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {balance <= 0 ? "Fully Paid" : formatCompactCurrency(balance)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => setReceipt(f)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mx-auto"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= RECEIPT MODAL ================= */}
        {receipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Payment Receipt</h3>
                  <p className="text-xs text-gray-500">Official transaction record</p>
                </div>
                <button onClick={() => setReceipt(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="text-center border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-bold text-gray-800">ACADEMIC ERP SYSTEM</h2>
                  <p className="text-xs text-gray-500 mt-1">Financial Transaction Receipt</p>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Reference:</span>
                    <span className="font-mono font-medium text-gray-800">{receipt.referenceNumber || receipt.reference_number || `SYS-${receipt.id}`}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t border-gray-100">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-800">{new Date(receipt.createdAt || receipt.created_at || new Date()).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t border-gray-100">
                    <span className="text-gray-500">Student:</span>
                    <span className="font-medium text-gray-800">{receipt.student?.fullName || receipt.student_name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t border-gray-100">
                    <span className="text-gray-500">Class:</span>
                    <span className="font-medium text-gray-800">{receipt.student?.class?.className || receipt.class_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t border-gray-100">
                    <span className="text-gray-500">Term / Year:</span>
                    <span className="font-medium text-gray-800">{receipt.term || "—"} ({receipt.academicYear || receipt.academic_year || "—"})</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t border-gray-100">
                    <span className="text-gray-500">Method:</span>
                    <span className="font-medium text-gray-800">{receipt.paymentMethod || receipt.payment_method || receipt.method || "—"}</span>
                  </div>
                </div>

                <div className="border-t border-b border-gray-200 py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Fee:</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(parseFloat(receipt.totalFee || receipt.total_fee || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid:</span>
                    <span className="font-bold">-{formatCurrency(parseFloat(receipt.amountPaid || receipt.amount_paid || 0))}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-semibold text-gray-600">Remaining Balance:</span>
                  <span className={`text-xl font-bold ${(parseFloat(receipt.totalFee || 0) - parseFloat(receipt.amountPaid || 0)) > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(parseFloat(receipt.totalFee || receipt.total_fee || 0) - parseFloat(receipt.amountPaid || receipt.amount_paid || 0))}
                  </span>
                </div>

                <div className="text-center pt-4 text-xs text-gray-400 border-t border-gray-200">
                  Thank you for your payment
                </div>
              </div>

              <div className="border-t border-gray-200 p-5 bg-gray-50 flex gap-3">
                <button onClick={() => window.print()} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button onClick={() => setReceipt(null)} className="flex-1 border border-gray-300 bg-white hover:bg-gray-50 py-2.5 rounded-lg font-medium transition-colors text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFeesPRO;