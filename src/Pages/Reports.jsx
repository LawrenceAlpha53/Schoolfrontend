// Reports.jsx – COMPLETELY CONNECTED TO EXISTING BACKEND
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Users, CheckCircle, XCircle, AlertCircle, Search,
  RefreshCw, Download, Printer, ChevronLeft, ChevronRight,
  Loader2, Award, TrendingUp, UserCheck, UserX, Eye, X,
  Calendar, Clock, School, BookOpen, DollarSign, BarChart3,
  ClipboardCheck, Sparkles, ArrowLeft, LayoutGrid
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ---------- Safe array extraction ----------
const extractArray = (res) => {
  if (!res?.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

const Reports = () => {
  // ================= STATE =================
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [marks, setMarks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // ================= STATS =================
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalFeesDemanded: 0,
    totalFeesCollected: 0,
    totalFeesOutstanding: 0,
    collectionRate: 0,
    totalMarks: 0,
    averageScore: 0,
    passRate: 0,
    attendanceRate: 0,
  });

  // ================= FORMAT HELPERS =================
  const formatUGX = (amount) => {
    if (!amount || isNaN(amount)) return 'UGX 0';
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatCompactUGX = (amount) => {
    if (amount >= 1e9) return `UGX ${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `UGX ${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `UGX ${(amount / 1e3).toFixed(1)}K`;
    return formatUGX(amount);
  };

  // ================= FETCH ALL DATA =================
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, teachersRes, classesRes, subjectsRes, feesRes, marksRes, attendanceRes] =
        await Promise.all([
          api.get('/students', config).catch(() => ({ data: [] })),
          api.get('/teachers', config).catch(() => ({ data: [] })),
          api.get('/classes', config).catch(() => ({ data: [] })),
          api.get('/subjects', config).catch(() => ({ data: [] })),
          api.get('/fees', config).catch(() => ({ data: [] })),
          api.get('/marks', config).catch(() => ({ data: [] })),
          api.get('/attendance/term-summary?term=Term%201&academicYear=' + new Date().getFullYear(), config).catch(() => ({ data: [] })),
        ]);

      const studentsData = extractArray(studentsRes);
      const teachersData = extractArray(teachersRes);
      const classesData = extractArray(classesRes);
      const subjectsData = extractArray(subjectsRes);
      const feesData = extractArray(feesRes);
      const marksData = extractArray(marksRes);
      const attendanceData = attendanceRes.data?.data || attendanceRes.data || [];

      setStudents(studentsData);
      setTeachers(teachersData);
      setClasses(classesData);
      setSubjects(subjectsData);
      setFees(feesData);
      setMarks(marksData);
      setAttendanceSummary(Array.isArray(attendanceData) ? attendanceData : []);

      // ---- Calculate stats ----
      // Fees
      let totalDemanded = 0, totalCollected = 0;
      feesData.forEach(f => {
        totalDemanded += Number(f.totalFee || 0);
        totalCollected += Number(f.amountPaid || 0);
      });
      const totalOutstanding = totalDemanded - totalCollected;
      const collectionRate = totalDemanded > 0 ? (totalCollected / totalDemanded) * 100 : 0;

      // Marks
      const scores = marksData.filter(m => m.score != null).map(m => Number(m.score));
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const passCount = scores.filter(s => s >= 50).length;
      const passRate = scores.length > 0 ? (passCount / scores.length) * 100 : 0;

      // Attendance rate from term summary (average across classes)
      let attRate = 0;
      if (Array.isArray(attendanceData) && attendanceData.length > 0) {
        attRate = attendanceData.reduce((sum, item) => sum + (item.attendanceRate || 0), 0) / attendanceData.length;
      }

      setStats({
        totalStudents: studentsData.length,
        totalTeachers: teachersData.length,
        totalClasses: classesData.length,
        totalSubjects: subjectsData.length,
        totalFeesDemanded: totalDemanded,
        totalFeesCollected: totalCollected,
        totalFeesOutstanding: totalOutstanding,
        collectionRate: Math.round(collectionRate * 10) / 10,
        totalMarks: marksData.length,
        averageScore: Math.round(avgScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        attendanceRate: Math.round(attRate * 10) / 10,
      });
    } catch (err) {
      console.error('Reports fetch error:', err);
      toast.error('Failed to load reports data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ================= STUDENT LIST TABLE =================
  const filteredStudents = students.filter(s =>
    !searchTerm ||
    (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ================= RENDER TABS =================
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'fees', label: 'Fees', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Reports Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time data from your school</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAllData} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 shadow-sm">
            <RefreshCw className="w-4 h-4 inline mr-1" /> Refresh
          </button>
          <button onClick={() => window.print()} className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 text-sm font-medium border border-blue-200">
            <Printer className="w-4 h-4 inline mr-1" /> Print
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white rounded-xl p-1.5 border border-gray-100 shadow-sm flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ================= OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Students" value={stats.totalStudents} color="blue" />
            <StatCard label="Teachers" value={stats.totalTeachers} color="purple" />
            <StatCard label="Classes" value={stats.totalClasses} color="green" />
            <StatCard label="Subjects" value={stats.totalSubjects} color="orange" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Fees Collected" value={formatCompactUGX(stats.totalFeesCollected)} color="emerald" />
            <StatCard label="Outstanding" value={formatCompactUGX(stats.totalFeesOutstanding)} color="rose" />
            <StatCard label="Collection Rate" value={`${stats.collectionRate}%`} color="indigo" />
            <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} color="teal" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Total Marks" value={stats.totalMarks} color="purple" />
            <StatCard label="Average Score" value={`${stats.averageScore}%`} color="blue" />
            <StatCard label="Pass Rate" value={`${stats.passRate}%`} color="emerald" />
          </div>
        </div>
      )}

      {/* ================= STUDENTS ================= */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or number..." className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="p-4 text-left">#</th>
                  <th className="p-4 text-left">Student</th>
                  <th className="p-4 text-left">Adm No</th>
                  <th className="p-4 text-left">Class</th>
                  <th className="p-4 text-center">Gender</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentStudents.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-gray-400">No students found</td></tr>
                ) : (
                  currentStudents.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-500">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                      <td className="p-4 font-medium">{s.fullName}</td>
                      <td className="p-4 font-mono text-xs text-gray-600">{s.studentNumber || '—'}</td>
                      <td className="p-4">{s.class?.className || 'N/A'}</td>
                      <td className="p-4 text-center">{s.gender || '-'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredStudents.length > itemsPerPage && (
              <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
                <span className="text-sm text-gray-500">{((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}</span>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 border rounded-lg text-sm ${p === currentPage ? 'bg-indigo-600 text-white' : ''}`}>{p}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= FEES ================= */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Demanded" value={formatCompactUGX(stats.totalFeesDemanded)} color="blue" />
            <StatCard label="Total Collected" value={formatCompactUGX(stats.totalFeesCollected)} color="emerald" />
            <StatCard label="Outstanding" value={formatCompactUGX(stats.totalFeesOutstanding)} color="rose" />
            <StatCard label="Collection Rate" value={`${stats.collectionRate}%`} color="indigo" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="p-4 text-left">Student</th>
                  <th className="p-4 text-right">Total Fee</th>
                  <th className="p-4 text-right">Paid</th>
                  <th className="p-4 text-right">Balance</th>
                  <th className="p-4 text-center">Term</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fees.slice(0, 50).map(f => {
                  const paid = Number(f.amountPaid || 0);
                  const total = Number(f.totalFee || 0);
                  const balance = total - paid;
                  const student = students.find(s => s.id === f.studentId);
                  return (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{student?.fullName || 'Unknown'}</td>
                      <td className="p-4 text-right">{formatUGX(total)}</td>
                      <td className="p-4 text-right text-emerald-600">{formatUGX(paid)}</td>
                      <td className={`p-4 text-right font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatUGX(balance)}</td>
                      <td className="p-4 text-center">{f.term || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= PERFORMANCE ================= */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Total Marks" value={stats.totalMarks} color="purple" />
            <StatCard label="Average Score" value={`${stats.averageScore}%`} color="blue" />
            <StatCard label="Pass Rate" value={`${stats.passRate}%`} color="emerald" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="p-4 text-left">Student</th>
                  <th className="p-4 text-left">Subject</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Exam</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {marks.slice(0, 50).map(m => {
                  const student = students.find(s => s.id === m.studentId);
                  const subject = subjects.find(s => s.id === m.subjectId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{student?.fullName || 'Unknown'}</td>
                      <td className="p-4">{subject?.subjectName || 'Unknown'}</td>
                      <td className="p-4 text-center font-bold">{m.score}%</td>
                      <td className="p-4 text-center">{m.examType || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ATTENDANCE ================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Overall Rate" value={`${stats.attendanceRate}%`} color="indigo" />
            <StatCard label="Classes" value={attendanceSummary.length} color="blue" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="p-4 text-left">Class</th>
                  <th className="p-4 text-center">Present</th>
                  <th className="p-4 text-center">Absent</th>
                  <th className="p-4 text-center">Late</th>
                  <th className="p-4 text-center">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attendanceSummary.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.className}</td>
                    <td className="p-4 text-center text-emerald-600">{item.present}</td>
                    <td className="p-4 text-center text-rose-600">{item.absent}</td>
                    <td className="p-4 text-center text-amber-600">{item.late}</td>
                    <td className="p-4 text-center font-bold">{item.attendanceRate?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Small helper card
const StatCard = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return (
    <div className={`rounded-xl p-4 border shadow-sm ${colors[color] || colors.blue}`}>
      <p className="text-xs font-medium uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default Reports;