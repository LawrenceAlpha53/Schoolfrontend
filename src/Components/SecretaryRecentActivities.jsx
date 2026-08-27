// components/SecretaryRecentActivity.jsx – FUTURE-READY SCALING (EXPECTS GROWTH)
import {
  TrendingUp, TrendingDown, DollarSign, Users, School, Award,
  AlertTriangle, CheckCircle, Clock, CreditCard, Brain, Sparkles,
  Rocket, Target, Shield, Bell, BookOpen
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// ================= SAFE DATA EXTRACTOR =================
const extractArray = (res) => {
  if (!res?.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

// ================= METRIC CARD =================
const MetricCard = ({ icon, value, label, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600', orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color] || colors.blue}`}>{icon}</div>
        <div>
          <p className="text-xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
};

// ================= SCHOOL TARGETS (EXPECTING MASSIVE GROWTH) =================
const TARGET_STUDENTS = 7000000;      // 7 million target students
const TARGET_TEACHERS = 140000;       // 1 teacher per 50 students
const TARGET_CLASSES = 140000;        // 1 class per teacher
const TARGET_REVENUE_PER_STUDENT = 500000; // UGX 500K avg per student
const TARGET_TOTAL_REVENUE = TARGET_STUDENTS * TARGET_REVENUE_PER_STUDENT;

// ================= REAL HEALTH SCORE (FUTURE-READY, ALL METRICS SCALED) =================
const calculateHealthScore = (students, fees, teachers, classes) => {
  // 1. ENROLLMENT PROGRESS (0-20 pts) – % of target students registered
  const enrollmentRate = (students.length / TARGET_STUDENTS) * 100;
  const enrollmentScore = Math.min(20, Math.round((enrollmentRate / 100) * 20));

  // 2. FEE RECORDS COVERAGE (0-15 pts) – % of target students with fee records
  const studentsWithFees = new Set(fees.map(f => Number(f.studentId)).filter(Boolean));
  const coverageRate = (studentsWithFees.size / TARGET_STUDENTS) * 100;
  const coverageScore = Math.min(15, Math.round((coverageRate / 100) * 15));

  // 3. REVENUE COLLECTION (0-20 pts) – % of target revenue collected
  let totalPaid = 0;
  fees.forEach(f => { totalPaid += Number(f.amountPaid || 0); });
  const revenueRate = (totalPaid / TARGET_TOTAL_REVENUE) * 100;
  const revenueScore = Math.min(20, Math.round((revenueRate / 100) * 20));

  // 4. STUDENTS PAYING (0-15 pts) – % of target students who have paid anything
  const whoPaid = new Set(fees.filter(f => Number(f.amountPaid || 0) > 0).map(f => Number(f.studentId)));
  const payingRate = (whoPaid.size / TARGET_STUDENTS) * 100;
  const payingScore = Math.min(15, Math.round((payingRate / 100) * 15));

  // 5. FULLY CLEARED (0-10 pts) – % of target students fully paid
  const balances = {};
  fees.forEach(f => {
    const sid = Number(f.studentId); if (!sid) return;
    if (!balances[sid]) balances[sid] = { d: 0, p: 0 };
    balances[sid].d += Number(f.totalFee || 0);
    balances[sid].p += Number(f.amountPaid || 0);
  });
  const fullyPaid = Object.values(balances).filter(b => b.d > 0 && b.p >= b.d).length;
  const fullyPaidRate = (fullyPaid / TARGET_STUDENTS) * 100;
  const fullyPaidScore = Math.min(10, Math.round((fullyPaidRate / 100) * 10));

  // 6. TEACHER STAFFING (0-10 pts) – % of target teachers hired
  const teacherRate = (teachers.length / TARGET_TEACHERS) * 100;
  const teacherScore = Math.min(10, Math.round((teacherRate / 100) * 10));

  // 7. CLASS INFRASTRUCTURE (0-10 pts) – % of target classes created
  const classRate = (classes.length / TARGET_CLASSES) * 100;
  const classScore = Math.min(10, Math.round((classRate / 100) * 10));

  const totalScore = enrollmentScore + coverageScore + revenueScore + payingScore + fullyPaidScore + teacherScore + classScore;

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      enrollment: { label: 'Enrollment', value: enrollmentRate, score: enrollmentScore, max: 20 },
      coverage: { label: 'Fee Records', value: coverageRate, score: coverageScore, max: 15 },
      revenue: { label: 'Revenue', value: revenueRate, score: revenueScore, max: 20 },
      paying: { label: 'Paying', value: payingRate, score: payingScore, max: 15 },
      cleared: { label: 'Cleared', value: fullyPaidRate, score: fullyPaidScore, max: 10 },
      teachers: { label: 'Teachers', value: teacherRate, score: teacherScore, max: 10 },
      classes: { label: 'Classes', value: classRate, score: classScore, max: 10 }
    },
    status: totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : totalScore >= 20 ? 'Poor' : 'Critical',
    color: totalScore >= 80 ? 'emerald' : totalScore >= 60 ? 'blue' : totalScore >= 40 ? 'yellow' : totalScore >= 20 ? 'orange' : 'red',
    grade: totalScore >= 80 ? 'A' : totalScore >= 65 ? 'B' : totalScore >= 50 ? 'C' : totalScore >= 30 ? 'D' : 'F'
  };
};

const SecretaryRecentActivity = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [schoolData, setSchoolData] = useState({
    totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalSubjects: 0,
    totalRevenue: 0, totalDebt: 0, collectionRate: 0, transactions: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [financialHealth, setFinancialHealth] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [performance, setPerformance] = useState({});
  const [healthBreakdown, setHealthBreakdown] = useState({});

  // ================= FORMAT HELPERS =================
  const formatUGX = (amount) => {
    if (!amount || isNaN(amount)) return "UGX 0";
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatCompactUGX = (amount) => {
    if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `UGX ${(amount / 1000).toFixed(0)}K`;
    return formatUGX(amount);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const diffMins = Math.floor((Date.now() - new Date(dateString)) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateString).toLocaleDateString("en-UG", { month: 'short', day: 'numeric' });
  };

  // ================= FETCH ALL DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [studentsRes, feesRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
          api.get("/students", config).catch(() => ({ data: [] })),
          api.get("/fees", config).catch(() => ({ data: [] })),
          api.get("/teachers", config).catch(() => ({ data: [] })),
          api.get("/classes", config).catch(() => ({ data: [] })),
          api.get("/subjects", config).catch(() => ({ data: [] }))
        ]);

        const students = extractArray(studentsRes);
        const fees = extractArray(feesRes);
        const teachers = extractArray(teachersRes);
        const classes = extractArray(classesRes);
        const subjects = extractArray(subjectsRes);

        let totalRevenue = 0, totalDemanded = 0;
        fees.forEach(f => {
          totalRevenue += Number(f.amountPaid || 0);
          totalDemanded += Number(f.totalFee || 0);
        });
        const totalDebt = totalDemanded - totalRevenue;
        const collectionRate = totalDemanded > 0 ? +(totalRevenue / totalDemanded * 100).toFixed(1) : 0;

        setSchoolData({
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalClasses: classes.length,
          totalSubjects: subjects.length,
          totalRevenue, totalDebt, collectionRate,
          transactions: fees.length
        });

        const health = calculateHealthScore(students, fees, teachers, classes);
        setFinancialHealth(health);
        setHealthBreakdown(health.breakdown);

        const paidFees = fees.filter(f => Number(f.amountPaid || 0) > 0)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);
        setRecentPayments(paidFees.map(f => {
          const student = students.find(s => Number(s.id) === Number(f.studentId));
          return {
            id: f.id, student: student?.fullName || 'Unknown',
            amount: Number(f.amountPaid || 0),
            date: f.createdAt || f.paymentDate || new Date(),
            method: f.paymentMethod || 'Cash'
          };
        }));

        const preds = [];
        if (students.length > 0) {
          const uncovered = Math.max(0, TARGET_STUDENTS - students.length);
          preds.push({
            id: 1, title: '📊 Enrollment Progress',
            description: `${students.length} registered • ${uncovered.toLocaleString()} more needed to reach ${TARGET_STUDENTS.toLocaleString()} target`,
            confidence: 'Live',
            icon: <Users className="w-5 h-5 text-blue-400" />
          });
        }
        if (totalDemanded > 0) {
          preds.push({
            id: 2, title: '💰 Revenue vs Target',
            description: `${formatCompactUGX(totalRevenue)} collected of ${formatCompactUGX(TARGET_TOTAL_REVENUE)} target`,
            confidence: 'Live',
            icon: <DollarSign className="w-5 h-5 text-emerald-400" />
          });
        }
        const teacherGap = Math.max(0, TARGET_TEACHERS - teachers.length);
        preds.push({
          id: 3, title: '👨‍🏫 Staffing Gap',
          description: `${teachers.length} teachers • ${teacherGap.toLocaleString()} more needed for ${TARGET_STUDENTS.toLocaleString()} students`,
          confidence: 'Live',
          icon: <Award className="w-5 h-5 text-purple-400" />
        });
        const classGap = Math.max(0, TARGET_CLASSES - classes.length);
        preds.push({
          id: 4, title: '🏫 Infrastructure Gap',
          description: `${classes.length} classes • ${classGap.toLocaleString()} more needed`,
          confidence: 'Live',
          icon: <School className="w-5 h-5 text-orange-400" />
        });
        setPredictions(preds);

        const alertList = [];
        if (students.length < TARGET_STUDENTS * 0.01) alertList.push({ id: 1, type: 'critical', icon: <AlertTriangle className="w-5 h-5 text-red-500" />, title: '🚨 Enrollment Critical', description: `Only ${students.length} of ${TARGET_STUDENTS.toLocaleString()} target students registered` });
        if (teachers.length < TARGET_TEACHERS * 0.01) alertList.push({ id: 2, type: 'warning', icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />, title: '⚠️ Teacher Shortage', description: `${teachers.length} teachers — need ${TARGET_TEACHERS.toLocaleString()}` });
        if (students.length === 0) alertList.push({ id: 3, type: 'info', icon: <Bell className="w-5 h-5 text-blue-500" />, title: 'ℹ️ No Students Registered', description: 'Start by registering students' });
        setAlerts(alertList);

        setPerformance({
          overall: health.status,
          grade: health.grade,
          color: health.score >= 80 ? 'text-emerald-600' : health.score >= 60 ? 'text-blue-600' : health.score >= 40 ? 'text-yellow-600' : 'text-red-600',
          metrics: [
            { name: 'Enrollment', value: (students.length / TARGET_STUDENTS) * 100, max: 100, color: 'purple' },
            { name: 'Teachers Hired', value: (teachers.length / TARGET_TEACHERS) * 100, max: 100, color: 'blue' },
            { name: 'Classes Built', value: (classes.length / TARGET_CLASSES) * 100, max: 100, color: 'emerald' }
          ]
        });

      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`bg-gradient-to-r rounded-2xl p-6 text-white ${
        financialHealth?.score >= 80 ? 'from-emerald-600 to-green-600' :
        financialHealth?.score >= 60 ? 'from-blue-600 to-indigo-600' :
        financialHealth?.score >= 40 ? 'from-yellow-500 to-amber-600' :
        financialHealth?.score >= 20 ? 'from-orange-500 to-red-500' :
        'from-red-600 to-rose-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-white/80" />
              <h2 className="text-2xl font-bold">School Health Score</h2>
            </div>
            <p className="text-white/70 mt-1 text-sm">Target: {TARGET_STUDENTS.toLocaleString()} students • {TARGET_TEACHERS.toLocaleString()} teachers</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{financialHealth?.score || 0}%</div>
            <div className="text-sm text-white/80">{financialHealth?.status || 'N/A'}</div>
            <div className="text-lg font-bold mt-1">Grade: {financialHealth?.grade || 'N/A'}</div>
          </div>
        </div>
        {healthBreakdown && Object.entries(healthBreakdown).length > 0 && (
          <div className="mt-4 grid grid-cols-4 md:grid-cols-7 gap-2">
            {Object.entries(healthBreakdown).map(([key, item]) => (
              <div key={key} className="text-center">
                <div className="text-[10px] text-white/60 mb-1">{item.label}</div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white rounded-full h-1.5" style={{ width: `${(item.score / item.max) * 100}%` }} />
                </div>
                <div className="text-[10px] text-white/80 mt-0.5">{item.score}/{item.max}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={<Users className="w-5 h-5" />} value={schoolData.totalStudents} label="Students" color="blue" />
        <MetricCard icon={<Award className="w-5 h-5" />} value={schoolData.totalTeachers} label="Teachers" color="purple" />
        <MetricCard icon={<School className="w-5 h-5" />} value={schoolData.totalClasses} label="Classes" color="green" />
        <MetricCard icon={<BookOpen className="w-5 h-5" />} value={schoolData.totalSubjects} label="Subjects" color="orange" />
        <MetricCard icon={<DollarSign className="w-5 h-5" />} value={formatCompactUGX(schoolData.totalRevenue)} label="Collected" color="emerald" />
        <MetricCard icon={<AlertTriangle className="w-5 h-5" />} value={formatCompactUGX(schoolData.totalDebt)} label="Outstanding" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-yellow-500" /> Alerts
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{alerts.length}</span>
          </h3>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-gray-500"><CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" /><p className="text-sm">All systems operational!</p></div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border ${alert.type === 'critical' ? 'border-red-200 bg-red-50' : alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
                  <div className="flex items-start gap-3"><div className="mt-0.5">{alert.icon}</div><div className="flex-1"><p className="font-semibold text-gray-800 text-sm">{alert.title}</p><p className="text-sm text-gray-600 mt-0.5">{alert.description}</p><button onClick={() => navigate('/secretary/fees')} className="text-xs font-medium text-purple-600 hover:text-purple-700 mt-2">Take Action →</button></div></div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" /> Growth Targets
          </h3>
          <div className="space-y-3">
            {predictions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No data yet</div>
            ) : (
              predictions.map(pred => (
                <div key={pred.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">{pred.icon}</div>
                  <div className="flex-1"><p className="font-semibold text-gray-800 text-sm">{pred.title}</p><p className="text-sm text-gray-500 mt-0.5">{pred.description}</p><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">{pred.confidence}</span></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <h4 className="text-sm font-medium text-gray-500">Overall Grade</h4>
          <p className={`text-5xl font-bold mt-2 ${performance.color}`}>{performance.grade}</p>
          <p className="text-sm text-gray-600 mt-1">{performance.overall}</p>
        </div>
        {performance.metrics?.map((metric, idx) => {
          const displayValue = Number(metric.value) || 0;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h4 className="text-sm font-medium text-gray-500">{metric.name}</h4>
              <div className="mt-3">
                <div className="flex justify-between text-sm"><span className="font-medium text-gray-700">{displayValue.toFixed(1)}%</span><span className="text-gray-400">of {metric.max}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div className="h-2.5 rounded-full" style={{ width: `${Math.min(displayValue, 100)}%`, backgroundColor: metric.color === 'purple' ? '#7c3aed' : metric.color === 'blue' ? '#3b82f6' : '#10b981' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-green-500" /> Recent Payments
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200"><th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Student</th><th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th><th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Method</th><th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Date</th></tr></thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No recent payments</td></tr>
              ) : (
                recentPayments.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50"><td className="py-3 font-medium text-gray-800">{p.student}</td><td className="py-3 text-emerald-600 font-medium">{formatUGX(p.amount)}</td><td className="py-3 text-gray-600">{p.method}</td><td className="py-3 text-gray-500">{formatTimeAgo(p.date)}</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecretaryRecentActivity;