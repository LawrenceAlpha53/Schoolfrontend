// Pages/Admin/AdminSettings.jsx
import { useAppSettings } from '../Components/AppSettingsContext';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Save, RefreshCw, Download, Upload, Trash2, AlertTriangle,
  Users, UserCog, Lock, Unlock, Eye, EyeOff, Shield, CheckCircle,
  XCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight, Search,
  Filter, Plus, X, Edit, ArrowLeft, Building, Phone, Mail, Globe,
  Calendar, Clock, Key, Fingerprint,
  Database, HardDrive, Server, Cloud, Archive, BookOpen, School,
  Award, Crown, Megaphone, Bell, MessageSquare, Share2, Link
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import * as XLSX from 'xlsx';




  const saveGeneralSettings = async () => {
    try {
      // ... API call to save settings
      await api.put('/settings/school', payload, config);
      
      // Update global context
      updateSettings({
        currentTerm: generalSettings.currentTerm,
        currentAcademicYear: generalSettings.currentYear,
        schoolName: generalSettings.schoolName,
        schoolMotto: generalSettings.schoolMotto,
        schoolAddress: generalSettings.schoolAddress,
        schoolPhone: generalSettings.schoolPhone,
        schoolEmail: generalSettings.schoolEmail,
        principalName: generalSettings.principalName,
        feeCurrency: generalSettings.currency
      });

      toast.success('Settings saved and applied globally');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

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
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200/30'
  };
  const iconColors = {
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    indigo: 'bg-indigo-100 text-indigo-700'
  };
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} border rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-md group`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 group-hover:translate-x-8 transition-all duration-500" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 group-hover:translate-x-0 transition-all duration-500" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400/80">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5 tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${iconColors[color]} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// ---------- MAIN COMPONENT ----------
const AdminSettings = () => {
  const navigate = useNavigate();

  // ================= REFS =================
  const fetchedRef = useRef(false);
  const fetchInProgressRef = useRef(false);

  // ================= STATE =================
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings (persisted)
  const [generalSettings, setGeneralSettings] = useState({
    schoolName: 'Academic ERP System',
    schoolAddress: 'Kampala, Uganda',
    schoolPhone: '+256 700 000 000',
    schoolEmail: 'info@school.ug',
    schoolMotto: 'Excellence in Education',
    currentTerm: 'Term 1',
    currentYear: new Date().getFullYear().toString(),
    principalName: 'Dr. John Doe',
    currency: 'UGX'
  });

  // Users
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const userPerPage = 8;

  // Reset password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security (local only – no backend)
  const [security, setSecurity] = useState({
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requirePasswordChange: false,
    passwordMinLength: 8,
    requireSpecialChar: true
  });

  // Data stats
  const [dataStats, setDataStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
    fees: 0,
    marks: 0
  });
  const [showFactoryReset, setShowFactoryReset] = useState(false);
  const [factoryResetConfirm, setFactoryResetConfirm] = useState('');

  // ================= DATA EXTRACTION =================
  const extractData = (res) => {
    if (!res || !res.data) return null;
    const d = res.data;
    if (d.data !== undefined) return d.data;
    if (d.success && d.data !== undefined) return d.data;
    return d;
  };

  // ================= DATA FETCHING (Optimized) =================
  const fetchData = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    if (fetchedRef.current) {
      setLoading(false);
      return;
    }

    fetchInProgressRef.current = true;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch school settings
      let schoolData = {};
      try {
        const res = await api.get('/settings/school', config);
        schoolData = extractData(res) || {};
        if (schoolData) {
          setGeneralSettings(prev => ({
            ...prev,
            schoolName: schoolData.schoolName || prev.schoolName,
            schoolAddress: schoolData.schoolAddress || prev.schoolAddress,
            schoolPhone: schoolData.schoolPhone || prev.schoolPhone,
            schoolEmail: schoolData.schoolEmail || prev.schoolEmail,
            schoolMotto: schoolData.schoolMotto || prev.schoolMotto,
            currentTerm: schoolData.currentTerm || prev.currentTerm,
            currentYear: schoolData.currentAcademicYear || prev.currentYear,
            principalName: schoolData.principalName || prev.principalName,
            currency: schoolData.feeCurrency || prev.currency
          }));
        }
      } catch (e) {
        console.warn('School settings endpoint not found, using defaults');
      }

      // Fetch students and teachers
      const [studentsRes, teachersRes, classesRes, subjectsRes, feesRes, marksRes] = await Promise.allSettled([
        api.get('/students', config),
        api.get('/teachers', config),
        api.get('/classes', config),
        api.get('/subjects', config),
        api.get('/fees', config),
        api.get('/marks', config)
      ]);

      const students = studentsRes.status === 'fulfilled' ? extractData(studentsRes.value) || [] : [];
      const teachers = teachersRes.status === 'fulfilled' ? extractData(teachersRes.value) || [] : [];

      const studentUsers = students.map(s => ({
        id: s.id,
        fullName: s.fullName || 'Student',
        email: s.email || s.parentEmail || '',
        phone: s.parentPhone || s.phoneNumber || '',
        role: 'student',
        status: s.status === 'Active' ? 'active' : 'inactive',
        source: 'students'
      }));

      const teacherUsers = teachers.map(t => {
        let fullName = t.fullName || t.name || '';
        if (!fullName && t.Fname) {
          fullName = t.Fname + (t.Lname ? ' ' + t.Lname : '');
        }
        return {
          id: t.id,
          fullName: fullName || 'Teacher',
          email: t.email || '',
          phone: t.phoneNumber || '',
          role: t.role || 'teacher',
          status: t.status === 'Active' ? 'active' : t.status === 'Terminated' ? 'blocked' : 'inactive',
          source: 'teachers'
        };
      });

      const allUsers = [...studentUsers, ...teacherUsers];
      setUsers(allUsers);
      setDataStats(prev => ({
        ...prev,
        students: studentUsers.length,
        teachers: teacherUsers.length,
        classes: classesRes.status === 'fulfilled' ? (extractData(classesRes.value) || []).length : 0,
        subjects: subjectsRes.status === 'fulfilled' ? (extractData(subjectsRes.value) || []).length : 0,
        fees: feesRes.status === 'fulfilled' ? (extractData(feesRes.value) || []).length : 0,
        marks: marksRes.status === 'fulfilled' ? (extractData(marksRes.value) || []).length : 0
      }));

      fetchedRef.current = true;

    } catch (error) {
      console.error('Fetch settings error:', error);
      toast.error('Failed to load some settings');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter users
  useEffect(() => {
    let result = [...users];
    if (userSearch.trim()) {
      const term = userSearch.toLowerCase().trim();
      result = result.filter(u =>
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(result);
    setUserPage(1);
  }, [users, userSearch, roleFilter]);

  const totalUserPages = Math.ceil(filteredUsers.length / userPerPage);
  const displayedUsers = filteredUsers.slice((userPage - 1) * userPerPage, userPage * userPerPage);

  // ================= SETTINGS SAVE (only general – persist) =================
  const saveGeneralSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const payload = {
        schoolName: generalSettings.schoolName,
        schoolAddress: generalSettings.schoolAddress,
        schoolPhone: generalSettings.schoolPhone,
        schoolEmail: generalSettings.schoolEmail,
        schoolMotto: generalSettings.schoolMotto,
        currentTerm: generalSettings.currentTerm,
        currentAcademicYear: generalSettings.currentYear,
        principalName: generalSettings.principalName,
        feeCurrency: generalSettings.currency
      };
      await api.put('/settings/school', payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('General settings saved');
    } catch (error) {
      toast.error('Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };

  // Security is local-only – we'll just show a toast when "Save" is clicked.
  const saveSecurity = () => {
    toast.success('Security settings saved locally (not persisted)');
  };

  // ================= PASSWORD RESET =================
  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const endpoint = selectedUser.source === 'students' ? '/students' :
                       selectedUser.source === 'teachers' ? '/teachers' : '/users';
      await api.put(`${endpoint}/${selectedUser.id}/reset-password`, { password: newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Password reset for ${selectedUser.fullName}`);
      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  // ================= FACTORY RESET (REAL) =================
  const performFactoryReset = async () => {
    if (factoryResetConfirm !== 'RESET ALL') {
      toast.error('Type "RESET ALL" to confirm');
      return;
    }
    if (!window.confirm('⚠️ This will permanently delete ALL data except admin accounts. Are you sure?')) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await api.post('/settings/factory-reset', {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Factory reset completed. All data has been wiped.');
      setShowFactoryReset(false);
      setFactoryResetConfirm('');
      navigate('/admin');
    } catch (error) {
      toast.error('Factory reset failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // ================= EXPORT / IMPORT =================
  const exportData = () => {
    const data = {
      settings: { general: generalSettings, security },
      users: users,
      stats: dataStats,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `school_data_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data exported');
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.settings || !data.users) {
          toast.error('Invalid backup file');
          return;
        }
        if (!window.confirm(`Import data for ${data.users.length} users? This will overwrite current data.`)) return;
        toast.success('Data imported successfully (mock)');
      } catch (error) {
        toast.error('Failed to import data');
      }
    };
    reader.readAsText(file);
  };

  // ================= UI HELPERS =================
  const goBack = () => navigate(-1);

  // Tabs: removed 'appearance'
  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database }
  ];

  // ================= RENDER =================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="mt-4 text-gray-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            className="p-2 hover:bg-gray-200 rounded-xl transition text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <span>System Settings</span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Full control over your school management system</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (activeTab === 'general') saveGeneralSettings();
                  else if (activeTab === 'security') saveSecurity();
                  else toast.info('No settings to save here');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium text-sm"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => { fetchedRef.current = false; fetchData(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition font-medium text-sm border border-blue-200/50"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={users.length} color="purple" />
          <StatCard icon={School} label="Students" value={dataStats.students} color="blue" />
          <StatCard icon={BookOpen} label="Teachers" value={dataStats.teachers} color="green" />
          <StatCard icon={Archive} label="Data Records" value={dataStats.fees + dataStats.marks} color="indigo" />
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1.5 overflow-x-auto shadow-sm">
          <div className="flex gap-1.5 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
          {/* ===== GENERAL TAB ===== */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                <Building className="w-5 h-5 text-purple-600" /> School Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ... all general fields ... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name</label>
                  <input
                    type="text"
                    value={generalSettings.schoolName}
                    onChange={(e) => setGeneralSettings({...generalSettings, schoolName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Motto</label>
                  <input
                    type="text"
                    value={generalSettings.schoolMotto}
                    onChange={(e) => setGeneralSettings({...generalSettings, schoolMotto: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={generalSettings.schoolAddress}
                    onChange={(e) => setGeneralSettings({...generalSettings, schoolAddress: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={generalSettings.schoolPhone}
                    onChange={(e) => setGeneralSettings({...generalSettings, schoolPhone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={generalSettings.schoolEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, schoolEmail: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Principal</label>
                  <input
                    type="text"
                    value={generalSettings.principalName}
                    onChange={(e) => setGeneralSettings({...generalSettings, principalName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Term</label>
                  <select
                    value={generalSettings.currentTerm}
                    onChange={(e) => setGeneralSettings({...generalSettings, currentTerm: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
                  <input
                    type="text"
                    value={generalSettings.currentYear}
                    onChange={(e) => setGeneralSettings({...generalSettings, currentYear: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  >
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                    <option value="TZS">TZS</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ===== USERS & ROLES TAB ===== */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-purple-600" /> User Management
                </h2>
                <button
                  onClick={() => navigate('/admin/create-user')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium text-sm"
                >
                  <Plus className="w-4 h-4" /> Add User
                </button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="secretary">Secretary</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-200/70">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3 font-medium text-gray-800">{user.fullName}</td>
                        <td className="p-3 text-gray-600">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            user.role === 'student' ? 'bg-green-100 text-green-700 border-green-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            user.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            user.status === 'blocked' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {user.status || 'unknown'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewPassword('');
                              setConfirmPassword('');
                              setShowResetModal(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalUserPages > 1 && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-200/70">
                  <p className="text-sm text-gray-500">Page {userPage} of {totalUserPages}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setUserPage(p => Math.max(1, p-1))}
                      disabled={userPage === 1}
                      className="p-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                      let p = i + 1;
                      if (totalUserPages > 5) {
                        if (userPage > 3) p = userPage - 3 + i;
                        if (p > totalUserPages) return null;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setUserPage(p)}
                          className={`px-3.5 py-1.5 border rounded-xl text-sm transition ${
                            userPage === p
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p+1))}
                      disabled={userPage === totalUserPages}
                      className="p-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SECURITY TAB ===== */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-purple-600" /> Security Policies
              </h2>
              <p className="text-sm text-gray-500">Security settings are saved locally (not persisted to server).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value) || 60})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                    min="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Login Attempts</label>
                  <input
                    type="number"
                    value={security.maxLoginAttempts}
                    onChange={(e) => setSecurity({...security, maxLoginAttempts: parseInt(e.target.value) || 5})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Password Length</label>
                  <input
                    type="number"
                    value={security.passwordMinLength}
                    onChange={(e) => setSecurity({...security, passwordMinLength: parseInt(e.target.value) || 8})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                    min="6"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={security.requireSpecialChar}
                      onChange={(e) => setSecurity({...security, requireSpecialChar: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Require special characters
                  </label>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={security.requirePasswordChange}
                      onChange={(e) => setSecurity({...security, requirePasswordChange: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Force password change on next login for all users
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ===== DATA MANAGEMENT TAB ===== */}
          {activeTab === 'data' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                <Database className="w-5 h-5 text-purple-600" /> Data Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-700">Export Data</h3>
                  <p className="text-sm text-gray-500 mt-1">Download a complete backup of all system data</p>
                  <button
                    onClick={exportData}
                    className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm"
                  >
                    <Download className="w-4 h-4" /> Export JSON
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-700">Import Data</h3>
                  <p className="text-sm text-gray-500 mt-1">Restore from a previously exported backup file</p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="mt-3 w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
                  />
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 col-span-1 md:col-span-2">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" /> Danger Zone
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Reset the entire system to factory defaults. All data except the current admin account will be permanently deleted.</p>
                  <button
                    onClick={() => setShowFactoryReset(true)}
                    className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Factory Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= RESET PASSWORD MODAL ================= */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between border-b border-gray-200/70 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" /> Reset Password
              </h3>
              <button onClick={() => setShowResetModal(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Resetting password for <span className="font-semibold text-gray-700">{selectedUser.fullName}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                  minLength="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/30 outline-none transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetPassword}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= FACTORY RESET MODAL ================= */}
      {showFactoryReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Factory Reset</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              This will permanently delete <strong>all data</strong> except admin accounts.
              All students, teachers, classes, subjects, fees, marks, and settings will be wiped.
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Type <strong className="text-red-600">RESET ALL</strong> to confirm.
            </p>
            <input
              type="text"
              value={factoryResetConfirm}
              onChange={(e) => setFactoryResetConfirm(e.target.value)}
              placeholder="Type RESET ALL"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/30 outline-none transition"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={performFactoryReset}
                disabled={saving || factoryResetConfirm !== 'RESET ALL'}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {saving ? 'Resetting...' : 'Reset System'}
              </button>
              <button
                onClick={() => setShowFactoryReset(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;