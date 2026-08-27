// AIFullReport.jsx - DEDICATED PAGE FOR FULL AI REPORT
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Users,
  DollarSign,
  GraduationCap,
  Award,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Lightbulb,
  Target,
  Rocket,
  Shield,
  BarChart3,
  PieChart,
  LineChart,
  Sparkles,
  ArrowLeft,
  Download,
  Printer,
  Share2,
  FileText
} from 'lucide-react';

const AIFullReport = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // ✅ Only fetch endpoints that exist
      const [
        studentsRes, teachersRes, classesRes, subjectsRes,
        feesRes, marksRes, attendanceRes, usersRes
      ] = await Promise.all([
        axios.get("/students", config).catch(() => ({ data: { data: [] } })),
        axios.get("/teachers", config).catch(() => ({ data: { data: [] } })),
        axios.get("/classes", config).catch(() => ({ data: { data: [] } })),
        axios.get("/subjects", config).catch(() => ({ data: { data: [] } })),
        axios.get("/fees", config).catch(() => ({ data: { data: [] } })),
        axios.get("/marks", config).catch(() => ({ data: { data: [] } })),
        axios.get("/attendance/class/1/date/" + new Date().toISOString().split('T')[0], config).catch(() => ({ data: { data: [] } })),
        axios.get("/users", config).catch(() => ({ data: { data: [] } }))
      ]);

      const students = studentsRes.data?.data || studentsRes.data || [];
      const teachers = teachersRes.data?.data || teachersRes.data || [];
      const classes = classesRes.data?.data || classesRes.data || [];
      const subjects = subjectsRes.data?.data || subjectsRes.data || [];
      const fees = feesRes.data?.data || feesRes.data || [];
      const marks = marksRes.data?.data || marksRes.data || [];
      const attendance = attendanceRes.data?.data || [];
      const users = usersRes.data?.data || usersRes.data || [];

      // Compute all metrics
      const totalStudents = students.length;
      const totalTeachers = teachers.length;
      const totalClasses = classes.length;
      const totalSubjects = subjects.length;
      const totalUsers = users.length;

      let totalFeesDemanded = 0,
          totalFeesCollected = 0,
          totalFeesOutstanding = 0;
      fees.forEach(f => {
        const total = Number(f.totalFee || 0);
        const paid = Number(f.amountPaid || 0);
        totalFeesDemanded += total;
        totalFeesCollected += paid;
        totalFeesOutstanding += total - paid;
      });
      const feeCollectionRate = totalFeesDemanded > 0 ? (totalFeesCollected / totalFeesDemanded) * 100 : 0;

      const allScores = marks
        .filter(m => m.score !== null && m.score !== undefined)
        .map(m => Number(m.score));
      const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      const passRate = allScores.length > 0 ? allScores.filter(s => s >= 50).length / allScores.length * 100 : 0;
      const failingRate = 100 - passRate;

      let attendanceRate = 0;
      if (attendance.length > 0) {
        const present = attendance.filter(a => a.status === 'present').length;
        attendanceRate = (present / attendance.length) * 100;
      }

      // Growth metrics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const currentMonthStudents = students.filter(s => {
        const date = new Date(s.createdAt || s.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length;

      const lastMonthStudents = students.filter(s => {
        const date = new Date(s.createdAt || s.created_at);
        return date.getMonth() === lastMonth && date.getFullYear() === lastYear;
      }).length;

      const enrollmentGrowth = lastMonthStudents > 0 ? ((currentMonthStudents - lastMonthStudents) / lastMonthStudents) * 100 : 0;

      const teacherStudentRatio = totalTeachers > 0 ? totalStudents / totalTeachers : 0;
      const avgClassSize = totalClasses > 0 ? totalStudents / totalClasses : 0;

      setMetrics({
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalUsers,
        totalFeesDemanded,
        totalFeesCollected,
        totalFeesOutstanding,
        feeCollectionRate,
        avgScore,
        passRate,
        failingRate,
        attendanceRate,
        enrollmentGrowth,
        teacherStudentRatio,
        avgClassSize
      });

      // Generate analysis
      const aiReport = generateAIReport({
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalUsers,
        totalFeesDemanded,
        totalFeesCollected,
        totalFeesOutstanding,
        feeCollectionRate,
        avgScore,
        passRate,
        failingRate,
        attendanceRate,
        enrollmentGrowth,
        teacherStudentRatio,
        avgClassSize
      });

      setAnalysis(aiReport);

    } catch (error) {
      console.error('❌ Error fetching AI data:', error);
      toast.error('Failed to load AI report');
      setAnalysis({
        summary: 'Unable to generate report. Please refresh.',
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        strategies: [],
        fullReport: 'Data unavailable.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ================= AI GENERATION ENGINE =================
  const generateAIReport = (data) => {
    const {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalUsers,
      totalFeesDemanded,
      totalFeesCollected,
      totalFeesOutstanding,
      feeCollectionRate,
      avgScore,
      passRate,
      failingRate,
      attendanceRate,
      enrollmentGrowth,
      teacherStudentRatio,
      avgClassSize
    } = data;

    const strengths = [];
    const weaknesses = [];
    const opportunities = [];
    const threats = [];

    if (enrollmentGrowth > 5) strengths.push(`Strong enrollment growth of ${enrollmentGrowth.toFixed(1)}% this month.`);
    else if (enrollmentGrowth < -5) weaknesses.push(`Enrollment declined by ${Math.abs(enrollmentGrowth).toFixed(1)}% this month.`);
    else opportunities.push(`Maintain stable enrollment by implementing a referral program.`);

    if (feeCollectionRate > 80) strengths.push(`Excellent fee collection rate of ${feeCollectionRate.toFixed(1)}%.`);
    else if (feeCollectionRate > 50) {
      weaknesses.push(`Fee collection rate is ${feeCollectionRate.toFixed(1)}%, below target.`);
      threats.push(`Outstanding fees of UGX ${totalFeesOutstanding.toLocaleString()}.`);
    } else {
      threats.push(`Critical fee collection rate of ${feeCollectionRate.toFixed(1)}%.`);
    }

    if (avgScore > 70) strengths.push(`Average score of ${avgScore.toFixed(1)}% indicates strong academics.`);
    else if (avgScore > 50) weaknesses.push(`Average score of ${avgScore.toFixed(1)}% is moderate.`);
    else threats.push(`Low average score of ${avgScore.toFixed(1)}%.`);

    if (passRate > 80) strengths.push(`High pass rate of ${passRate.toFixed(1)}%.`);
    else if (passRate > 50) weaknesses.push(`Pass rate of ${passRate.toFixed(1)}% needs improvement.`);

    if (attendanceRate > 90) strengths.push(`Excellent attendance rate of ${attendanceRate.toFixed(1)}%.`);
    else if (attendanceRate > 70) weaknesses.push(`Attendance rate of ${attendanceRate.toFixed(1)}% is below optimal.`);
    else threats.push(`Low attendance rate of ${attendanceRate.toFixed(1)}%.`);

    if (teacherStudentRatio < 25) strengths.push(`Good teacher-student ratio of ${teacherStudentRatio.toFixed(1)}.`);
    else if (teacherStudentRatio > 40) weaknesses.push(`High teacher-student ratio of ${teacherStudentRatio.toFixed(1)}.`);

    if (avgClassSize < 30) strengths.push(`Average class size of ${avgClassSize.toFixed(1)} is conducive.`);
    else if (avgClassSize > 50) weaknesses.push(`Large class sizes (${avgClassSize.toFixed(1)}).`);

    if (totalSubjects < 20) opportunities.push(`Expand subject offering.`);
    if (totalTeachers < 10) opportunities.push(`Increase teaching staff.`);

    // Strategies
    const strategies = [];

    if (enrollmentGrowth < 5) {
      strategies.push({
        category: 'Enrollment',
        title: 'Referral Program',
        description: 'Incentivize parents to refer new students.',
        impact: 'High',
        effort: 'Low',
        timeline: '1-2 months'
      });
      strategies.push({
        category: 'Enrollment',
        title: 'School Open Day',
        description: 'Host an open day to attract prospective parents.',
        impact: 'High',
        effort: 'Medium',
        timeline: '1 month'
      });
    }

    if (feeCollectionRate < 80) {
      strategies.push({
        category: 'Finance',
        title: 'Automated Fee Reminders',
        description: 'Send SMS/email reminders for due payments.',
        impact: 'High',
        effort: 'Low',
        timeline: 'Immediate'
      });
      strategies.push({
        category: 'Finance',
        title: 'Payment Plans',
        description: 'Allow installment payments to ease burden.',
        impact: 'Medium',
        effort: 'Medium',
        timeline: '1 month'
      });
    }

    if (avgScore < 70) {
      strategies.push({
        category: 'Academics',
        title: 'Remedial Classes',
        description: 'Extra lessons for underperforming students.',
        impact: 'High',
        effort: 'Medium',
        timeline: 'Ongoing'
      });
      strategies.push({
        category: 'Academics',
        title: 'Teacher Training',
        description: 'Professional development for teachers.',
        impact: 'Medium',
        effort: 'High',
        timeline: '3-6 months'
      });
    }

    if (attendanceRate < 85) {
      strategies.push({
        category: 'Attendance',
        title: 'Attendance Incentives',
        description: 'Reward perfect attendance.',
        impact: 'Medium',
        effort: 'Low',
        timeline: '1 month'
      });
    }

    if (totalTeachers < 15 && totalStudents > 100) {
      strategies.push({
        category: 'Staffing',
        title: 'Recruit More Teachers',
        description: 'Reduce class sizes to improve quality.',
        impact: 'High',
        effort: 'High',
        timeline: '3 months'
      });
    }

    if (totalSubjects < 15) {
      strategies.push({
        category: 'Curriculum',
        title: 'Add New Subjects',
        description: 'Expand curriculum to attract more students.',
        impact: 'Medium',
        effort: 'Medium',
        timeline: '3-6 months'
      });
    }

    const fullReport = `
╔═══════════════════════════════════════════════════════════════════════╗
║  📊 SCHOOL AI INTELLIGENCE REPORT                                   ║
║  Generated: ${new Date().toLocaleString()}                           ║
╚═══════════════════════════════════════════════════════════════════════╝

📌 Executive Summary
─────────────────────────────────────────────────────────────────────────
Your school has ${totalStudents} students, ${totalTeachers} teachers, and ${totalClasses} classes.
Enrollment growth is ${enrollmentGrowth > 0 ? '+' : ''}${enrollmentGrowth.toFixed(1)}%.
Fee collection: ${feeCollectionRate.toFixed(1)}% (Outstanding: UGX ${totalFeesOutstanding.toLocaleString()})
Academic performance: ${avgScore.toFixed(1)}% average (Pass rate: ${passRate.toFixed(1)}%)
Attendance: ${attendanceRate.toFixed(1)}%

📈 STRENGTHS
─────────────────────────────────────────────────────────────────────────
${strengths.length ? strengths.map(s => `✓ ${s}`).join('\n') : 'No significant strengths identified.'}

⚠️ WEAKNESSES
─────────────────────────────────────────────────────────────────────────
${weaknesses.length ? weaknesses.map(w => `✗ ${w}`).join('\n') : 'No major weaknesses identified.'}

🚀 OPPORTUNITIES
─────────────────────────────────────────────────────────────────────────
${opportunities.length ? opportunities.map(o => `○ ${o}`).join('\n') : 'Explore new opportunities.'}

🔥 THREATS
─────────────────────────────────────────────────────────────────────────
${threats.length ? threats.map(t => `● ${t}`).join('\n') : 'No immediate threats.'}

💡 RECOMMENDED STRATEGIES
─────────────────────────────────────────────────────────────────────────
${strategies.map((s, idx) => `
Strategy ${idx+1}: ${s.title}
  Category: ${s.category}
  Description: ${s.description}
  Impact: ${s.impact} | Effort: ${s.effort} | Timeline: ${s.timeline}
`).join('\n')}

📊 KEY METRICS
─────────────────────────────────────────────────────────────────────────
• Total Students          : ${totalStudents}
• Total Teachers          : ${totalTeachers}
• Total Classes           : ${totalClasses}
• Total Subjects          : ${totalSubjects}
• Teacher-Student Ratio   : 1:${teacherStudentRatio.toFixed(1)}
• Average Class Size      : ${avgClassSize.toFixed(1)}
• Fee Collection Rate     : ${feeCollectionRate.toFixed(1)}%
• Outstanding Fees        : UGX ${totalFeesOutstanding.toLocaleString()}
• Average Score           : ${avgScore.toFixed(1)}%
• Pass Rate               : ${passRate.toFixed(1)}%
• Attendance Rate         : ${attendanceRate.toFixed(1)}%
• Enrollment Growth       : ${enrollmentGrowth > 0 ? '+' : ''}${enrollmentGrowth.toFixed(1)}%

🎯 NEXT STEPS
─────────────────────────────────────────────────────────────────────────
1. ${strategies.length > 0 ? strategies[0].title : 'Monitor key metrics.'}
2. ${strategies.length > 1 ? strategies[1].title : 'Review financial reports.'}
3. Engage with parents for feedback.
4. Invest in teacher development.

🔮 LONG-TERM VISION
─────────────────────────────────────────────────────────────────────────
• Maintain high academic standards
• Enhance parent-school communication
• Diversify revenue streams
• Build a strong school brand

╚═══════════════════════════════════════════════════════════════════════╝
    `;

    return {
      summary: `Your school has ${totalStudents} students, ${totalTeachers} teachers, and ${totalClasses} classes.`,
      strengths,
      weaknesses,
      opportunities,
      threats,
      strategies,
      fullReport
    };
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Generating AI Intelligence Report...</p>
          <p className="text-sm text-gray-400">Analyzing your school data</p>
        </div>
      </div>
    );
  }

  // ================= RENDER =================
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Brain className="w-7 h-7 text-purple-600" />
              AI Intelligence Report
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Comprehensive analysis of your school's performance
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => { fetchData(); setIsRefreshing(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm"
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-2">📌 Executive Summary</h2>
        <p className="text-purple-100">{analysis?.summary}</p>
        <p className="text-purple-200 text-sm mt-2">
          Report generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
          <p className="text-xs text-blue-600 font-medium">Students</p>
          <p className="text-2xl font-bold text-blue-700">{metrics.totalStudents || 0}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
          <p className="text-xs text-emerald-600 font-medium">Fee Collection</p>
          <p className="text-2xl font-bold text-emerald-700">{metrics.feeCollectionRate?.toFixed(1) || 0}%</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 text-center">
          <p className="text-xs text-purple-600 font-medium">Pass Rate</p>
          <p className="text-2xl font-bold text-purple-700">{metrics.passRate?.toFixed(1) || 0}%</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
          <p className="text-xs text-amber-600 font-medium">Attendance</p>
          <p className="text-2xl font-bold text-amber-700">{metrics.attendanceRate?.toFixed(1) || 0}%</p>
        </div>
      </div>

      {/* SWOT Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h3 className="font-semibold text-emerald-700 flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" /> Strengths
          </h3>
          <ul className="space-y-1 text-sm text-slate-700">
            {analysis?.strengths.length ? (
              analysis.strengths.map((s, i) => <li key={i}>• {s}</li>)
            ) : (
              <li className="text-slate-400">No strengths identified</li>
            )}
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5" /> Weaknesses
          </h3>
          <ul className="space-y-1 text-sm text-slate-700">
            {analysis?.weaknesses.length ? (
              analysis.weaknesses.map((w, i) => <li key={i}>• {w}</li>)
            ) : (
              <li className="text-slate-400">No major weaknesses</li>
            )}
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" /> Opportunities
          </h3>
          <ul className="space-y-1 text-sm text-slate-700">
            {analysis?.opportunities.length ? (
              analysis.opportunities.map((o, i) => <li key={i}>• {o}</li>)
            ) : (
              <li className="text-slate-400">No opportunities found</li>
            )}
          </ul>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-700 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" /> Threats
          </h3>
          <ul className="space-y-1 text-sm text-slate-700">
            {analysis?.threats.length ? (
              analysis.threats.map((t, i) => <li key={i}>• {t}</li>)
            ) : (
              <li className="text-slate-400">No immediate threats</li>
            )}
          </ul>
        </div>
      </div>

      {/* Strategies */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Recommended Strategies
        </h3>
        <div className="space-y-3">
          {analysis?.strategies.length ? (
            analysis.strategies.map((s, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-blue-600 font-bold text-sm">{i+1}.</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{s.title}</h4>
                    <p className="text-sm text-slate-600 mt-0.5">{s.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Impact: {s.impact}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Effort: {s.effort}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Timeline: {s.timeline}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">No strategies generated</div>
          )}
        </div>
      </div>

      {/* Full Report */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Detailed Report
        </h3>
        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
          {analysis?.fullReport || 'No report available'}
        </pre>
      </div>
    </div>
  );
};

export default AIFullReport;