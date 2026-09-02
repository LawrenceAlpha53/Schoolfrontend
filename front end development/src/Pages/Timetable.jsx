// SecretaryTimetable.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  User,
  Plus,
  Search,
  RefreshCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
  Trash2,
  Save,
  X,
  Filter,
  Settings,
  Sparkles,
  Rocket,
  Target,
  Eye,
  Copy,
  AlertCircle,
  CheckCircle,
  XCircle,
  School,
  GraduationCap,
  UserCheck,
  UserX,
  FileText,
  Grid,
  List,
  LayoutGrid,
  Table,
  Clock as ClockIcon,
  MapPin,
  UserPlus,
  Send,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SecretaryTimetable = () => {
  // ================= STATE =================
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    room: '',
    term: 'Term 1',
    academicYear: new Date().getFullYear().toString()
  });

  // Assign form state
  const [assignForm, setAssignForm] = useState({
    teacherId: '',
    classId: '',
    subjectId: '',
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    room: '',
    term: 'Term 1',
    academicYear: new Date().getFullYear().toString(),
    message: ''
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Bulk form state
  const [bulkEntries, setBulkEntries] = useState([]);
  const [bulkDay, setBulkDay] = useState('Monday');

  // Clone form state
  const [cloneData, setCloneData] = useState({
    fromTerm: 'Term 1',
    fromYear: new Date().getFullYear().toString(),
    toTerm: 'Term 2',
    toYear: new Date().getFullYear().toString(),
    classId: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [];
  for (let i = 7; i <= 17; i++) {
    timeSlots.push(`${String(i).padStart(2, '0')}:00`);
    timeSlots.push(`${String(i).padStart(2, '0')}:30`);
  }

  // ================= FETCH DATA =================
  // ================= FETCH DATA =================
// ================= FETCH DATA =================
const fetchData = useCallback(async () => {
  try {
    setIsLoading(true);

    const [classesRes, subjectsRes, teachersRes, timetablesRes] = await Promise.all([
      api.get('/classes'),
      api.get('/subjects'),
      api.get('/teachers'),
      api.get(`/timetables?term=${selectedTerm}&academicYear=${selectedYear}`)
    ]);

    console.log('📌 Classes Response:', classesRes.data);
    console.log('📌 Subjects Response:', subjectsRes.data);
    console.log('📌 Teachers Response:', teachersRes.data);
    console.log('📌 Timetables Response:', timetablesRes.data);

    // Extract data - handle different response formats
    const classesData = classesRes.data?.data || classesRes.data || [];
    const subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
    const teachersData = teachersRes.data?.data || teachersRes.data || [];
    
    // FIX: Handle timetables response properly - check all possible formats
    let timetablesData = [];
    if (timetablesRes.data) {
      if (Array.isArray(timetablesRes.data)) {
        timetablesData = timetablesRes.data;
      } else if (timetablesRes.data.data && Array.isArray(timetablesRes.data.data)) {
        timetablesData = timetablesRes.data.data;
      } else if (timetablesRes.data.timetables && Array.isArray(timetablesRes.data.timetables)) {
        timetablesData = timetablesRes.data.timetables;
      } else if (timetablesRes.data.results && Array.isArray(timetablesRes.data.results)) {
        timetablesData = timetablesRes.data.results;
      } else if (timetablesRes.data.rows && Array.isArray(timetablesRes.data.rows)) {
        timetablesData = timetablesRes.data.rows;
      } else {
        // If it's an object with keys, try to extract
        const dataObj = timetablesRes.data;
        if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
          // Try to find an array property
          const possibleArrays = Object.values(dataObj).filter(v => Array.isArray(v));
          if (possibleArrays.length > 0) {
            timetablesData = possibleArrays[0];
          } else {
            timetablesData = [];
          }
        } else {
          timetablesData = [];
        }
      }
    }

    console.log('📌 Extracted Timetables:', timetablesData.length);

    setClasses(Array.isArray(classesData) ? classesData : []);
    setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    setTeachers(Array.isArray(teachersData) ? teachersData : []);
    setTimetables(Array.isArray(timetablesData) ? timetablesData : []);

  } catch (error) {
    console.error('❌ Fetch error:', error);
    console.error('❌ Error response:', error.response?.data);
    toast.error('Failed to load timetable data: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsLoading(false);
  }
}, [selectedTerm, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= FILTER TIMETABLES =================
  const getFilteredTimetables = () => {
    let filtered = [...timetables];

    if (selectedClass) {
      filtered = filtered.filter(t => t.classId === parseInt(selectedClass));
    }

    if (selectedDay && selectedDay !== 'all') {
      filtered = filtered.filter(t => t.dayOfWeek === selectedDay);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.subject?.subjectName?.toLowerCase().includes(term) ||
        t.teacher?.fullName?.toLowerCase().includes(term) ||
        t.class?.className?.toLowerCase().includes(term) ||
        t.room?.toLowerCase().includes(term)
      );
    }

    if (filterTeacher !== 'all') {
      filtered = filtered.filter(t => t.teacherId === parseInt(filterTeacher));
    }

    return filtered;
  };

  const filteredTimetables = getFilteredTimetables();

  // ================= GROUP BY DAY =================
  const getTimetableByDay = (day) => {
    return filteredTimetables.filter(t => t.dayOfWeek === day);
  };

  // ================= HANDLE FORM CHANGE =================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ================= CREATE TIMETABLE =================
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.classId || !formData.subjectId || !formData.teacherId) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSaving(true);
      const response = await api.post('/timetables', formData);
      
      if (response.data.success) {
        toast.success('Timetable entry created successfully!');
        setShowAddModal(false);
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Failed to create timetable entry');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= UPDATE TIMETABLE =================
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      const response = await api.put(`/timetables/${selectedEntry.id}`, formData);
      
      if (response.data.success) {
        toast.success('Timetable entry updated successfully!');
        setShowEditModal(false);
        setSelectedEntry(null);
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update timetable entry');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= DELETE TIMETABLE =================
  const handleDelete = async () => {
    try {
      setIsSaving(true);
      const response = await api.delete(`/timetables/${entryToDelete.id}`);
      
      if (response.data.success) {
        toast.success('Timetable entry deleted successfully!');
        setShowDeleteModal(false);
        setEntryToDelete(null);
        fetchData();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete timetable entry');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= ASSIGN TO TEACHER =================
  // In SecretaryTimetable.jsx - Updated handleAssignToTeacher
const handleAssignToTeacher = async (e) => {
  e.preventDefault();
  
  if (!assignForm.teacherId || !assignForm.classId || !assignForm.subjectId) {
    toast.error('Please fill all required fields');
    return;
  }

  try {
    setIsAssigning(true);
    
    // Create the timetable entry with notification
    const assignData = {
      teacherId: parseInt(assignForm.teacherId),
      classId: parseInt(assignForm.classId),
      subjectId: parseInt(assignForm.subjectId),
      dayOfWeek: assignForm.dayOfWeek,
      startTime: assignForm.startTime,
      endTime: assignForm.endTime,
      room: assignForm.room,
      term: assignForm.term || 'Term 1',
      academicYear: assignForm.academicYear || new Date().getFullYear().toString(),
      message: assignForm.message || `You have been assigned to teach on ${assignForm.dayOfWeek} at ${assignForm.startTime} - ${assignForm.endTime}`
    };
    
    console.log('📌 Assigning timetable with data:', assignData);
    
    const response = await api.post('/timetables/assign-to-teacher', assignData);
    
    if (response.data.success) {
      toast.success('✅ Timetable assigned to teacher successfully! Notification sent.');
      setShowAssignModal(false);
      resetAssignForm();
      fetchData();
    }
  } catch (error) {
    console.error('❌ Assign error:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    if (error.response?.status === 403) {
      toast.error('⚠️ Permission denied. Only Admins and Secretaries can assign timetables.');
    } else if (error.response?.status === 401) {
      toast.error('Session expired. Please login again.');
    } else {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to assign timetable');
    }
  } finally {
    setIsAssigning(false);
  }
};

  // ================= BULK CREATE =================
  const handleBulkCreate = async () => {
    try {
      setIsSaving(true);
      const response = await api.post('/timetables/bulk', { entries: bulkEntries });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowBulkModal(false);
        setBulkEntries([]);
        fetchData();
      }
    } catch (error) {
      console.error('Bulk create error:', error);
      toast.error(error.response?.data?.message || 'Failed to create bulk entries');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= CLONE TIMETABLE =================
  const handleClone = async () => {
    try {
      setIsSaving(true);
      const response = await api.post('/timetables/clone', cloneData);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowCloneModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Clone error:', error);
      toast.error(error.response?.data?.message || 'Failed to clone timetable');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= RESET FORMS =================
  const resetForm = () => {
    setFormData({
      classId: '',
      subjectId: '',
      teacherId: '',
      dayOfWeek: 'Monday',
      startTime: '08:00',
      endTime: '09:00',
      room: '',
      term: 'Term 1',
      academicYear: new Date().getFullYear().toString()
    });
  };

  const resetAssignForm = () => {
    setAssignForm({
      teacherId: '',
      classId: '',
      subjectId: '',
      dayOfWeek: 'Monday',
      startTime: '08:00',
      endTime: '09:00',
      room: '',
      term: 'Term 1',
      academicYear: new Date().getFullYear().toString(),
      message: ''
    });
  };

  // ================= OPEN EDIT MODAL =================
  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setFormData({
      classId: entry.classId || '',
      subjectId: entry.subjectId || '',
      teacherId: entry.teacherId || '',
      dayOfWeek: entry.dayOfWeek || 'Monday',
      startTime: entry.startTime || '08:00',
      endTime: entry.endTime || '09:00',
      room: entry.room || '',
      term: entry.term || 'Term 1',
      academicYear: entry.academicYear || new Date().getFullYear().toString()
    });
    setShowEditModal(true);
  };

  // ================= OPEN VIEW MODAL =================
  const openViewModal = (entry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  // ================= ADD BULK ENTRY =================
  const addBulkEntry = () => {
    if (!formData.classId || !formData.subjectId || !formData.teacherId) {
      toast.error('Please select class, subject, and teacher');
      return;
    }
    
    setBulkEntries([...bulkEntries, {
      classId: formData.classId,
      subjectId: formData.subjectId,
      teacherId: formData.teacherId,
      dayOfWeek: bulkDay,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room,
      term: selectedTerm,
      academicYear: selectedYear
    }]);
    toast.success('Entry added to bulk list');
  };

  // ================= REMOVE BULK ENTRY =================
  const removeBulkEntry = (index) => {
    setBulkEntries(bulkEntries.filter((_, i) => i !== index));
  };

  // ================= EXPORT CSV =================
  const exportCSV = () => {
    if (filteredTimetables.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Class,Subject,Teacher,Day,Start Time,End Time,Room,Term,Year\n'];
    const rows = filteredTimetables.map(t => 
      `${t.class?.className || 'N/A'},${t.subject?.subjectName || 'N/A'},${t.teacher?.fullName || 'N/A'},${t.dayOfWeek},${t.startTime},${t.endTime},${t.room || 'N/A'},${t.term},${t.academicYear}\n`
    );

    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `timetable_${selectedTerm}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Timetable exported successfully');
  };

  // ================= LOADING STATE =================
  // ================= LOADING STATE =================
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading timetable...</p>
        <p className="text-sm text-gray-400 mt-2">Fetching classes, subjects, teachers and timetables</p>
      </div>
    </div>
  );
}

  // ================= RENDER GRID VIEW =================
  const renderGridView = () => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-gray-50 border p-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">Time</th>
              {dayOrder.map(day => (
                <th key={day} className="bg-gray-50 border p-3 text-center text-xs font-semibold text-gray-500 uppercase min-w-[120px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time, index) => {
              const nextTime = timeSlots[index + 1] || '18:00';
              return (
                <tr key={time}>
                  <td className="border p-2 text-xs font-medium text-gray-500 text-center">
                    {time}
                  </td>
                  {dayOrder.map(day => {
                    const entry = filteredTimetables.find(t => 
                      t.dayOfWeek === day && 
                      t.startTime <= time && 
                      t.endTime > time
                    );
                    
                    if (entry) {
                      const rowSpan = Math.ceil(
                        (new Date(`1970-01-01T${entry.endTime}`) - new Date(`1970-01-01T${entry.startTime}`)) / 
                        (1000 * 60 * 30)
                      );
                      
                      const isFirstRow = !filteredTimetables.find(t => 
                        t.id !== entry.id &&
                        t.dayOfWeek === day &&
                        t.startTime <= time &&
                        t.endTime > time
                      );
                      
                      if (isFirstRow) {
                        return (
                          <td 
                            key={`${day}-${time}`} 
                            rowSpan={rowSpan}
                            className="border p-2 bg-purple-50 hover:bg-purple-100 cursor-pointer transition"
                            onClick={() => openViewModal(entry)}
                          >
                            <div className="text-sm font-medium text-purple-800">{entry.subject?.subjectName}</div>
                            <div className="text-xs text-gray-600">{entry.teacher?.fullName}</div>
                            <div className="text-xs text-gray-500">{entry.room}</div>
                          </td>
                        );
                      }
                      return null;
                    }
                    
                    const isInEntry = filteredTimetables.some(t => 
                      t.dayOfWeek === day && 
                      t.startTime <= time && 
                      t.endTime > time
                    );
                    
                    if (!isInEntry) {
                      return (
                        <td key={`${day}-${time}`} className="border p-2 bg-gray-50 h-12">
                          <div className="text-xs text-gray-300 text-center">-</div>
                        </td>
                      );
                    }
                    return null;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ================= RENDER LIST VIEW =================
  const renderListView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Day</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Room</th>
              <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTimetables.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No timetable entries found</p>
                  <p className="text-sm mt-1">Click "Add Entry" to create your first timetable entry</p>
                </td>
              </tr>
            ) : (
              filteredTimetables.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <School className="w-3 h-3" />
                      {entry.class?.className}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      {entry.subject?.subjectName}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {entry.teacher?.fullName}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm font-medium">{entry.dayOfWeek}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-sm">
                      <ClockIcon className="w-3 h-3 text-gray-400" />
                      {entry.startTime} - {entry.endTime}
                    </div>
                  </td>
                  <td className="p-3">
                    {entry.room && (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {entry.room}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openViewModal(entry)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(entry)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEntryToDelete(entry);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-purple-600" />
            Timetable Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage school timetable • Assign classes to teachers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              resetAssignForm();
              setShowAssignModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Assign to Teacher
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
          >
            <Copy className="w-4 h-4" />
            Bulk Add
          </button>
          <button
            onClick={() => setShowCloneModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition font-medium text-sm"
          >
            <Copy className="w-4 h-4" />
            Clone
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="all">All Days</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          <div className="flex-1 min-w-[180px] relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <Search className="absolute left-3 top-[34px] w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject, teacher, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Load
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Teacher:</span>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Teachers</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-500 ml-auto">
            {filteredTimetables.length} entries found
          </div>
        </div>
      </div>

      {/* ================= TIMETABLE DISPLAY ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </div>

      {/* ================= ADD MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Add Timetable Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subjectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Day *</label>
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleFormChange}
                  placeholder="e.g., Room 101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
                  <select
                    name="term"
                    value={formData.term}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
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
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ASSIGN TO TEACHER MODAL ================= */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-green-600" />
                Assign Timetable to Teacher
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAssignToTeacher} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700 flex items-start gap-2">
                <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Assign this timetable entry to a teacher. They will see it in their timetable.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                <select
                  value={assignForm.teacherId}
                  onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                <select
                  value={assignForm.classId}
                  onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                <select
                  value={assignForm.subjectId}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subjectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Day *</label>
                <select
                  value={assignForm.dayOfWeek}
                  onChange={(e) => setAssignForm({ ...assignForm, dayOfWeek: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  required
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    value={assignForm.startTime}
                    onChange={(e) => setAssignForm({ ...assignForm, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                  <input
                    type="time"
                    value={assignForm.endTime}
                    onChange={(e) => setAssignForm({ ...assignForm, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                <input
                  type="text"
                  value={assignForm.room}
                  onChange={(e) => setAssignForm({ ...assignForm, room: e.target.value })}
                  placeholder="e.g., Room 101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
                  <select
                    value={assignForm.term}
                    onChange={(e) => setAssignForm({ ...assignForm, term: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
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
                    value={assignForm.academicYear}
                    onChange={(e) => setAssignForm({ ...assignForm, academicYear: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isAssigning ? 'Assigning...' : 'Assign to Teacher'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Edit Timetable Entry</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subjectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Day *</label>
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleFormChange}
                  placeholder="e.g., Room 101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Updating...' : 'Update Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {showDeleteModal && entryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Entry</h3>
              <p className="text-gray-500 text-sm mb-4">
                Are you sure you want to delete this timetable entry for
                <span className="font-semibold text-gray-700 block mt-1">
                  {entryToDelete.subject?.subjectName} - {entryToDelete.class?.className}
                </span>
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
      {showViewModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Timetable Entry Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium text-gray-800">{selectedEntry.class?.className}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="font-medium text-gray-800">{selectedEntry.subject?.subjectName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Teacher</p>
                  <p className="font-medium text-gray-800">{selectedEntry.teacher?.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Day</p>
                  <p className="font-medium text-gray-800">{selectedEntry.dayOfWeek}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Start Time</p>
                  <p className="font-medium text-gray-800">{selectedEntry.startTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End Time</p>
                  <p className="font-medium text-gray-800">{selectedEntry.endTime}</p>
                </div>
              </div>

              {selectedEntry.room && (
                <div>
                  <p className="text-xs text-gray-500">Room</p>
                  <p className="font-medium text-gray-800">{selectedEntry.room}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Term</p>
                  <p className="font-medium text-gray-800">{selectedEntry.term}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Academic Year</p>
                  <p className="font-medium text-gray-800">{selectedEntry.academicYear}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= BULK MODAL ================= */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Bulk Add Timetable Entries</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.className}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Day *</label>
                    <select
                      value={bulkDay}
                      onChange={(e) => setBulkDay(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.subjectName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher *</label>
                    <select
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g., Room 101"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={addBulkEntry}
                  disabled={!formData.classId || !formData.subjectId || !formData.teacherId}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                >
                  Add to Bulk List
                </button>

                {bulkEntries.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-2 text-sm font-medium text-gray-700">
                      Bulk List ({bulkEntries.length} entries)
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {bulkEntries.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border-t border-gray-100">
                          <span className="text-sm">
                            {entry.dayOfWeek} - {entry.startTime} to {entry.endTime}
                          </span>
                          <button
                            onClick={() => removeBulkEntry(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleBulkCreate}
                    disabled={bulkEntries.length === 0 || isSaving}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : `Save All (${bulkEntries.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CLONE MODAL ================= */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Clone Timetable</h3>
              <button onClick={() => setShowCloneModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">From Term *</label>
                  <select
                    value={cloneData.fromTerm}
                    onChange={(e) => setCloneData({ ...cloneData, fromTerm: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">From Year *</label>
                  <input
                    type="text"
                    value={cloneData.fromYear}
                    onChange={(e) => setCloneData({ ...cloneData, fromYear: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">To Term *</label>
                  <select
                    value={cloneData.toTerm}
                    onChange={(e) => setCloneData({ ...cloneData, toTerm: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">To Year *</label>
                  <input
                    type="text"
                    value={cloneData.toYear}
                    onChange={(e) => setCloneData({ ...cloneData, toYear: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class (Optional)</label>
                <select
                  value={cloneData.classId}
                  onChange={(e) => setCloneData({ ...cloneData, classId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleClone}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  {isSaving ? 'Cloning...' : 'Clone Timetable'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretaryTimetable;