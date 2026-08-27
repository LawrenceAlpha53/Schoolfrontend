// Pages/Admin/AdminAnalytics.jsx – Compact Edition with Working Quick Actions & Back Button
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, TrendingDown, Users, School, BookOpen, DollarSign,
  FileText, Calendar, CheckCircle, XCircle, AlertCircle, Activity, Zap,
  Target, Award, Clock, UserCheck, UserX, Sparkles, Brain, Rocket,
  RefreshCw, Download, Printer, Loader2, ChevronRight, Eye, Bell,
  MessageSquare, PieChart, LineChart, AreaChart, BarChart,
  ArrowUpRight, ArrowDownRight, Users2, GraduationCap, CreditCard,
  CalendarDays, ClipboardCheck, Globe, Layers, Grid, List, LayoutGrid,
  Star, Trophy, Medal, Crown, Gem, Diamond, Sparkle, Wand2,
  ArrowLeft
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

// ---------- COMPACT STAT CARD ----------
const StatCard = ({ icon: Icon, label, value, color, progress, subtitle, trend, trendValue }) => {
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

  const displayValue = typeof value === 'number' ? formatCompact(value) : value;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} border rounded-xl p-3.5 backdrop-blur-sm transition-all duration-300 hover:shadow-md group`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 group-hover:translate-x-8 transition-all duration-500" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 group-hover:translate-x-0 transition-all duration-500" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400/80">{label}</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5 tracking-tight">{displayValue}</p>
          {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${iconColors[color]} shadow-sm`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="relative mt-2">
          <div className="w-full h-1 bg-gray-200/50 rounded-full overflow-hidden">
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

// ---------- INSIGHT CARD ----------
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
    <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${colors[color]} transition-all duration-200 hover:shadow-sm`}>
      <div className={`p-1.5 rounded-lg shrink-0 ${iconColors[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 leading-relaxed">{text}</p>
      </div>
      {severity && (
        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${severityBadge[severity] || 'bg-gray-200 text-gray-600'}`}>
          {severity}
        </span>
      )}
    </div>
  );
};

// ---------- MINI CHART ----------
const MiniBarChart = ({ data, label, valueKey, color = 'purple' }) => {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const colors = {
    purple: 'bg-purple-400',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    indigo: 'bg-indigo-400',
  };
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-500 mb-2">{label}</p>
      <div className="flex items-end gap-1 h-12">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className={`w-full rounded-t ${colors[color]}`} style={{ height: `${(item[valueKey] / max) * 100}%` }} />
            <span className="text-[7px] text-gray-400 mt-0.5">{item.label.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- MAIN COMPONENT ----------
const AdminAnalytics = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalFeesCollected: 0,
    totalFeesDemanded: 0,
    pendingFees: 0,
    averageScore: 0,
    attendanceRate: 0,
    pickupRate: 0,
    activeUsers: 0,
  });

  const [trends, setTrends] = useState({
    feeTrend: [],
    enrollmentTrend: [],
    attendanceTrend: [],
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [insights, setInsights] = useState([]);

  // ---------- HELPER: Extract data ----------
  const extractData = (res) => {
    if (!res || !res.data) return null;
    const d = res.data;
    if (d.data !== undefined) return d.data;
    if (d.success && d.data !== undefined) return d.data;
    return d;
  };

  // ---------- DATA FETCHING ----------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [
        dashboardRes,
        feesRes,
        studentsRes,
        teachersRes,
        classesRes,
        subjectsRes,
        marksRes,
        pickupRes,
        notificationsRes,
      ] = await Promise.allSettled([
        api.get('/dashboard', config),
        api.get('/fees', config),
        api.get('/students?limit=200', config),
        api.get('/teachers', config),
        api.get('/classes', config),
        api.get('/subjects', config),
        api.get('/marks', config),
        api.get('/report-analytics/students/status?term=Term%201&academicYear=2026', config),
        api.get('/notifications?limit=5', config),
      ]);

      const dashboard = dashboardRes.status === 'fulfilled' ? extractData(dashboardRes.value) || {} : {};
      const fees = feesRes.status === 'fulfilled' ? extractData(feesRes.value) || [] : [];
      const students = studentsRes.status === 'fulfilled' ? extractData(studentsRes.value) || [] : [];
      const teachers = teachersRes.status === 'fulfilled' ? extractData(teachersRes.value) || [] : [];
      const classes = classesRes.status === 'fulfilled' ? extractData(classesRes.value) || [] : [];
      const subjects = subjectsRes.status === 'fulfilled' ? extractData(subjectsRes.value) || [] : [];
      const marks = marksRes.status === 'fulfilled' ? extractData(marksRes.value) || [] : [];
      const pickup = pickupRes.status === 'fulfilled' ? extractData(pickupRes.value) || {} : {};
      const notifications = notificationsRes.status === 'fulfilled' ? extractData(notificationsRes.value) || [] : [];

      // --- Compute stats ---
      const totalStudents = students.length || dashboard.totalStudents || 0;
      const totalTeachers = teachers.length || dashboard.totalTeachers || 0;
      const totalClasses = classes.length || dashboard.totalClasses || 0;
      const totalSubjects = subjects.length || dashboard.totalSubjects || 0;

      let totalCollected = 0, totalDemanded = 0;
      fees.forEach(f => {
        totalCollected += Number(f.amountPaid || 0);
        totalDemanded += Number(f.totalFee || 0);
      });
      const pendingFees = Math.max(0, totalDemanded - totalCollected);

      let totalMarks = 0, markCount = 0;
      marks.forEach(m => {
        const score = Number(m.score || 0);
        if (score > 0) { totalMarks += score; markCount++; }
      });
      const averageScore = markCount ? totalMarks / markCount : 0;

      const attendanceRate = dashboard.attendanceRate || 0;
      const pickupRate = pickup.summary?.pickUpRate || 0;
      const activeUsers = dashboard.activeUsers || 0;

      setStats({
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalFeesCollected: totalCollected,
        totalFeesDemanded: totalDemanded,
        pendingFees,
        averageScore,
        attendanceRate,
        pickupRate,
        activeUsers,
      });

      // --- Trends ---
      const feeMap = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        feeMap[key] = 0;
      }
      fees.forEach(f => {
        const d = new Date(f.paymentDate || f.createdAt);
        if (!isNaN(d)) {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          if (feeMap.hasOwnProperty(key)) {
            feeMap[key] += Number(f.amountPaid || 0);
          }
        }
      });
      const feeTrend = Object.entries(feeMap).map(([month, amount]) => ({ label: month, value: amount }));

      const enrollMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        enrollMap[key] = 0;
      }
      students.forEach(s => {
        const d = new Date(s.createdAt);
        if (!isNaN(d)) {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          if (enrollMap.hasOwnProperty(key)) {
            enrollMap[key] += 1;
          }
        }
      });
      const enrollmentTrend = Object.entries(enrollMap).map(([month, count]) => ({ label: month, value: count }));

      setTrends({ feeTrend, enrollmentTrend, attendanceTrend: [] });

      // --- Top Performers ---
      const studentMap = {};
      marks.forEach(m => {
        const sid = m.studentId;
        if (!sid) return;
        if (!studentMap[sid]) {
          studentMap[sid] = { total: 0, count: 0, name: m.student?.fullName || 'Student' };
        }
        studentMap[sid].total += Number(m.score || 0);
        studentMap[sid].count += 1;
      });
      const top = Object.entries(studentMap)
        .map(([id, data]) => ({
          id,
          name: data.name,
          average: data.count ? data.total / data.count : 0,
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 5);
      setTopPerformers(top);

      // --- Recent Activities ---
      const activities = notifications.map(n => ({
        id: n.id,
        title: n.title || 'Notification',
        message: n.message || '',
        time: n.createdAt,
        type: n.type || 'info',
      }));
      setRecentActivities(activities);

      // --- Insights ---
      const ins = [];
      const rate = pickupRate;
      if (rate < 30) ins.push({ icon: AlertCircle, text: `Critical: Only ${rate}% of reports picked.`, color: 'red', severity: 'critical' });
      else if (rate < 50) ins.push({ icon: AlertCircle, text: `Warning: Pickup rate ${rate}%.`, color: 'yellow', severity: 'warning' });
      else if (rate >= 80) ins.push({ icon: CheckCircle, text: `Excellent: ${rate}% pickup rate.`, color: 'green', severity: 'success' });

      const collRate = totalDemanded > 0 ? Math.round((totalCollected / totalDemanded) * 100) : 0;
      if (collRate < 40) ins.push({ icon: DollarSign, text: `Fee collection at ${collRate}%. Need improvement.`, color: 'red', severity: 'critical' });
      else if (collRate < 70) ins.push({ icon: DollarSign, text: `Fee collection at ${collRate}%.`, color: 'amber', severity: 'warning' });
      else ins.push({ icon: DollarSign, text: `Fee collection healthy at ${collRate}%.`, color: 'green', severity: 'success' });

      if (totalStudents > 0 && totalTeachers > 0) {
        const ratio = (totalStudents / totalTeachers).toFixed(1);
        ins.push({ icon: Users, text: `Student-Teacher ratio: ${ratio}:1`, color: 'blue', severity: 'info' });
      }

      if (ins.length === 0) ins.push({ icon: Sparkles, text: 'All metrics look good.', color: 'green', severity: 'success' });
      setInsights(ins);

    } catch (error) {
      console.error('❌ Fetch analytics error:', error);
      toast.error('Failed to load some analytics data. Showing available data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= EXPORT =================
  const exportCSV = () => {
    const data = [
      ['Metric', 'Value'],
      ['Total Students', stats.totalStudents],
      ['Total Teachers', stats.totalTeachers],
      ['Total Classes', stats.totalClasses],
      ['Total Subjects', stats.totalSubjects],
      ['Total Fees Collected', stats.totalFeesCollected],
      ['Total Fees Demanded', stats.totalFeesDemanded],
      ['Pending Fees', stats.pendingFees],
      ['Average Score', stats.averageScore.toFixed(1)],
      ['Attendance Rate', stats.attendanceRate.toFixed(1)],
      ['Pickup Rate', stats.pickupRate.toFixed(1)],
      ['Active Users', stats.activeUsers],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
    XLSX.writeFile(wb, `Analytics_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success('Exported');
  };

  // ================= NAVIGATION HELPERS =================
  const goBack = () => navigate(-1);

  const goToStudents = () => navigate('/admin/students');
  const goToFees = () => navigate('/admin/fees');
  const goToReports = () => navigate('/admin/reports');
  const goToTimetable = () => navigate('/admin/timetable');

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="mt-4 text-gray-500 font-medium text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // ================= MAIN RENDER =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-600 hover:text-gray-800"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg shadow-purple-500/25">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span>Analytics Dashboard</span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Real‑time insights across your school</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-xs border border-emerald-200/50">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-xs border border-blue-200/50">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards – 2 rows of 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <StatCard icon={Users} label="Students" value={stats.totalStudents} color="blue" />
          <StatCard icon={GraduationCap} label="Teachers" value={stats.totalTeachers} color="purple" />
          <StatCard icon={School} label="Classes" value={stats.totalClasses} color="green" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <StatCard icon={BookOpen} label="Subjects" value={stats.totalSubjects} color="indigo" />
          <StatCard icon={DollarSign} label="Fees Collected" value={stats.totalFeesCollected} color="emerald" subtitle={`Demanded: ${formatCompact(stats.totalFeesDemanded)}`} />
          <StatCard icon={CreditCard} label="Pending Fees" value={stats.pendingFees} color="rose" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <StatCard icon={Target} label="Attendance Rate" value={`${stats.attendanceRate.toFixed(1)}%`} color="cyan" progress={stats.attendanceRate} />
          <StatCard icon={ClipboardCheck} label="Pickup Rate" value={`${stats.pickupRate.toFixed(1)}%`} color="purple" progress={stats.pickupRate} />
          <StatCard icon={Award} label="Avg Score" value={`${stats.averageScore.toFixed(1)}%`} color="amber" />
          <StatCard icon={Users2} label="Active Users" value={stats.activeUsers} color="green" />
        </div>

        {/* AI Insights */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 via-indigo-50/50 to-blue-50/80 rounded-xl border border-purple-200/30 p-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl -translate-y-24 translate-x-24" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-200/20 rounded-full blur-3xl translate-y-16 -translate-x-16" />
          <div className="relative flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
              <Brain className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-gray-800 text-sm">AI Insights</h2>
            <span className="ml-auto text-[9px] font-medium text-purple-500 bg-purple-100/80 px-2 py-0.5 rounded-full">live</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {insights.map((ins, i) => (
              <InsightCard key={i} icon={ins.icon} text={ins.text} color={ins.color} severity={ins.severity} />
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200/70 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
              <LineChart className="w-3.5 h-3.5 text-purple-600" /> Fee Collection
            </h3>
            {trends.feeTrend.length > 0 ? (
              <MiniBarChart data={trends.feeTrend} label="Monthly" valueKey="value" color="purple" />
            ) : (
              <p className="text-xs text-gray-400">No data</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200/70 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Enrollment
            </h3>
            {trends.enrollmentTrend.length > 0 ? (
              <MiniBarChart data={trends.enrollmentTrend} label="Monthly" valueKey="value" color="blue" />
            ) : (
              <p className="text-xs text-gray-400">No data</p>
            )}
          </div>
        </div>

        {/* Performance & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Performers */}
          <div className="bg-white rounded-xl border border-gray-200/70 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Top Performers
            </h3>
            {topPerformers.length > 0 ? (
              <div className="space-y-1.5">
                {topPerformers.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 w-5 h-5 rounded-full flex items-center justify-center">#{i+1}</span>
                      <span className="text-xs font-medium text-gray-800">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-purple-600">{p.average.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No performance data</p>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl border border-gray-200/70 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-indigo-600" /> Recent Activity
            </h3>
            {recentActivities.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className={`p-1 rounded-lg ${act.type === 'warning' ? 'bg-yellow-100' : act.type === 'success' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                      <Bell className="w-3 h-3 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{act.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{act.message}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{formatDate(act.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions – ALL FUNCTIONAL */}
        <div className="bg-white rounded-xl border border-gray-200/70 p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
            <Rocket className="w-3.5 h-3.5 text-purple-600" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={goToStudents}
              className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-left hover:shadow-md transition group"
            >
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600 group-hover:scale-105 transition"><Users className="w-3.5 h-3.5" /></div>
                <span className="text-xs font-medium text-gray-700">Students</span>
              </div>
            </button>
            <button
              onClick={goToFees}
              className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-left hover:shadow-md transition group"
            >
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-105 transition"><DollarSign className="w-3.5 h-3.5" /></div>
                <span className="text-xs font-medium text-gray-700">Fees</span>
              </div>
            </button>
            <button
              onClick={goToReports}
              className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-left hover:shadow-md transition group"
            >
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600 group-hover:scale-105 transition"><FileText className="w-3.5 h-3.5" /></div>
                <span className="text-xs font-medium text-gray-700">Reports</span>
              </div>
            </button>
            <button
              onClick={goToTimetable}
              className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-left hover:shadow-md transition group"
            >
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600 group-hover:scale-105 transition"><Calendar className="w-3.5 h-3.5" /></div>
                <span className="text-xs font-medium text-gray-700">Timetable</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;