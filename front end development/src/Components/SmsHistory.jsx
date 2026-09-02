// Components/SmsHistory.jsx – Fully Connected
import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Filter,
  ChevronDown,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SmsHistory = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get('/sms/messages', { params });
      console.log('📩 History API response:', response.data);

      let messagesData = [];
      let totalCount = 0;

      if (response.data?.data && Array.isArray(response.data.data)) {
        messagesData = response.data.data;
        totalCount = response.data.pagination?.total || response.data.total || messagesData.length;
      } else if (Array.isArray(response.data)) {
        messagesData = response.data;
        totalCount = messagesData.length;
      }

      setMessages(messagesData);
      setPagination(prev => ({
        ...prev,
        total: totalCount || 0
      }));

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('en-UG', {
      day: '2-digit',
      month: '2-digit',
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
    switch(status) {
      case 'delivered': return <CheckCircle size={14} />;
      case 'failed': return <XCircle size={14} />;
      case 'sent': return <Send size={14} />;
      case 'scheduled': return <Clock size={14} />;
      default: return <Clock size={14} />;
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

  const getPriorityColor = (priority) => {
    const colors = {
      emergency: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      normal: 'bg-blue-500 text-white',
      low: 'bg-gray-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchMessages();
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      category: '',
      search: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    setTimeout(fetchMessages, 100);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Send className="text-purple-600" size={28} />
            SMS History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View all sent SMS messages and their delivery status
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 justify-center flex-1 sm:flex-none"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 w-full"
        >
          <Filter size={18} />
          <span className="font-medium">Filters</span>
          <ChevronDown size={16} className={`ml-auto transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="mt-4 space-y-4">
            {/* First row: Search, Status, Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search message or recipient..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  <option value="fee_reminder">Fee Reminder</option>
                  <option value="attendance">Attendance</option>
                  <option value="results">Results</option>
                  <option value="examination">Examination</option>
                  <option value="meeting">Meeting</option>
                  <option value="event">Event</option>
                  <option value="emergency">Emergency</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date Range (From – To)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 w-full">
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                  <span className="text-xs text-slate-400 block mt-0.5">Start date</span>
                </div>
                <span className="text-slate-400 text-sm hidden sm:block">→</span>
                <div className="flex-1 w-full">
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                  <span className="text-xs text-slate-400 block mt-0.5">End date</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                <Calendar className="inline-block mr-1" size={12} />
                Filter messages sent between the selected start and end dates.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
              >
                Clear Filters
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin text-purple-600" size={32} />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center py-12">
            <Send className="mx-auto text-slate-300" size={48} />
            <p className="text-slate-500 mt-2">No messages found</p>
            <p className="text-sm text-slate-400">Start sending SMS to see history here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Recipient</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Message</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Sent At</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-sm">{msg.recipientName || msg.recipient || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{msg.recipient || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate text-sm text-slate-600" title={msg.message}>
                        {msg.message ? msg.message.substring(0, 60) : 'No message'}
                        {msg.message && msg.message.length > 60 ? '...' : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(msg.category)}`}>
                        {msg.category?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(msg.status)}`}>
                        {getStatusIcon(msg.status)}
                        {msg.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(msg.sentAt || msg.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedMessage(msg);
                          setDetailsVisible(true);
                        }}
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {messages.length > 0 && pagination.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-sm text-slate-500">
              Showing {messages.length} of {pagination.total} messages
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-slate-600">
                Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize) || 1}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {detailsVisible && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-slate-800">Message Details</h2>
                <button
                  onClick={() => {
                    setDetailsVisible(false);
                    setSelectedMessage(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-500">Recipient</p>
                    <p className="font-medium">{selectedMessage.recipientName || selectedMessage.recipient || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium">{selectedMessage.recipient || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Category</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedMessage.category)}`}>
                      {selectedMessage.category?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Priority</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedMessage.priority)}`}>
                      {selectedMessage.priority?.toUpperCase() || 'NORMAL'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(selectedMessage.status)}`}>
                      {getStatusIcon(selectedMessage.status)}
                      {selectedMessage.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">SMS Count</p>
                    <p className="font-medium">{selectedMessage.smsCount || 1}</p>
                  </div>
                  {selectedMessage.isBulk && (
                    <>
                      <div>
                        <p className="text-sm text-slate-500">Total Recipients</p>
                        <p className="font-medium">{selectedMessage.totalRecipients || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Delivery</p>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                            ✅ {selectedMessage.successfulCount || 0}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                            ❌ {selectedMessage.failedCount || 0}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">Sent At</p>
                    <p className="font-medium">{formatDate(selectedMessage.sentAt || selectedMessage.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Cost</p>
                    <p className="font-medium text-green-600">UGX {(selectedMessage.cost || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-2">Message Content</p>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 whitespace-pre-wrap">
                    {selectedMessage.message || 'No message content'}
                  </div>
                </div>

                {selectedMessage.deliveryReports && selectedMessage.deliveryReports.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-2">Delivery Reports</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">Recipient</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">Status</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">Delivered At</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedMessage.deliveryReports.map((report) => (
                            <tr key={report.id}>
                              <td className="px-3 py-2">{report.recipient || 'N/A'}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                  {report.status?.toUpperCase() || 'PENDING'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-500">{formatDate(report.deliveredAt)}</td>
                              <td className="px-3 py-2 text-red-500">{report.errorMessage || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setDetailsVisible(false);
                      setSelectedMessage(null);
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsHistory;