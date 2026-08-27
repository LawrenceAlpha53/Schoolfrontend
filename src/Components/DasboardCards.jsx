import {
  Users, GraduationCap, School, BookOpen, DollarSign,
  ClipboardCheck, TrendingUp, Activity, X, Eye, Plus,
  Search, Loader2, Edit, Trash2, Save, AlertCircle,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import toast from "react-hot-toast";

const extractData = (res, label = '') => {
  if (!res?.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.success && Array.isArray(d.data)) return d.data;
  return [];
};

const DashboardCards = () => {
  const [studentsCount, setStudentsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);
  const [feesCollected, setFeesCollected] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [performanceRate, setPerformanceRate] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [trends, setTrends] = useState({});
  const [previousData, setPreviousData] = useState({});

  const [selectedCard, setSelectedCard] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `UGX ${(amount / 1000).toFixed(0)}K`;
    return `UGX ${amount}`;
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { setIsLoading(false); return; }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const prev = { students: studentsCount, teachers: teachersCount, classes: classCount, subjects: subjectCount, fees: feesCollected, attendance: attendanceRate, performance: performanceRate, users: activeUsers };
      setPreviousData(prev);

      const [studentsRes, teachersRes, classRes, subjectRes, feesRes, marksRes, usersRes] = await Promise.all([
        axios.get("/students", config).catch(() => ({ data: [] })),
        axios.get("/teachers", config).catch(() => ({ data: [] })),
        axios.get("/classes", config).catch(() => ({ data: [] })),
        axios.get("/subjects", config).catch(() => ({ data: [] })),
        axios.get("/fees", config).catch(() => ({ data: [] })),
        axios.get("/marks", config).catch(() => ({ data: [] })),
        axios.get("/users", config).catch(() => ({ data: [] }))
      ]);

      const students = extractData(studentsRes);
      const teachers = extractData(teachersRes);
      const classes = extractData(classRes);
      const subjects = extractData(subjectRes);
      const fees = extractData(feesRes);
      const marks = extractData(marksRes);
      const users = extractData(usersRes);

      const totalFees = fees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
      const scores = marks.filter(m => m.score != null).map(m => Number(m.score));
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      setStudentsCount(students.length);
      setTeachersCount(teachers.length);
      setClassCount(classes.length);
      setSubjectCount(subjects.length);
      setFeesCollected(totalFees);
      setAttendanceRate(0);
      setPerformanceRate(avgScore);
      setActiveUsers(users.length);

      setTrends({
        students: students.length > prev.students ? 'up' : students.length < prev.students ? 'down' : 'same',
        teachers: teachers.length > prev.teachers ? 'up' : teachers.length < prev.teachers ? 'down' : 'same',
        classes: classes.length > prev.classes ? 'up' : classes.length < prev.classes ? 'down' : 'same',
        subjects: subjects.length > prev.subjects ? 'up' : subjects.length < prev.subjects ? 'down' : 'same',
        fees: totalFees > prev.fees ? 'up' : totalFees < prev.fees ? 'down' : 'same',
        performance: avgScore > prev.performance ? 'up' : avgScore < prev.performance ? 'down' : 'same',
        users: users.length > prev.users ? 'up' : users.length < prev.users ? 'down' : 'same'
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailData = async (cardType) => {
    try {
      setIsDetailLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let data = [], statsData = {};
      let options = {};

      switch(cardType) {
        case 'students': {
          const [sRes, cRes] = await Promise.all([axios.get("/students", config), axios.get("/classes", config)]);
          data = extractData(sRes);
          const classes = extractData(cRes);
          const classMap = {}; classes.forEach(c => { classMap[c.id] = c.className; });
          data = data.map(s => ({ ...s, className: classMap[s.classId] || 'N/A' }));
          statsData = { total: data.length, male: data.filter(s => s.gender === 'Male' || s.gender === 'male').length, female: data.filter(s => s.gender === 'Female' || s.gender === 'female').length };
          options = { classes: classes.map(c => ({ value: c.id, label: c.className })), statuses: ['Active', 'Inactive', 'Graduated'] };
          break;
        }
        case 'teachers': {
          // ✅ FIXED: Uses 'subjects' (plural) from the many-to-many relationship
          const [tRes, cRes, sRes] = await Promise.all([
            axios.get("/teachers", config), 
            axios.get("/classes", config), 
            axios.get("/subjects", config)
          ]);
          
          data = extractData(tRes);
          const classes = extractData(cRes);
          const subjects = extractData(sRes);
          
          const classMap = {};
          classes.forEach(c => { classMap[c.id] = c.className; });
          
          const subjectMap = {};
          subjects.forEach(s => { subjectMap[s.id] = s.subjectName; });
          
          // ✅ Handle multiple subjects per teacher
          data = data.map(t => {
            // Get subject names from the subjects array (many-to-many)
            let subjectNames = 'N/A';
            if (t.subjects && t.subjects.length > 0) {
              subjectNames = t.subjects.map(s => s.subjectName).join(', ');
            } else if (t.subjectId && subjectMap[t.subjectId]) {
              // Fallback for backward compatibility if subjectId still exists
              subjectNames = subjectMap[t.subjectId];
            }
            
            return {
              ...t,
              className: t.class ? t.class.className : (classMap[t.classId] || 'N/A'),
              subjectName: subjectNames,  // Comma-separated list of subjects
              subjectsList: t.subjects || [] // Keep the full array for reference
            };
          });
          
          statsData = { total: data.length };
          options = { 
            classes: classes.map(c => ({ value: c.id, label: c.className })), 
            subjects: subjects.map(s => ({ value: s.id, label: s.subjectName })), 
            statuses: ['Active', 'On Leave', 'Suspended', 'Retired', 'Terminated'] 
          };
          break;
        }
        case 'classes': {
          const cRes = await axios.get("/classes", config);
          data = extractData(cRes);
          statsData = { total: data.length };
          break;
        }
        case 'subjects': {
          const sRes = await axios.get("/subjects", config);
          data = extractData(sRes);
          statsData = { total: data.length };
          options = { levels: ['olevel', 'alevel'], categories: ['core', 'science', 'humanities', 'language', 'vocational'] };
          break;
        }
        case 'fees': {
          const [fRes, sRes] = await Promise.all([axios.get("/fees", config), axios.get("/students", config)]);
          data = extractData(fRes);
          const students = extractData(sRes);
          const studentMap = {}; students.forEach(s => { studentMap[s.id] = s.fullName; });
          data = data.map(f => ({ ...f, studentName: studentMap[f.studentId] || 'Unknown', balance: Number(f.totalFee || 0) - Number(f.amountPaid || 0) }));
          const totalCollected = data.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
          const totalDue = data.reduce((sum, f) => sum + Number(f.totalFee || 0), 0);
          statsData = { total: data.length, collected: totalCollected, due: totalDue, balance: totalDue - totalCollected, rate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0 };
          options = { terms: ['Term 1', 'Term 2', 'Term 3'], academicYears: ['2025', '2026', '2027'] };
          break;
        }
        case 'users': {
          const uRes = await axios.get("/users", config);
          data = extractData(uRes);
          statsData = { total: data.length };
          options = { roles: ['admin', 'teacher', 'student', 'secretary'] };
          break;
        }
        case 'performance': {
          const [mRes, sRes, stRes] = await Promise.all([axios.get("/marks", config), axios.get("/subjects", config), axios.get("/students", config)]);
          data = extractData(mRes);
          const subjects = extractData(sRes), students = extractData(stRes);
          const subjectMap = {}, studentMap = {};
          subjects.forEach(s => { subjectMap[s.id] = s.subjectName; });
          students.forEach(s => { studentMap[s.id] = s.fullName; });
          data = data.map(m => ({ ...m, studentName: studentMap[m.studentId] || 'Unknown', subjectName: subjectMap[m.subjectId] || 'Unknown' }));
          const scores = data.filter(m => m.score != null).map(m => Number(m.score));
          statsData = { total: data.length, average: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0, passed: scores.filter(s => s >= 50).length };
          options = { examTypes: ['CAT 1', 'CAT 2', 'CAT 3', 'End of Term', 'Mock'] };
          break;
        }
        default: data = []; statsData = {};
      }

      setDetailData(data);
      setStats(statsData);
      setSelectedCard(cardType);
      setFilterOptions(options);
      setFilters({});
      setSearchTerm('');
      setShowDetailModal(true);
    } catch (error) {
      console.error("Detail error:", error);
      toast.error("Failed to load details");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const getFilteredData = () => {
    let filtered = detailData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(term))
      );
    }
    if (selectedCard === 'students') {
      if (filters.classId) filtered = filtered.filter(s => s.classId == filters.classId);
      if (filters.gender) filtered = filtered.filter(s => s.gender?.toLowerCase() === filters.gender.toLowerCase());
      if (filters.status) filtered = filtered.filter(s => s.status?.toLowerCase() === filters.status.toLowerCase());
    } else if (selectedCard === 'teachers') {
      if (filters.classId) filtered = filtered.filter(t => t.classId == filters.classId);
      if (filters.subjectId) filtered = filtered.filter(t => t.subjectId == filters.subjectId);
      if (filters.status) filtered = filtered.filter(t => t.status?.toLowerCase() === filters.status.toLowerCase());
    } else if (selectedCard === 'subjects') {
      if (filters.level) filtered = filtered.filter(s => s.level === filters.level);
      if (filters.category) filtered = filtered.filter(s => s.category === filters.category);
    } else if (selectedCard === 'fees') {
      if (filters.term) filtered = filtered.filter(f => f.term === filters.term);
      if (filters.academicYear) filtered = filtered.filter(f => f.academicYear === filters.academicYear);
      if (filters.status) {
        if (filters.status === 'paid') filtered = filtered.filter(f => f.balance === 0);
        else if (filters.status === 'unpaid') filtered = filtered.filter(f => f.balance > 0);
      }
    } else if (selectedCard === 'users') {
      if (filters.role) filtered = filtered.filter(u => u.role === filters.role);
    } else if (selectedCard === 'performance') {
      if (filters.examType) filtered = filtered.filter(m => m.examType === filters.examType);
    }
    return filtered;
  };

  const filteredData = getFilteredData();

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      setIsSaving(true);
      let endpoint = '', payload = {};
      switch(selectedCard) {
        case 'students': endpoint = '/students'; payload = { fullName: addFormData.fullName, studentNumber: addFormData.studentNumber || `STU-${Date.now().toString().slice(-6)}`, classId: addFormData.classId || null, status: 'Active' }; break;
        case 'teachers': endpoint = '/teachers'; payload = { fullName: addFormData.fullName, email: addFormData.email, phoneNumber: addFormData.phoneNumber, classId: addFormData.classId || null }; break;
        case 'classes': endpoint = '/classes'; payload = { className: addFormData.className }; break;
        case 'subjects': endpoint = '/subjects'; payload = { subjectName: addFormData.subjectName, subjectCode: addFormData.subjectCode, level: addFormData.level || 'olevel', category: addFormData.category || 'core' }; break;
        default: toast.error('Not available'); return;
      }
      await axios.post(endpoint, payload, config);
      toast.success('Created successfully!');
      setShowAddModal(false);
      setAddFormData({});
      fetchDetailData(selectedCard);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      setIsSaving(true);
      let endpoint = '';
      switch(selectedCard) {
        case 'students': endpoint = `/students/${id}`; break;
        case 'teachers': endpoint = `/teachers/${id}`; break;
        case 'classes': endpoint = `/classes/${id}`; break;
        case 'subjects': endpoint = `/subjects/${id}`; break;
        case 'fees': endpoint = `/fees/${id}`; break;
        default: return;
      }
      await axios.put(endpoint, editData, config);
      toast.success('Updated!');
      setEditingId(null);
      fetchDetailData(selectedCard);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    setIsSaving(true);
    try {
      let endpoint = '', entityName = '';
      switch(selectedCard) {
        case 'students': endpoint = `/students/${id}/force`; entityName = 'student'; break;
        case 'teachers': endpoint = `/teachers/${id}/force`; entityName = 'teacher'; break;
        case 'classes': endpoint = `/classes/${id}`; entityName = 'class'; break;
        case 'subjects': endpoint = `/subjects/${id}`; entityName = 'subject'; break;
        case 'fees': endpoint = `/fees/${id}`; entityName = 'fee record'; break;
        default: toast.error('Cannot delete this type'); return;
      }
      await axios.delete(endpoint, config);
      toast.success(`${entityName} deleted successfully!`);
      setDeleteConfirm(null);
      fetchDetailData(selectedCard);
      fetchDashboardData();
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.data?.message?.includes('foreign key') || error.response?.data?.message?.includes('violates')) {
        toast.error('This record has related data. Please delete all related records first.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getCardConfig = (type) => {
    const configs = {
      students: { 
        title: 'Student Management', 
        headers: ['Name', 'Student No', 'Class', 'Status'], 
        fields: ['fullName', 'studentNumber', 'className', 'status'], 
        addFields: [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true }, 
          { name: 'studentNumber', label: 'Student Number', type: 'text' }, 
          { name: 'classId', label: 'Class ID', type: 'number' }
        ] 
      },
      teachers: { 
        title: 'Teacher Management', 
        headers: ['Name', 'Email', 'Phone', 'Class', 'Subjects', 'Status'],  // ← Changed to "Subjects" (plural)
        fields: ['fullName', 'email', 'phoneNumber', 'className', 'subjectName', 'status'], 
        addFields: [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true }, 
          { name: 'email', label: 'Email', type: 'email', required: true }, 
          { name: 'phoneNumber', label: 'Phone', type: 'text' }, 
          { name: 'classId', label: 'Class ID', type: 'number' }
        ] 
      },
      classes: { 
        title: 'Class Management', 
        headers: ['Class Name', 'Created'], 
        fields: ['className', 'createdAt'], 
        addFields: [
          { name: 'className', label: 'Class Name', type: 'text', required: true }
        ] 
      },
      subjects: { 
        title: 'Subject Management', 
        headers: ['Subject', 'Code', 'Level', 'Category'], 
        fields: ['subjectName', 'subjectCode', 'level', 'category'], 
        addFields: [
          { name: 'subjectName', label: 'Subject Name', type: 'text', required: true }, 
          { name: 'subjectCode', label: 'Subject Code', type: 'text', required: true }, 
          { name: 'level', label: 'Level', type: 'select', options: ['olevel', 'alevel'] }, 
          { name: 'category', label: 'Category', type: 'select', options: ['core', 'science', 'humanities', 'language', 'vocational'] }
        ] 
      },
      fees: { 
        title: 'Fee Management', 
        headers: ['Student', 'Paid', 'Total', 'Balance', 'Term'], 
        fields: ['studentName', 'amountPaid', 'totalFee', 'balance', 'term'] 
      },
      performance: { 
        title: 'Performance', 
        headers: ['Student', 'Subject', 'Score', 'Exam'], 
        fields: ['studentName', 'subjectName', 'score', 'examType'] 
      },
      users: { 
        title: 'User Management', 
        headers: ['First Name', 'Last Name', 'Email', 'Role'], 
        fields: ['Fname', 'Lname', 'Email', 'role'], 
        addFields: [
          { name: 'Fname', label: 'First Name', type: 'text', required: true }, 
          { name: 'Lname', label: 'Last Name', type: 'text' }, 
          { name: 'Email', label: 'Email', type: 'email', required: true }, 
          { name: 'password', label: 'Password', type: 'password', required: true }, 
          { name: 'role', label: 'Role', type: 'select', options: ['student', 'teacher', 'secretary', 'admin'] }
        ] 
      }
    };
    return configs[type] || configs.students;
  };

  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500', border: 'border-indigo-100', bar: 'bg-indigo-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500', border: 'border-blue-100', bar: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500', border: 'border-emerald-100', bar: 'bg-emerald-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500', border: 'border-purple-100', bar: 'bg-purple-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500', border: 'border-amber-100', bar: 'bg-amber-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'text-rose-500', border: 'border-rose-100', bar: 'bg-rose-500' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', icon: 'text-teal-500', border: 'border-teal-100', bar: 'bg-teal-500' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', icon: 'text-slate-500', border: 'border-slate-100', bar: 'bg-slate-500' }
  };

  const cardConfigs = [
    { id: 'students', title: "Total Students", value: studentsCount, icon: Users, color: 'indigo' },
    { id: 'teachers', title: "Total Teachers", value: teachersCount, icon: GraduationCap, color: 'blue' },
    { id: 'classes', title: "Total Classes", value: classCount, icon: School, color: 'emerald' },
    { id: 'subjects', title: "Subjects", value: subjectCount, icon: BookOpen, color: 'purple' },
    { id: 'fees', title: "Fees Collected", value: formatCurrency(feesCollected), icon: DollarSign, color: 'amber' },
    { id: 'attendance', title: "Attendance", value: `${attendanceRate}%`, icon: ClipboardCheck, color: 'rose' },
    { id: 'performance', title: "Performance", value: `${performanceRate}%`, icon: TrendingUp, color: 'teal' },
    { id: 'users', title: "Active Users", value: activeUsers, icon: Activity, color: 'slate' }
  ];

  useEffect(() => { fetchDashboardData(); }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-7 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cardConfigs.map((card, idx) => {
          const Icon = card.icon;
          const trend = trends[card.id] || 'same';
          const c = colorMap[card.color] || colorMap.indigo;

          return (
            <div
              key={idx}
              onClick={() => fetchDetailData(card.id)}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.title}</span>
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                <span className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors flex items-center gap-1">
                  <Eye size={11} /> View Details
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedCard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{getCardConfig(selectedCard).title}</h3>
                <p className="text-sm text-gray-500">{filteredData.length} records</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {Object.keys(stats).length > 0 && (
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 uppercase font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-base font-bold text-gray-800">{typeof value === 'number' && key.includes('rate') ? `${value}%` : typeof value === 'number' && (key === 'collected' || key === 'due' || key === 'balance') ? formatCurrency(value) : value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedCard === 'students' && (
                  <>
                    <select value={filters.classId || ''} onChange={e => setFilters({ ...filters, classId: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Classes</option>
                      {filterOptions.classes?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <select value={filters.gender || ''} onChange={e => setFilters({ ...filters, gender: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <select value={filters.status || ''} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Status</option>
                      {filterOptions.statuses?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}
                {selectedCard === 'teachers' && (
                  <>
                    <select value={filters.classId || ''} onChange={e => setFilters({ ...filters, classId: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Classes</option>
                      {filterOptions.classes?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <select value={filters.subjectId || ''} onChange={e => setFilters({ ...filters, subjectId: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Subjects</option>
                      {filterOptions.subjects?.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select value={filters.status || ''} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Status</option>
                      {filterOptions.statuses?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}
                {selectedCard === 'subjects' && (
                  <>
                    <select value={filters.level || ''} onChange={e => setFilters({ ...filters, level: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Levels</option>
                      {filterOptions.levels?.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select value={filters.category || ''} onChange={e => setFilters({ ...filters, category: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Categories</option>
                      {filterOptions.categories?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                )}
                {selectedCard === 'fees' && (
                  <>
                    <select value={filters.term || ''} onChange={e => setFilters({ ...filters, term: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Terms</option>
                      {filterOptions.terms?.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={filters.academicYear || ''} onChange={e => setFilters({ ...filters, academicYear: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Years</option>
                      {filterOptions.academicYears?.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={filters.status || ''} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </>
                )}
                {selectedCard === 'users' && (
                  <select value={filters.role || ''} onChange={e => setFilters({ ...filters, role: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">All Roles</option>
                    {filterOptions.roles?.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
                {selectedCard === 'performance' && (
                  <select value={filters.examType || ''} onChange={e => setFilters({ ...filters, examType: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">All Exams</option>
                    {filterOptions.examTypes?.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                )}
              </div>

              <button onClick={() => { setAddFormData({}); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium">
                <Plus size={15} /> Add New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-16 text-gray-400">No records found</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {getCardConfig(selectedCard).headers.map((h, i) => (
                          <th key={i} className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                        <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.slice(0, 50).map((item, idx) => {
                        const isEditing = editingId === item.id;
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            {getCardConfig(selectedCard).fields.map((field, fIdx) => {
                              let value = item[field];
                              if (field === 'amountPaid' || field === 'totalFee' || field === 'balance') value = formatCurrency(item[field]);
                              if (field === 'createdAt' && value) value = new Date(value).toLocaleDateString();
                              return (
                                <td key={fIdx} className="p-3 text-gray-700">
                                  {isEditing ? (
                                    <input type="text" name={field} value={editData[field] || ''} onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))} className="w-full px-2 py-1 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                  ) : (
                                    <span className={field === 'status' ? `px-2 py-0.5 rounded-full text-xs font-medium ${value === 'Active' || value === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}` : ''}>
                                      {value || 'N/A'}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => handleUpdate(item.id)} disabled={isSaving} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Save size={15} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"><X size={15} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setEditingId(item.id); setEditData({ ...item }); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={15} /></button>
                                    <button onClick={() => setDeleteConfirm(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">{filteredData.length} records</span>
              <button onClick={() => setShowDetailModal(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && selectedCard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Add New {selectedCard.slice(0, -1)}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-80px)]">
              {getCardConfig(selectedCard).addFields?.map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                  {field.type === 'select' ? (
                    <select name={field.name} value={addFormData[field.name] || ''} onChange={e => setAddFormData(prev => ({ ...prev, [field.name]: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required={field.required}>
                      <option value="">Select...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input type={field.type} name={field.name} value={addFormData[field.name] || ''} onChange={e => setAddFormData(prev => ({ ...prev, [field.name]: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required={field.required} />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-gray-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Record</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-gray-600">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={isSaving} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardCards;