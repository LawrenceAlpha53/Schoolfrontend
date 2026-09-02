// Pages/Communications.jsx – School Communications Hub
import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Send, Users, Smartphone, List,
  Clock, CheckCircle, XCircle, Loader2, AlertCircle,
  RefreshCw, User, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Communications = () => {
  // ================= STATE =================
  const [activeTab, setActiveTab] = useState('sms');
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Compose
  const [recipientType, setRecipientType] = useState('all_teachers');
  const [selectedClass, setSelectedClass] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduled, setScheduled] = useState(false);

  // ================= INITIAL FETCH =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [teachersRes, studentsRes, classesRes] = await Promise.all([
          api.get('/teachers', config),
          api.get('/students', config),
          api.get('/classes', config)
        ]);

        const extractArray = (res) => {
          if (!res || !res.data) return [];
          const d = res.data;
          if (Array.isArray(d)) return d;
          if (d.data && Array.isArray(d.data)) return d.data;
          return [];
        };

        setTeachers(extractArray(teachersRes));
        setStudents(extractArray(studentsRes));
        setClasses(extractArray(classesRes));
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Failed to load communications data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ================= FETCH HISTORY =================
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get('/sms/messages', config);
      const data = res.data?.data || res.data || [];
      setSentMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('History fetch error:', err);
      toast.error('Failed to load message history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // ================= RECIPIENTS LOGIC =================
  // Returns an array of { name, phone } for display
  const getRecipientDetails = () => {
    let recipients = [];
    switch (recipientType) {
      case 'all_teachers':
        recipients = teachers
          .filter(t => t.phoneNumber)
          .map(t => ({ name: t.fullName || t.name || 'Unknown', phone: t.phoneNumber }));
        break;
      case 'all_parents':
        recipients = students
          .filter(s => s.parentPhone)
          .map(s => ({ name: s.fullName || 'Student', phone: s.parentPhone }));
        break;
      case 'class_parents':
        if (!selectedClass) return [];
        recipients = students
          .filter(s => s.classId == selectedClass && s.parentPhone)
          .map(s => ({ name: s.fullName || 'Student', phone: s.parentPhone }));
        break;
      case 'class_teachers':
        if (!selectedClass) return [];
        recipients = teachers
          .filter(t => t.classId == selectedClass && t.phoneNumber)
          .map(t => ({ name: t.fullName || t.name || 'Unknown', phone: t.phoneNumber }));
        break;
      default:
        break;
    }
    // Remove duplicates (if any)
    const unique = recipients.filter((v, i, a) => a.findIndex(t => t.phone === v.phone) === i);
    return unique;
  };

  const recipients = getRecipientDetails();
  const phoneNumbers = recipients.map(r => r.phone);
  const recipientCount = phoneNumbers.length;

  // ================= SEND SMS =================
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (phoneNumbers.length === 0) {
      toast.error('No recipients found with valid phone numbers');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        recipients: phoneNumbers,
        message: message.trim(),
        category: 'general',
        priority: 'normal',
        isBulk: phoneNumbers.length > 1,
        scheduledFor: scheduled && scheduleDate ? scheduleDate : null
      };
      await api.post('/sms/send', payload, config);
      toast.success(
        scheduled
          ? `SMS scheduled for ${new Date(scheduleDate).toLocaleString()}`
          : `SMS sent to ${phoneNumbers.length} recipient(s)`
      );
      // Clear form
      setMessage('');
      setScheduleDate('');
      setScheduled(false);
    } catch (error) {
      console.error('Send error:', error);
      toast.error(error.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  // ================= FORMAT HELPERS =================
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // ================= LOADING / ERROR =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading communications data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-blue-600" />
            Communications Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">Send SMS & notifications to teachers, parents, and students</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
              activeTab === 'sms' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Compose SMS
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
              activeTab === 'history' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <List className="w-4 h-4" /> History
          </button>
        </div>
      </div>

      {/* SMS TAB */}
      {activeTab === 'sms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Compose SMS</h3>

              {/* Recipient Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient Group</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="all_teachers">All Teachers</option>
                  <option value="all_parents">All Parents</option>
                  <option value="class_parents">Parents of a Class</option>
                  <option value="class_teachers">Teachers of a Class</option>
                </select>
              </div>

              {/* Class Selector (conditional) */}
              {(recipientType === 'class_parents' || recipientType === 'class_teachers') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">Choose a class...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.className}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="Type your message here..."
                  maxLength={480}
                />
                <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                  <span>{message.length}/480 characters</span>
                  <span>{Math.ceil(message.length / 160)} SMS parts</span>
                </div>
              </div>

              {/* Schedule */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <input
                    type="checkbox"
                    checked={scheduled}
                    onChange={(e) => setScheduled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  Schedule for later
                </label>
                {scheduled && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {scheduled ? 'Schedule SMS' : 'Send SMS'}
              </button>
            </div>
          </div>

          {/* Recipient Summary & List Column */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Recipient Summary</h3>
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <p className="text-3xl font-bold text-gray-800">{recipientCount}</p>
                <p className="text-sm text-gray-500">recipients</p>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Teachers</span>
                  <span className="font-medium">{teachers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Students (with parents)</span>
                  <span className="font-medium">{students.filter(s => s.parentPhone).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Classes</span>
                  <span className="font-medium">{classes.length}</span>
                </div>
              </div>
            </div>

            {/* Recipient List – shows names and phone numbers */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Recipients
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{recipientCount}</span>
              </h4>
              {recipientCount === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recipients found</p>
              ) : (
                <div className="max-h-60 overflow-y-auto border rounded-lg divide-y divide-gray-100">
                  {recipients.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-sm">
                      <span className="text-gray-700 truncate">{r.name || 'Unknown'}</span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {r.phone}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Recipients</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Message</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">SMS Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingHistory ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-500">Loading history...</p>
                    </td>
                  </tr>
                ) : sentMessages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No messages sent yet</p>
                    </td>
                  </tr>
                ) : (
                  sentMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{formatDate(msg.createdAt)}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Users className="w-3 h-3" /> {msg.totalRecipients}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-800 max-w-xs truncate">{msg.message}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          msg.status === 'sent' ? 'bg-green-100 text-green-700' :
                          msg.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {msg.status === 'sent' ? <CheckCircle className="w-3 h-3" /> :
                           msg.status === 'scheduled' ? <Clock className="w-3 h-3" /> :
                           <XCircle className="w-3 h-3" />}
                          {msg.status}
                        </span>
                      </td>
                      <td className="p-4 text-center text-sm text-gray-600">{msg.smsCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {sentMessages.length > 0 && (
            <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
              Showing {sentMessages.length} message(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Communications;