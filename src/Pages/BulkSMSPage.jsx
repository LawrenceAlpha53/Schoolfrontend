import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Upload,
  Phone,
  DollarSign,
  Clock,
  Users,
  Loader2,
  X,
  UserPlus,
  RefreshCw,
  FileSpreadsheet,
  Edit3,
  RotateCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import * as XLSX from 'xlsx';

const BulkSMSPage = () => {
  // ================= STATE =================
  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState('');
  const [senderId, setSenderId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [balance, setBalance] = useState(0);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true); // default open
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(20);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyFilters, setHistoryFilters] = useState({
    status: '',
    search: '',
  });
  const [deletingId, setDeletingId] = useState(null);

  const [manualInput, setManualInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ===== FETCH DATA =====
  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts');
      if (res.data.success) setContacts(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load contacts');
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await api.get('/sms/balance');
      if (res.data.success) setBalance(res.data.data.balance || 0);
    } catch (err) {
      console.error('Balance error', err);
    }
  };

  const fetchHistory = async (page = historyPage, filters = historyFilters) => {
    setHistoryLoading(true);
    try {
      const params = {
        page,
        limit: historyLimit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      };
      const res = await api.get('/sms/messages', { params });
      if (res.data.success) {
        setHistory(res.data.data || []);
        setHistoryTotal(res.data.pagination?.total || 0);
        setHistoryPage(page);
      }
    } catch (err) {
      toast.error('Could not fetch history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchBalance();
    fetchHistory(1, { status: '', search: '' });
  }, []);

  // ===== IMPORT HANDLERS (unchanged) =====
  const handleManualAdd = async () => {
    if (!manualInput.trim()) return toast.error('Enter numbers');
    const raw = manualInput.split(/[\n,;]+/).map(s => s.trim()).filter(s => s);
    if (!raw.length) return toast.error('No numbers found');
    try {
      const res = await api.post('/contacts/import', { numbers: raw });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchContacts();
        setManualInput('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    }
  };

  const processAndUploadFile = async (file) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt === 'csv') {
      const formData = new FormData();
      formData.append('file', file);
      try {
        toast.loading('Uploading and processing CSV...', { id: 'file-upload' });
        const res = await api.post('/contacts/import/csv', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          toast.success(res.data.message, { id: 'file-upload' });
          fetchContacts();
        } else {
          toast.error(res.data.message || 'CSV import failed', { id: 'file-upload' });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'CSV import failed', { id: 'file-upload' });
      }
      return;
    }
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      try {
        toast.loading('Reading Excel file...', { id: 'file-upload' });
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        if (!rows || rows.length === 0) {
          toast.error('Excel file is empty', { id: 'file-upload' });
          return;
        }
        const header = rows[0]?.map(h => String(h).toLowerCase()) || [];
        let phoneIndex = -1;
        const possibleNames = ['phone', 'mobile', 'contact', 'telephone', 'tel', 'number', 'phonenumber'];
        for (let i = 0; i < header.length; i++) {
          if (possibleNames.some(name => header[i].includes(name))) {
            phoneIndex = i;
            break;
          }
        }
        if (phoneIndex === -1) phoneIndex = 0;
        const numbers = rows.slice(1)
          .map(row => row[phoneIndex])
          .filter(v => v && String(v).trim())
          .map(v => String(v).trim());
        if (numbers.length === 0) {
          toast.error('No phone numbers found in Excel', { id: 'file-upload' });
          return;
        }
        const res = await api.post('/contacts/import', { numbers });
        if (res.data.success) {
          toast.success(res.data.message, { id: 'file-upload' });
          fetchContacts();
        } else {
          toast.error(res.data.message || 'Excel import failed', { id: 'file-upload' });
        }
      } catch (err) {
        toast.error('Failed to read Excel file: ' + err.message, { id: 'file-upload' });
      }
      return;
    }
    toast.error('Only CSV, XLSX, and XLS files are supported');
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    await processAndUploadFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processAndUploadFile(file);
    }
  };

  const deleteContact = async (id) => {
    if (!confirm('Remove this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success('Removed');
      fetchContacts();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const clearAllContacts = async () => {
    if (!confirm('Delete ALL contacts?')) return;
    try {
      await api.delete('/contacts');
      toast.success('All contacts cleared');
      fetchContacts();
    } catch (err) {
      toast.error('Clear failed');
    }
  };

  // ===== SEND SMS =====
  const sendBulkSms = async () => {
    if (contacts.length === 0) return toast.error('No contacts to send to');
    if (!message.trim()) return toast.error('Enter a message');
    const smsLength = 160;
    const smsCount = Math.ceil(message.length / smsLength);
    const cost = smsCount * 62 * contacts.length;
    if (balance < cost) {
      return toast.error(`Insufficient balance. Need ${cost}, have ${balance}`);
    }
    if (!confirm(`Send to ${contacts.length} recipients? Cost: ${cost} SMS`)) return;
    setIsSending(true);
    try {
      const phoneNumbers = contacts.map(c => c.phone);
      const payload = {
        recipients: phoneNumbers,
        message,
        category: 'general',
      };
      const res = await api.post('/sms/send', payload);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchBalance();
        fetchHistory(1, historyFilters);
        setMessage('');
      } else {
        toast.error(res.data.message || 'Send failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send error');
    } finally {
      setIsSending(false);
    }
  };

  const resendMessage = (msg) => {
    setMessage(msg.message);
    toast.success('Message copied to composer. You can edit and send again.');
    document.getElementById('compose-area')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ===== HISTORY DELETE & CLEAR =====
  const deleteMessage = async (id) => {
    if (!confirm('Delete this message from history?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/sms/messages/${id}`);
      toast.success('Message deleted');
      fetchHistory(historyPage, historyFilters);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Delete ALL message history? This cannot be undone.')) return;
    try {
      await api.delete('/sms/messages');
      toast.success('All history cleared');
      fetchHistory(1, historyFilters);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Clear history failed');
    }
  };

  // ===== FILTER & PAGINATION =====
  const handleFilterChange = (key, value) => {
    const newFilters = { ...historyFilters, [key]: value };
    setHistoryFilters(newFilters);
    fetchHistory(1, newFilters);
  };

  const goToPage = (page) => {
    if (page < 1 || page > Math.ceil(historyTotal / historyLimit)) return;
    fetchHistory(page, historyFilters);
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-7 h-7 text-purple-600" />
                Bulk SMS
              </h1>
              <p className="text-sm text-slate-500">Send to all imported contacts or selected numbers</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-xs text-slate-500">Balance</span>
                  <p className="text-lg font-bold text-emerald-700">{balance} SMS</p>
                </div>
              </div>
              <button
                onClick={() => { fetchBalance(); fetchContacts(); fetchHistory(historyPage, historyFilters); }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Import & Contacts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Import section (unchanged) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Import Phone Numbers
              </h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Paste numbers (one per line, comma or semicolon separated)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. 0700123456, +256700123456, 700123456"
                    rows="3"
                    className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleManualAdd}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium whitespace-nowrap self-end sm:self-auto"
                  >
                    Add Numbers
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload CSV or Excel file
                </label>
                <div 
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? 'border-purple-600 bg-purple-50/70 scale-[1.01]' 
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-purple-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                  <FileSpreadsheet className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDragging ? 'text-purple-600 scale-110 animate-pulse' : 'text-slate-400'}`} />
                  <p className="text-sm font-medium text-slate-700">
                    {isDragging ? 'Drop your file here now!' : 'Drag & Drop CSV or Excel file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse (.csv, .xlsx, .xls)</p>
                </div>
              </div>
            </div>

            {/* Contacts list (unchanged) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-purple-600" />
                  Contacts ({contacts.length})
                </h2>
                {contacts.length > 0 && (
                  <button
                    onClick={clearAllContacts}
                    className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All
                  </button>
                )}
              </div>
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Phone className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  No contacts. Import numbers above.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-slate-600 font-medium">#</th>
                        <th className="px-4 py-2 text-left text-slate-600 font-medium">Phone</th>
                        <th className="px-4 py-2 text-left text-slate-600 font-medium">Added</th>
                        <th className="px-4 py-2 text-right text-slate-600 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c, i) => (
                        <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                          <td className="px-4 py-2 font-mono text-slate-700">{c.phone}</td>
                          <td className="px-4 py-2 text-slate-500 text-xs">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => deleteContact(c.id)}
                              className="text-red-400 hover:text-red-600 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Compose & Send (unchanged) */}
          <div className="space-y-6">
            <div id="compose-area" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
                <Edit3 className="w-5 h-5 text-purple-600" />
                Compose Message
              </h2>
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sender ID <span className="text-xs text-slate-400">(currently forced to ATInfo)</span>
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder="Leave blank – backend uses ATInfo"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm bg-slate-50"
                  disabled
                />
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows="6"
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm resize-y"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>{message.length} chars</span>
                <span>
                  SMS: {Math.ceil(message.length / 160)}
                  {contacts.length > 0 && ` · Cost: ${Math.ceil(message.length / 160) * 62 * contacts.length} SMS`}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <button
                onClick={sendBulkSms}
                disabled={isSending || contacts.length === 0 || !message.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition font-bold text-lg shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-5 h-5" /> Send Bulk SMS</>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''} will receive this message
              </p>
            </div>
          </div>
        </div>

        {/* ===================== HISTORY SECTION (UPGRADED) ===================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Message History
              </h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                {historyTotal} messages
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={historyFilters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none w-40 md:w-56"
                  />
                </div>
                <select
                  value={historyFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                >
                  <option value="">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <button
                onClick={clearAllHistory}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition"
              >
                <Trash className="w-4 h-4" /> Clear All
              </button>
            </div>
          </div>

          {/* History Table */}
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Clock className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              No messages in history
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-600 font-semibold text-xs uppercase tracking-wider">Recipient</th>
                    <th className="px-4 py-3 text-left text-slate-600 font-semibold text-xs uppercase tracking-wider">Message</th>
                    <th className="px-4 py-3 text-left text-slate-600 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-slate-600 font-semibold text-xs uppercase tracking-wider">Sent At</th>
                    <th className="px-4 py-3 text-center text-slate-600 font-semibold text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {msg.isBulk ? (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-purple-500" />
                            BULK ({msg.totalRecipients || '?'})
                          </span>
                        ) : (
                          msg.recipient
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={msg.message}>
                        {msg.message}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          msg.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                          msg.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {msg.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => resendMessage(msg)}
                            className="text-blue-500 hover:text-blue-700 transition p-1 rounded hover:bg-blue-50"
                            title="Reuse this message"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            disabled={deletingId === msg.id}
                            className="text-red-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50 disabled:opacity-50"
                            title="Delete this message"
                          >
                            {deletingId === msg.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {historyTotal > historyLimit && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Showing {((historyPage - 1) * historyLimit) + 1} to {Math.min(historyPage * historyLimit, historyTotal)} of {historyTotal} messages
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(historyPage - 1)}
                  disabled={historyPage === 1}
                  className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600">
                  Page {historyPage} of {Math.ceil(historyTotal / historyLimit)}
                </span>
                <button
                  onClick={() => goToPage(historyPage + 1)}
                  disabled={historyPage >= Math.ceil(historyTotal / historyLimit)}
                  className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkSMSPage;