// SecretaryAnalytics.jsx – Professionally Connected to Backend
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart,
  PieChart, Pie, Cell
} from "recharts";
import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  Wallet, TrendingUp, Users, Calendar, Eye,
  School, Award, BookOpen, FileText, CheckCircle, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

// ================= DATA EXTRACTOR =================
const extractArray = (res) => {
  if (!res?.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9'];

const SecretaryAnalytics = () => {
  const [feeData, setFeeData] = useState([]);
  const [admissionsData, setAdmissionsData] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);
  const [schoolStats, setSchoolStats] = useState({
    totalTeachers: 0, totalClasses: 0, totalSubjects: 0, pendingDocuments: 0
  });
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0, totalStudents: 0, averageRevenue: 0, growthRate: 0
  });

  // ================= FORMAT HELPERS =================
  const formatUGX = (amount) => {
    if (!amount || isNaN(amount)) return "UGX 0";
    return new Intl.NumberFormat("en-UG", {
      style: "currency", currency: "UGX", minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
  };

  // ================= FETCH ANALYTICS =================
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
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

        // School stats
        const studentsWithFees = new Set(fees.map(f => f.studentId).filter(Boolean));
        const pendingDocs = Math.max(0, students.length - studentsWithFees.size);

        setSchoolStats({
          totalTeachers: teachers.length,
          totalClasses: classes.length,
          totalSubjects: subjects.length,
          pendingDocuments: pendingDocs
        });

        // Monthly data
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyRevenue = {};
        const monthlyAdmissions = {};
        monthNames.forEach(m => { monthlyRevenue[m] = 0; monthlyAdmissions[m] = 0; });

        fees.forEach(f => {
          const d = f.createdAt || f.paymentDate || f.created_at;
          if (d) {
            const month = monthNames[new Date(d).getMonth()];
            monthlyRevenue[month] += Number(f.amountPaid || 0);
          }
        });

        students.forEach(s => {
          const d = s.createdAt || s.created_at;
          if (d) {
            const month = monthNames[new Date(d).getMonth()];
            monthlyAdmissions[month]++;
          }
        });

        setFeeData(monthNames.map(m => ({
          month: m,
          amount: +(monthlyRevenue[m] / 1000000).toFixed(2),
          rawAmount: monthlyRevenue[m]
        })));

        setAdmissionsData(monthNames.map(m => ({
          month: m,
          students: monthlyAdmissions[m]
        })));

        // Payment methods
        const methods = {};
        fees.forEach(f => {
          const method = f.paymentMethod || 'Other';
          const paid = Number(f.amountPaid || 0);
          if (paid > 0) methods[method] = (methods[method] || 0) + paid;
        });

        setPaymentMethodData(Object.entries(methods).map(([name, value]) => ({
          name,
          value: +(value / 1000000).toFixed(2)
        })));

        // Summary
        const totalRevenue = fees.reduce((s, f) => s + Number(f.amountPaid || 0), 0);
        setSummaryStats({
          totalRevenue,
          totalStudents: students.length,
          averageRevenue: students.length > 0 ? totalRevenue / students.length : 0,
          growthRate: 0
        });

      } catch (error) {
        console.error("Analytics Error:", error);
        toast.error("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // ================= TOOLTIPS =================
  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 min-w-[180px]">
          <p className="font-bold text-gray-800 text-lg">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">Collected: <span className="font-bold text-purple-700">{formatUGX(d.rawAmount)}</span></p>
            <p className="text-xs text-gray-400">UGX {d.amount}M</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 min-w-[140px]">
          <p className="font-bold text-gray-800 text-lg">{label}</p>
          <p className="text-sm text-gray-600 mt-1">Students: <span className="font-bold text-blue-700 text-xl">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const total = paymentMethodData.reduce((s, i) => s + i.value, 0);
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-200 min-w-[140px]">
          <p className="font-bold text-gray-800">{payload[0].name}</p>
          <p className="text-sm text-gray-600">UGX {payload[0].value}M</p>
          <p className="text-xs text-gray-400">{((payload[0].value / total) * 100).toFixed(0)}%</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Teachers', value: schoolStats.totalTeachers, icon: Award, color: 'purple' },
          { label: 'Total Classes', value: schoolStats.totalClasses, icon: School, color: 'blue' },
          { label: 'Total Subjects', value: schoolStats.totalSubjects, icon: BookOpen, color: 'emerald' },
          { label: 'Pending Documents', value: schoolStats.pendingDocuments, icon: schoolStats.pendingDocuments > 0 ? FileText : CheckCircle, color: schoolStats.pendingDocuments > 0 ? 'amber' : 'emerald' },
        ].map((s, i) => (
          <div key={i} className={`bg-${s.color}-50 rounded-xl border border-${s.color}-200 p-4 shadow-sm hover:shadow-md transition`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
              <div className={`w-10 h-10 bg-${s.color}-200 rounded-full flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 text-${s.color}-700`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Fee Collections Line */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-purple-600" /> Monthly Fee Collections
          </h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={feeData} onMouseMove={e => {
                if (e?.activePayload?.length) {
                  setHoveredMonth(e.activePayload[0].payload.month);
                  setHoveredValue(e.activePayload[0].payload.amount);
                }
              }} onMouseLeave={() => { setHoveredMonth(null); setHoveredValue(null); }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="amount" name="UGX Millions" stroke="#7c3aed" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {hoveredMonth && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">{hoveredMonth}: <span className="font-bold text-purple-700">{formatUGX(feeData.find(d => d.month === hoveredMonth)?.rawAmount || 0)}</span></span>
            </div>
          )}
        </div>

        {/* Admissions Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" /> Student Admissions
          </h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={admissionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend />
                <Bar dataKey="students" name="New Students" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Pie */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-pink-600" /> Payment Methods
          </h2>
          <div className="h-[320px]">
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" labelLine={true} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                    {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No payment data yet</div>
            )}
          </div>
        </div>

        {/* Revenue Trend Area */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Revenue Trend
          </h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="amount" name="UGX Millions" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600" /> Quick Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-gray-500">Top Collection Month</p>
            <p className="text-lg font-bold text-purple-700">
              {feeData.reduce((max, i) => i.amount > max.amount ? i : max, { amount: 0, month: 'N/A' }).month}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-gray-500">Popular Payment Method</p>
            <p className="text-lg font-bold text-purple-700">
              {paymentMethodData.reduce((max, i) => i.value > max.value ? i : max, { value: 0, name: 'N/A' }).name}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-gray-500">Year-to-Date</p>
            <p className="text-lg font-bold text-purple-700">
              {feeData.reduce((s, i) => s + i.amount, 0).toFixed(1)}M UGX
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretaryAnalytics;