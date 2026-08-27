// Components/SmsDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Send,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  FileText,
  Inbox,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SmsDashboard = () => {
  const [stats, setStats] = useState({
    currentBalance: 0,
    totalPurchased: 0,
    totalUsed: 0,
    totalSpent: 0,
    totalMessages: 0,
    totalSent: 0,
    totalFailed: 0,
    sentToday: 0,
    deliveryRate: 0
  });
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAnalytics(), fetchRecentMessages(), fetchTemplates()]);
    } catch (error) {
      console.error('Error fetching SMS data:', error);
      toast.error('Failed to load SMS dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Force token inclusion by getting it from localStorage
  const getToken = () => localStorage.getItem('token');

  const fetchAnalytics = async () => {
    try {
      const token = getToken();
      const response = await api.get('/sms/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data?.data || response.data || {};
      setStats({
        currentBalance: data.currentBalance || data.balance || 0,
        totalPurchased: data.totalPurchased || 0,
        totalUsed: data.totalUsed || 0,
        totalSpent: data.totalSpent || 0,
        totalMessages: data.totalMessages || 0,
        totalSent: data.totalSent || 0,
        totalFailed: data.totalFailed || 0,
        sentToday: data.sentToday || 0,
        deliveryRate: data.deliveryRate || 0
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      const token = getToken();
      const response = await api.get('/sms/messages', {
        params: { limit: 20, page: 1 },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📩 Messages API response:', response.data);
      // Extract messages – handle multiple formats
      let messages = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        messages = response.data.data;
      } else if (Array.isArray(response.data)) {
        messages = response.data;
      } else if (response.data?.rows && Array.isArray(response.data.rows)) {
        messages = response.data.rows;
      }
      setRecentMessages(messages);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setRecentMessages([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = getToken();
      const response = await api.get('/sms/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const templatesData = response.data?.data || response.data || [];
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Templates error:', error);
      setTemplates([]);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleString('en-UG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: 'bg-blue-100 text-blue-600',
      delivered: 'bg-green-100 text-green-600',
      failed: 'bg-red-100 text-red-600',
      pending: 'bg-yellow-100 text-yellow-600',
      scheduled: 'bg-purple-100 text-purple-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5" />;
      case 'sent': return <Send className="w-3.5 h-3.5" />;
      case 'scheduled': return <Clock className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      fee_reminder: 'bg-orange-100 text-orange-600',
      attendance: 'bg-blue-100 text-blue-600',
      results: 'bg-green-100 text-green-600',
      examination: 'bg-red-100 text-red-600',
      meeting: 'bg-purple-100 text-purple-600',
      event: 'bg-pink-100 text-pink-600',
      emergency: 'bg-red-200 text-red-700',
      birthday: 'bg-yellow-100 text-yellow-600',
      admission: 'bg-teal-100 text-teal-600',
      payment_confirmation: 'bg-emerald-100 text-emerald-600',
      allowance: 'bg-indigo-100 text-indigo-600',
      general: 'bg-gray-100 text-gray-600'
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="sms-dashboard p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-purple-600" size={28} />
            SMS Communication Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor SMS usage, delivery rates, and communication history
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/secretary/sms/compose'}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
        >
          <Send size={18} />
          Compose SMS
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">SMS Balance</p>
              <p className={`text-2xl font-bold mt-1 ${stats.currentBalance < 1000 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.currentBalance}
              </p>
              <span className="text-xs text-slate-400">SMS credits</span>
            </div>
            <Wallet className={stats.currentBalance < 1000 ? 'text-red-400' : 'text-green-400'} size={28} />
          </div>
          <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${stats.currentBalance < 1000 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: stats.currentBalance < 1000 ? '10%' : '80%' }}
            />
          </div>
          {stats.currentBalance < 100 && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />
              Low balance!
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            Total purchased: {stats.totalPurchased} SMS
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Sent Today</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.sentToday}</p>
              <span className="text-xs text-slate-400">messages</span>
            </div>
            <Send className="text-blue-400" size={28} />
          </div>
          <div className="mt-3 flex gap-2 text-xs text-slate-400">
            <span>Total sent: {stats.totalSent}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Delivery Rate</p>
              <p className={`text-2xl font-bold mt-1 ${stats.deliveryRate > 95 ? 'text-green-600' : stats.deliveryRate > 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {stats.deliveryRate}%
              </p>
              <span className="text-xs text-slate-400">success rate</span>
            </div>
            <CheckCircle className={stats.deliveryRate > 95 ? 'text-green-400' : 'text-yellow-400'} size={28} />
          </div>
          <div className="mt-3 flex gap-2 text-xs text-slate-400">
            <span>Failed: {stats.totalFailed}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Messages</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalMessages}</p>
              <span className="text-xs text-slate-400">all time</span>
            </div>
            <BarChart3 className="text-purple-400" size={28} />
          </div>
          <div className="mt-3 flex gap-2 text-xs text-slate-400">
            <span>Total spent: UGX {formatCurrency(stats.totalSpent)}</span>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-purple-500" />
            SMS Usage
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Used</span>
              <span className="font-bold text-slate-800">{stats.totalUsed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Purchased</span>
              <span className="font-bold text-slate-800">{stats.totalPurchased}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-3">
              <span className="text-sm text-slate-500">Total Spent</span>
              <span className="font-bold text-green-600">UGX {formatCurrency(stats.totalSpent)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-blue-500" />
            Templates ({templates.length})
          </h3>
          {templates.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {templates.slice(0, 5).map((template) => (
                <div key={template.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 truncate max-w-[150px]">{template.name}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
                    {template.usageCount || 0}
                  </span>
                </div>
              ))}
              {templates.length > 5 && (
                <p className="text-xs text-slate-400 mt-1">+{templates.length - 5} more</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No templates created yet</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700">
              <Send size={16} />
              Send to Defaulters
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700">
              <FileText size={16} />
              Fee Reminders
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700">
              <Inbox size={16} />
              View Inbox
            </button>
            <button
              onClick={fetchAllData}
              className="w-full flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-sm text-purple-600"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-medium text-slate-700 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-500" />
            Recent Messages
            <span className="text-sm text-slate-400 font-normal">({recentMessages.length})</span>
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecentMessages}
              disabled={loading}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin text-purple-600" size={32} />
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto text-slate-300" size={48} />
            <p className="text-slate-500 mt-2">No messages sent yet</p>
            <p className="text-sm text-slate-400">Start sending SMS to see history here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Recipient</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Message</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{msg.recipientName || msg.recipient || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{msg.recipient || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate text-slate-600" title={msg.message}>
                        {msg.message ? msg.message.substring(0, 80) : 'No message'}
                        {msg.message && msg.message.length > 80 && '...'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(msg.category)}`}>
                        {msg.category ? msg.category.replace(/_/g, ' ').toUpperCase() : 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(msg.status)}`}>
                        {getStatusIcon(msg.status)}
                        {msg.status ? msg.status.toUpperCase() : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(msg.sentAt || msg.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {recentMessages.length > 10 && (
          <div className="p-4 border-t border-slate-200 text-center">
            <button className="text-sm text-purple-600 hover:text-purple-700">
              View all messages →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmsDashboard;