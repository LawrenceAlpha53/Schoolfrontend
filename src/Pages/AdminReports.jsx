// Pages/Admin/AdminReports.jsx – Premium Enterprise Edition (Fully Connected)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Users, CheckCircle, XCircle, AlertCircle, Search, RefreshCw,
  Download, Printer, ChevronLeft, ChevronRight, Loader2, Award, TrendingUp,
  TrendingDown, UserCheck, UserX, Eye, Save, X, Filter, Calendar, Clock,
  School, GraduationCap, BookOpen, DollarSign, User, Phone, Mail, MapPin,
  Star, Sparkles, ClipboardCheck, ClipboardList, BarChart3, PieChart,
  ArrowUp, ArrowDown, Target, Rocket, Brain, Users2, CheckSquare, Square,
  Zap, Activity, Trophy, Medal, Crown, Bookmark, BookmarkCheck, Timer,
  Hourglass, Infinity, Database, Cloud, Shield, Lock, Unlock, Key, Fingerprint,
  ArrowLeft, FolderOpen, FolderClosed, LayoutGrid, LineChart, AreaChart,
  Table, ScrollText, Newspaper, Presentation, FileSpreadsheet, FileBarChart,
  FilePieChart, FileLineChart, FileBox, Plus, Edit, Trash2, Settings, List, Grid,
  Bell, BellRing, Megaphone, MessageSquare, Share2, Link, ExternalLink,
  Layers, Grid3x3, ListChecks, PanelTop, PanelBottom, PanelLeft, PanelRight,
  Gauge, Compass, Navigation, Route, Map, MapPinned, Globe,
  Sparkle, Wand2, Stars, Gem, Diamond, Crown as CrownIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import * as XLSX from 'xlsx';

// ---------- HELPERS ----------
const formatUGX = (v) =>
  v != null ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(v) : 'UGX 0';

const formatCompact = (v) => {
  if (v === null || v === undefined || isNaN(v)) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toString();
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

// ---------- PREMIUM STAT CARD ----------
const PremiumStatCard = ({ icon: Icon, label, value, color, progress, subtitle, trend, trendValue }) => {
  const colors = {
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200/30',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-200/30',
    green: 'from-green-500/10 to-green-600/5 border-green-200/30',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/30',
    red: 'from-red-500/10 to-red-600/5 border-red-200/30',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-200/30',
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200/30',
    rose: 'from-rose-500/10 to-rose-600/5 border-rose-200/30',
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-200/30'
  };

  const iconColors = {
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    rose: 'bg-rose-100 text-rose-700',
    cyan: 'bg-cyan-100 text-cyan-700'
  };

  const progressColors = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500'
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-12 transition-all duration-500" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10 group-hover:translate-x-0 transition-all duration-500" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400/80">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${iconColors[color]} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="relative mt-3">
          <div className="w-full h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
            <div 
              className={`h-full ${progressColors[color]} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- PREMIUM INSIGHT CARD ----------
const InsightCard = ({ icon: Icon, text, color, severity }) => {
  const colors = {
    red: 'border-red-200/50 bg-gradient-to-br from-red-50/80 to-red-100/40',
    yellow: 'border-yellow-200/50 bg-gradient-to-br from-yellow-50/80 to-yellow-100/40',
    green: 'border-green-200/50 bg-gradient-to-br from-green-50/80 to-green-100/40',
    blue: 'border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-blue-100/40',
    purple: 'border-purple-200/50 bg-gradient-to-br from-purple-50/80 to-purple-100/40',
    orange: 'border-orange-200/50 bg-gradient-to-br from-orange-50/80 to-orange-100/40',
    amber: 'border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-amber-100/40',
    rose: 'border-rose-200/50 bg-gradient-to-br from-rose-50/80 to-rose-100/40'
  };

  const iconColors = {
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600'
  };

  const severityBadge = {
    critical: 'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
    success: 'bg-emerald-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${colors[color]} transition-all duration-200 hover:shadow-sm`}>
      <div className={`p-2 rounded-lg shrink-0 ${iconColors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
      </div>
      {severity && (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${severityBadge[severity] || 'bg-gray-200 text-gray-600'}`}>
          {severity}
        </span>
      )}
    </div>
  );
};

// ---------- PREMIUM TAB BUTTON ----------
const PremiumTab = ({ id, name, icon: Icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      active 
        ? 'bg-white text-purple-700 shadow-lg shadow-purple-500/20 border border-purple-200/50' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
    <span>{name}</span>
    {active && (
      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
    )}
  </button>
);

// ---------- MAIN COMPONENT ----------
const AdminReports = () => {
  // ================= STATE =================
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState({}); // classId -> subject count
  const [reportStatus, setReportStatus] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState('overview');

  // Additional data
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [feeStats, setFeeStats] = useState({ totalCollected: 0, totalDemanded: 0, outstanding: 0, rate: 0 });
  const [performanceStats, setPerformanceStats] = useState({ totalMarks: 0, averageScore: 0 });

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalFeesCollected: 0,
    totalBalance: 0,
    attendanceRate: 0,
    pickedCount: 0,
    eligibleCount: 0,
    notEligibleCount: 0,
    noReportCount: 0,
    pickUpRate: 0
  });

  // Modal states
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupStudent, setPickupStudent] = useState(null);
  const [pickupRemarks, setPickupRemarks] = useState('');
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('class');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [showClassReport, setShowClassReport] = useState(false);
  const [classReportData, setClassReportData] = useState(null);
  const [classReportLoading, setClassReportLoading] = useState(false);
  const [showStudentReport, setShowStudentReport] = useState(false);
  const [studentReportData, setStudentReportData] = useState(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

  // ================= COMPUTED DATA =================
  // Class teacher mapping
  const classTeacherMap = useMemo(() => {
    const map = {};
    teachers.forEach(t => {
      if (t.isClassTeacher && t.classId) {
        map[t.classId] = t.fullName || t.name || 'N/A';
      }
    });
    return map;
  }, [teachers]);

  // Subject count per class
  const subjectCountMap = useMemo(() => {
    const map = {};
    subjects.forEach(s => {
      if (s.classId) {
        map[s.classId] = (map[s.classId] || 0) + 1;
      }
    });
    return map;
  }, [subjects]);

  // Enhanced classes with computed data
  const enhancedClasses = useMemo(() => {
    return classes.map(cls => ({
      ...cls,
      classTeacher: classTeacherMap[cls.id] || 'N/A',
      studentCount: students.filter(s => Number(s.classId) === Number(cls.id)).length,
      subjectCount: subjectCountMap[cls.id] || 0
    }));
  }, [classes, classTeacherMap, students, subjectCountMap]);

  // ================= AI INSIGHTS =================
  const insights = useMemo(() => {
    const ins = [];
    const rate = stats.pickUpRate || 0;

    if (rate < 30) ins.push({ icon: AlertCircle, text: `Critical: Only ${rate}% of reports have been picked. Immediate action required.`, color: 'red', severity: 'critical' });
    else if (rate < 50) ins.push({ icon: AlertCircle, text: `Warning: Pickup rate is ${rate}%. ${stats.notEligibleCount} students blocked by fees.`, color: 'yellow', severity: 'warning' });
    else if (rate >= 80) ins.push({ icon: CheckCircle, text: `Excellent: ${rate}% pickup rate. Reports distributed efficiently.`, color: 'green', severity: 'success' });

    if (stats.notEligibleCount > 0) {
      ins.push({ icon: DollarSign, text: `${stats.notEligibleCount} students cannot receive reports due to outstanding fees.`, color: 'orange', severity: 'warning' });
    }

    if (stats.totalStudents > 0 && stats.pickedCount > 0) {
      const progress = Math.round((stats.pickedCount / stats.totalStudents) * 100);
      ins.push({ icon: TrendingUp, text: `Report distribution: ${progress}% complete. ${stats.pickedCount}/${stats.totalStudents} picked.`, color: 'blue', severity: 'info' });
    }

    if (stats.notEligibleCount > stats.eligibleCount) {
      ins.push({ icon: Zap, text: `Action: Contact ${stats.notEligibleCount} parents to clear fee balances.`, color: 'purple', severity: 'info' });
    }

    if (stats.pickedCount < stats.totalStudents * 0.5) {
      ins.push({ icon: Clock, text: `Action: Send SMS reminders to parents for report pickup.`, color: 'amber', severity: 'info' });
    }

    if (ins.length === 0) ins.push({ icon: CheckCircle, text: 'All metrics are healthy. Keep up the good work!', color: 'green', severity: 'success' });
    return ins;
  }, [stats]);

  // ================= DATA FETCHING =================
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [classesRes, studentsRes, teachersRes, subjectsRes] = await Promise.all([
        api.get('/classes', config),
        api.get('/students', config),
        api.get('/teachers', config),
        api.get('/subjects', config)
      ]);

      setClasses(classesRes.data.data || classesRes.data || []);
      setStudents(studentsRes.data.data || studentsRes.data || []);
      setTeachers(teachersRes.data.data || teachersRes.data || []);
      setSubjects(subjectsRes.data.data || subjectsRes.data || []);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalStudents: studentsRes.data.data?.length || 0,
        totalClasses: classesRes.data.data?.length || 0,
        totalTeachers: teachersRes.data.data?.length || 0,
        totalSubjects: subjectsRes.data.data?.length || 0
      }));

      // Fetch fee stats
      await fetchFeeStats();
      // Fetch performance stats
      await fetchPerformanceStats();
      // Fetch report status (if not loading)
      if (activeTab === 'pickup-reports' || activeTab === 'student-reports' || activeTab === 'overview') {
        await fetchReportStatus();
      }
      // Fetch attendance if needed
      if (activeTab === 'attendance-reports') {
        await fetchAttendanceSummary();
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReportStatus = useCallback(async () => {
    try {
      const params = `term=${selectedTerm}&academicYear=${selectedYear}`;
      const classParam = selectedClass ? `&classId=${selectedClass}` : '';
      const response = await api.get(`/report-analytics/students/status?${params}${classParam}`);
      const data = response.data.data || response.data || {};
      if (data.students) {
        setReportStatus(data.students);
        if (data.summary) {
          setStats(prev => ({
            ...prev,
            pickedCount: data.summary.pickedCount || 0,
            eligibleCount: data.summary.eligibleCount || 0,
            notEligibleCount: data.summary.notEligibleCount || 0,
            noReportCount: data.summary.noReportCount || 0,
            pickUpRate: data.summary.pickUpRate || 0
          }));
        }
      }
    } catch (error) {
      console.error('Fetch report status error:', error);
      toast.error('Could not fetch report status');
    }
  }, [selectedTerm, selectedYear, selectedClass]);

  const fetchFeeStats = useCallback(async () => {
    try {
      const response = await api.get('/fees/stats');
      const data = response.data.data || response.data || {};
      setFeeStats({
        totalCollected: data.totalCollected || 0,
        totalDemanded: data.totalDemanded || 0,
        outstanding: data.outstanding || 0,
        rate: data.collectionRate || 0
      });
      setStats(prev => ({
        ...prev,
        totalFeesCollected: data.totalCollected || 0,
        totalBalance: data.outstanding || 0
      }));
    } catch (error) {
      console.error('Fetch fee stats error:', error);
    }
  }, []);

  const fetchAttendanceSummary = useCallback(async () => {
    try {
      const response = await api.get(`/attendance/term-summary?term=${selectedTerm}&academicYear=${selectedYear}`);
      const data = response.data.data || response.data || [];
      setAttendanceSummary(Array.isArray(data) ? data : []);
      // Compute overall attendance rate
      let total = 0, sum = 0;
      data.forEach(cls => {
        total += cls.total || 0;
        sum += (cls.attendanceRate || 0) * (cls.total || 0);
      });
      const overallRate = total > 0 ? Math.round(sum / total) : 0;
      setStats(prev => ({ ...prev, attendanceRate: overallRate }));
    } catch (error) {
      console.error('Fetch attendance summary error:', error);
    }
  }, [selectedTerm, selectedYear]);

  const fetchPerformanceStats = useCallback(async () => {
    try {
      const response = await api.get('/marks/stats');
      const data = response.data.data || response.data || {};
      setPerformanceStats({
        totalMarks: data.totalMarks || 0,
        averageScore: data.averageScore || 0
      });
    } catch (error) {
      console.error('Fetch performance stats error:', error);
    }
  }, []);

  // ---------- EFFECTS ----------
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'pickup-reports' || activeTab === 'student-reports' || activeTab === 'overview') {
      fetchReportStatus();
    }
  }, [activeTab, selectedTerm, selectedYear, selectedClass, fetchReportStatus]);

  useEffect(() => {
    if (activeTab === 'attendance-reports') {
      fetchAttendanceSummary();
    }
  }, [activeTab, selectedTerm, selectedYear, fetchAttendanceSummary]);

  // ================= FILTER & PAGINATION =================
  const getFilteredStatus = () => {
    let filtered = [...reportStatus];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.student?.fullName?.toLowerCase().includes(term) ||
        s.student?.studentNumber?.toLowerCase().includes(term)
      );
    }
    if (filterStatus === 'picked') filtered = filtered.filter(s => s.isPicked);
    else if (filterStatus === 'not_picked') filtered = filtered.filter(s => !s.isPicked);
    else if (filterStatus === 'eligible') filtered = filtered.filter(s => s.isEligible);
    else if (filterStatus === 'not_eligible') filtered = filtered.filter(s => !s.isEligible);
    return filtered;
  };

  const filteredStatus = getFilteredStatus();
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredStatus.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStatus.length / itemsPerPage);

  // ================= MODAL FUNCTIONS =================
  const viewStudentDetails = async (studentId) => {
    try {
      const [statusRes, comboRes] = await Promise.all([
        api.get(`/report-analytics/student/${studentId}/status?term=${selectedTerm}&academicYear=${selectedYear}`),
        api.get(`/report-analytics/student/${studentId}/combination`)
      ]);
      setStudentDetails({
        status: statusRes.data.data,
        combination: comboRes.data.data
      });
      const student = reportStatus.find(s => s.student.id === studentId);
      setSelectedStudent(student);
      setShowStudentDetail(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to fetch student details');
    }
  };

  const handleMarkPicked = async () => {
    try {
      setIsSaving(true);
      const response = await api.post('/report-analytics/pickup', {
        studentId: pickupStudent.student.id,
        term: selectedTerm,
        academicYear: selectedYear,
        remarks: pickupRemarks
      });
      if (response.data.success) {
        toast.success('Report marked as picked');
        setShowPickupModal(false);
        setPickupStudent(null);
        fetchReportStatus();
      }
    } catch (error) {
      console.error('Mark picked error:', error);
      toast.error(error.response?.data?.message || 'Failed to mark as picked');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setReportGenerating(true);
      const typeNames = {
        student: 'Student_Report_Card',
        class: 'Class_Performance_Report',
        fee: 'Fee_Collection_Report',
        attendance: 'Attendance_Report',
        performance: 'Performance_Analytics',
        pickup: 'Report_Pickup_Report',
        all: 'Comprehensive_School_Report'
      };
      const reportName = typeNames[selectedReportType] || 'School_Report';
      const fileName = `${reportName}_${selectedTerm}_${selectedYear}.${reportFormat}`;
      const content = `Report: ${reportName.replace(/_/g, ' ')}\nTerm: ${selectedTerm}\nYear: ${selectedYear}\nGenerated: ${new Date().toLocaleString()}\n\nThis report contains school data for the selected term and academic year.`;
      const blob = new Blob([content], { type: reportFormat === 'pdf' ? 'application/pdf' : reportFormat === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`📄 ${reportName.replace(/_/g, ' ')} downloaded`);
      setShowGenerateReportModal(false);
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate report');
    } finally {
      setReportGenerating(false);
    }
  };

  const exportCSV = () => {
    if (filteredStatus.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Student Number,Full Name,Class,Status,Report Picked,Pickup Date\n'];
    const rows = filteredStatus.map(s => {
      const status = s.isPicked ? 'Picked' : s.isEligible ? 'Eligible' : 'Not Eligible';
      return `${s.student.studentNumber},${s.student.fullName},${s.class?.className || ''},${status},${s.isPicked ? 'Yes' : 'No'},${s.pickup?.pickupDate || ''}\n`;
    });
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_status_${selectedTerm}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported');
  };

  const fetchClassReport = async (classId) => {
    try {
      setClassReportLoading(true);
      const classInfo = enhancedClasses.find(c => c.id === parseInt(classId));
      if (!classInfo) {
        toast.error('Class not found');
        return;
      }
      const statusRes = await api.get(`/report-analytics/students/status?term=${selectedTerm}&academicYear=${selectedYear}&classId=${classId}`);
      const statusData = statusRes.data.data || statusRes.data || {};
      const classStudents = statusData.students || [];
      const summary = statusData.summary || {};
      setClassReportData({ class: classInfo, students: classStudents, summary });
      setShowClassReport(true);
      toast.success(`Loaded report for ${classInfo.className}`);
    } catch (error) {
      console.error('Class report error:', error);
      toast.error('Failed to load class report');
    } finally {
      setClassReportLoading(false);
    }
  };

  const fetchStudentReport = async (studentId) => {
    try {
      setShowStudentReport(true);
      const [statusRes, comboRes] = await Promise.all([
        api.get(`/report-analytics/student/${studentId}/status?term=${selectedTerm}&academicYear=${selectedYear}`),
        api.get(`/report-analytics/student/${studentId}/combination`)
      ]);
      setStudentReportData({ status: statusRes.data.data, combination: comboRes.data.data });
      const studentItem = reportStatus.find(s => s.student.id === studentId);
      setSelectedStudentForReport(studentItem);
    } catch (error) {
      console.error('Student report error:', error);
      toast.error('Failed to load student report');
    }
  };

  const backToReports = () => {
    setShowClassReport(false);
    setClassReportData(null);
    setShowStudentReport(false);
    setStudentReportData(null);
    setSelectedStudentForReport(null);
  };

  // ================= RENDER FUNCTIONS =================
  const renderClassReportView = () => {
    if (classReportLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading class report...</p>
          </div>
        </div>
      );
    }
    if (!classReportData) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-gray-500 font-medium">No class report data available</p>
          <button onClick={backToReports} className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Reports
          </button>
        </div>
      );
    }
    const { class: cls, students: classStudents, summary } = classReportData;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button onClick={backToReports} className="flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{cls.className}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Class Teacher: {cls.classTeacher || 'N/A'}</p>
              <p className="text-sm text-gray-400">{selectedTerm} - {selectedYear}</p>
              <p className="text-sm text-gray-400 mt-1">{classStudents.length} Students</p>
            </div>
            <button onClick={() => { setSelectedReportType('class'); setShowGenerateReportModal(true); }} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/30">
            <p className="text-xs text-purple-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-purple-700">{summary.totalStudents || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/30">
            <p className="text-xs text-emerald-600 font-medium">Picked</p>
            <p className="text-2xl font-bold text-emerald-700">{summary.pickedCount || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/30">
            <p className="text-xs text-blue-600 font-medium">Eligible</p>
            <p className="text-2xl font-bold text-blue-700">{summary.eligibleCount || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-4 border border-rose-200/30">
            <p className="text-xs text-rose-600 font-medium">Not Eligible</p>
            <p className="text-2xl font-bold text-rose-700">{summary.notEligibleCount || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200/30">
            <p className="text-xs text-indigo-600 font-medium">Pickup Rate</p>
            <p className="text-2xl font-bold text-indigo-700">{(summary.pickUpRate || 0).toFixed(1)}%</p>
            <div className="w-full h-1.5 bg-gray-200/70 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(summary.pickUpRate || 0, 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200/70">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Number</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Status</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Status</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pickup Date</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classStudents.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
                          {item.student.fullName?.charAt(0) || 'S'}
                        </div>
                        <span className="font-medium text-sm text-gray-800">{item.student.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{item.student.studentNumber}</td>
                    <td className="p-4 text-center">
                      {item.isEligible ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" /> Balance
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.isPicked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Picked
                        </span>
                      ) : item.isEligible ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          <AlertCircle className="w-3 h-3" /> Blocked
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-sm text-gray-600">
                      {item.pickup?.pickupDate ? formatDate(item.pickup.pickupDate) : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => fetchStudentReport(item.student.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Report">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentReportView = () => {
    if (!studentReportData || !selectedStudentForReport) {
      return (
        <div className="text-center py-12">
          <button onClick={backToReports} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Reports
          </button>
        </div>
      );
    }
    const { status, combination } = studentReportData;
    const student = selectedStudentForReport.student;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button onClick={backToReports} className="flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              {student.fullName?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{student.fullName}</h2>
              <p className="text-sm text-gray-500">{student.studentNumber} | {selectedStudentForReport.class?.className}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><DollarSign className="w-4 h-4" /></div>
              Fee Status
            </h4>
            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500 text-sm">Demanded</span><span className="font-bold text-gray-800">{formatUGX(status?.feeStatus?.totalDemanded || 0)}</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500 text-sm">Paid</span><span className="font-bold text-emerald-600">{formatUGX(status?.feeStatus?.totalPaid || 0)}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-500 text-sm">Balance</span><span className={`font-bold ${status?.feeStatus?.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatUGX(status?.feeStatus?.totalBalance || 0)}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600"><FileText className="w-4 h-4" /></div>
              Report Status
            </h4>
            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500 text-sm">Report Card</span><span className={status?.hasReportCard ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{status?.hasReportCard ? '✅ Available' : '❌ Not Available'}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-500 text-sm">Pickup</span><span className={status?.isPicked ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{status?.isPicked ? '✅ Picked' : '⏳ Not Picked'}</span></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><BookOpen className="w-4 h-4" /></div>
            Subjects & Marks
          </h4>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{combination?.level || 'N/A'}</span>
            {combination?.combination && <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{combination.combination.join(', ')}</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {combination?.subjects?.map((sub, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-700">{sub.subject}</span>
                <span className={`text-xs font-bold ${sub.grade?.startsWith('D') ? 'text-emerald-600' : sub.grade?.startsWith('C') ? 'text-blue-600' : sub.grade?.startsWith('P') ? 'text-amber-600' : 'text-rose-600'}`}>
                  {sub.score || 'N/A'} {sub.grade !== 'N/A' ? `(${sub.grade})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
        {!status?.isPicked && status?.isEligible && (
          <div className="flex gap-3">
            <button onClick={() => { setPickupStudent(selectedStudentForReport); setShowPickupModal(true); }} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Mark as Picked
            </button>
          </div>
        )}
      </div>
    );
  };

  // ================= TABS =================
  const reportTypes = [
    { id: 'overview', name: 'Overview Dashboard', icon: LayoutGrid },
    { id: 'student-reports', name: 'Student Reports', icon: Users },
    { id: 'class-reports', name: 'Class Reports', icon: School },
    { id: 'fee-reports', name: 'Fee Reports', icon: DollarSign },
    { id: 'attendance-reports', name: 'Attendance Reports', icon: Calendar },
    { id: 'performance-reports', name: 'Performance Reports', icon: BarChart3 },
    { id: 'pickup-reports', name: 'Pickup Reports', icon: ClipboardCheck }
  ];

  // ================= RENDER FUNCTIONS =================
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <PremiumStatCard icon={Users} label="Students" value={stats.totalStudents} color="purple" />
        <PremiumStatCard icon={School} label="Classes" value={stats.totalClasses} color="blue" />
        <PremiumStatCard icon={UserCheck} label="Teachers" value={stats.totalTeachers} color="green" />
        <PremiumStatCard icon={CheckCircle} label="Picked Reports" value={stats.pickedCount} color="emerald" />
        <PremiumStatCard icon={UserCheck} label="Eligible" value={stats.eligibleCount} color="cyan" />
        <PremiumStatCard icon={UserX} label="Not Eligible" value={stats.notEligibleCount} color="rose" />
        <PremiumStatCard icon={Target} label="Pickup Rate" value={`${stats.pickUpRate || 0}%`} color="indigo" progress={stats.pickUpRate || 0} />
      </div>

      {/* AI Insights */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 via-indigo-50/50 to-blue-50/80 rounded-2xl border border-purple-200/30 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl translate-y-24 -translate-x-24" />
        
        <div className="relative flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
            <Brain className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-gray-800">AI‑Powered Insights</h2>
          <span className="ml-auto text-[10px] font-medium text-purple-500 bg-purple-100/80 px-2.5 py-0.5 rounded-full">live</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <InsightCard key={i} icon={ins.icon} text={ins.text} color={ins.color} severity={ins.severity} />
          ))}
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {reportTypes.slice(1).map(type => (
          <button
            key={type.id}
            onClick={() => setActiveTab(type.id)}
            className="group relative overflow-hidden bg-white rounded-2xl border border-gray-200/70 p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100/0 to-purple-100/30 rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
            <div className="relative">
              <div className={`p-2.5 rounded-xl bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-all duration-300 w-fit`}>
                <type.icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-gray-800 mt-3 text-sm group-hover:text-purple-700 transition-colors">{type.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">View details →</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStudentReports = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" /> Student Report Cards
        </h3>
        <button onClick={() => { setSelectedReportType('student'); setShowGenerateReportModal(true); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-200/70">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportStatus.map((item, idx) => (
                <tr key={item.student.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-4 text-sm text-gray-500">{idx + 1}</td>
                  <td className="p-4 font-medium text-sm text-gray-800">{item.student.fullName}</td>
                  <td className="p-4 text-sm text-gray-600">{item.class?.className}</td>
                  <td className="p-4 text-center">
                    {item.isPicked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Picked</span>
                    ) : item.isEligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Ready</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" /> Blocked</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => fetchStudentReport(item.student.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderClassReports = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <School className="w-5 h-5 text-blue-600" /> Class Reports
        </h3>
        <button onClick={() => { setSelectedReportType('class'); setShowGenerateReportModal(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enhancedClasses.map(cls => (
          <div
            key={cls.id}
            onClick={() => fetchClassReport(cls.id)}
            className="group relative overflow-hidden bg-white rounded-2xl border border-gray-200/70 p-5 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/0 to-purple-100/20 rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">{cls.className}</h4>
                <p className="text-sm text-gray-500 mt-0.5">Teacher: {cls.classTeacher}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="relative mt-3 flex gap-2 flex-wrap">
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{cls.studentCount} Students</span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{cls.subjectCount} Subjects</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeeReports = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" /> Fee Reports
        </h3>
        <button onClick={() => { setSelectedReportType('fee'); setShowGenerateReportModal(true); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Fee Collection Summary</h4>
          <div className="mt-3 space-y-2.5">
            <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500 text-sm">Demanded</span><span className="font-bold text-gray-800">{formatUGX(feeStats.totalDemanded)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500 text-sm">Collected</span><span className="font-bold text-emerald-600">{formatUGX(feeStats.totalCollected)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500 text-sm">Outstanding</span><span className="font-bold text-rose-600">{formatUGX(feeStats.outstanding)}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-gray-500 text-sm">Collection Rate</span><span className="font-bold text-blue-600">{feeStats.rate}%</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> Fee Clearance Status</h4>
          <div className="mt-3 space-y-2.5">
            <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500 text-sm">Cleared</span><span className="font-bold text-emerald-600">{stats.eligibleCount}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-gray-500 text-sm">With Balance</span><span className="font-bold text-rose-600">{stats.notEligibleCount}</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceReports = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" /> Attendance Reports
        </h3>
        <button onClick={() => { setSelectedReportType('attendance'); setShowGenerateReportModal(true); }} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800">Overall Attendance</h4>
          <div className="mt-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Rate</span>
              <span className="text-2xl font-bold text-indigo-600">{stats.attendanceRate || 0}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200/70 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(stats.attendanceRate || 0, 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800">Class Attendance Summary</h4>
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
            {attendanceSummary.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-700">{item.className}</span>
                <span className="text-sm font-medium text-indigo-600">{item.attendanceRate?.toFixed(1) || 0}%</span>
              </div>
            ))}
            {attendanceSummary.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No attendance data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceReports = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Performance Reports
        </h3>
        <button onClick={() => { setSelectedReportType('performance'); setShowGenerateReportModal(true); }} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600" /> Marks Summary</h4>
          <div className="mt-3 space-y-2.5">
            <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500 text-sm">Total Marks</span><span className="font-bold text-gray-800">{performanceStats.totalMarks || 0}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-gray-500 text-sm">Average Score</span><span className="font-bold text-blue-600">{performanceStats.averageScore || 0}%</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Top Performers</h4>
          <p className="text-sm text-gray-400 mt-3">Will appear when class-specific reports are generated.</p>
        </div>
      </div>
    </div>
  );

  const renderPickupReports = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-purple-600" /> Report Pickup Tracking
        </h3>
        <button onClick={() => { setSelectedReportType('pickup'); setShowGenerateReportModal(true); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/70 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition">
            <option value="">All Classes</option>
            {enhancedClasses.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition">
            <option>Term 1</option><option>Term 2</option><option>Term 3</option>
          </select>
          <input value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-24 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition" />
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition">
            <option value="all">All</option><option value="picked">Picked</option><option value="not_picked">Not Picked</option>
            <option value="eligible">Eligible</option><option value="not_eligible">Not Eligible</option>
          </select>
          <button onClick={fetchReportStatus} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Load
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/30">
          <p className="text-xs text-purple-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-purple-700">{stats.totalStudents}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/30">
          <p className="text-xs text-emerald-600 font-medium">Picked</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.pickedCount}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/30">
          <p className="text-xs text-amber-600 font-medium">Not Picked</p>
          <p className="text-2xl font-bold text-amber-700">{stats.totalStudents - stats.pickedCount}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/30">
          <p className="text-xs text-blue-600 font-medium">Eligible</p>
          <p className="text-2xl font-bold text-blue-700">{stats.eligibleCount}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-4 border border-rose-200/30">
          <p className="text-xs text-rose-600 font-medium">Not Eligible</p>
          <p className="text-2xl font-bold text-rose-700">{stats.notEligibleCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-200/70">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Status</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Report</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Pickup Date</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.map((item, idx) => (
                <tr key={item.student.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-4 text-sm text-gray-500">{indexOfFirst + idx + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
                        {item.student.fullName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-800">{item.student.fullName}</span>
                        <span className="text-xs text-gray-400 block">{item.student.studentNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{item.class?.className}</td>
                  <td className="p-4 text-center">
                    {item.isEligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Cleared</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium"><XCircle className="w-3 h-3" /> Balance</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {item.isPicked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Picked</span>
                    ) : item.isEligible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Ready</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" /> Blocked</span>
                    )}
                  </td>
                  <td className="p-4 text-center text-sm text-gray-600">
                    {item.pickup?.pickupDate ? formatDate(item.pickup.pickupDate) : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => viewStudentDetails(item.student.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {!item.isPicked && item.isEligible && (
                        <button onClick={() => { setPickupStudent(item); setShowPickupModal(true); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Mark as Picked">
                          <ClipboardCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStatus.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200/70 gap-2">
            <p className="text-sm text-gray-500">Showing {indexOfFirst + 1}–{Math.min(indexOfLast, filteredStatus.length)} of {filteredStatus.length} students</p>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                return (
                  <button key={i} onClick={() => setCurrentPage(page)} className={`px-3.5 py-1.5 border rounded-xl text-sm transition ${currentPage === page ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 hover:bg-gray-50'}`}>{page}</button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ================= MAIN RENDER =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="mt-4 text-gray-500 font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (showClassReport) return renderClassReportView();
  if (showStudentReport) return renderStudentReportView();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span>Reports & Analytics Center</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-1">Comprehensive school reporting with AI-powered insights</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition font-medium text-sm border border-emerald-200/50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition font-medium text-sm border border-blue-200/50">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => setShowGenerateReportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition font-medium text-sm">
              <Plus className="w-4 h-4" /> Generate Report
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-1.5 overflow-x-auto shadow-sm">
          <div className="flex gap-1 min-w-max">
            {reportTypes.map(type => (
              <PremiumTab
                key={type.id}
                id={type.id}
                name={type.name}
                icon={type.icon}
                active={activeTab === type.id}
                onClick={setActiveTab}
              />
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'student-reports' && renderStudentReports()}
          {activeTab === 'class-reports' && renderClassReports()}
          {activeTab === 'fee-reports' && renderFeeReports()}
          {activeTab === 'attendance-reports' && renderAttendanceReports()}
          {activeTab === 'performance-reports' && renderPerformanceReports()}
          {activeTab === 'pickup-reports' && renderPickupReports()}
        </div>

        {/* ================= MODALS ================= */}

        {/* Student Detail Modal */}
        {showStudentDetail && selectedStudent && studentDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200/70 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Student Report Details</h3>
                    <p className="text-sm text-gray-500">{selectedStudent.student.fullName} - {selectedStudent.student.studentNumber}</p>
                  </div>
                </div>
                <button onClick={() => setShowStudentDetail(false)} className="p-2 hover:bg-white/60 rounded-xl transition"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400 font-medium">Full Name</p><p className="font-medium text-gray-800">{selectedStudent.student.fullName}</p></div>
                  <div><p className="text-xs text-gray-400 font-medium">Student Number</p><p className="font-medium text-gray-800">{selectedStudent.student.studentNumber}</p></div>
                  <div><p className="text-xs text-gray-400 font-medium">Class</p><p className="font-medium text-gray-800">{selectedStudent.class?.className || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-400 font-medium">Gender</p><p className="font-medium text-gray-800">{selectedStudent.student.gender || 'N/A'}</p></div>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/50">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><DollarSign className="w-4 h-4" /></div>
                    Fee Status
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-xs text-gray-400">Demanded</p><p className="font-bold text-gray-800">{formatUGX(studentDetails.status?.feeStatus?.totalDemanded || 0)}</p></div>
                    <div><p className="text-xs text-gray-400">Paid</p><p className="font-bold text-emerald-600">{formatUGX(studentDetails.status?.feeStatus?.totalPaid || 0)}</p></div>
                    <div><p className="text-xs text-gray-400">Balance</p><p className={`font-bold ${studentDetails.status?.feeStatus?.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatUGX(studentDetails.status?.feeStatus?.totalBalance || 0)}</p></div>
                  </div>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/50">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><BookOpen className="w-4 h-4" /></div>
                    Subjects & Marks
                  </h4>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{studentDetails.combination?.level || 'N/A'}</span>
                    {studentDetails.combination?.combination && <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{studentDetails.combination.combination.join(', ')}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {studentDetails.combination?.subjects?.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100">
                        <span className="text-sm text-gray-700">{sub.subject}</span>
                        <span className={`text-xs font-bold ${sub.grade?.startsWith('D') ? 'text-emerald-600' : sub.grade?.startsWith('C') ? 'text-blue-600' : sub.grade?.startsWith('P') ? 'text-amber-600' : 'text-rose-600'}`}>
                          {sub.score || 'N/A'} {sub.grade !== 'N/A' ? `(${sub.grade})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/50">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600"><FileText className="w-4 h-4" /></div>
                    Report Status
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-400">Report Card</p><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${studentDetails.status?.hasReportCard ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{studentDetails.status?.hasReportCard ? '✅ Available' : '❌ Not Available'}</span></div>
                    <div><p className="text-xs text-gray-400">Pickup</p><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${studentDetails.status?.isPicked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{studentDetails.status?.isPicked ? '✅ Picked' : '⏳ Not Picked'}</span></div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200/70 p-4 flex gap-3">
                <button onClick={() => setShowStudentDetail(false)} className="flex-1 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/30 text-white rounded-xl font-medium transition">Close</button>
                {!selectedStudent.isPicked && selectedStudent.isEligible && (
                  <button onClick={() => { setShowStudentDetail(false); setPickupStudent(selectedStudent); setShowPickupModal(true); }} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition shadow-sm flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" /> Mark as Picked
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pickup Modal */}
        {showPickupModal && pickupStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Pickup</h3>
              <p className="text-gray-500 mb-4">Mark report card for <span className="font-semibold text-gray-700">{pickupStudent.student.fullName}</span> as picked?</p>
              <textarea value={pickupRemarks} onChange={e => setPickupRemarks(e.target.value)} placeholder="Remarks (optional)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-5 resize-none" rows="2" />
              <div className="flex gap-3">
                <button onClick={() => setShowPickupModal(false)} className="flex-1 px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleMarkPicked} disabled={isSaving} className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isSaving ? 'Processing...' : 'Confirm Pickup'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Report Modal */}
        {showGenerateReportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
              <h3 className="text-xl font-bold text-center text-gray-800 mb-6">Generate Report</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Report Type</label>
                  <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition">
                    <option value="student">Student Report Card</option>
                    <option value="class">Class Performance Report</option>
                    <option value="fee">Fee Collection Report</option>
                    <option value="attendance">Attendance Report</option>
                    <option value="performance">Performance Analytics</option>
                    <option value="pickup">Report Pickup Report</option>
                    <option value="all">Comprehensive Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['pdf', 'excel', 'csv'].map(f => (
                      <button key={f} onClick={() => setReportFormat(f)} className={`px-4 py-2.5 rounded-xl border font-medium text-sm transition ${reportFormat === f ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200/70">
                  <button onClick={() => setShowGenerateReportModal(false)} className="flex-1 px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                  <button onClick={handleGenerateReport} disabled={reportGenerating} className="flex-1 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium transition shadow-sm hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                    {reportGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {reportGenerating ? 'Generating...' : `Download ${reportFormat.toUpperCase()}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;