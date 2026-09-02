import {
  UserPlus,
  CreditCard,
  Receipt,
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  RefreshCw,
  Printer,
  Search,
  X,
  CheckCircle,
  Clock,
  AlertCircle as AlertCircleIcon,
  Calendar,
  User,
  Phone,
  Mail,
  DollarSign,
  FileText as FileTextIcon,
  Download,
  BarChart3,
  PieChart,
  Brain,
  Sparkles,
  Lightbulb,
  Target,
  Shield,
  GraduationCap,
  BookOpen,
  Award,
  Building,
  Bot,
  Mic,
  Loader2,
  ArrowRight,
  Zap,
  Rocket,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Upload,
  FileSpreadsheet,
  File,
  School,
  BookMarked,
  ClipboardCheck,
  CalendarDays,
  Clock as ClockIcon,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Info,
  ClipboardList,
  Filter,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const SecretaryQuickActions = () => {

  const navigate = useNavigate();

  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Receipt / Payment Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [manualTotalFee, setManualTotalFee] = useState("");
  const [sendSms, setSendSms] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);
  
  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [insightCycle, setInsightCycle] = useState(0);

  // Import Students Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);
  
  const [stats, setStats] = useState({
    revenue: 0,
    debt: 0,
    transactions: 0,
    totalStudents: 0,
    collectionRate: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    pendingDocuments: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    growth: 0,
    fullyPaidStudents: 0,
    partialPaidStudents: 0,
    notPaidStudents: 0,
    averageFeePerStudent: 0
  });

  const STANDARD_TERMS = ["Term 1", "Term 2", "Term 3"];

  const getStandardAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    return [String(currentYear - 1), String(currentYear), String(currentYear + 1)];
  };

  // ================= HELPER: Extract array from response =================
  const extractArray = (res) => {
    if (!res || !res.data) return [];
    const d = res.data;
    if (Array.isArray(d)) return d;
    if (d.data && Array.isArray(d.data)) return d.data;
    if (d.success && Array.isArray(d.data)) return d.data;
    return [];
  };

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const [studentsRes, feesRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
          api.get("/students"),
          api.get("/fees"),
          api.get("/teachers"),
          api.get("/classes"),
          api.get("/subjects")
        ]);

        const studentsData = extractArray(studentsRes);
        const feesData = extractArray(feesRes);
        const teachersData = extractArray(teachersRes);
        const classesData = extractArray(classesRes);
        const subjectsData = extractArray(subjectsRes);

        setStudents(studentsData);
        setTeachers(teachersData);
        setClasses(classesData);
        setSubjects(subjectsData);
        setFees(feesData);

        let revenue = 0;
        let debt = 0;
        let totalDemanded = 0;
        let transactions = feesData.length;
        let thisMonthRevenue = 0;
        let lastMonthRevenue = 0;
        let fullyPaidCount = 0;
        let partialPaidCount = 0;
        let notPaidCount = 0;

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        const studentFeeMap = new Map();

        feesData.forEach((fee) => {
          const paid = Number(fee.amountPaid || fee.amount_paid || fee.paid || 0);
          const total = Number(fee.totalFee || fee.total_fee || fee.fee_amount || fee.amount || 0);
          revenue += paid;
          totalDemanded += total;
          debt += Math.max(total - paid, 0);

          const studentId = fee.studentId || fee.student?.id;
          if (studentId) {
            if (!studentFeeMap.has(studentId)) {
              studentFeeMap.set(studentId, { demanded: 0, paid: 0 });
            }
            const current = studentFeeMap.get(studentId);
            current.demanded += total;
            current.paid += paid;
          }

          const feeDate = fee.createdAt || fee.created_at || fee.paymentDate;
          if (feeDate) {
            const date = new Date(feeDate);
            if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
              thisMonthRevenue += paid;
            }
            if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
              lastMonthRevenue += paid;
            }
          }
        });

        studentFeeMap.forEach((data) => {
          if (data.demanded === 0) return;
          const balance = data.demanded - data.paid;
          if (balance === 0) {
            fullyPaidCount++;
          } else if (data.paid > 0 && balance > 0) {
            partialPaidCount++;
          } else {
            notPaidCount++;
          }
        });

        const collectionRate = totalDemanded > 0 
          ? ((revenue / totalDemanded) * 100).toFixed(1) 
          : 0;

        const growth = lastMonthRevenue > 0 
          ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0;

        const studentsWithFees = new Set();
        feesData.forEach(fee => {
          if (fee.studentId) studentsWithFees.add(fee.studentId);
          if (fee.student?.id) studentsWithFees.add(fee.student.id);
        });
        const pendingDocuments = studentsData.length - studentsWithFees.size;

        const averageFeePerStudent = studentsData.length > 0 ? revenue / studentsData.length : 0;

        setStats({
          revenue,
          debt,
          transactions,
          totalStudents: studentsData.length,
          collectionRate: Number(collectionRate),
          totalTeachers: teachersData.length,
          totalClasses: classesData.length,
          totalSubjects: subjectsData.length,
          pendingDocuments: Math.max(0, pendingDocuments),
          thisMonthRevenue,
          lastMonthRevenue,
          growth,
          fullyPaidStudents: fullyPaidCount,
          partialPaidStudents: partialPaidCount,
          notPaidStudents: notPaidCount,
          averageFeePerStudent
        });

      } catch (error) {
        console.error("Quick Actions Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ================= CLICK OUTSIDE TO CLOSE SEARCH RESULTS =================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= FORMAT HELPERS =================
  const formatUGX = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "UGX 0";
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCompactUGX = (amount) => {
    if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `UGX ${(amount / 1000).toFixed(0)}K`;
    return formatUGX(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-UG", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ================= GET UNIQUE TERMS & YEARS =================
  const getUniqueTerms = () => {
    const terms = new Set(STANDARD_TERMS);
    fees.forEach(fee => {
      if (fee.term) terms.add(fee.term);
    });
    return Array.from(terms).sort();
  };

  const getUniqueAcademicYears = () => {
    const years = new Set(getStandardAcademicYears());
    fees.forEach(fee => {
      if (fee.academicYear) years.add(fee.academicYear);
    });
    return Array.from(years).sort().reverse();
  };

  // ================= BACKEND-CONNECTED FILTERS =================
  const getFilteredStudents = async (term, academicYear) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const params = new URLSearchParams();
      if (term && term !== '') params.append('term', term);
      if (academicYear && academicYear !== '') params.append('academicYear', academicYear);
      
      // Fetch filtered students
      const response = await api.get(`/students/filter?${params.toString()}`, config);
      const filteredData = extractArray(response);
      setStudents(filteredData);
      
      // Fetch filtered fees
      const feesResponse = await api.get(`/fees/filter?${params.toString()}`, config);
      const filteredFees = extractArray(feesResponse);
      setFees(filteredFees);
      
      recalculateStats(filteredData, filteredFees);
      
      return filteredData;
    } catch (error) {
      console.error("Filter error:", error);
      // Fallback to all students if filter fails
      const response = await api.get("/students");
      const allStudents = extractArray(response);
      setStudents(allStudents);
      return allStudents;
    }
  };

  const recalculateStats = (filteredStudents, filteredFees) => {
    let revenue = 0;
    let debt = 0;
    let totalDemanded = 0;
    let transactions = filteredFees.length;
    let fullyPaidCount = 0;
    let partialPaidCount = 0;
    let notPaidCount = 0;

    const studentFeeMap = new Map();

    filteredFees.forEach((fee) => {
      const paid = Number(fee.amountPaid || fee.amount_paid || fee.paid || 0);
      const total = Number(fee.totalFee || fee.total_fee || fee.fee_amount || fee.amount || 0);
      revenue += paid;
      totalDemanded += total;
      debt += Math.max(total - paid, 0);

      const studentId = fee.studentId || fee.student?.id;
      if (studentId) {
        if (!studentFeeMap.has(studentId)) {
          studentFeeMap.set(studentId, { demanded: 0, paid: 0 });
        }
        const current = studentFeeMap.get(studentId);
        current.demanded += total;
        current.paid += paid;
      }
    });

    studentFeeMap.forEach((data) => {
      if (data.demanded === 0) return;
      const balance = data.demanded - data.paid;
      if (balance === 0) {
        fullyPaidCount++;
      } else if (data.paid > 0 && balance > 0) {
        partialPaidCount++;
      } else {
        notPaidCount++;
      }
    });

    const collectionRate = totalDemanded > 0 
      ? ((revenue / totalDemanded) * 100).toFixed(1) 
      : 0;

    const averageFeePerStudent = filteredStudents.length > 0 ? revenue / filteredStudents.length : 0;

    setStats(prev => ({
      ...prev,
      revenue,
      debt,
      transactions,
      totalStudents: filteredStudents.length,
      collectionRate: Number(collectionRate),
      fullyPaidStudents: fullyPaidCount,
      partialPaidStudents: partialPaidCount,
      notPaidStudents: notPaidCount,
      averageFeePerStudent
    }));
  };

  const handleFilterChange = async (term, year) => {
    setIsLoading(true);
    try {
      await getFilteredStudents(term, year);
      // After filtering, if a student is selected, refresh their fee info
      if (selectedStudent) {
        refreshStudentFeeInfo(selectedStudent.id);
      }
    } catch (error) {
      console.error("Filter application error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= REFRESH STUDENT FEE INFO =================
  const refreshStudentFeeInfo = async (studentId) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch fresh fees for this student
      const response = await api.get(`/fees/student/${studentId}`, config);
      const studentFees = extractArray(response);
      
      // Update the fees state with the fresh data
      setFees(prevFees => {
        // Remove old fees for this student and add new ones
        const otherFees = prevFees.filter(f => f.studentId !== studentId && f.student?.id !== studentId);
        return [...otherFees, ...studentFees];
      });
      
      // If the student is currently selected, refresh the displayed info
      if (selectedStudent && selectedStudent.id === studentId) {
        // Re-select the student to refresh the UI
        selectStudentForReceipt(selectedStudent);
      }
    } catch (error) {
      console.error("Error refreshing student fees:", error);
    }
  };

  // ================= AI INTELLIGENCE ENGINE =================
  const generateAIInsights = () => {
    const totalStudents = stats.totalStudents;
    const totalRevenue = stats.revenue;
    const totalDebt = stats.debt;
    const collectionRate = stats.collectionRate;
    const transactions = stats.transactions;
    const totalTeachers = stats.totalTeachers;
    const totalClasses = stats.totalClasses;
    const totalSubjects = stats.totalSubjects;
    const growth = stats.growth;
    const fullyPaid = stats.fullyPaidStudents;
    const partialPaid = stats.partialPaidStudents;
    const notPaid = stats.notPaidStudents;
    
    const insights = [];
    
    if (collectionRate >= 90) {
      insights.push({
        type: "success",
        icon: <Sparkles className="w-5 h-5" />,
        title: "🏆 Excellent Financial Performance",
        description: `Your collection rate of ${collectionRate}% is exceptional! The school is in a strong financial position.`,
        action: "Continue maintaining this high standard. Reward departments with high collection rates."
      });
    } else if (collectionRate >= 70) {
      insights.push({
        type: "warning",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "📈 Good Progress, Room for Improvement",
        description: `With a ${collectionRate}% collection rate, you're on the right track. Focus on the remaining ${formatUGX(totalDebt)} to reach optimal performance.`,
        action: "Implement a structured payment reminder system for parents with outstanding balances."
      });
    } else if (collectionRate >= 40) {
      insights.push({
        type: "danger",
        icon: <AlertCircleIcon className="w-5 h-5" />,
        title: "⚠️ Collection Rate Needs Attention",
        description: `${collectionRate}% collection rate indicates significant challenges. ${formatUGX(totalDebt)} in outstanding fees requires immediate action.`,
        action: "Schedule urgent meetings with parents who have long-standing arrears. Consider flexible payment plans."
      });
    } else {
      insights.push({
        type: "danger",
        icon: <AlertCircleIcon className="w-5 h-5" />,
        title: "🚨 Critical Financial Alert",
        description: `Collection rate at ${collectionRate}% is dangerously low. This threatens the school's operational stability.`,
        action: "Immediate intervention required. Engage the Board of Governors and implement a debt recovery task force."
      });
    }

    if (totalStudents > 0) {
      const paidPercentage = ((fullyPaid / totalStudents) * 100).toFixed(1);
      const partialPercentage = ((partialPaid / totalStudents) * 100).toFixed(1);
      const notPaidPercentage = ((notPaid / totalStudents) * 100).toFixed(1);
      
      insights.push({
        type: "info",
        icon: <Users className="w-5 h-5" />,
        title: "📊 Student Payment Status",
        description: `${fullyPaid} (${paidPercentage}%) fully paid • ${partialPaid} (${partialPercentage}%) partial • ${notPaid} (${notPaidPercentage}%) not paid`,
        action: notPaid > 0 
          ? `Focus on ${notPaid} students who haven't paid any fees. Consider personalized outreach.`
          : "Excellent payment compliance! All students have made at least some payment."
      });
    }

    if (growth > 10) {
      insights.push({
        type: "success",
        icon: <Rocket className="w-5 h-5" />,
        title: "📈 Strong Revenue Growth",
        description: `Revenue grew by ${growth.toFixed(1)}% compared to last month. Excellent momentum!`,
        action: "Continue the strategies that are driving this growth. Consider expanding programs."
      });
    } else if (growth > 0) {
      insights.push({
        type: "info",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "📊 Positive Growth Trend",
        description: `Revenue grew by ${growth.toFixed(1)}% compared to last month. Steady progress.`,
        action: "Identify what's working and double down on those areas."
      });
    } else if (growth < 0) {
      insights.push({
        type: "warning",
        icon: <TrendingDown className="w-5 h-5" />,
        title: "📉 Revenue Decline Detected",
        description: `Revenue declined by ${Math.abs(growth).toFixed(1)}% compared to last month.`,
        action: "Review your collection strategies and identify reasons for the decline."
      });
    }

    if (transactions === 0) {
      insights.push({
        type: "info",
        icon: <Lightbulb className="w-5 h-5" />,
        title: "💡 System Activated",
        description: "Your school management system is ready. Start recording transactions to unlock full AI capabilities.",
        action: "Begin by recording the first fee payment for any student."
      });
    }

    const randomInsights = [
      {
        title: "🤖 AI Suggestion",
        description: "Based on your school's data, automated payment reminders could improve collection by 15-20%.",
        action: "Set up automated SMS reminders for parents 3 days before payment deadlines."
      },
      {
        title: "📊 Data Insight",
        description: `Your school's current financial health score is ${collectionRate > 70 ? 'Excellent' : collectionRate > 40 ? 'Moderate' : 'Needs Improvement'}.`,
        action: collectionRate > 70 
          ? "Consider investing in teacher training or infrastructure."
          : "Focus on improving collection through better parent communication."
      }
    ];
    
    const randomPick = Math.floor(Math.random() * randomInsights.length);
    insights.push({
      type: "info",
      icon: <Zap className="w-5 h-5" />,
      title: randomInsights[randomPick].title,
      description: randomInsights[randomPick].description,
      action: randomInsights[randomPick].action
    });

    return insights;
  };

  // ================= FIXED: COMPREHENSIVE STUDENT FEE INFO =================
  const getStudentFeeInfo = (studentId, term = null, academicYear = null) => {
    // Get ALL fees for this student
    const allStudentFees = fees.filter(f => f.studentId === studentId || f.student?.id === studentId);
    
    // FIXED: Only filter if term AND academicYear are provided and not empty
    let filteredFees = allStudentFees;
    if (term && term !== '' && academicYear && academicYear !== '') {
      filteredFees = filteredFees.filter(f => f.term === term && f.academicYear === academicYear);
    } else if (term && term !== '') {
      // Only term filter
      filteredFees = filteredFees.filter(f => f.term === term);
    } else if (academicYear && academicYear !== '') {
      // Only year filter
      filteredFees = filteredFees.filter(f => f.academicYear === academicYear);
    }
    // If both are empty/null, show ALL fees (no filtering)
    
    // Calculate totals from ALL fees (global history)
    let totalDemandedAll = 0;
    let totalPaidAll = 0;
    allStudentFees.forEach(fee => {
      totalDemandedAll += Number(fee.totalFee || 0);
      totalPaidAll += Number(fee.amountPaid || 0);
    });
    const balanceAll = totalDemandedAll - totalPaidAll;
    
    // Calculate totals for selected term/year (or all if no filters)
    let totalDemandedSelected = 0;
    let totalPaidSelected = 0;
    filteredFees.forEach(fee => {
      totalDemandedSelected += Number(fee.totalFee || 0);
      totalPaidSelected += Number(fee.amountPaid || 0);
    });
    const balanceSelected = totalDemandedSelected - totalPaidSelected;
    
    // Determine if there's a fee record for this term/year
    const hasRecordForTerm = filteredFees.length > 0;
    const hasAnyRecord = allStudentFees.length > 0;
    
    let status = "";
    let statusColor = "";
    let statusIcon = null;
    let statusMessage = "";
    let isFullyPaid = false;
    
    if (!hasAnyRecord) {
      // No fee records at all for this student
      status = "No Fee Record";
      statusColor = "text-gray-600 bg-gray-100";
      statusIcon = <AlertCircleIcon className="w-4 h-4" />;
      statusMessage = `⚠️ No fee record found for this student. Please enter total fee amount below.`;
    } else if (!hasRecordForTerm && (term || academicYear)) {
      // Has fees but not for this specific term/year
      const displayTerm = term || 'any term';
      const displayYear = academicYear || 'any year';
      status = "No Record for This Selection";
      statusColor = "text-amber-600 bg-amber-100";
      statusIcon = <Clock className="w-4 h-4" />;
      statusMessage = `📌 This student has fees for other terms/years but not for ${displayTerm} ${displayYear}. Total paid across all records: ${formatUGX(totalPaidAll)}`;
    } else if (totalPaidSelected === 0 && balanceSelected > 0) {
      status = "Not Paid";
      statusColor = "text-red-600 bg-red-100";
      statusIcon = <X className="w-4 h-4" />;
      statusMessage = `⚠️ ${selectedStudent?.fullName || 'Student'} has not paid any fees for the selected period.`;
    } else if (balanceSelected === 0 && totalPaidSelected > 0) {
      status = "✅ Fully Paid";
      statusColor = "text-green-600 bg-green-100";
      statusIcon = <CheckCircle className="w-4 h-4" />;
      statusMessage = `✅ ${selectedStudent?.fullName || 'Student'} has fully paid all fees for the selected period.`;
      isFullyPaid = true;
    } else if (balanceSelected > 0 && totalPaidSelected > 0) {
      status = "Partial Payment";
      statusColor = "text-yellow-600 bg-yellow-100";
      statusIcon = <Clock className="w-4 h-4" />;
      statusMessage = `📌 ${selectedStudent?.fullName || 'Student'} has paid ${formatUGX(totalPaidSelected)} out of ${formatUGX(totalDemandedSelected)}. Balance: ${formatUGX(balanceSelected)}`;
    } else {
      status = "Unknown";
      statusColor = "text-gray-600 bg-gray-100";
      statusIcon = <AlertCircleIcon className="w-4 h-4" />;
      statusMessage = "Fee status could not be determined.";
    }
    
    // Use selected term/year totals if available, otherwise use all-time totals
    const displayDemanded = hasRecordForTerm ? totalDemandedSelected : totalDemandedAll;
    const displayPaid = hasRecordForTerm ? totalPaidSelected : totalPaidAll;
    const displayBalance = displayDemanded - displayPaid;
    
    return {
      totalDemanded: displayDemanded,
      totalPaid: displayPaid,
      balance: displayBalance,
      status,
      statusColor,
      statusIcon,
      statusMessage,
      isFullyPaid,
      fees: filteredFees,
      allFees: allStudentFees,
      hasRecordForTerm,
      hasAnyRecord,
      term: term || (allStudentFees.length > 0 ? allStudentFees[0].term : null),
      academicYear: academicYear || (allStudentFees.length > 0 ? allStudentFees[0].academicYear : null)
    };
  };

  const getStudentTerms = (studentId) => {
    const studentFees = fees.filter(f => f.studentId === studentId || f.student?.id === studentId);
    const terms = new Set();
    studentFees.forEach(fee => {
      if (fee.term) terms.add(fee.term);
    });
    return Array.from(terms).sort();
  };

  // ================= OPEN MODALS =================
  const openReceiptModal = () => {
    setSelectedStudent(null);
    setSelectedFee(null);
    setStudentSearch("");
    setPaymentAmount("");
    setSelectedTerm("");
    setSelectedAcademicYear("");
    setManualTotalFee("");
    setSendSms(false);
    setShowSearchResults(false);
    setShowReceiptModal(true);
  };

  const openReportModal = () => {
    setShowReportModal(true);
    setAiResponse(null);
    setIsThinking(false);
  };

  const openImportModal = () => {
    setShowImportModal(true);
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadStatus(null);
    setIsProcessing(false);
    setImportErrors([]);
  };

  // ================= ANALYZE WITH AI =================
  const analyzeWithAI = () => {
    setIsThinking(true);
    setAiResponse(null);
    
    setTimeout(() => {
      const insights = generateAIInsights();
      setAiResponse(insights);
      setIsThinking(false);
    }, 3000);
  };

  const regenerateInsights = () => {
    setInsightCycle(prev => prev + 1);
    analyzeWithAI();
  };

  const selectStudentForReceipt = (student) => {
    setSelectedStudent(student);
    const existingTerms = getStudentTerms(student.id);
    const defaultTerm = existingTerms.length > 0 ? existingTerms[0] : STANDARD_TERMS[0];
    setSelectedTerm(defaultTerm);

    const years = getUniqueAcademicYears();
    const defaultYear = years.length > 0 ? years[0] : String(new Date().getFullYear());
    setSelectedAcademicYear(defaultYear);

    setPaymentAmount("");
    setManualTotalFee("");
    setSendSms(false);
    setShowSearchResults(false);
    setStudentSearch("");

    const feeInfo = getStudentFeeInfo(student.id, defaultTerm, defaultYear);
    if (feeInfo.fees && feeInfo.fees.length > 0) {
      setSelectedFee(feeInfo.fees[0]);
      // Set the total fee from the existing record
      setManualTotalFee(String(feeInfo.totalDemanded || ""));
    } else if (feeInfo.hasAnyRecord) {
      // Has fees but not for this term - use all-time total as reference
      setManualTotalFee(String(feeInfo.totalDemanded || ""));
      setSelectedFee(null);
    } else {
      setSelectedFee(null);
      setManualTotalFee("");
    }
  };

  // Update fee info when term/year changes
  useEffect(() => {
    if (!selectedStudent) return;
    const feeInfo = getStudentFeeInfo(selectedStudent.id, selectedTerm, selectedAcademicYear);
    // Update manual total fee based on the fee info
    if (feeInfo.totalDemanded > 0) {
      setManualTotalFee(String(feeInfo.totalDemanded));
    }
  }, [selectedTerm, selectedAcademicYear, selectedStudent, fees]);

  const printReceipt = () => {
    window.print();
  };

  const getDynamicBalance = () => {
    if (!selectedStudent) return 0;
    const feeInfo = getStudentFeeInfo(selectedStudent.id, selectedTerm, selectedAcademicYear);
    // Use the manually entered total fee if no existing record
    const effectiveTotal = feeInfo.totalDemanded > 0
      ? feeInfo.totalDemanded
      : (parseFloat(manualTotalFee) || 0);
    const alreadyPaid = feeInfo.totalPaid;
    const currentBalance = Math.max(effectiveTotal - alreadyPaid, 0);
    const entered = parseFloat(paymentAmount) || 0;
    return Math.max(currentBalance - entered, 0);
  };

  const filteredStudentsForReceipt = (students || []).filter(student => {
    const search = studentSearch.toLowerCase();
    return student.fullName?.toLowerCase().includes(search) ||
           student.studentNumber?.toLowerCase().includes(search);
  });

  // ================= PROCESS PAYMENT HANDLER =================
  const handleProcessPayment = async () => {
    if (!selectedStudent) {
      toast.error("No student selected.");
      return;
    }

    if (!selectedTerm) {
      toast.error("Please select a term.");
      return;
    }

    if (!selectedAcademicYear) {
      toast.error("Please select an academic year.");
      return;
    }

    const feeInfo = getStudentFeeInfo(selectedStudent.id, selectedTerm, selectedAcademicYear);
    const hasExistingRecord = feeInfo.hasRecordForTerm;
    const effectiveTotalFee = hasExistingRecord
      ? feeInfo.totalDemanded
      : parseFloat(manualTotalFee) || 0;

    if (!hasExistingRecord && effectiveTotalFee <= 0) {
      toast.error("Please enter the Total Fee amount for this student's term before recording a payment.");
      return;
    }
    
    if (feeInfo.isFullyPaid) {
      toast.error(`❌ ${selectedStudent.fullName} is already fully paid for the selected period.`);
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    const entered = parseFloat(paymentAmount);
    const currentBalance = Math.max(effectiveTotalFee - feeInfo.totalPaid, 0);
    const newBalance = currentBalance - entered;
    if (newBalance < 0) {
      toast.error(`Overpayment! The remaining balance is ${formatUGX(currentBalance)}. Please enter a lower amount.`);
      return;
    }

    const confirmMsg = `Confirm payment of ${formatUGX(entered)} for ${selectedStudent.fullName} (${selectedTerm})?\n\nTotal Fee: ${formatUGX(effectiveTotalFee)}\nNew balance will be: ${formatUGX(newBalance)}`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const paymentData = {
        studentId: selectedStudent.id,
        amountPaid: entered,
        totalFee: effectiveTotalFee,
        term: selectedTerm,
        academicYear: selectedAcademicYear,
        paymentMethod: "Cash",
        paymentDate: new Date().toISOString().split("T")[0],
      };

      const response = await api.post("/fees", paymentData, config);
      const recordedFee = response.data.data || response.data;

      toast.success(`✅ Payment of ${formatUGX(entered)} recorded for ${selectedStudent.fullName}`);

      if (sendSms && selectedStudent.parentPhone) {
        try {
          const smsMessage = `Dear Parent, ${formatUGX(entered)} has been received as fee payment for ${selectedStudent.fullName} (${selectedStudent.studentNumber}). New balance: ${formatUGX(newBalance)}. Thank you.`;

          const smsPayload = {
            recipients: [selectedStudent.parentPhone],
            message: smsMessage,
            category: "payment_confirmation",
            priority: "normal",
            recipientType: "parents",
            recipientIds: [selectedStudent.id],
            isBulk: false,
          };

          await api.post("/sms/send", smsPayload, config);
          toast.success("📱 SMS sent to parent successfully!");
        } catch (smsError) {
          console.error("SMS error:", smsError);
          toast.error("Payment recorded but SMS failed. Please check SMS settings.");
        }
      } else if (sendSms && !selectedStudent.parentPhone) {
        toast.warning("Parent phone number not available. SMS not sent.");
      }

      // ===== CRITICAL: Refresh data immediately =====
      setPaymentAmount("");
      setManualTotalFee("");
      setSendSms(false);
      
      // Refresh fees for this student
      await refreshStudentFeeInfo(selectedStudent.id);
      
      // Refresh all fees
      const updatedFeesRes = await api.get("/fees", config);
      const updatedFees = extractArray(updatedFeesRes);
      setFees(updatedFees);
      
      // Refresh students, teachers, classes, subjects
      const [studentsRes2, teachersRes2, classesRes2, subjectsRes2] = await Promise.all([
        api.get("/students", config),
        api.get("/teachers", config),
        api.get("/classes", config),
        api.get("/subjects", config)
      ]);
      setStudents(extractArray(studentsRes2));
      setTeachers(extractArray(teachersRes2));
      setClasses(extractArray(classesRes2));
      setSubjects(extractArray(subjectsRes2));

      // Recalculate stats
      const newFees = extractArray(updatedFeesRes);
      setFees(newFees);
      let newRevenue = 0;
      let newDebt = 0;
      newFees.forEach(f => {
        newRevenue += Number(f.amountPaid || 0);
        newDebt += Math.max(0, Number(f.totalFee || 0) - Number(f.amountPaid || 0));
      });
      setStats(prev => ({ ...prev, revenue: newRevenue, debt: newDebt }));

      // Close modal after successful payment
      setShowReceiptModal(false);
      
      toast.success(`💰 Payment recorded successfully!`);

    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  // ================= DRAG & DROP IMPORT FUNCTIONS =================
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      const isValidFile = validTypes.includes(file.type) || 
                          file.name.endsWith('.xlsx') || 
                          file.name.endsWith('.xls') || 
                          file.name.endsWith('.csv');
      
      if (isValidFile) {
        handleFileUpload(file);
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Please upload an Excel file (.xlsx, .xls) or CSV file'
        });
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    setUploadStatus(null);
    setUploadProgress(10);
    setIsProcessing(true);
    setImportErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      let progress = 10;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
        setUploadProgress(progress);
      }, 300);

     const response = await api.post('/students/import', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 1800000, // 30 minutes (1800 seconds)
});
      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = response.data.data || {};
      const errorsList = result.errors || [];
      
      setUploadStatus({
        type: 'success',
        message: `File "${file.name}" processed successfully!`,
        details: {
          total: result.total || 0,
          added: result.added || 0,
          skipped: result.skipped || 0,
          errorsCount: errorsList.length
        }
      });

      if (errorsList.length > 0) {
        setImportErrors(errorsList);
      }

      const updatedStudentsRes = await api.get("/students");
      const updatedStudents = extractArray(updatedStudentsRes);
      setStudents(updatedStudents);
      setStats(prev => ({
        ...prev,
        totalStudents: updatedStudents.length
      }));

    } catch (error) {
      console.error("❌ File upload error:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Error processing file';
      setUploadStatus({
        type: 'error',
        message: errorMsg
      });
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  // ================= ACTIONS =================
  const actions = [
    {
      id: "register",
      title: "Register Student",
      subtitle: "Add new students",
      icon: <UserPlus size={22} />,
      path: "/secretary/studentregistration",
      color: "blue",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600"
    },
    {
      id: "import",
      title: "Import Students",
      subtitle: "Bulk upload from Excel",
      icon: <Upload size={22} />,
      onClick: openImportModal,
      color: "purple",
      bgColor: "bg-purple-50",
      hoverBg: "hover:bg-purple-100",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600"
    },
    {
      id: "fees",
      title: "Manage Fees",
      subtitle: `${stats.transactions} Transactions`,
      amount: formatCompactUGX(stats.revenue),
      icon: <CreditCard size={22} />,
      path: "/secretary/fees",
      color: "purple",
      bgColor: "bg-purple-50",
      hoverBg: "hover:bg-purple-100",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600"
    },
    {
      id: "receipt",
      title: "Process Payment",
      subtitle: "Search & record payment",
      icon: <Receipt size={22} />,
      onClick: openReceiptModal,
      color: "emerald",
      bgColor: "bg-emerald-50",
      hoverBg: "hover:bg-emerald-100",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600"
    },
    {
      id: "outstanding",
      title: "Outstanding Fees",
      subtitle: "Pending balances",
      amount: formatCompactUGX(stats.debt),
      icon: <Users size={22} />,
      path: "/secretary/fees",
      color: "rose",
      bgColor: "bg-rose-50",
      hoverBg: "hover:bg-rose-100",
      borderColor: "border-rose-200",
      iconColor: "text-rose-600"
    },
    {
      id: "report",
      title: "AI Intelligence Report",
      subtitle: "Smart insights & analytics",
      icon: <Brain size={22} />,
      onClick: openReportModal,
      color: "indigo",
      bgColor: "bg-indigo-50",
      hoverBg: "hover:bg-indigo-100",
      borderColor: "border-indigo-200",
      iconColor: "text-indigo-600"
    },
    {
      id: "attendance",
      title: "Teacher Attendance",
      subtitle: "Track staff attendance",
      icon: <UserCheck size={22} />,
      path: "/secretary/teacherAttendance",
      color: "teal",
      bgColor: "bg-teal-50",
      hoverBg: "hover:bg-teal-100",
      borderColor: "border-teal-200",
      iconColor: "text-teal-600"
    },
    {
      id: "settings",
      title: "System Settings",
      subtitle: "School configuration",
      icon: <Shield size={22} />,
      path: "/secretary/settings",
      color: "slate",
      bgColor: "bg-slate-50",
      hoverBg: "hover:bg-slate-100",
      borderColor: "border-slate-200",
      iconColor: "text-slate-600"
    },
    {
      id: "requirements",
      title: "Requirements",
      subtitle: "Manage student requirements",
      icon: <ClipboardList size={22} />,
      onClick: () => navigate('/secretary/requirements'),
      color: "orange",
      bgColor: "bg-orange-50",
      hoverBg: "hover:bg-orange-100",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600"
    }
  ];

  const totalStudents = stats.totalStudents || 0;

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-600" />
            Quick Actions
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{totalStudents} Students</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>{stats.collectionRate}% Collected</span>
            </div>
            {isLoading && (
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium">Fully Paid</p>
                <p className="text-xl font-bold text-emerald-700">{stats.fullyPaidStudents}</p>
              </div>
              <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
            <p className="text-xs text-emerald-500 mt-1">
              {stats.totalStudents > 0 ? ((stats.fullyPaidStudents / stats.totalStudents) * 100).toFixed(1) : 0}% of students
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-3 border border-yellow-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600 font-medium">Partial Payment</p>
                <p className="text-xl font-bold text-yellow-700">{stats.partialPaidStudents}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-yellow-700" />
              </div>
            </div>
            <p className="text-xs text-yellow-500 mt-1">
              {stats.totalStudents > 0 ? ((stats.partialPaidStudents / stats.totalStudents) * 100).toFixed(1) : 0}% of students
            </p>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-3 border border-red-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 font-medium">Not Paid</p>
                <p className="text-xl font-bold text-red-700">{stats.notPaidStudents}</p>
              </div>
              <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-red-700" />
              </div>
            </div>
            <p className="text-xs text-red-500 mt-1">
              {stats.totalStudents > 0 ? ((stats.notPaidStudents / stats.totalStudents) * 100).toFixed(1) : 0}% of students
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={action.onClick ? action.onClick : () => navigate(action.path)}
              className={`p-3 rounded-xl border ${action.borderColor} ${action.bgColor} ${action.hoverBg} transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-1.5 rounded-lg bg-white shadow-sm ${action.iconColor}`}>
                  {action.icon}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 leading-tight">{action.title}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{action.subtitle}</p>
                {action.amount && (
                  <p className="text-sm font-black text-gray-900 mt-1">{action.amount}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== RECEIPT / PAYMENT MODAL (MODERNIZED WITH BACKEND-CONNECTED FILTERS) ========== */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-purple-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shadow-sm">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Process Fee Payment</h3>
                  <p className="text-xs text-gray-500">Search student, enter amount, and record payment</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Student Search with modern design */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Type student name or number..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => {
                      if (studentSearch.trim()) {
                        setShowSearchResults(true);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                {showSearchResults && studentSearch && filteredStudentsForReceipt.length > 0 && (
                  <div 
                    ref={searchResultsRef}
                    className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-fadeIn"
                  >
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        {filteredStudentsForReceipt.length} student{filteredStudentsForReceipt.length > 1 ? 's' : ''} found
                      </span>
                      <button 
                        onClick={() => setShowSearchResults(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {filteredStudentsForReceipt.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                        onClick={() => selectStudentForReceipt(student)}
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          {student.fullName?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-800">{student.fullName}</div>
                          <div className="text-xs text-gray-400">{student.studentNumber}</div>
                        </div>
                        {student.className && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {student.className}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedStudent ? (
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                  {/* Student Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {selectedStudent.fullName?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{selectedStudent.fullName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        {selectedStudent.studentNumber}
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        {selectedStudent.className || 'No Class'}
                      </div>
                      {selectedStudent.parentPhone && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {selectedStudent.parentPhone}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentSearch("");
                        setPaymentAmount("");
                        setManualTotalFee("");
                        setSendSms(false);
                        setShowSearchResults(false);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Filters Section - Modernized with Backend Connection */}
                  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Filters</span>
                      <span className="text-xs text-gray-400 ml-auto">Filter students by term & year</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
                        <select
                          value={selectedTerm}
                          onChange={(e) => {
                            const newTerm = e.target.value;
                            setSelectedTerm(newTerm);
                            // Only apply filter if term or year is selected
                            if (newTerm || selectedAcademicYear) {
                              handleFilterChange(newTerm, selectedAcademicYear);
                            } else {
                              handleFilterChange('', '');
                            }
                            // Refresh student fee info
                            if (selectedStudent) {
                              refreshStudentFeeInfo(selectedStudent.id);
                            }
                          }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
                        >
                          <option value="">All Terms</option>
                          {getUniqueTerms().map((term) => (
                            <option key={term} value={term}>{term}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
                        <select
                          value={selectedAcademicYear}
                          onChange={(e) => {
                            const newYear = e.target.value;
                            setSelectedAcademicYear(newYear);
                            // Only apply filter if term or year is selected
                            if (selectedTerm || newYear) {
                              handleFilterChange(selectedTerm, newYear);
                            } else {
                              handleFilterChange('', '');
                            }
                            // Refresh student fee info
                            if (selectedStudent) {
                              refreshStudentFeeInfo(selectedStudent.id);
                            }
                          }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
                        >
                          <option value="">All Years</option>
                          {getUniqueAcademicYears().map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Filter status indicator */}
                    {(selectedTerm || selectedAcademicYear) && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-lg">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Showing {stats.totalStudents} students for {selectedTerm || 'all terms'} {selectedAcademicYear || 'all years'}</span>
                        <button 
                          onClick={() => {
                            setSelectedTerm("");
                            setSelectedAcademicYear("");
                            handleFilterChange("", "");
                            if (selectedStudent) {
                              refreshStudentFeeInfo(selectedStudent.id);
                            }
                          }}
                          className="ml-auto text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fee Info - Shows correct data based on selection */}
                  {(() => {
                    const feeInfo = getStudentFeeInfo(selectedStudent.id, selectedTerm, selectedAcademicYear);
                    const hasExistingRecord = feeInfo.hasRecordForTerm;
                    
                    // Debug logging
                    console.log('📊 Fee Info for student:', selectedStudent.id);
                    console.log('📊 Selected term:', selectedTerm);
                    console.log('📊 Selected year:', selectedAcademicYear);
                    console.log('📊 Has record for term:', hasExistingRecord);
                    console.log('📊 Total demanded:', feeInfo.totalDemanded);
                    console.log('📊 Total paid:', feeInfo.totalPaid);
                    console.log('📊 Fees array:', feeInfo.fees);
                    console.log('📊 All fees:', feeInfo.allFees);
                    
                    return (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {!hasExistingRecord && feeInfo.hasAnyRecord && (
                          <div className="bg-blue-50/80 border border-blue-200/60 rounded-xl p-4 col-span-2 backdrop-blur-sm">
                            <div className="flex items-start gap-2 mb-2">
                              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                              <label className="text-sm font-medium text-blue-800">
                                Student has fees in other terms/years but not for the selected period
                              </label>
                            </div>
                            <p className="text-xs text-blue-600 mb-2">
                              Total paid across all records: {formatUGX(feeInfo.totalPaid)}
                            </p>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">UGX</span>
                              <input
                                type="number"
                                placeholder="Enter total fee amount for this term"
                                value={manualTotalFee}
                                onChange={(e) => setManualTotalFee(e.target.value)}
                                className="w-full pl-14 pr-4 py-2.5 border border-blue-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white/90"
                              />
                            </div>
                          </div>
                        )}
                        {!hasExistingRecord && !feeInfo.hasAnyRecord && (
                          <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 col-span-2 backdrop-blur-sm">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                              <label className="text-sm font-medium text-amber-800">
                                No fee record found for this student
                              </label>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">UGX</span>
                              <input
                                type="number"
                                placeholder="Enter total fee amount for the term"
                                value={manualTotalFee}
                                onChange={(e) => setManualTotalFee(e.target.value)}
                                className="w-full pl-14 pr-4 py-2.5 border border-amber-300/70 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm bg-white/90"
                              />
                            </div>
                          </div>
                        )}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">Total Demanded</p>
                          <p className="font-bold text-gray-800 text-base">
                            {formatUGX(hasExistingRecord ? feeInfo.totalDemanded : (parseFloat(manualTotalFee) || 0))}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-400">Total Paid</p>
                          <p className="font-bold text-emerald-600 text-base">{formatUGX(feeInfo.totalPaid)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 col-span-2">
                          <p className="text-xs text-gray-400">Current Balance</p>
                          <p className={`font-bold text-lg ${
                            Math.max((hasExistingRecord ? feeInfo.totalDemanded : (parseFloat(manualTotalFee) || 0)) - feeInfo.totalPaid, 0) > 0
                              ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {formatUGX(Math.max((hasExistingRecord ? feeInfo.totalDemanded : (parseFloat(manualTotalFee) || 0)) - feeInfo.totalPaid, 0))}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 col-span-2">
                          <p className="text-xs text-gray-400">Status</p>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${feeInfo.statusColor} shadow-sm`}>
                            {feeInfo.statusIcon}
                            {feeInfo.status}
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5">{feeInfo.statusMessage}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment Form */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (UGX)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">UGX</span>
                        <input
                          type="number"
                          placeholder="Enter amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full pl-14 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all"
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1.5 flex justify-between px-1">
                        <span>Balance after payment:</span>
                        <span className="font-medium text-gray-600">{formatUGX(getDynamicBalance())}</span>
                      </div>
                    </div>

                    {/* SMS Toggle - Modernized */}
                    <div className="col-span-2 flex items-center gap-3 mt-1 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          id="sendSms"
                          checked={sendSms}
                          onChange={(e) => setSendSms(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="sendSms" className="text-sm font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer">
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                          Send SMS notification
                        </label>
                      </div>
                      {selectedStudent.parentPhone ? (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedStudent.parentPhone}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          No parent phone
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 mt-2">
                    <button
                      onClick={handleProcessPayment}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Confirm Payment
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentSearch("");
                        setPaymentAmount("");
                        setManualTotalFee("");
                        setSendSms(false);
                        setShowSearchResults(false);
                      }}
                      className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">Search and select a student</p>
                  <p className="text-xs mt-1 text-gray-400">Type the student's name or number above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== IMPORT STUDENTS MODAL (DRAG & DROP CONTAINER) ========== */}
      {showImportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          <div className="w-full max-w-xl bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-700 shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Bulk Import Students</h3>
                  <p className="text-xs text-gray-500">Upload your school spreadsheet rosters</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div
                ref={dragRef}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-50/60 scale-[0.99] shadow-inner' 
                    : 'border-gray-300 hover:border-purple-400 hover:bg-slate-50/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
                
                <div className={`p-4 rounded-full mb-3 transition-colors ${dragActive ? 'bg-purple-200 text-purple-700' : 'bg-purple-50 text-purple-600'}`}>
                  <FileSpreadsheet className="w-8 h-8 animate-pulse" />
                </div>
                
                <p className="text-sm font-semibold text-gray-800">
                  {dragActive ? 'Drop your spreadsheet here' : 'Drag & Drop your student file here'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Accepts Excel (.xlsx, .xls) or CSV files</p>
                
                <button
                  type="button"
                  disabled={isProcessing}
                  className="mt-4 px-4 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Browse Files
                </button>
              </div>

              {isProcessing && (
                <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                      Parsing student document metrics...
                    </span>
                    <span className="font-semibold text-purple-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {uploadStatus && (
                <div className={`p-4 rounded-xl border ${
                  uploadStatus.type === 'success' ? 'bg-emerald-50/90 border-emerald-200/70 text-emerald-800' : 'bg-rose-50/90 border-rose-200/70 text-rose-800'
                }`}>
                  <div className="flex gap-2.5">
                    {uploadStatus.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{uploadStatus.message}</p>
                      {uploadStatus.details && (
                        <div className="text-xs opacity-90 grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 font-medium">
                          <div>Total Rows: {uploadStatus.details.total}</div>
                          <div className="text-emerald-700">Added: +{uploadStatus.details.added}</div>
                          <div className="text-amber-700">Skipped: {uploadStatus.details.skipped}</div>
                          <div className="text-rose-700">Errors: {uploadStatus.details.errorsCount}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    Row Validation Conflicts ({importErrors.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-lg border border-slate-800 space-y-1 divide-y divide-slate-800/50">
                    {importErrors.map((err, idx) => {
                      let message = '';
                      if (typeof err === 'string') {
                        message = err;
                      } else if (err && typeof err === 'object') {
                        if (err.reason) message = err.reason;
                        else if (err.message) message = err.message;
                        else {
                          try {
                            message = JSON.stringify(err);
                          } catch (e) {
                            message = 'Error data could not be stringified';
                          }
                        }
                      } else {
                        message = String(err);
                      }
                      const rowNumber = (typeof err.row === 'number') ? err.row : (idx + 1);
                      return (
                        <div key={idx} className="pt-1 first:pt-0 text-rose-400">
                          <span className="text-slate-500">[Row {rowNumber}]</span> {message}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 border-t border-gray-100">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecretaryQuickActions;