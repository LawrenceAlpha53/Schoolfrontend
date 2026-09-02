// Pages/SmsInbox.jsx – Fully Connected
import React, { useState, useEffect } from 'react';
import {
  Inbox,
  CheckCircle,
  Eye,
  RefreshCw,
  Search,
  User,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  ChevronRight,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SmsInbox = () => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReply, setSelectedReply] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchReplies();
  }, []);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      // Using api instance – baseURL is /api, so we call /sms/replies
      const response = await api.get('/sms/replies');
      console.log('📩 Inbox API response:', response.data);
      // The backend returns { success: true, data: [...] }
      const messages = response.data?.data || [];
      setReplies(Array.isArray(messages) ? messages : []);
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Failed to load inbox messages');
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read – we'll update locally since backend may not have a dedicated endpoint
  const markAsRead = async (id) => {
    // If you have a backend endpoint, use it; otherwise just update state
    try {
      // Attempt to call a PUT endpoint if it exists
      await api.put(`/sms/replies/${id}/read`);
      setReplies(replies.map(reply =>
        reply.id === id ? { ...reply, isRead: true } : reply
      ));
      toast.success('Marked as read');
    } catch (error) {
      // If endpoint doesn't exist, just update locally
      setReplies(replies.map(reply =>
        reply.id === id ? { ...reply, isRead: true } : reply
      ));
      toast.success('Marked as read (local)');
    }
  };

  const filteredReplies = replies.filter(reply => {
    const matchesSearch = reply.message?.toLowerCase().includes(searchText.toLowerCase()) ||
                          reply.sender?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'read' && reply.isRead) ||
                         (filterStatus === 'unread' && !reply.isRead);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: replies.length,
    unread: replies.filter(r => !r.isRead).length,
    read: replies.filter(r => r.isRead).length
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

  const getTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(date);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Inbox className="text-purple-600" size={28} />
            SMS Inbox
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage incoming SMS replies from parents and staff
          </p>
        </div>
        <button
          onClick={fetchReplies}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Messages</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Inbox className="text-blue-400" size={32} />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Unread</p>
              <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
            </div>
            <Mail className="text-red-400" size={32} />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Read</p>
              <p className="text-2xl font-bold text-green-600">{stats.read}</p>
            </div>
            <CheckCircle className="text-green-400" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by sender or message"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('unread')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'unread'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unread
              {stats.unread > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                  {stats.unread}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterStatus('read')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'read'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Read
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin text-purple-600" size={32} />
          </div>
        ) : filteredReplies.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="mx-auto text-slate-300" size={48} />
            <p className="text-slate-500 mt-2">No messages in inbox</p>
            <p className="text-sm text-slate-400">Messages from parents and staff will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredReplies.map((reply) => (
              <div
                key={reply.id}
                className={`p-4 hover:bg-slate-50 transition cursor-pointer ${
                  !reply.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''
                }`}
                onClick={() => {
                  setSelectedReply(reply);
                  setShowDetails(true);
                  if (!reply.isRead) {
                    markAsRead(reply.id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <User className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{reply.sender}</span>
                        {!reply.isRead && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">New</span>
                        )}
                      </div>
                      <p className={`text-sm text-slate-600 truncate ${!reply.isRead ? 'font-semibold' : ''}`}>
                        {reply.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {getTimeAgo(reply.receivedAt)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          reply.isRead ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {reply.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-400 flex-shrink-0" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {showDetails && selectedReply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-slate-800">Message Details</h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedReply(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-500">Sender</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone size={16} />
                      {selectedReply.sender}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedReply.isRead ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {selectedReply.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Received At</p>
                    <p>{formatDate(selectedReply.receivedAt)}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-2">Message</p>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 whitespace-pre-wrap">
                    {selectedReply.message}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedReply(null);
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

export default SmsInbox;