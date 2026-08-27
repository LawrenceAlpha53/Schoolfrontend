// SecretaryDashboardCards.jsx – FIXED: Square cards + Requirements in Student Modal
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Users, UserPlus, CreditCard, ClipboardList, TrendingUp,
  Wallet, School, Award, ArrowUpRight, ArrowDownRight,
  X, Search, GraduationCap, BookOpen, ChevronDown,
  CheckCircle, Clock, AlertCircle, XCircle, PieChart,
  Calendar, Filter, CalendarDays, UserCheck, User,
  Mail, Phone, BookMarked, Eye, Package
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const SecretaryDashboardCards = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [studentsCount, setStudentsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [teachersList, setTeachersList] = useState([]);
  const [feeCollection, setFeeCollection] = useState(0);
  const [totalFeesDemanded, setTotalFeesDemanded] = useState(0);
  const [newAdmissions, setNewAdmissions] = useState(0);
  const [lastMonthFees, setLastMonthFees] = useState(0);
  const [allStudents, setAllStudents] = useState([]);
  const [allFees, setAllFees] = useState([]);
  const [allRequirements, setAllRequirements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [availableClasses, setAvailableClasses] = useState([]);

  const [feeFilterMethod, setFeeFilterMethod] = useState("All");
  const [feeFilterTerm, setFeeFilterTerm] = useState("All");
  const [feeFilterYear, setFeeFilterYear] = useState("All");
  const [admissionSearch, setAdmissionSearch] = useState("");
  const [admissionClassFilter, setAdmissionClassFilter] = useState("All");
  const [admissionDateFilter, setAdmissionDateFilter] = useState("all");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherClass, setSelectedTeacherClass] = useState("All");

  const classRefs = useRef({});

  const standardClassList = [
    "All", "Senior One", "Senior Two", "Senior Three",
    "Senior Four", "Senior Five", "Senior Six"
  ];

  // ================= DATA FETCHING =================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // ===== STUDENTS =====
        const studentsRes = await api.get("/students");
        let students = [];
        if (studentsRes.data) {
          if (Array.isArray(studentsRes.data)) {
            students = studentsRes.data;
          } else if (studentsRes.data.data && Array.isArray(studentsRes.data.data)) {
            students = studentsRes.data.data;
          } else if (studentsRes.data.success && Array.isArray(studentsRes.data.data)) {
            students = studentsRes.data.data;
          } else {
            students = [];
          }
        }
        setAllStudents(students);
        setStudentsCount(students.length);
        setNewAdmissions(students.length);
        const uniqueClasses = [...new Set(students.map(s => s.class?.className || "No Class"))];
        setAvailableClasses(uniqueClasses);

        // ===== TEACHERS =====
        try {
          const teachersRes = await api.get("/teachers");
          let teachers = [];
          if (teachersRes.data) {
            if (Array.isArray(teachersRes.data)) {
              teachers = teachersRes.data;
            } else if (teachersRes.data.data && Array.isArray(teachersRes.data.data)) {
              teachers = teachersRes.data.data;
            } else if (teachersRes.data.success && Array.isArray(teachersRes.data.data)) {
              teachers = teachersRes.data.data;
            } else {
              teachers = [];
            }
          }
          setTeachersList(teachers);
          setTeachersCount(teachers.length);
        } catch (e) {
          setTeachersList([]);
          setTeachersCount(0);
        }

        // ===== FEES =====
        const feesRes = await api.get("/fees");
        let fees = [];
        if (feesRes.data) {
          if (Array.isArray(feesRes.data)) {
            fees = feesRes.data;
          } else if (feesRes.data.data && Array.isArray(feesRes.data.data)) {
            fees = feesRes.data.data;
          } else if (feesRes.data.success && Array.isArray(feesRes.data.data)) {
            fees = feesRes.data.data;
          } else {
            fees = [];
          }
        }
        setAllFees(fees);

        // ===== REQUIREMENTS =====
        try {
          const reqRes = await api.get("/requirements/student-requirements");
          let reqs = [];
          if (reqRes.data) {
            if (Array.isArray(reqRes.data)) {
              reqs = reqRes.data;
            } else if (reqRes.data.data && Array.isArray(reqRes.data.data)) {
              reqs = reqRes.data.data;
            } else if (reqRes.data.success && Array.isArray(reqRes.data.data)) {
              reqs = reqRes.data.data;
            } else {
              reqs = [];
            }
          }
          setAllRequirements(reqs);
        } catch (reqError) {
          setAllRequirements([]);
        }

        // ===== FEE CALCULATIONS =====
        let totalCollected = 0;
        let totalDemanded = 0;
        let lastMonthTotal = 0;
        const currentDate = new Date();
        const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        
        fees.forEach((fee) => {
          const paid = Number(fee.amountPaid || 0);
          const demanded = Number(fee.totalFee || 0);
          totalCollected += paid;
          totalDemanded += demanded;
          const feeDate = fee.createdAt || fee.paymentDate;
          if (feeDate) {
            const transactionDate = new Date(feeDate);
            if (transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd) {
              lastMonthTotal += paid;
            }
          }
        });
        setFeeCollection(totalCollected);
        setTotalFeesDemanded(totalDemanded);
        setLastMonthFees(lastMonthTotal);

      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // ================= HELPERS =================
  const formatUGX = (amount) => {
    return new Intl.NumberFormat("en-UG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactUGX = (amount) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-UG", {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const normalizeClassName = (className) => {
    if (!className) return "No Class";
    const normalized = className.toLowerCase().trim();
    if (normalized.includes("senior") && (normalized.includes("1") || normalized.includes("one"))) return "Senior One";
    if (normalized.includes("senior") && (normalized.includes("2") || normalized.includes("two"))) return "Senior Two";
    if (normalized.includes("senior") && (normalized.includes("3") || normalized.includes("three"))) return "Senior Three";
    if (normalized.includes("senior") && (normalized.includes("4") || normalized.includes("four"))) return "Senior Four";
    if (normalized.includes("senior") && (normalized.includes("5") || normalized.includes("five"))) return "Senior Five";
    if (normalized.includes("senior") && (normalized.includes("6") || normalized.includes("six"))) return "Senior Six";
    return className;
  };

  // ================= FEE & REQUIREMENT STATS =================
  const getStudentFeeInfo = (studentId) => {
    const studentFees = allFees.filter(f => f.studentId === studentId);
    let totalDemanded = 0, totalPaid = 0;
    studentFees.forEach(fee => {
      totalDemanded += Number(fee.totalFee || 0);
      totalPaid += Number(fee.amountPaid || 0);
    });
    const balance = totalDemanded - totalPaid;
    let status = "", statusColor = "", statusIcon = null, balanceDisplay = "";
    if (totalDemanded === 0) {
      status = "No Fee Record";
      statusColor = "bg-gray-100 text-gray-600";
      statusIcon = <AlertCircle className="w-3 h-3" />;
      balanceDisplay = "—";
    } else if (totalPaid === 0 && balance > 0) {
      status = "Not Paid";
      statusColor = "bg-red-100 text-red-700";
      statusIcon = <XCircle className="w-3 h-3" />;
      balanceDisplay = `UGX ${formatUGX(balance)}`;
    } else if (balance === 0 && totalPaid > 0) {
      status = "Fully Paid";
      statusColor = "bg-green-100 text-green-700";
      statusIcon = <CheckCircle className="w-3 h-3" />;
      balanceDisplay = "NIL";
    } else if (balance > 0 && totalPaid > 0) {
      status = "Partial Payment";
      statusColor = "bg-yellow-100 text-yellow-700";
      statusIcon = <Clock className="w-3 h-3" />;
      balanceDisplay = `UGX ${formatUGX(balance)}`;
    } else {
      status = "Unknown";
      statusColor = "bg-gray-100 text-gray-600";
      statusIcon = <AlertCircle className="w-3 h-3" />;
      balanceDisplay = "—";
    }
    return { totalDemanded, totalPaid, balance, status, statusColor, statusIcon, balanceDisplay };
  };

  const getStudentRequirementStats = (studentId) => {
    let reqs = Array.isArray(allRequirements) ? allRequirements : [];
    const studentReqs = reqs.filter(r => {
      const id = r.studentId || r.StudentId || r.student?.id || r.Student?.id;
      return id === studentId;
    });
    const assigned = studentReqs.length;
    const completed = studentReqs.filter(r => {
      const status = r.status || r.Status || '';
      return status === 'Completed';
    }).length;
    const partial = studentReqs.filter(r => {
      const status = r.status || r.Status || '';
      return status === 'Partial';
    }).length;
    const pending = studentReqs.filter(r => {
      const status = r.status || r.Status || '';
      return status === 'Pending';
    }).length;
    return { assigned, completed, partial, pending };
  };

  // ================= FILTERING =================
  const filteredStudents = (allStudents || []).filter(student => {
    const matchesSearch = student.fullName?.toLowerCase().includes((studentSearch || "").toLowerCase()) ||
                         student.studentNumber?.toLowerCase().includes((studentSearch || "").toLowerCase());
    let matchesClass = selectedClass === "All";
    if (!matchesClass && selectedClass !== "All") {
      const studentClass = normalizeClassName(student.class?.className || "No Class");
      matchesClass = studentClass === selectedClass;
    }
    return matchesSearch && matchesClass;
  });

  const studentsByClass = filteredStudents.reduce((acc, student) => {
    const className = normalizeClassName(student.class?.className || "No Class");
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

  const getClassStats = (students) => {
    let totalStudents = students.length;
    let totalDemanded = 0, totalPaid = 0;
    let fullyPaid = 0, partialPaid = 0, notPaid = 0, noRecord = 0;
    let totalReqAssigned = 0, totalReqCompleted = 0;

    students.forEach(student => {
      const feeInfo = getStudentFeeInfo(student.id);
      totalDemanded += feeInfo.totalDemanded;
      totalPaid += feeInfo.totalPaid;
      if (feeInfo.totalDemanded === 0) noRecord++;
      else if (feeInfo.totalPaid === 0) notPaid++;
      else if (feeInfo.balance === 0) fullyPaid++;
      else partialPaid++;

      const reqStats = getStudentRequirementStats(student.id);
      totalReqAssigned += reqStats.assigned;
      totalReqCompleted += reqStats.completed;
    });

    const collectionRate = totalDemanded > 0 ? ((totalPaid / totalDemanded) * 100).toFixed(1) : 0;
    const reqCompletionRate = totalReqAssigned > 0 ? ((totalReqCompleted / totalReqAssigned) * 100).toFixed(1) : 0;

    return { totalStudents, totalDemanded, totalPaid, fullyPaid, partialPaid, notPaid, noRecord, collectionRate, totalReqAssigned, totalReqCompleted, reqCompletionRate };
  };

  // ================= FEE FILTERS =================
  const getFilteredFees = () => {
    let filtered = [...(allFees || [])];
    if (feeFilterMethod !== "All") filtered = filtered.filter(f => (f.paymentMethod || "") === feeFilterMethod);
    if (feeFilterTerm !== "All") filtered = filtered.filter(f => (f.term || "") === feeFilterTerm);
    if (feeFilterYear !== "All") filtered = filtered.filter(f => (f.academicYear || "") === feeFilterYear);
    return filtered;
  };

  const filteredFees = getFilteredFees();
  const filteredTotalCollected = filteredFees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
  const filteredTotalDemanded = filteredFees.reduce((sum, f) => sum + Number(f.totalFee || 0), 0);
  const filteredCollectionRate = filteredTotalDemanded > 0 ? ((filteredTotalCollected / filteredTotalDemanded) * 100).toFixed(1) : 0;

  const feesByMethod = filteredFees.reduce((acc, fee) => {
    const method = fee.paymentMethod || "Other";
    if (!acc[method]) acc[method] = { count: 0, total: 0 };
    acc[method].count++;
    acc[method].total += Number(fee.amountPaid || 0);
    return acc;
  }, {});

  const feesByTerm = filteredFees.reduce((acc, fee) => {
    const term = fee.term || "Unknown";
    if (!acc[term]) acc[term] = { count: 0, total: 0 };
    acc[term].count++;
    acc[term].total += Number(fee.amountPaid || 0);
    return acc;
  }, {});

  // ================= ADMISSION FILTERS =================
  const getFilteredAdmissions = () => {
    let filtered = [...(allStudents || [])];
    if (admissionClassFilter !== "All") filtered = filtered.filter(s => normalizeClassName(s.class?.className || "No Class") === admissionClassFilter);
    if (admissionSearch) filtered = filtered.filter(s => s.fullName?.toLowerCase().includes((admissionSearch || "").toLowerCase()) || s.studentNumber?.toLowerCase().includes((admissionSearch || "").toLowerCase()) || (s.parentName && s.parentName.toLowerCase().includes((admissionSearch || "").toLowerCase())));
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    if (admissionDateFilter === "month") filtered = filtered.filter(s => { const d = new Date(s.createdAt); return d >= thirtyDaysAgo; });
    if (admissionDateFilter === "quarter") filtered = filtered.filter(s => { const d = new Date(s.createdAt); return d >= ninetyDaysAgo; });
    return filtered;
  };

  const filteredAdmissions = getFilteredAdmissions();
  const admissionsByClass = filteredAdmissions.reduce((acc, student) => {
    const className = normalizeClassName(student.class?.className || "No Class");
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

  const getAdmissionsByMonth = () => {
    const monthData = {};
    filteredAdmissions.forEach(student => {
      const createdAt = student.createdAt;
      if (createdAt) {
        const month = new Date(createdAt).toLocaleString('default', { month: 'short' });
        monthData[month] = (monthData[month] || 0) + 1;
      }
    });
    return monthData;
  };
  const admissionsByMonth = getAdmissionsByMonth();
  const maxCount = Math.max(...Object.values(admissionsByMonth), 1);

  // ================= TEACHER FILTERS =================
  const filteredTeachers = (teachersList || []).filter(teacher => {
    const matchesSearch = teacher.fullName?.toLowerCase().includes((teacherSearch || "").toLowerCase()) ||
                         teacher.email?.toLowerCase().includes((teacherSearch || "").toLowerCase()) ||
                         teacher.phoneNumber?.includes(teacherSearch || "");
    let matchesClass = selectedTeacherClass === "All";
    if (!matchesClass && selectedTeacherClass !== "All") {
      const teacherClass = normalizeClassName(teacher.class?.className || "No Class");
      matchesClass = teacherClass === selectedTeacherClass;
    }
    return matchesSearch && matchesClass;
  });

  const teachersByClass = filteredTeachers.reduce((acc, teacher) => {
    const className = normalizeClassName(teacher.class?.className || "No Class");
    if (!acc[className]) acc[className] = [];
    acc[className].push(teacher);
    return acc;
  }, {});

  const uniqueTerms = ["All", ...new Set((allFees || []).map(f => f.term || "").filter(t => t))];
  const uniqueYears = ["All", ...new Set((allFees || []).map(f => f.academicYear || "").filter(y => y))];

  useEffect(() => {
    if (selectedClass !== "All" && classRefs.current[selectedClass]) {
      setTimeout(() => {
        classRefs.current[selectedClass]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedClass, filteredStudents]);

  const collectionPercentage = totalFeesDemanded > 0 ? ((feeCollection / totalFeesDemanded) * 100).toFixed(1) : 0;
  const getCollectionRateColor = (percentage) => {
    if (percentage >= 90) return "text-emerald-600";
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    if (percentage >= 30) return "text-orange-600";
    return "text-red-600";
  };
  const feeTrend = lastMonthFees > 0 ? ((feeCollection - lastMonthFees) / lastMonthFees) * 100 : 0;
  const isPositiveTrend = feeTrend >= 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ===== SQUARE CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - Total Students */}
        <div onClick={() => setShowStudentModal(true)} className="bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative cursor-pointer hover:scale-[1.02] aspect-square flex flex-col justify-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm"><School size={22} /></div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600"><ArrowUpRight size={12} />+12%</div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Students</p>
            <p className="text-3xl font-bold text-gray-800">{studentsCount.toLocaleString()}</p>
            <p className="text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition">Click to view all →</p>
          </div>
        </div>

        {/* Card 2 - New Admissions */}
        <div onClick={() => setShowAdmissionModal(true)} className="bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 group relative cursor-pointer hover:scale-[1.02] aspect-square flex flex-col justify-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm"><UserPlus size={22} /></div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600"><ArrowUpRight size={12} />+5%</div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">New Admissions</p>
            <p className="text-3xl font-bold text-gray-800">{newAdmissions.toLocaleString()}</p>
            <p className="text-xs text-emerald-500 mt-2 opacity-0 group-hover:opacity-100 transition">Click to view details →</p>
          </div>
        </div>

        {/* Card 3 - Fee Collections */}
        <div onClick={() => setShowFeeModal(true)} className="bg-white rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative cursor-pointer hover:scale-[1.02] aspect-square flex flex-col justify-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm"><Wallet size={22} /></div>
              {lastMonthFees > 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositiveTrend ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {isPositiveTrend ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(feeTrend).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fee Collections</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">UGX</span>
              <span className="text-2xl font-bold text-gray-800">{formatCompactUGX(feeCollection)}</span>
            </div>
            {totalFeesDemanded > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Collection</span>
                  <span className={`font-semibold ${getCollectionRateColor(collectionPercentage)}`}>{collectionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-purple-600`} style={{ width: `${Math.min(collectionPercentage, 100)}%` }}></div>
                </div>
              </div>
            )}
            <p className="text-xs text-purple-500 mt-2 opacity-0 group-hover:opacity-100 transition">Click to view details →</p>
          </div>
        </div>

        {/* Card 4 - Total Teachers */}
        <div onClick={() => navigate('/secretary/teacherprofile')} className="bg-white rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative cursor-pointer hover:scale-[1.02] aspect-square flex flex-col justify-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm"><Award size={22} /></div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"><Eye size={12} /> View All</div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Teachers</p>
            <p className="text-3xl font-bold text-gray-800">{teachersCount.toLocaleString()}</p>
            <p className="text-xs text-orange-500 mt-2 opacity-0 group-hover:opacity-100 transition">Click to manage teachers →</p>
          </div>
        </div>
      </div>

      {/* ============ STUDENT MODAL ============ */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  Student Financial & Requirements Dashboard
                </h2>
                <p className="text-sm text-gray-500 mt-1">Track student fees, payments, and requirement progress</p>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search by name or student ID..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[180px]">
                  {standardClassList.map(className => (<option key={className} value={className}>{className === "All" ? "All Classes" : className}</option>))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No students found</p></div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(studentsByClass).map(([className, students]) => {
                    const classStats = getClassStats(students);
                    return (
                      <div key={className} ref={el => classRefs.current[className] = el} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                          <div className="flex flex-wrap justify-between items-center gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">{className}</h3>
                              <p className="text-sm text-gray-600">{classStats.totalStudents} Students</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <div className="bg-white rounded-lg px-3 py-1 text-center">
                                <p className="text-xs text-gray-500">Fee Collection</p>
                                <p className={`text-sm font-bold ${classStats.collectionRate >= 70 ? 'text-green-600' : classStats.collectionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{classStats.collectionRate}%</p>
                              </div>
                              <div className="bg-white rounded-lg px-3 py-1 text-center">
                                <p className="text-xs text-gray-500">Requirements Done</p>
                                <p className={`text-sm font-bold ${classStats.reqCompletionRate >= 70 ? 'text-green-600' : classStats.reqCompletionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{classStats.reqCompletionRate}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Fees Demanded</th>
                                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Fees Paid</th>
                                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Fee Status</th>
                                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Requirements</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {students.map((student) => {
                                const feeInfo = getStudentFeeInfo(student.id);
                                const reqStats = getStudentRequirementStats(student.id);
                                return (
                                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3"><p className="font-medium text-gray-800">{student.fullName}</p></td>
                                    <td className="p-3"><p className="text-sm text-gray-600">{student.studentNumber}</p></td>
                                    <td className="p-3 text-right">
                                      {feeInfo.totalDemanded > 0 ? <p className="text-sm font-medium text-blue-600">UGX {formatUGX(feeInfo.totalDemanded)}</p> : <p className="text-sm text-gray-400">—</p>}
                                    </td>
                                    <td className="p-3 text-right">
                                      {feeInfo.totalPaid > 0 ? <p className="text-sm font-medium text-green-600">UGX {formatUGX(feeInfo.totalPaid)}</p> : <p className="text-sm text-gray-400">—</p>}
                                    </td>
                                    <td className="p-3 text-right">
                                      <p className={`text-sm font-bold ${feeInfo.balance > 0 ? 'text-red-600' : feeInfo.balance === 0 && feeInfo.totalPaid > 0 ? 'text-green-600' : 'text-gray-400'}`}>{feeInfo.balanceDisplay}</p>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${feeInfo.statusColor}`}>{feeInfo.statusIcon}{feeInfo.status}</span>
                                    </td>
                                    <td className="p-3 text-center">
                                      {reqStats.assigned > 0 ? (
                                        <div className="flex flex-col items-center">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-emerald-600">{reqStats.completed} ✓</span>
                                            <span className="text-xs text-gray-400">|</span>
                                            <span className="text-xs font-medium text-amber-600">{reqStats.partial} ⏳</span>
                                            <span className="text-xs text-gray-400">|</span>
                                            <span className="text-xs font-medium text-rose-600">{reqStats.pending} ⌛</span>
                                          </div>
                                          <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${reqStats.assigned > 0 ? (reqStats.completed / reqStats.assigned) * 100 : 0}%` }}></div>
                                          </div>
                                          <span className="text-xs text-gray-400 mt-0.5">{reqStats.completed}/{reqStats.assigned} completed</span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400">No requirements</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center">
              <p className="text-sm text-gray-500">Showing {filteredStudents.length} of {allStudents.length} students</p>
              <button onClick={() => setShowStudentModal(false)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ FEE MODAL ============ */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Wallet className="w-6 h-6 text-purple-600" />Fee Collections Analytics</h2><p className="text-sm text-gray-500 mt-1">Detailed breakdown of all fee transactions</p></div>
              <button onClick={() => setShowFeeModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Transactions</p><p className="text-xl font-bold text-purple-600">{filteredFees.length}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Demanded</p><p className="text-xl font-bold text-blue-600">UGX {formatCompactUGX(filteredTotalDemanded)}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Collected</p><p className="text-xl font-bold text-green-600">UGX {formatCompactUGX(filteredTotalCollected)}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Rate</p><p className={`text-xl font-bold ${getCollectionRateColor(filteredCollectionRate)}`}>{filteredCollectionRate}%</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Outstanding</p><p className="text-xl font-bold text-red-600">UGX {formatCompactUGX(filteredTotalDemanded - filteredTotalCollected)}</p></div>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-gray-400" /><span className="text-sm font-medium text-gray-600">Filters:</span></div>
                <select value={feeFilterMethod} onChange={(e) => setFeeFilterMethod(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"><option value="All">All Methods</option><option value="Cash">Cash</option><option value="Mobile Money">Mobile Money</option><option value="Bank">Bank Transfer</option><option value="Cheque">Cheque</option></select>
                <select value={feeFilterTerm} onChange={(e) => setFeeFilterTerm(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">{uniqueTerms.map(term => (<option key={term} value={term}>{term === "All" ? "All Terms" : term}</option>))}</select>
                <select value={feeFilterYear} onChange={(e) => setFeeFilterYear(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">{uniqueYears.map(year => (<option key={year} value={year}>{year === "All" ? "All Years" : year}</option>))}</select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200"><h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-purple-500" />Payment Methods</h3><div className="space-y-3">{Object.entries(feesByMethod).map(([method, data]) => (<div key={method}><div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-600">{method}</span><span className="text-gray-500">{data.count} txns</span></div><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">UGX {formatCompactUGX(data.total)}</span><span className="text-gray-400">{filteredTotalCollected > 0 ? ((data.total / filteredTotalCollected) * 100).toFixed(1) : 0}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{ width: `${filteredTotalCollected > 0 ? (data.total / filteredTotalCollected) * 100 : 0}%` }}></div></div></div>))}</div></div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200"><h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-500" />Terms Breakdown</h3><div className="space-y-3">{Object.entries(feesByTerm).map(([term, data]) => (<div key={term}><div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-600">{term}</span><span className="text-gray-500">{data.count} txns</span></div><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">UGX {formatCompactUGX(data.total)}</span><span className="text-gray-400">{filteredTotalCollected > 0 ? ((data.total / filteredTotalCollected) * 100).toFixed(1) : 0}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${filteredTotalCollected > 0 ? (data.total / filteredTotalCollected) * 100 : 0}%` }}></div></div></div>))}</div></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200"><h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-purple-500" />Recent Transactions</h3><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200"><th className="text-left p-2 text-xs font-semibold text-gray-500 uppercase">Date</th><th className="text-left p-2 text-xs font-semibold text-gray-500 uppercase">Student</th><th className="text-left p-2 text-xs font-semibold text-gray-500 uppercase">Term</th><th className="text-left p-2 text-xs font-semibold text-gray-500 uppercase">Method</th><th className="text-right p-2 text-xs font-semibold text-gray-500 uppercase">Amount</th><th className="text-left p-2 text-xs font-semibold text-gray-500 uppercase">Ref</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredFees.slice(0, 10).map((fee, idx) => (<tr key={idx} className="hover:bg-white transition-colors"><td className="p-2 text-sm text-gray-600">{formatDate(fee.createdAt || fee.paymentDate)}</td><td className="p-2 text-sm font-medium text-gray-800">{fee.student?.fullName || "Unknown"}</td><td className="p-2 text-sm text-gray-600">{fee.term || "—"}</td><td className="p-2 text-sm text-gray-600">{fee.paymentMethod || "—"}</td><td className="p-2 text-right text-sm font-semibold text-green-600">UGX {formatUGX(fee.amountPaid || 0)}</td><td className="p-2 text-xs text-gray-400 font-mono">{fee.referenceNumber || "—"}</td></tr>))}</tbody></table></div></div>
            </div>
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center"><p className="text-sm text-gray-500">Showing {filteredFees.length} transaction(s)</p><button onClick={() => setShowFeeModal(false)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">Close</button></div>
          </div>
        </div>
      )}

      {/* ============ ADMISSION MODAL ============ */}
      {showAdmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-6 h-6 text-emerald-600" />New Admissions Report</h2><p className="text-sm text-gray-500 mt-1">Track and manage newly enrolled students</p></div>
              <button onClick={() => setShowAdmissionModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-shrink-0 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Total Admissions</p><p className="text-xl font-bold text-emerald-600">{filteredAdmissions.length}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Classes</p><p className="text-xl font-bold text-blue-600">{Object.keys(admissionsByClass).length}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">This Month</p><p className="text-xl font-bold text-purple-600">{filteredAdmissions.filter(s => {const d = new Date(s.createdAt); const now = new Date(); const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)); return d >= thirtyDaysAgo;}).length}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">With Fee Records</p><p className="text-xl font-bold text-green-600">{filteredAdmissions.filter(s => getStudentFeeInfo(s.id).totalDemanded > 0).length}</p></div>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-gray-400" /><span className="text-sm font-medium text-gray-600">Filters:</span></div>
                <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search by name, ID or parent..." value={admissionSearch} onChange={(e) => setAdmissionSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm" /></div>
                <select value={admissionClassFilter} onChange={(e) => setAdmissionClassFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">{standardClassList.map(className => (<option key={className} value={className}>{className === "All" ? "All Classes" : className}</option>))}</select>
                <select value={admissionDateFilter} onChange={(e) => setAdmissionDateFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"><option value="all">All Time</option><option value="month">Last 30 Days</option><option value="quarter">Last 90 Days</option></select>
              </div>
            </div>
            {Object.keys(admissionsByMonth).length > 0 && (
              <div className="flex-shrink-0 bg-gray-50 mx-6 mt-4 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-500" />Admissions by Month</h3>
                <div className="flex items-end gap-3 h-32 w-full">
                  {Object.entries(admissionsByMonth).sort((a,b) => {const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return months.indexOf(a[0]) - months.indexOf(b[0]);}).map(([month, count]) => (
                    <div key={month} className="flex-1 text-center min-w-[30px]">
                      <div className="bg-emerald-500 rounded-t-lg transition-all duration-300 hover:bg-emerald-600 mx-auto" style={{ height: `${Math.max(20, (count / maxCount) * 100)}px`, width: '100%', maxWidth: '60px' }}><div className="text-white text-xs font-bold pt-1">{count}</div></div>
                      <p className="text-xs text-gray-500 mt-2">{month}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="space-y-6">
                {Object.entries(admissionsByClass).map(([className, students]) => (
                  <div key={className} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div><h3 className="text-lg font-bold text-gray-800">{className}</h3><p className="text-sm text-gray-500">{students.length} Students</p></div>
                        <div className="flex gap-3">
                          <div className="text-center"><p className="text-xs text-gray-500">With Fee</p><p className="text-sm font-bold text-green-600">{students.filter(s => getStudentFeeInfo(s.id).totalDemanded > 0).length}</p></div>
                          <div className="text-center"><p className="text-xs text-gray-500">No Fee</p><p className="text-sm font-bold text-gray-500">{students.filter(s => getStudentFeeInfo(s.id).totalDemanded === 0).length}</p></div>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Parent</th>
                            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Admission Date</th>
                            <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Fee Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {students.map((student) => {
                            const feeInfo = getStudentFeeInfo(student.id);
                            return (
                              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3"><p className="font-medium text-gray-800">{student.fullName}</p></td>
                                <td className="p-3"><p className="text-sm text-gray-600">{student.studentNumber}</p></td>
                                <td className="p-3"><p className="text-sm text-gray-600">{student.parentName || "—"}</p></td>
                                <td className="p-3"><p className="text-sm text-gray-600">{formatDate(student.createdAt)}</p></td>
                                <td className="p-3 text-center">
                                  {feeInfo.totalDemanded === 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600"><AlertCircle className="w-3 h-3" />No Fee</span>
                                  ) : feeInfo.totalPaid === 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><XCircle className="w-3 h-3" />Not Paid</span>
                                  ) : feeInfo.balance === 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Fully Paid</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Partial</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              {filteredAdmissions.length === 0 && (
                <div className="text-center py-12"><UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No admissions found with current filters</p></div>
              )}
            </div>
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center">
              <p className="text-sm text-gray-500">Showing {filteredAdmissions.length} of {allStudents.length} total students</p>
              <button onClick={() => setShowAdmissionModal(false)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TEACHER MODAL ============ */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Award className="w-6 h-6 text-orange-600" />Teachers Directory</h2>
                <p className="text-sm text-gray-500 mt-1">View teachers, their subjects and assigned classes</p>
              </div>
              <button onClick={() => setShowTeacherModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-shrink-0 bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Total Teachers</p><p className="text-xl font-bold text-orange-600">{filteredTeachers.length}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Classes</p><p className="text-xl font-bold text-blue-600">{Object.keys(teachersByClass).length}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Subjects Taught</p><p className="text-xl font-bold text-purple-600">{filteredTeachers.filter(t => t.subjectId).length}</p></div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Class Teachers</p><p className="text-xl font-bold text-emerald-600">{filteredTeachers.filter(t => t.classId).length}</p></div>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search by name, email or phone..." value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm" /></div>
                <select value={selectedTeacherClass} onChange={(e) => setSelectedTeacherClass(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[150px]">{standardClassList.map(className => (<option key={className} value={className}>{className === "All" ? "All Classes" : className}</option>))}</select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-12"><Award className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No teachers found</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTeachers.map((teacher) => (
                    <div key={teacher.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{teacher.fullName}</h3>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {teacher.email && (<span className="flex items-center gap-1 text-xs text-gray-500"><Mail className="w-3 h-3" />{teacher.email}</span>)}
                              {teacher.phoneNumber && (<span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" />{teacher.phoneNumber}</span>)}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            {teacher.subject && (<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700"><BookMarked className="w-3 h-3" />{teacher.subject.subjectName}</span>)}
                            {teacher.class && (<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><School className="w-3 h-3" />{teacher.class.className}</span>)}
                            {!teacher.subject && !teacher.class && (<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">No assignment</span>)}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><p className="text-xs text-gray-500">Subject Teaching</p><p className="font-medium text-gray-800">{teacher.subject ? teacher.subject.subjectName : "Not Assigned"}</p></div>
                          <div><p className="text-xs text-gray-500">Class</p><p className="font-medium text-gray-800">{teacher.class ? teacher.class.className : "Not Assigned"}</p></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center">
              <p className="text-sm text-gray-500">Showing {filteredTeachers.length} of {teachersList.length} teachers</p>
              <div className="flex gap-2">
                <button onClick={() => navigate('/secretary/teacherprofile')} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Eye className="w-4 h-4" />Full Management</button>
                <button onClick={() => setShowTeacherModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecretaryDashboardCards;