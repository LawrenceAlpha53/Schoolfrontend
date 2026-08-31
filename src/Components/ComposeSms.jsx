// Components/ComposeSms.jsx - WITH "Thank Fully Paid Parents"
import api from '../api/axios';
import React, { useState, useEffect } from 'react';
import {
  Send,
  User,
  Users,
  Clock,
  DollarSign,
  Trash2,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Phone,
  Mail,
  Users as UsersIcon,
  Search,
  RefreshCw,
  Briefcase,
  Shield,
  GraduationCap,
  UserCheck,
  Loader2,
  Check,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

const ComposeSms = () => {
  const [formData, setFormData] = useState({
    recipientType: 'parents',
    category: 'general',
    priority: 'normal',
    message: '',
    scheduleDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [recipientType, setRecipientType] = useState('parents');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [allRecipients, setAllRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [smsCost, setSmsCost] = useState({ smsCount: 0, estimatedCost: 0 });
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [smsBalance, setSmsBalance] = useState(0);
  const [sending, setSending] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, failed: 0 });

  useEffect(() => {
    fetchTemplates();
    fetchRecipients('parents');
    fetchBalance();
  }, []);

  useEffect(() => {
    if (messageText) {
      const cost = calculateSmsCost(messageText);
      setSmsCost(cost);
    }
  }, [messageText, selectedRecipients]);

  const fetchBalance = async () => {
    try {
      const response = await api.get('/sms/balance');
      setSmsBalance(response.data.data?.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/sms/templates');
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  // ---------- RECIPIENT FETCHING ----------
  const fetchRecipients = async (type = 'parents', autoSelect = false) => {
    setLoadingRecipients(true);
    try {
      let data = [];
      if (type === 'parents' || type === 'students') {
        const response = await api.get(`/sms/recipients/${type}`);
        data = response.data.data || [];
        data = data.map(item => {
          const student = item.Student || item;
          return {
            id: item.id || student.id,
            key: item.id || student.id,
            title: student.fullName || student.name || student.parentName || 'Unknown',
            description: student.parentPhone || item.phoneNumber || 'No phone',
            phone: student.parentPhone || item.phoneNumber,
            className: student.class?.className || item.className,
            ...student,
            ...item,
            type: 'student'
          };
        });
      } else if (type === 'teachers') {
        const response = await api.get('/sms/recipients/teachers');
        data = response.data.data || [];
        data = data.map(item => ({
          id: item.id,
          key: `teacher-${item.id}`,
          title: item.fullName || item.name || 'Teacher',
          description: item.phoneNumber || 'No phone',
          phone: item.phoneNumber,
          className: item.className || 'Teacher',
          type: 'teacher'
        }));
      } else if (type === 'class') {
        const response = await api.get('/sms/recipients/students');
        data = response.data.data || [];
        data = data.map(item => ({
          id: item.id,
          key: `student-${item.id}`,
          title: item.fullName || 'Student',
          description: item.parentPhone || 'No phone',
          phone: item.parentPhone,
          className: item.class?.className || 'Class',
          type: 'student'
        }));
      } else if (type === 'school') {
        const [studentsRes, teachersRes, staffRes, usersRes] = await Promise.all([
          api.get('/sms/recipients/students'),
          api.get('/sms/recipients/teachers'),
          api.get('/staff'),
          api.get('/users')
        ]);

        const students = (studentsRes.data.data || []).map(s => ({
          id: s.id,
          key: `student-${s.id}`,
          title: s.fullName || 'Student',
          description: s.parentPhone || 'No phone',
          phone: s.parentPhone,
          className: s.class?.className || 'Student',
          type: 'student',
          role: 'student'
        }));

        const teachers = (teachersRes.data.data || []).map(t => ({
          id: t.id,
          key: `teacher-${t.id}`,
          title: t.fullName || 'Teacher',
          description: t.phoneNumber || 'No phone',
          phone: t.phoneNumber,
          className: 'Teacher',
          type: 'teacher',
          role: 'teacher'
        }));

        const staff = (staffRes.data.data || []).map(s => ({
          id: s.id,
          key: `staff-${s.id}`,
          title: s.fullName || 'Staff',
          description: s.phoneNumber || 'No phone',
          phone: s.phoneNumber,
          className: s.position || 'Staff',
          type: 'staff',
          role: 'staff'
        }));

        const users = (usersRes.data.data || usersRes.data || []).filter(u =>
          ['admin', 'secretary'].includes(u.role?.toLowerCase())
        ).map(u => ({
          id: u.id,
          key: `user-${u.id}`,
          title: `${u.Fname || ''} ${u.Lname || ''}`.trim() || 'User',
          description: u.Phonenumber || 'No phone',
          phone: u.Phonenumber,
          className: u.role?.charAt(0).toUpperCase() + u.role?.slice(1) || 'User',
          type: 'user',
          role: u.role
        }));

        const combined = [...students, ...teachers, ...staff, ...users];
        const uniqueMap = new Map();
        combined.forEach(item => {
          if (item.phone && !uniqueMap.has(item.phone)) {
            uniqueMap.set(item.phone, item);
          }
        });
        data = Array.from(uniqueMap.values());
        data.sort((a, b) => a.title.localeCompare(b.title));
      } else if (type === 'workers') {
        const [usersRes, staffRes] = await Promise.all([
          api.get('/users'),
          api.get('/staff')
        ]);

        const users = (usersRes.data.data || usersRes.data || []).filter(u =>
          ['admin', 'teacher', 'secretary'].includes(u.role?.toLowerCase())
        ).map(u => ({
          id: u.id,
          key: `user-${u.id}`,
          title: `${u.Fname || ''} ${u.Lname || ''}`.trim() || 'User',
          description: u.Phonenumber || 'No phone',
          phone: u.Phonenumber,
          className: u.role?.charAt(0).toUpperCase() + u.role?.slice(1) || 'User',
          type: 'user',
          role: u.role
        }));

        const staff = (staffRes.data.data || []).map(s => ({
          id: s.id,
          key: `staff-${s.id}`,
          title: s.fullName || 'Staff',
          description: s.phoneNumber || 'No phone',
          phone: s.phoneNumber,
          className: s.position || 'Staff',
          type: 'staff',
          role: 'staff'
        }));

        const combined = [...users, ...staff];
        const uniqueMap = new Map();
        combined.forEach(item => {
          if (item.phone && !uniqueMap.has(item.phone)) {
            uniqueMap.set(item.phone, item);
          }
        });
        data = Array.from(uniqueMap.values());
        data.sort((a, b) => a.title.localeCompare(b.title));
      }

      setAllRecipients(data);
      if (autoSelect) {
        setSelectedRecipients(data);
      } else {
        setSelectedRecipients([]);
      }

    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setLoadingRecipients(false);
    }
  };

  // ---------- QUICK ACTIONS ----------
  const quickActionFeeDefaulters = async () => {
    setQuickActionLoading(true);
    try {
      const response = await api.get('/fees');
      const fees = response.data?.data || response.data || [];
      const studentMap = new Map();
      fees.forEach(fee => {
        const balance = Number(fee.balance) || 0;
        if (balance > 0) {
          if (!studentMap.has(fee.studentId)) {
            studentMap.set(fee.studentId, { studentId: fee.studentId, balance: 0 });
          }
          studentMap.get(fee.studentId).balance += balance;
        }
      });

      if (studentMap.size === 0) {
        toast.info('No fee defaulters found.');
        setQuickActionLoading(false);
        return;
      }

      const defaulterIds = Array.from(studentMap.keys());
      const studentsRes = await api.get('/students');
      const allStudents = studentsRes.data?.data || studentsRes.data || [];
      const defaulters = allStudents.filter(s => defaulterIds.includes(s.id)).map(s => ({
        id: s.id,
        key: `student-${s.id}`,
        title: s.fullName || 'Student',
        phone: s.parentPhone,
        description: s.parentPhone || 'No phone',
        className: s.class?.className || 'Class',
        type: 'student',
        balance: studentMap.get(s.id).balance,
        studentName: s.fullName || 'Student',
        classNameFull: s.class?.className || 'Class'
      }));

      if (defaulters.length === 0) {
        toast.info('No defaulters with phone numbers found.');
        setQuickActionLoading(false);
        return;
      }

      setAllRecipients(defaulters);
      setSelectedRecipients(defaulters);
      setRecipientType('parents');
      const defaultMsg = `Dear parent of {{student_name}} ({{class_name}}),\n\nThis is a reminder that your child has an outstanding fee balance of UGX {{balance}}. Please clear the balance to avoid penalties.\n\nThank you.`;
      setFormData(prev => ({ ...prev, message: defaultMsg, category: 'fee_reminder' }));
      setMessageText(defaultMsg);
      toast.success(`Loaded ${defaulters.length} fee defaulters`);
    } catch (error) {
      console.error('Error fetching fee defaulters:', error);
      toast.error('Failed to load fee defaulters');
    } finally {
      setQuickActionLoading(false);
    }
  };

  const quickActionThankFullyPaid = async () => {
    setQuickActionLoading(true);
    try {
      const response = await api.get('/fees');
      const fees = response.data?.data || response.data || [];
      const studentMap = new Map();
      fees.forEach(fee => {
        const balance = Number(fee.balance) || 0;
        // Only include students with ZERO balance (fully paid)
        if (balance === 0) {
          if (!studentMap.has(fee.studentId)) {
            studentMap.set(fee.studentId, { studentId: fee.studentId, balance: 0 });
          }
        }
      });

      if (studentMap.size === 0) {
        toast.info('No fully paid students found.');
        setQuickActionLoading(false);
        return;
      }

      const paidIds = Array.from(studentMap.keys());
      const studentsRes = await api.get('/students');
      const allStudents = studentsRes.data?.data || studentsRes.data || [];
      const paidStudents = allStudents.filter(s => paidIds.includes(s.id)).map(s => ({
        id: s.id,
        key: `student-${s.id}`,
        title: s.fullName || 'Student',
        phone: s.parentPhone,
        description: s.parentPhone || 'No phone',
        className: s.class?.className || 'Class',
        type: 'student',
        balance: 0,
        studentName: s.fullName || 'Student',
        classNameFull: s.class?.className || 'Class'
      }));

      if (paidStudents.length === 0) {
        toast.info('No fully paid students with phone numbers found.');
        setQuickActionLoading(false);
        return;
      }

      setAllRecipients(paidStudents);
      setSelectedRecipients(paidStudents);
      setRecipientType('parents');
      const thankMsg = `Dear parent of {{student_name}} ({{class_name}}),\n\nWe are grateful to inform you that your child's fee account is fully cleared. Thank you for your timely payment and continued support to our school.\n\nWe appreciate you! 🎉\n\nFrom all of us at the school.`;
      setFormData(prev => ({ ...prev, message: thankMsg, category: 'payment_confirmation' }));
      setMessageText(thankMsg);
      toast.success(`Loaded ${paidStudents.length} fully paid students`);
    } catch (error) {
      console.error('Error fetching fully paid students:', error);
      toast.error('Failed to load fully paid students');
    } finally {
      setQuickActionLoading(false);
    }
  };

  const quickActionAbsentStudents = async () => {
    setQuickActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/attendance');
      const allAttendance = response.data?.data || response.data || [];
      const absentToday = allAttendance.filter(a => a.status === 'absent' && a.date === today);
      
      if (absentToday.length === 0) {
        toast.info('No absent students found today.');
        setQuickActionLoading(false);
        return;
      }

      const studentIds = [...new Set(absentToday.map(a => a.studentId))];
      const studentsRes = await api.get('/students');
      const allStudents = studentsRes.data?.data || studentsRes.data || [];
      const absentStudents = allStudents.filter(s => studentIds.includes(s.id)).map(s => ({
        id: s.id,
        key: `student-${s.id}`,
        title: s.fullName || 'Student',
        phone: s.parentPhone,
        description: s.parentPhone || 'No phone',
        className: s.class?.className || 'Class',
        type: 'student'
      }));

      if (absentStudents.length === 0) {
        toast.info('No absent students with phone numbers found.');
        setQuickActionLoading(false);
        return;
      }

      setAllRecipients(absentStudents);
      setSelectedRecipients(absentStudents);
      setRecipientType('parents');
      const defaultMsg = `Dear Parent,\n\nYour child was marked absent today. Please ensure regular attendance for academic success.\n\nThank you.`;
      setFormData(prev => ({ ...prev, message: defaultMsg, category: 'attendance' }));
      setMessageText(defaultMsg);
      toast.success(`Loaded ${absentStudents.length} absent students`);
    } catch (error) {
      console.error('Error fetching absent students:', error);
      toast.error('Failed to load absent students');
    } finally {
      setQuickActionLoading(false);
    }
  };

  const quickActionBirthday = async () => {
    setQuickActionLoading(true);
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const response = await api.get('/students');
      const students = response.data?.data || response.data || [];
      const birthdayStudents = students.filter(s => {
        if (!s.dateOfBirth) return false;
        const dob = new Date(s.dateOfBirth);
        return dob.getMonth() + 1 === month && dob.getDate() === day;
      }).map(s => ({
        id: s.id,
        key: `student-${s.id}`,
        title: s.fullName || 'Student',
        phone: s.parentPhone,
        description: s.parentPhone || 'No phone',
        className: s.class?.className || 'Class',
        type: 'student'
      }));

      if (birthdayStudents.length === 0) {
        toast.info('No students celebrating birthdays today.');
        setQuickActionLoading(false);
        return;
      }

      setAllRecipients(birthdayStudents);
      setSelectedRecipients(birthdayStudents);
      setRecipientType('parents');
      const defaultMsg = `🎉 Happy Birthday to {{student_name}}!\n\nWishing you a wonderful day filled with joy and success.\n\nFrom all of us at the school.`;
      setFormData(prev => ({ ...prev, message: defaultMsg, category: 'birthday' }));
      setMessageText(defaultMsg);
      toast.success(`Loaded ${birthdayStudents.length} birthday students`);
    } catch (error) {
      console.error('Error fetching birthday students:', error);
      toast.error('Failed to load birthday students');
    } finally {
      setQuickActionLoading(false);
    }
  };

  const quickActionFeeReminders = async () => {
    await quickActionFeeDefaulters();
    const reminderMsg = `Dear parent of {{student_name}} ({{class_name}}),\n\nThis is a friendly reminder to clear your child's outstanding fee balance of UGX {{balance}}. Payment can be made at the school accounts office.\n\nThank you.`;
    setFormData(prev => ({ ...prev, message: reminderMsg }));
    setMessageText(reminderMsg);
  };

  const quickActionAllWorkers = async () => {
    setRecipientType('workers');
    await fetchRecipients('workers', true);
    const defaultMsg = `Dear Team,\n\nThis is an important announcement from the school administration. Please take note.\n\nThank you.`;
    setFormData(prev => ({ ...prev, message: defaultMsg, category: 'general' }));
    setMessageText(defaultMsg);
  };

  // ---------- CALCULATE COST ----------
  const calculateSmsCost = (message) => {
    const smsLength = 160;
    const count = Math.ceil(message.length / smsLength);
    const costPerSms = 62;
    const recipientCount = Math.max(selectedRecipients.length, 1);
    return {
      smsCount: count,
      estimatedCost: count * costPerSms * recipientCount
    };
  };

  // ---------- PERSONALIZED SEND ----------
  const sendPersonalizedSMS = async (recipients, template, category, priority, scheduleDate) => {
    const total = recipients.length;
    let sent = 0;
    let failed = 0;
    const failedPhones = [];

    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const promises = batch.map(async (recipient) => {
        try {
          let message = template;
          if (recipient.studentName) {
            message = message.replace(/\{\{student_name\}\}/g, recipient.studentName);
          } else {
            message = message.replace(/\{\{student_name\}\}/g, recipient.title || 'Student');
          }
          if (recipient.classNameFull) {
            message = message.replace(/\{\{class_name\}\}/g, recipient.classNameFull);
          } else if (recipient.className) {
            message = message.replace(/\{\{class_name\}\}/g, recipient.className);
          } else {
            message = message.replace(/\{\{class_name\}\}/g, '');
          }
          if (recipient.balance !== undefined) {
            message = message.replace(/\{\{balance\}\}/g, recipient.balance.toLocaleString());
          } else {
            message = message.replace(/\{\{balance\}\}/g, '0');
          }

          const payload = {
            recipients: [recipient.phone],
            message: message,
            category: category || 'general',
            priority: priority || 'normal',
            recipientType: 'parents',
            recipientIds: [recipient.id],
            isBulk: false,
            scheduledFor: scheduleDate || null,
            recipientName: recipient.title
          };

          const response = await api.post('/sms/send', payload);
          if (response.data.success) {
            sent++;
          } else {
            failed++;
            failedPhones.push(recipient.phone);
          }
        } catch (error) {
          console.error('Error sending to', recipient.phone, error);
          failed++;
          failedPhones.push(recipient.phone);
        }
        setSendProgress({ sent, total, failed });
      });

      await Promise.all(promises);
      setSendProgress({ sent, total, failed });
    }

    return { sent, failed, failedPhones };
  };

  // ---------- HANDLE SEND ----------
  const handleSend = async (e) => {
    e.preventDefault();
    
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    setSendProgress({ sent: 0, total: selectedRecipients.length, failed: 0 });

    try {
      const hasPlaceholders = formData.message.includes('{{student_name}}') || 
                              formData.message.includes('{{balance}}') || 
                              formData.message.includes('{{class_name}}');

      if (hasPlaceholders && selectedRecipients.some(r => r.studentName || r.balance !== undefined)) {
        const result = await sendPersonalizedSMS(
          selectedRecipients,
          formData.message,
          formData.category,
          formData.priority,
          formData.scheduleDate
        );

        if (result.failed === 0) {
          toast.success(`✅ SMS sent successfully to ${result.sent} recipients`);
        } else {
          toast.warning(`⚠️ Sent to ${result.sent}, failed for ${result.failed} recipients. Check logs.`);
        }
      } else {
        const recipients = selectedRecipients
          .map(r => r.phone)
          .filter(Boolean);
        
        if (recipients.length === 0) {
          toast.error('No valid phone numbers found');
          setSending(false);
          return;
        }

        const payload = {
          recipients: recipients,
          message: formData.message,
          category: formData.category || 'general',
          priority: formData.priority || 'normal',
          recipientType: recipientType,
          recipientIds: selectedRecipients.map(r => r.id || r.key),
          isBulk: selectedRecipients.length > 1,
          templateId: selectedTemplate?.id || null,
          scheduledFor: formData.scheduleDate || null,
          recipientName: selectedRecipients.map(r => r.title).join(', ')
        };

        const response = await api.post('/sms/send', payload);
        toast.success(`✅ SMS sent successfully to ${response.data.data?.totalRecipients || selectedRecipients.length} recipients`);
      }

      setFormData({ ...formData, message: '', scheduleDate: '' });
      setSelectedRecipients([]);
      setMessageText('');
      setSelectedTemplate(null);
      setSendProgress({ sent: 0, total: 0, failed: 0 });
      
      fetchBalance();
      
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      toast.error(error.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const toggleRecipient = (recipient) => {
    const exists = selectedRecipients.some(r => r.key === recipient.key);
    if (exists) {
      setSelectedRecipients(selectedRecipients.filter(r => r.key !== recipient.key));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const toggleAllRecipients = () => {
    if (selectedRecipients.length === allRecipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients([...allRecipients]);
    }
  };

  const filteredRecipients = allRecipients.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.includes(searchTerm) ||
    item.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recipientOptions = [
    { label: 'All Parents', value: 'parents' },
    { label: 'Selected Students', value: 'students' },
    { label: 'All Teachers', value: 'teachers' },
    { label: 'Selected Class', value: 'class' },
    { label: 'Entire School', value: 'school' },
    { label: 'All School Workers', value: 'workers' }
  ];

  const categoryOptions = [
    { label: 'General', value: 'general' },
    { label: 'Fee Reminder', value: 'fee_reminder' },
    { label: 'Attendance', value: 'attendance' },
    { label: 'Results', value: 'results' },
    { label: 'Examination', value: 'examination' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Event', value: 'event' },
    { label: 'Emergency', value: 'emergency' },
    { label: 'Birthday', value: 'birthday' },
    { label: 'Admission', value: 'admission' },
    { label: 'Payment Confirmation', value: 'payment_confirmation' },
    { label: 'Allowance', value: 'allowance' }
  ];

  const priorityOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'High', value: 'high' },
    { label: 'Emergency', value: 'emergency' }
  ];

  const getRoleIcon = (type, role) => {
    if (type === 'teacher' || role === 'teacher') return <GraduationCap size={16} className="text-blue-500" />;
    if (type === 'staff' || role === 'staff') return <Briefcase size={16} className="text-purple-500" />;
    if (role === 'admin') return <Shield size={16} className="text-red-500" />;
    if (role === 'secretary') return <UserCheck size={16} className="text-amber-500" />;
    return <User size={16} className="text-gray-400" />;
  };

  return (
    <div className="compose-sms p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Send className="text-purple-600" size={28} />
            Compose SMS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Send SMS messages to parents, students, teachers, and all school workers
          </p>
        </div>
        <div className="text-sm text-slate-500 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
          Balance: <span className="font-bold text-purple-600">{smsBalance}</span> SMS
        </div>
      </div>

      {sending && sendProgress.total > 0 && (
        <div className="mb-4 bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">
              Sending personalized messages...
            </span>
            <span className="text-sm text-slate-500">
              {sendProgress.sent + sendProgress.failed} / {sendProgress.total}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((sendProgress.sent + sendProgress.failed) / sendProgress.total) * 100}%` }}
            />
          </div>
          {sendProgress.failed > 0 && (
            <p className="text-xs text-red-500 mt-1">
              {sendProgress.failed} failed
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSend} className="bg-white border border-slate-200 rounded-xl p-6">
            {/* Recipient Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Recipient Type
              </label>
              <div className="flex flex-wrap gap-2">
                {recipientOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRecipientType(option.value);
                      fetchRecipients(option.value, false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      recipientType === option.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Template (Optional)
              </label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                onChange={(e) => handleTemplateSelect(e.target.value)}
                value={selectedTemplate?.id || ''}
              >
                <option value="">Choose a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.category?.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Selector */}
            {(recipientType === 'students' || recipientType === 'parents' || recipientType === 'teachers' || recipientType === 'class' || recipientType === 'school' || recipientType === 'workers') && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Select Recipients
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllRecipients}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    {selectedRecipients.length === allRecipients.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search recipients..."
                    className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {loadingRecipients ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="animate-spin text-purple-600" size={32} />
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                    {filteredRecipients.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No recipients found
                      </div>
                    ) : (
                      filteredRecipients.map((item) => {
                        const isSelected = selectedRecipients.some(r => r.key === item.key);
                        return (
                          <div
                            key={item.key}
                            onClick={() => toggleRecipient(item)}
                            className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-50 transition ${
                              isSelected ? 'bg-purple-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              {getRoleIcon(item.type, item.role)}
                              <div>
                                <div className="font-medium text-slate-800">{item.title}</div>
                                <div className="text-sm text-slate-500">{item.phone || 'No phone'}</div>
                              </div>
                            </div>
                            {item.className && (
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {item.className}
                              </span>
                            )}
                            {item.role && (
                              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                                {item.role}
                              </span>
                            )}
                            {item.position && (
                              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                {item.position}
                              </span>
                            )}
                            {item.balance !== undefined && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                Balance: UGX {item.balance}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                
                <div className="mt-2 text-sm text-slate-500">
                  Selected: <span className="font-bold text-purple-600">{selectedRecipients.length}</span> recipients
                </div>
              </div>
            )}

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder="Type your message here. Use {{student_name}}, {{class_name}}, {{balance}} for personalization."
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  setMessageText(e.target.value);
                }}
                maxLength={1600}
              />
              <div className="flex justify-between mt-1 text-sm text-slate-500">
                <span>{formData.message.length} / 1600 characters</span>
                <span>SMS: {smsCost.smsCount || 0}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Use <code className="bg-slate-100 px-1 rounded">{"{{student_name}}"}</code>, <code className="bg-slate-100 px-1 rounded">{"{{class_name}}"}</code>, <code className="bg-slate-100 px-1 rounded">{"{{balance}}"}</code> to personalise for each parent.
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                />
              </div>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || selectedRecipients.length === 0 || !formData.message.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg transition font-medium"
            >
              {sending ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
              {sending ? 'Sending...' : 'Send SMS'}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* SMS Preview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h3 className="font-medium text-slate-700 mb-3">SMS Preview</h3>
            <div className="bg-slate-100 p-4 rounded-lg min-h-[150px] whitespace-pre-wrap text-slate-700">
              {formData.message || 'Your message will appear here...'}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h3 className="font-medium text-slate-700 mb-3">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Recipients</span>
                <span className="font-bold">{selectedRecipients.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">SMS per Recipient</span>
                <span className="font-bold">{smsCost.smsCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total SMS</span>
                <span className="font-bold">{smsCost.smsCount * Math.max(selectedRecipients.length, 1)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">Estimated Cost</span>
                  <span className="font-bold text-green-600">UGX {smsCost.estimatedCost.toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">Balance After</span>
                  <span className={`font-bold ${smsBalance - smsCost.smsCount * Math.max(selectedRecipients.length, 1) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {smsBalance - smsCost.smsCount * Math.max(selectedRecipients.length, 1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-medium text-slate-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={quickActionFeeDefaulters}
                disabled={quickActionLoading}
                className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700 disabled:opacity-50"
              >
                {quickActionLoading ? <Loader2 className="animate-spin" size={16} /> : <Users size={16} />}
                Send to Fee Defaulters
              </button>
              <button
                onClick={quickActionThankFullyPaid}
                disabled={quickActionLoading}
                className="w-full flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition text-sm text-green-700 disabled:opacity-50"
              >
                {quickActionLoading ? <Loader2 className="animate-spin" size={16} /> : <Heart size={16} />}
                Thank Fully Paid Parents
              </button>
              <button
                onClick={quickActionAbsentStudents}
                disabled={quickActionLoading}
                className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700 disabled:opacity-50"
              >
                {quickActionLoading ? <Loader2 className="animate-spin" size={16} /> : <User size={16} />}
                Send to Absent Students
              </button>
              <button
                onClick={quickActionBirthday}
                disabled={quickActionLoading}
                className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700 disabled:opacity-50"
              >
                {quickActionLoading ? <Loader2 className="animate-spin" size={16} /> : <Clock size={16} />}
                Send Birthday SMS
              </button>
              <button
                onClick={quickActionFeeReminders}
                disabled={quickActionLoading}
                className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700 disabled:opacity-50"
              >
                {quickActionLoading ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16} />}
                Send Fee Reminders
              </button>
              <button
                onClick={quickActionAllWorkers}
                disabled={quickActionLoading}
                className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700 disabled:opacity-50"
              >
                {quickActionLoading ? <Loader2 className="animate-spin" size={16} /> : <Briefcase size={16} />}
                Send to All Workers 
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeSms;