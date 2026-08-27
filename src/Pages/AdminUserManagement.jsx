// Pages/Admin/AdminUserManagement.jsx – COMPLETE WORKING VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Filter, Edit, Trash2, Shield, UserCog,
  Lock, Unlock, CheckCircle, XCircle, AlertCircle, Loader2,
  RefreshCw, Download, Printer, ChevronLeft, ChevronRight,
  Mail, Phone, Calendar, ArrowLeft, Ban, UserCheck, UserX,
  Crown, GraduationCap, School, BookOpen, Briefcase,
  MoreVertical, Eye, Save, X, Sparkles, Brain, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import * as XLSX from 'xlsx';

// ---------- HELPERS ----------
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

// ---------- STAT CARD ----------
const StatCard = ({ icon: Icon, label, value, color }) => {
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

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} border rounded-xl p-3.5 backdrop-blur-sm transition-all duration-300 hover:shadow-md group`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 group-hover:translate-x-8 transition-all duration-500" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 group-hover:translate-x-0 transition-all duration-500" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400/80">{label}</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5 tracking-tight">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconColors[color]} shadow-sm`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

// ---------- MAIN COMPONENT ----------
const AdminUserManagement = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'block', 'unblock', 'delete'
  const [editForm, setEditForm] = useState({
    Fname: '',
    Lname: '',
    Email: '',
    Phonenumber: '',
    role: 'student'
  });
  const [isSaving, setIsSaving] = useState(false);

  // ================= DATA EXTRACTION HELPER =================
  const extractData = (res) => {
    if (!res || !res.data) return null;
    const d = res.data;
    if (d.data !== undefined) return d.data;
    if (d.success && d.data !== undefined) return d.data;
    if (d.users !== undefined) return d.users;
    return d;
  };

  // ================= FETCH USERS =================
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let usersData = [];
      
      // Try primary /users endpoint first
      try {
        const res = await api.get('/users', config);
        const data = extractData(res);
        if (data && Array.isArray(data) && data.length > 0) {
          usersData = data.map(u => ({ ...u, source: 'users' }));
        }
      } catch (e) {
        console.log('📌 /users not available, falling back to combined sources...');
      }

      // If no users from /users, combine students & teachers
      if (usersData.length === 0) {
        try {
          const [studentsRes, teachersRes] = await Promise.allSettled([
            api.get('/students', config),
            api.get('/teachers', config)
          ]);

          const students = studentsRes.status === 'fulfilled' ? extractData(studentsRes.value) || [] : [];
          const teachers = teachersRes.status === 'fulfilled' ? extractData(teachersRes.value) || [] : [];

          // Map students to user-like objects
          const studentUsers = students.map(s => ({
            id: s.id,
            Fname: s.fullName?.split(' ')[0] || s.fullName || 'Student',
            Lname: s.fullName?.split(' ').slice(1).join(' ') || '',
            Email: s.email || s.parentEmail || `${s.studentNumber}@school.ug`,
            Phonenumber: s.parentPhone || s.phoneNumber || '',
            role: 'student',
            status: s.status === 'Active' ? 'active' : s.status === 'Inactive' ? 'inactive' : 'active',
            createdAt: s.createdAt,
            source: 'students'
          }));

          const teacherUsers = teachers.map(t => ({
            id: t.id,
            Fname: t.fullName?.split(' ')[0] || t.fullName || 'Teacher',
            Lname: t.fullName?.split(' ').slice(1).join(' ') || '',
            Email: t.email || `${t.employeeNumber || t.id}@school.ug`,
            Phonenumber: t.phoneNumber || '',
            role: t.role || 'teacher',
            status: t.status === 'Active' ? 'active' : t.status === 'Terminated' ? 'blocked' : 'inactive',
            createdAt: t.createdAt,
            source: 'teachers'
          }));

          usersData = [...studentUsers, ...teacherUsers];
        } catch (e) {
          console.error('❌ Failed to fetch combined users:', e);
        }
      }

      setUsers(usersData);
    } catch (error) {
      console.error('❌ Fetch users error:', error);
      toast.error('Failed to load users. Showing available data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ================= FILTERING =================
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(u =>
        (u.Fname?.toLowerCase().includes(term) || '') ||
        (u.Lname?.toLowerCase().includes(term) || '') ||
        (u.Email?.toLowerCase().includes(term) || '') ||
        (u.Phonenumber?.includes(term) || '')
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }

    return result;
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const currentItems = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ================= STATS =================
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const blocked = users.filter(u => u.status === 'blocked').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const teachers = users.filter(u => u.role === 'teacher').length;
    const students = users.filter(u => u.role === 'student').length;
    const secretaries = users.filter(u => u.role === 'secretary').length;
    return { total, active, blocked, inactive, admins, teachers, students, secretaries };
  }, [users]);

  // ================= ACTIONS =================
  const handleBlockUser = (user) => {
    setSelectedUser(user);
    setConfirmAction('block');
    setShowConfirmModal(true);
  };

  const handleUnblockUser = (user) => {
    setSelectedUser(user);
    setConfirmAction('unblock');
    setShowConfirmModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setConfirmAction('delete');
    setShowConfirmModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      Fname: user.Fname || '',
      Lname: user.Lname || '',
      Email: user.Email || '',
      Phonenumber: user.Phonenumber || '',
      role: user.role || 'student'
    });
    setShowEditModal(true);
  };

  // ================= CONFIRM ACTION (block/unblock/delete) =================
  const confirmActionHandler = async () => {
    if (!selectedUser) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const source = selectedUser.source || 'users';

      if (confirmAction === 'delete') {
        // Delete from appropriate endpoint
        if (source === 'students') {
          await api.delete(`/students/${selectedUser.id}`, config);
        } else if (source === 'teachers') {
          await api.delete(`/teachers/${selectedUser.id}`, config);
        } else {
          await api.delete(`/users/${selectedUser.id}`, config);
        }
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        toast.success('User deleted successfully');
        setShowConfirmModal(false);
        setSelectedUser(null);
        setIsSaving(false);
        return;
      }

      // Block / Unblock – update status
      const newStatus = confirmAction === 'block' ? 'blocked' : 'active';
      let updatePayload = { status: newStatus };
      let endpoint = '';

      if (source === 'students') {
        // Student model uses 'status' field (Active/Inactive) but we'll map
        updatePayload = { status: newStatus === 'active' ? 'Active' : 'Inactive' };
        endpoint = `/students/${selectedUser.id}`;
      } else if (source === 'teachers') {
        // Teacher uses 'status' (Active, Terminated, etc.)
        updatePayload = { status: newStatus === 'active' ? 'Active' : 'Terminated' };
        endpoint = `/teachers/${selectedUser.id}`;
      } else {
        // Users table has 'status' (active/blocked/inactive)
        endpoint = `/users/${selectedUser.id}`;
      }

      await api.put(endpoint, updatePayload, config);

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, status: newStatus } : u
      ));

      toast.success(confirmAction === 'block' ? 'User blocked successfully' : 'User unblocked successfully');
      setShowConfirmModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Action error:', error);
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= SAVE EDIT =================
  const saveEditHandler = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const source = selectedUser.source || 'users';

      let endpoint = '';
      let payload = {};

      if (source === 'students') {
        endpoint = `/students/${selectedUser.id}`;
        payload = {
          fullName: `${editForm.Fname} ${editForm.Lname}`.trim(),
          parentPhone: editForm.Phonenumber,
          // Student doesn't have email; we can ignore or add later
          status: selectedUser.status === 'blocked' ? 'Inactive' : 'Active'
        };
        // Update local state
        setUsers(prev => prev.map(u =>
          u.id === selectedUser.id ? {
            ...u,
            Fname: editForm.Fname,
            Lname: editForm.Lname,
            Phonenumber: editForm.Phonenumber,
            role: editForm.role
          } : u
        ));
      } else if (source === 'teachers') {
        endpoint = `/teachers/${selectedUser.id}`;
        payload = {
          fullName: `${editForm.Fname} ${editForm.Lname}`.trim(),
          email: editForm.Email,
          phoneNumber: editForm.Phonenumber,
          status: selectedUser.status === 'blocked' ? 'Terminated' : 'Active'
        };
        setUsers(prev => prev.map(u =>
          u.id === selectedUser.id ? {
            ...u,
            Fname: editForm.Fname,
            Lname: editForm.Lname,
            Email: editForm.Email,
            Phonenumber: editForm.Phonenumber,
            role: editForm.role
          } : u
        ));
      } else {
        // Users table
        endpoint = `/users/${selectedUser.id}`;
        payload = {
          Fname: editForm.Fname,
          Lname: editForm.Lname,
          Email: editForm.Email,
          Phonenumber: editForm.Phonenumber,
          role: editForm.role,
          status: selectedUser.status
        };
        setUsers(prev => prev.map(u =>
          u.id === selectedUser.id ? {
            ...u,
            Fname: editForm.Fname,
            Lname: editForm.Lname,
            Email: editForm.Email,
            Phonenumber: editForm.Phonenumber,
            role: editForm.role
          } : u
        ));
      }

      await api.put(endpoint, payload, config);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Update error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= EXPORT =================
  const exportCSV = () => {
    const data = [
      ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created'],
      ...filteredUsers.map(u => [
        `${u.Fname || ''} ${u.Lname || ''}`.trim(),
        u.Email || '',
        u.Phonenumber || '',
        u.role || 'user',
        u.status || 'unknown',
        formatDate(u.createdAt)
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `Users_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success('Exported');
  };

  // ================= RENDER =================
  const goBack = () => navigate(-1);

  // Role badge
  const RoleBadge = ({ role }) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      teacher: 'bg-blue-100 text-blue-700 border-blue-200',
      student: 'bg-green-100 text-green-700 border-green-200',
      secretary: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    const cls = colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
        {role || 'user'}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      blocked: 'bg-red-100 text-red-700 border-red-200'
    };
    const cls = colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
        {status || 'unknown'}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="mt-4 text-gray-500 font-medium text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

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
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span>User Management</span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Manage all users, control access, and assign roles</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-xs border border-emerald-200/50">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-xs border border-blue-200/50">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={fetchUsers} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <StatCard icon={Users} label="Total Users" value={stats.total} color="purple" />
          <StatCard icon={UserCheck} label="Active" value={stats.active} color="emerald" />
          <StatCard icon={Ban} label="Blocked" value={stats.blocked} color="red" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <StatCard icon={Crown} label="Admins" value={stats.admins} color="purple" />
          <StatCard icon={GraduationCap} label="Teachers" value={stats.teachers} color="blue" />
          <StatCard icon={School} label="Students" value={stats.students} color="green" />
          <StatCard icon={Briefcase} label="Secretaries" value={stats.secretaries} color="amber" />
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-3 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[180px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="secretary">Secretary</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="text-xs text-gray-500 ml-auto">
              {filteredUsers.length} users found
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl border border-gray-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200/70">
                <tr>
                  <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400 text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No users found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
                            {user.Fname?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">{user.Fname} {user.Lname}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-xs text-gray-600">{user.Email}</p>
                        <p className="text-[10px] text-gray-400">{user.Phonenumber}</p>
                      </td>
                      <td className="p-3"><RoleBadge role={user.role} /></td>
                      <td className="p-3"><StatusBadge status={user.status} /></td>
                      <td className="p-3">
                        <p className="text-[10px] text-gray-500">{formatDate(user.createdAt)}</p>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {user.status === 'blocked' ? (
                            <button
                              onClick={() => handleUnblockUser(user)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Unblock"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(user)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Block"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredUsers.length > perPage && (
            <div className="flex justify-between items-center px-3 py-2 border-t border-gray-200/70">
              <p className="text-[10px] text-gray-500">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-gray-200 rounded-lg text-[10px] disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) page = currentPage - 3 + i;
                    if (page > totalPages) return null;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-0.5 border rounded-lg text-[10px] transition ${
                        currentPage === page
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-gray-200 rounded-lg text-[10px] disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between border-b border-gray-200/70 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-purple-600" /> Edit User
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={saveEditHandler} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.Fname}
                    onChange={(e) => setEditForm({...editForm, Fname: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.Lname}
                    onChange={(e) => setEditForm({...editForm, Lname: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.Email}
                  onChange={(e) => setEditForm({...editForm, Email: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.Phonenumber}
                  onChange={(e) => setEditForm({...editForm, Phonenumber: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="secretary">Secretary</option>
                </select>
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-200/70">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CONFIRM MODAL ================= */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              confirmAction === 'block' ? 'bg-amber-100' :
              confirmAction === 'unblock' ? 'bg-emerald-100' :
              'bg-red-100'
            }`}>
              {confirmAction === 'block' && <Lock className="w-6 h-6 text-amber-600" />}
              {confirmAction === 'unblock' && <Unlock className="w-6 h-6 text-emerald-600" />}
              {confirmAction === 'delete' && <Trash2 className="w-6 h-6 text-red-600" />}
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {confirmAction === 'block' && 'Block User'}
              {confirmAction === 'unblock' && 'Unblock User'}
              {confirmAction === 'delete' && 'Delete User'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {confirmAction === 'block' && `Are you sure you want to block ${selectedUser.Fname}? They will lose access to the system.`}
              {confirmAction === 'unblock' && `Are you sure you want to unblock ${selectedUser.Fname}? They will regain access.`}
              {confirmAction === 'delete' && `Are you sure you want to permanently delete ${selectedUser.Fname}? This cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmActionHandler}
                disabled={isSaving}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white transition shadow-sm flex items-center justify-center gap-2 ${
                  confirmAction === 'block' ? 'bg-amber-600 hover:bg-amber-700' :
                  confirmAction === 'unblock' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;