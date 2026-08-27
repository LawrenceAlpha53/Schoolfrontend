// Components/SmsTemplates.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios'; // <-- USE YOUR CONFIGURED AXIOS INSTANCE

const SmsTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    body: '',
    variables: '',
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Use api instance - baseURL is already /api
      const response = await api.get('/sms/templates');
      console.log('📦 Templates response:', response.data);
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter template name');
      return;
    }
    if (!formData.body.trim()) {
      toast.error('Please enter message body');
      return;
    }

    try {
      const payload = {
        ...formData,
        variables: formData.variables ? formData.variables.split(',').map(v => v.trim()) : []
      };

      console.log('📤 Saving template:', payload);

      if (editingTemplate) {
        await api.put(`/sms/templates/${editingTemplate.id}`, payload);
        toast.success('Template updated successfully');
      } else {
        await api.post('/sms/templates', payload);
        toast.success('Template created successfully');
      }
      
      fetchTemplates();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    
    try {
      await api.delete(`/sms/templates/${id}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'general',
      body: '',
      variables: '',
      isDefault: false,
      isActive: true
    });
    setEditingTemplate(null);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      category: template.category || 'general',
      body: template.body || '',
      variables: template.variables ? template.variables.join(', ') : '',
      isDefault: template.isDefault || false,
      isActive: template.isActive !== undefined ? template.isActive : true
    });
    setModalVisible(true);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const copyTemplate = (template) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (Copy)`,
      category: template.category || 'general',
      body: template.body || '',
      variables: template.variables ? template.variables.join(', ') : '',
      isDefault: false,
      isActive: true
    });
    setModalVisible(true);
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

  const getCategoryLabel = (category) => {
    const labels = {
      fee_reminder: 'Fee Reminder',
      attendance: 'Attendance',
      results: 'Results',
      examination: 'Examination',
      meeting: 'Meeting',
      event: 'Event',
      emergency: 'Emergency',
      birthday: 'Birthday',
      admission: 'Admission',
      payment_confirmation: 'Payment Confirmation',
      allowance: 'Allowance',
      general: 'General'
    };
    return labels[category] || category;
  };

  const filteredTemplates = templates.filter(template =>
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.body?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sms-templates p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-purple-600" size={28} />
            SMS Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage reusable SMS message templates
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search templates by name, category, or content..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin text-purple-600" size={32} />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-300" size={48} />
            <p className="text-slate-500 mt-2">No templates found</p>
            <p className="text-sm text-slate-400">Create your first SMS template</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Message Preview</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Variables</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Usage</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{template.name}</div>
                      {template.isDefault && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {getCategoryLabel(template.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate text-sm text-slate-600">
                        {template.body?.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {template.variables?.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
                        {template.usageCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {template.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <XCircle size={14} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => copyTemplate(template)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Copy"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
        {filteredTemplates.length > 20 && (
          <div className="px-4 py-3 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm text-slate-500">
              Showing {filteredTemplates.length} templates
            </span>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingTemplate ? 'Edit Template' : 'Create Template'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {editingTemplate ? 'Update template details' : 'Create a new SMS template'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Fee Reminder"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="fee_reminder">Fee Reminder</option>
                    <option value="attendance">Attendance</option>
                    <option value="results">Results</option>
                    <option value="examination">Examination</option>
                    <option value="meeting">Meeting</option>
                    <option value="event">Event</option>
                    <option value="emergency">Emergency</option>
                    <option value="birthday">Birthday</option>
                    <option value="admission">Admission</option>
                    <option value="payment_confirmation">Payment Confirmation</option>
                    <option value="allowance">Allowance</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Message Body <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Type your template message..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  />
                  <div className="mt-1 text-sm text-slate-500">
                    {formData.body.length} characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Variables (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., {StudentName}, {Balance}, {SchoolName}"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Example: StudentName, Balance, SchoolName
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                    />
                    Set as default template
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                    />
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                  >
                    {editingTemplate ? <Edit size={18} /> : <Plus size={18} />}
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsTemplates;