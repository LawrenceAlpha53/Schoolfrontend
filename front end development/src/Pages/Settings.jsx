import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Users,
  Bell,
  Shield,
  Database,
  Cloud,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle,
  BookOpen,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useSchool } from './SchoolContext';   // ✅ Import context

const AdminSettings = () => {
  // ================= STATE =================
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [schoolSettings, setSchoolSettings] = useState({});
  const [userSettings, setUserSettings] = useState({});
  const [systemStats, setSystemStats] = useState({});
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isCacheLoading, setIsCacheLoading] = useState(false);

  const { updateSchoolName } = useSchool();   // ✅ Get updater function

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    schoolMotto: '',
    principalName: '',
    currentTerm: 'Term 1',
    currentAcademicYear: '',
    feeCurrency: 'UGX',
    reportCardFormat: 'standard',
    enableSMSNotifications: false,
    enableEmailNotifications: false,
    enableParentPortal: false,
    enableStudentPortal: false,
    maxLoginAttempts: 5,
    sessionTimeout: 60
  });

  // ================= TABS =================
  const tabs = [
    { id: 'general', label: 'General', icon: <Building className="w-4 h-4" /> },
    { id: 'academic', label: 'Academic', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'system', label: 'System', icon: <Database className="w-4 h-4" /> },
    { id: 'backup', label: 'Backup', icon: <Cloud className="w-4 h-4" /> }
  ];

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [schoolRes, userRes, statsRes] = await Promise.all([
        api.get('/settings/school', config),
        api.get('/settings/user', config),
        api.get('/settings/stats', config)
      ]);

      const school = schoolRes.data.data || {};
      const user = userRes.data.data || {};
      const stats = statsRes.data.data || {};

      setSchoolSettings(school);
      setUserSettings(user);
      setSystemStats(stats);

      setFormData({
        schoolName: school.schoolName || '',
        schoolAddress: school.schoolAddress || '',
        schoolPhone: school.schoolPhone || '',
        schoolEmail: school.schoolEmail || '',
        schoolMotto: school.schoolMotto || '',
        principalName: school.principalName || '',
        currentTerm: school.currentTerm || 'Term 1',
        currentAcademicYear: school.currentAcademicYear || new Date().getFullYear().toString(),
        feeCurrency: school.feeCurrency || 'UGX',
        reportCardFormat: school.reportCardFormat || 'standard',
        enableSMSNotifications: school.enableSMSNotifications || false,
        enableEmailNotifications: school.enableEmailNotifications || false,
        enableParentPortal: school.enableParentPortal || false,
        enableStudentPortal: school.enableStudentPortal || false,
        maxLoginAttempts: school.maxLoginAttempts || 5,
        sessionTimeout: school.sessionTimeout || 60
      });

    } catch (error) {
      console.error('Fetch settings error:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= HANDLE FORM CHANGE =================
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ================= HANDLE SAVE =================
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await api.put('/settings/school', formData, config);

      if (response.data.success) {
        toast.success('Settings saved successfully!');
        setSchoolSettings(response.data.data);
        // ✅ Update the context and localStorage instantly
        updateSchoolName(formData.schoolName);
        fetchData();
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= BACKUP & CACHE =================
  const handleBackup = async () => {
    try {
      setIsBackupLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await api.post('/settings/backup', {}, config);
      if (response.data.success) toast.success('Backup created!');
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setIsCacheLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.post('/settings/clear-cache', {}, config);
      toast.success('Cache cleared');
    } catch (error) {
      toast.error('Cache clear failed');
    } finally {
      setIsCacheLoading(false);
    }
  };

  // ================= RENDER TABS =================
  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name *</label>
          <input
            type="text"
            name="schoolName"
            value={formData.schoolName}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            placeholder="Enter school name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Principal Name</label>
          <input
            type="text"
            name="principalName"
            value={formData.principalName}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            placeholder="Enter principal name"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">School Address</label>
        <input
          type="text"
          name="schoolAddress"
          value={formData.schoolAddress}
          onChange={handleFormChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          placeholder="Enter school address"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
          <input
            type="text"
            name="schoolPhone"
            value={formData.schoolPhone}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input
            type="email"
            name="schoolEmail"
            value={formData.schoolEmail}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            placeholder="Enter email address"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">School Motto</label>
        <input
          type="text"
          name="schoolMotto"
          value={formData.schoolMotto}
          onChange={handleFormChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          placeholder="Enter school motto"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
          <select
            name="feeCurrency"
            value={formData.feeCurrency}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
          >
            <option value="UGX">UGX</option>
            <option value="USD">USD</option>
            <option value="KES">KES</option>
            <option value="TZS">TZS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Report Card Format</label>
          <select
            name="reportCardFormat"
            value={formData.reportCardFormat}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
          >
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
            <option value="compact">Compact</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAcademicTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Term</label>
          <select
            name="currentTerm"
            value={formData.currentTerm}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
          >
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Academic Year</label>
          <input
            type="text"
            name="currentAcademicYear"
            value={formData.currentAcademicYear}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            placeholder="e.g., 2024"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Term Start Date</label>
          <input
            type="date"
            name="termStartDate"
            value={formData.termStartDate || ''}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Term End Date</label>
          <input
            type="date"
            name="termEndDate"
            value={formData.termEndDate || ''}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
        </div>
      </div>
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Academic Calendar
        </h4>
        <p className="text-sm text-blue-600 mt-1">
          Set the academic calendar to enable automatic report generation and term-based features.
        </p>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">A</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Admin User</p>
                      <p className="text-xs text-gray-400">admin@school.com</p>
                    </div>
                  </div>
                </td>
                <td className="p-3"><span className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Admin</span></td>
                <td className="p-3 text-sm text-gray-600">admin@school.com</td>
                <td className="p-3"><span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />Active</span></td>
                <td className="p-3 text-center"><button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm">
        <Plus className="w-4 h-4" /> Add User
      </button>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {[
        { key: 'enableSMSNotifications', title: 'SMS Notifications', desc: 'Send SMS notifications to parents' },
        { key: 'enableEmailNotifications', title: 'Email Notifications', desc: 'Send email notifications to staff and parents' },
        { key: 'enableParentPortal', title: 'Parent Portal', desc: 'Enable parents to view children\'s information' },
        { key: 'enableStudentPortal', title: 'Student Portal', desc: 'Enable students to view academic information' },
      ].map(item => (
        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <h4 className="font-medium text-gray-800">{item.title}</h4>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
          <button
            onClick={() => handleFormChange({ target: { name: item.key, type: 'checkbox', checked: !formData[item.key] } })}
            className={`w-12 h-6 rounded-full transition ${formData[item.key] ? 'bg-purple-600' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transform transition ${formData[item.key] ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
          </button>
        </div>
      ))}
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Login Attempts</label>
          <input type="number" name="maxLoginAttempts" value={formData.maxLoginAttempts} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm" min="1" max="10" />
          <p className="text-xs text-gray-400 mt-1">Number of failed login attempts before lockout</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Timeout (minutes)</label>
          <input type="number" name="sessionTimeout" value={formData.sessionTimeout} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm" min="5" max="480" />
          <p className="text-xs text-gray-400 mt-1">Inactivity timeout before automatic logout</p>
        </div>
      </div>
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-2"><Shield className="w-4 h-4" />Security Recommendations</h4>
        <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
          <li>Use strong passwords with at least 8 characters</li>
          <li>Enable two-factor authentication for admin accounts</li>
          <li>Regularly review user access permissions</li>
          <li>Keep login attempts to 5 or less</li>
        </ul>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: systemStats.totalUsers, color: 'purple' },
          { label: 'Total Students', value: systemStats.totalStudents, color: 'blue' },
          { label: 'Total Teachers', value: systemStats.totalTeachers, color: 'emerald' },
          { label: 'Total Classes', value: systemStats.totalClasses, color: 'orange' },
          { label: 'Total Subjects', value: systemStats.totalSubjects, color: 'pink' },
          { label: 'Total Transactions', value: systemStats.totalFees, color: 'cyan' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value || 0}</p>
          </div>
        ))}
      </div>
      <button onClick={handleClearCache} disabled={isCacheLoading} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition font-medium text-sm disabled:opacity-50">
        {isCacheLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {isCacheLoading ? 'Clearing...' : 'Clear Cache'}
      </button>
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center"><Cloud className="w-7 h-7 text-purple-600" /></div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">System Backup</h3>
            <p className="text-sm text-gray-500">Create a backup of all system data</p>
          </div>
        </div>
        <button onClick={handleBackup} disabled={isBackupLoading} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm disabled:opacity-50">
          {isBackupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isBackupLoading ? 'Creating Backup...' : 'Create Backup'}
        </button>
        <p className="text-xs text-gray-400 mt-3">Backup includes: Students, Teachers, Classes, Subjects, Fees, Marks, and Users data</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Backup History</h4>
        {/* Example backup entries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-3"><File className="w-5 h-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-800">backup_2024-01-15.sql</p><p className="text-xs text-gray-400">15 Jan 2024, 14:30</p></div></div>
            <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">Download</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-3"><File className="w-5 h-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-800">backup_2024-01-14.sql</p><p className="text-xs text-gray-400">14 Jan 2024, 10:15</p></div></div>
            <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">Download</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch(activeTab) {
      case 'general': return renderGeneralTab();
      case 'academic': return renderAcademicTab();
      case 'users': return renderUsersTab();
      case 'notifications': return renderNotificationsTab();
      case 'security': return renderSecurityTab();
      case 'system': return renderSystemTab();
      case 'backup': return renderBackupTab();
      default: return renderGeneralTab();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-purple-600" />
            System Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure your school management system</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm disabled:opacity-50">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;