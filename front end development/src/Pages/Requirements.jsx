// Requirements.jsx – COMPLETE SCHOOL REQUIREMENTS SYSTEM (FIXED DATA EXTRACTION)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ClipboardList, Search, Plus, TrendingUp, Trash2, X, CheckCircle,
  Clock, AlertTriangle, Package, User, School, ArrowLeftRight,
  RefreshCw, Loader2, Eye, Save, DollarSign, History,
  AlertCircle, ArrowLeft, Users, Building, Layers, Minus, PlusCircle,
  Filter, Calendar, BookOpen, CheckSquare, Edit2, Activity,
  Check, Square, ChevronDown, ChevronUp, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// FIXED: Better data extraction with more robust handling
const extractData = (response) => {
  if (!response) return [];
  console.log('📦 extractData raw:', response);
  
  // If response has data property
  if (response.data) {
    const d = response.data;
    console.log('📦 response.data:', d);
    
    // If data is an array directly
    if (Array.isArray(d)) return d;
    
    // If data has a data property that's an array
    if (d.data && Array.isArray(d.data)) return d.data;
    
    // If data has a success property and data property
    if (d.success && d.data && Array.isArray(d.data)) return d.data;
    
    // If data has a results property
    if (d.results && Array.isArray(d.results)) return d.results;
    
    // If data has an items property
    if (d.items && Array.isArray(d.items)) return d.items;
  }
  
  // If response itself is an array
  if (Array.isArray(response)) return response;
  
  console.warn('⚠️ Could not extract array from response:', response);
  return [];
};

const extractSingle = (response) => {
  if (!response) return null;
  console.log('📦 extractSingle raw:', response);
  
  if (response.data) {
    const d = response.data;
    console.log('📦 response.data:', d);
    
    // If data has a data property
    if (d.data) return d.data;
    
    // If data has a success property and data property
    if (d.success && d.data) return d.data;
    
    // If data itself is the object
    return d;
  }
  
  return response;
};

// --- HELPER COMPONENT: InfoField ---
const InfoField = ({ label, value }) => (
  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="font-semibold text-gray-800 text-sm mt-0.5 truncate">{value || 'N/A'}</p>
  </div>
);

// --- HELPER COMPONENT: MiniCard ---
const MiniCard = ({ icon, label, value, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.indigo} flex flex-col justify-between`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <p className="text-2xl font-black mt-2">{value}</p>
    </div>
  );
};

const Requirements = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user?.id || null;

  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalRequirements: 0, totalAssignments: 0, completed: 0, pending: 0, partial: 0, completionPercentage: 0
  });

  // Current term settings
  const currentYear = new Date().getFullYear().toString();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedClass, setSelectedClass] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReqList, setStudentReqList] = useState([]);
  const [studentHistory, setStudentHistory] = useState([]);
  const [studentStats, setStudentStats] = useState({
    total: 0,
    completed: 0,
    partial: 0,
    pending: 0,
    completionPercentage: 0
  });
  const [feeStatus, setFeeStatus] = useState({ 
    totalFee: 0, 
    amountPaid: 0, 
    balance: 0,
    term: '',
    academicYear: '',
    loading: false,
    hasRecord: false
  });
  const [studentReqLoading, setStudentReqLoading] = useState(false);

  // Assign multiple requirements to student
  const [showAssignToStudent, setShowAssignToStudent] = useState(false);
  const [selectedReqsForStudent, setSelectedReqsForStudent] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchRequirements, setSearchRequirements] = useState('');
  const [assigningToStudent, setAssigningToStudent] = useState(false);
  const [broughtItems, setBroughtItems] = useState({});

  // Receive items
  const [receiveModal, setReceiveModal] = useState(false);
  const [receivingItem, setReceivingItem] = useState(null);
  const [receiveQty, setReceiveQty] = useState(1);
  const [receiveCondition, setReceiveCondition] = useState('Good');
  const [receiveRemarks, setReceiveRemarks] = useState('');

  // Bulk assign to class
  const [assignClassModal, setAssignClassModal] = useState(false);
  const [assigningReq, setAssigningReq] = useState(null);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState('');

  // Global requirement CRUD
  const [showReqForm, setShowReqForm] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [reqFormData, setReqFormData] = useState({
    requirementName: '',
    category: 'Others',
    description: '',
    quantityRequired: 1,
    unit: 'piece',
    academicYear: currentYear,
    term: 'Term 1',
    classId: null,
    deadline: null,
    activeStatus: true
  });
  const [submittingReq, setSubmittingReq] = useState(false);

  // Search
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  const [activeTab, setActiveTab] = useState('search');

  // ---- Global Search ----
  const handleGlobalSearch = (term) => {
    setGlobalSearch(term);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (term.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
    setIsSearching(true);
    searchTimeout.current = setTimeout(() => {
      const q = term.toLowerCase().trim();
      const results = students.filter(s =>
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.studentNumber || '').toLowerCase().includes(q) ||
        (s.class?.className || '').toLowerCase().includes(q)
      ).slice(0, 10);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 300);
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setSelectedClass(student.class?.id || '');
    setGlobalSearch('');
    setSearchResults([]);
    setShowResults(false);
    loadStudentDetail(student);
  };

  // ---- Fetch Data ----
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching initial data...');
      
      const [studentsRes, classesRes, reqRes] = await Promise.all([
        api.get('/students', authConfig),
        api.get('/classes', authConfig),
        api.get('/requirements', authConfig)
      ]);
      
      console.log('📥 Students response:', studentsRes);
      console.log('📥 Classes response:', classesRes);
      console.log('📥 Requirements response:', reqRes);
      
      const studentsData = extractData(studentsRes);
      const classesData = extractData(classesRes);
      const reqData = extractData(reqRes);
      
      console.log('📊 Extracted students:', studentsData);
      console.log('📊 Extracted classes:', classesData);
      console.log('📊 Extracted requirements:', reqData);
      
      setStudents(studentsData);
      setClasses(classesData);
      setRequirements(reqData);
      
      await fetchDashboardStats();
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [authConfig]);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/requirements/dashboard/stats', authConfig);
      console.log('📊 Dashboard stats response:', res);
      const data = extractSingle(res);
      console.log('📊 Extracted stats:', data);
      if (data) setDashboardStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  // ---- Fetch Student Fee Status ----
  const fetchStudentFeeStatus = async (studentId, academicYear, term) => {
    if (!studentId) return;
    
    setFeeStatus(prev => ({ ...prev, loading: true, hasRecord: false }));
    
    try {
      console.log(`💰 Fetching fee for student ${studentId}, ${term} ${academicYear}`);
      
      // Try to get fee data filtered by academic year and term
      const response = await api.get(
        `/fees/student/${studentId}?academicYear=${academicYear}&term=${term}`,
        authConfig
      );
      
      console.log('💰 Fee response:', response);
      
      let feeData = {};
      let found = false;
      
      // Extract the data properly
      const extracted = extractSingle(response);
      console.log('💰 Extracted fee data:', extracted);
      
      if (extracted) {
        feeData = extracted;
      } else {
        feeData = response.data || {};
      }
      
      // Check if we have a valid record
      if (feeData && typeof feeData === 'object') {
        // If it has totalFee or amountPaid, it's a record
        if (feeData.totalFee !== undefined || feeData.amountPaid !== undefined) {
          // Check if it matches the requested term
          if (feeData.term === term && feeData.academicYear === academicYear) {
            found = true;
          } else if (!feeData.term && !feeData.academicYear) {
            // If no term/year in the data, assume it's the right one
            found = true;
          } else {
            // It has term/year but doesn't match - check if it's the only one
            // Try to fetch all fees and filter
            try {
              const allFeesRes = await api.get(`/fees/student/${studentId}`, authConfig);
              const allFees = extractData(allFeesRes);
              console.log('💰 All fees for student:', allFees);
              
              const matchedFee = allFees.find(f => 
                f.term === term && f.academicYear === academicYear
              );
              
              if (matchedFee) {
                feeData = matchedFee;
                found = true;
              }
            } catch (e) {
              console.warn('Could not fetch all fees:', e);
            }
          }
        }
      }
      
      console.log('💰 Final fee data:', feeData, 'found:', found);
      
      setFeeStatus({
        totalFee: feeData.totalFee || 0,
        amountPaid: feeData.amountPaid || 0,
        balance: feeData.balance || 0,
        term: feeData.term || term,
        academicYear: feeData.academicYear || academicYear,
        loading: false,
        hasRecord: found
      });
      
    } catch (error) {
      console.error('❌ Fee fetch error:', error);
      
      // Fallback: Try to get all fees and filter manually
      try {
        const fallbackResponse = await api.get(`/fees/student/${studentId}`, authConfig);
        console.log('💰 Fallback fee response:', fallbackResponse);
        
        let allFees = extractData(fallbackResponse);
        console.log('💰 All fees from fallback:', allFees);
        
        // Find matching term
        const matchedFee = allFees.find(f => 
          f.term === term && f.academicYear === academicYear
        );
        
        if (matchedFee) {
          console.log('💰 Matched fee:', matchedFee);
          setFeeStatus({
            totalFee: matchedFee.totalFee || 0,
            amountPaid: matchedFee.amountPaid || 0,
            balance: matchedFee.balance || 0,
            term: matchedFee.term || term,
            academicYear: matchedFee.academicYear || academicYear,
            loading: false,
            hasRecord: true
          });
        } else {
          console.log('💰 No matching fee found for term');
          setFeeStatus({
            totalFee: 0,
            amountPaid: 0,
            balance: 0,
            term: term,
            academicYear: academicYear,
            loading: false,
            hasRecord: false
          });
        }
      } catch (fallbackError) {
        console.error('Fallback fee fetch error:', fallbackError);
        setFeeStatus({
          totalFee: 0,
          amountPaid: 0,
          balance: 0,
          term: term,
          academicYear: academicYear,
          loading: false,
          hasRecord: false
        });
      }
    }
  };

  // ---- Student Detail ----
  const loadStudentDetail = async (student) => {
    if (!student) return;
    
    setStudentReqLoading(true);
    try {
      const academicYear = selectedAcademicYear;
      const term = selectedTerm;
      
      console.log(`🔄 Loading for student ${student.id} - ${term} ${academicYear}`);
      
      // Fetch student requirements
      const response = await api.get(
        `/requirements/student/${student.id}?academicYear=${academicYear}&term=${term}&status=all`, 
        authConfig
      );
      
      console.log('📦 Student requirements response:', response);
      
      let reqData = extractData(response);
      console.log('📊 Extracted student requirements:', reqData);
      
      // If no data found, try without status filter
      if (!reqData || reqData.length === 0) {
        console.log('🔄 Trying without status filter...');
        const retryResponse = await api.get(
          `/requirements/student/${student.id}?academicYear=${academicYear}&term=${term}`, 
          authConfig
        );
        reqData = extractData(retryResponse);
        console.log('📊 Retry extracted:', reqData);
      }
      
      setStudentReqList(reqData);
      
      const total = reqData.length;
      const completed = reqData.filter(r => r && r.status === 'Completed').length;
      const partial = reqData.filter(r => r && r.status === 'Partial').length;
      const pending = reqData.filter(r => r && r.status === 'Pending').length;
      const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      setStudentStats({ total, completed, partial, pending, completionPercentage });
      
      // Fetch student fee status for the selected term
      await fetchStudentFeeStatus(student.id, academicYear, term);
      
      // Fetch history
      try {
        const historyRes = await api.get(`/requirements/student/${student.id}/history`, authConfig);
        let historyData = extractData(historyRes);
        setStudentHistory(historyData.slice(0, 20));
      } catch (e) {
        console.warn('History fetch error:', e);
        setStudentHistory([]);
      }
      
    } catch (error) {
      console.error('❌ Load error:', error);
      toast.error('Could not load student details');
    } finally {
      setStudentReqLoading(false);
    }
  };

  const clearStudent = () => { 
    setSelectedStudent(null); 
    setSelectedClass('');
    setStudentReqList([]); 
    setStudentHistory([]); 
    setStudentStats({ total: 0, completed: 0, partial: 0, pending: 0, completionPercentage: 0 });
    setFeeStatus({ totalFee: 0, amountPaid: 0, balance: 0, term: '', academicYear: '', loading: false, hasRecord: false });
  };

  // ---- Toggle requirement selection ----
  const toggleRequirementSelection = (reqId) => {
    setSelectedReqsForStudent(prev => {
      if (prev.includes(reqId)) {
        return prev.filter(id => id !== reqId);
      } else {
        return [...prev, reqId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedReqsForStudent([]);
    } else {
      const filteredReqs = getFilteredRequirements();
      setSelectedReqsForStudent(filteredReqs.map(r => r.id));
    }
    setSelectAll(!selectAll);
  };

  const getFilteredRequirements = () => {
    return currentTermRequirements.filter(r => 
      r.activeStatus !== false &&
      r.requirementName.toLowerCase().includes(searchRequirements.toLowerCase())
    );
  };

  // ---- Assign multiple requirements ----
  const handleAssignMultipleToStudent = async () => {
    if (selectedReqsForStudent.length === 0) {
      toast.error('Please select at least one requirement');
      return;
    }
    if (!selectedStudent) {
      toast.error('No student selected');
      return;
    }

    setAssigningToStudent(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const reqId of selectedReqsForStudent) {
        try {
          const selectedReq = requirements.find(r => r.id === reqId);
          if (!selectedReq) {
            errorCount++;
            continue;
          }

          const year = selectedReq.academicYear;
          const term = selectedReq.term;

          console.log(`📤 Assigning: ${selectedReq.requirementName} - ${term} ${year}`);

          await api.post('/requirements/assign/students', {
            requirementId: reqId,
            studentIds: [selectedStudent.id],
            override: true,
            academicYear: year,
            term: term
          }, authConfig);

          // Handle brought items
          const broughtQty = broughtItems[reqId] || 0;
          if (broughtQty > 0) {
            const studentReqsResponse = await api.get(
              `/requirements/student/${selectedStudent.id}?academicYear=${year}&term=${term}&status=all`, 
              authConfig
            );
            
            let list = extractData(studentReqsResponse);
            const justAssigned = list.find(r => r.requirementId === reqId);
            
            if (justAssigned && broughtQty > 0) {
              await api.post('/requirements/receive', {
                studentRequirementId: justAssigned.id,
                quantityReceived: Math.min(broughtQty, selectedReq.quantityRequired || 1),
                condition: 'Good',
                remarks: `Initial items brought by student (${term})`
              }, authConfig);
            }
          }

          successCount++;
        } catch (error) {
          console.error(`❌ Error:`, error);
          errorCount++;
        }
      }

      if (successCount > 0 && errorCount === 0) {
        toast.success(`✅ Successfully assigned ${successCount} requirements!`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`⚠️ Assigned ${successCount}, ${errorCount} failed`);
      } else {
        toast.error('Failed to assign requirements');
      }

      setShowAssignToStudent(false);
      setSelectedReqsForStudent([]);
      setSelectAll(false);
      setBroughtItems({});
      setSearchRequirements('');

      setTimeout(async () => {
        await loadStudentDetail(selectedStudent);
        await fetchDashboardStats();
      }, 500);

    } catch (error) {
      console.error('❌ Assign error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign requirements');
    } finally {
      setAssigningToStudent(false);
    }
  };

  // ---- Receive items ----
  const handleReceive = async () => {
    if (!receivingItem || receiveQty < 1 || receiveQty > receivingItem.balance) {
      toast.error(`Quantity must be between 1 and ${receivingItem.balance}`);
      return;
    }
    try {
      await api.post('/requirements/receive', {
        studentRequirementId: receivingItem.id,
        quantityReceived: receiveQty,
        condition: receiveCondition,
        remarks: receiveRemarks || `Received ${receiveQty} items`
      }, authConfig);
      toast.success('✅ Items recorded successfully!');
      setReceiveModal(false);
      setReceivingItem(null);
      setReceiveQty(1);
      setReceiveRemarks('');
      
      await loadStudentDetail(selectedStudent);
      await fetchDashboardStats();
      
    } catch (error) {
      console.error('Receive error:', error);
      toast.error('Failed to record receipt');
    }
  };

  // ---- Assign to entire class ----
  const handleAssignClass = async () => {
    if (!assigningReq || !selectedClassForAssign) {
      toast.error('Please select a class');
      return;
    }
    try {
      const year = assigningReq.academicYear;
      const term = assigningReq.term;
      
      await api.post('/requirements/assign/class', {
        requirementId: assigningReq.id,
        classId: parseInt(selectedClassForAssign),
        override: true,
        academicYear: year,
        term: term
      }, authConfig);
      
      toast.success(`✅ Assigned "${assigningReq.requirementName}" to class`);
      setAssignClassModal(false);
      setAssigningReq(null);
      setSelectedClassForAssign('');
      
      if (selectedStudent) {
        await loadStudentDetail(selectedStudent);
      }
      await fetchDashboardStats();
      
    } catch (error) {
      console.error('Assign class error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign to class');
    }
  };

  // ---- Global CRUD for Requirements ----
  const handleAddRequirement = async () => {
    if (!reqFormData.requirementName.trim()) {
      toast.error('Requirement name is required');
      return;
    }
    if (reqFormData.quantityRequired < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    if (!currentUserId) {
      toast.error('User not authenticated. Please login again.');
      return;
    }

    setSubmittingReq(true);
    try {
      const dataToSend = {
        requirementName: reqFormData.requirementName.trim(),
        category: reqFormData.category,
        description: reqFormData.description || null,
        quantityRequired: parseInt(reqFormData.quantityRequired) || 1,
        unit: reqFormData.unit || 'piece',
        academicYear: reqFormData.academicYear,
        term: reqFormData.term,
        classId: reqFormData.classId ? parseInt(reqFormData.classId) : null,
        deadline: reqFormData.deadline || null,
        activeStatus: reqFormData.activeStatus !== undefined ? reqFormData.activeStatus : true,
        createdBy: parseInt(currentUserId)
      };

      if (editingReq) {
        delete dataToSend.createdBy;
        await api.put(`/requirements/${editingReq.id}`, dataToSend, authConfig);
        toast.success('Requirement updated successfully!');
      } else {
        await api.post('/requirements', dataToSend, authConfig);
        toast.success('Requirement created successfully!');
      }
      
      setShowReqForm(false);
      setEditingReq(null);
      setReqFormData({
        requirementName: '',
        category: 'Others',
        description: '',
        quantityRequired: 1,
        unit: 'piece',
        academicYear: selectedAcademicYear,
        term: selectedTerm,
        classId: null,
        deadline: null,
        activeStatus: true
      });
      
      await fetchInitialData();
      if (selectedStudent) {
        await loadStudentDetail(selectedStudent);
      }
      
    } catch (error) {
      console.error('Save requirement error:', error);
      toast.error(error.response?.data?.message || 'Failed to save requirement');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleDeleteReq = async (id) => {
    if (!window.confirm('Delete this requirement? This will remove all assignments.')) return;
    try {
      await api.delete(`/requirements/${id}`, authConfig);
      toast.success('Requirement deleted');
      await fetchInitialData();
      if (selectedStudent) {
        await loadStudentDetail(selectedStudent);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleEditReq = (req) => {
    setEditingReq(req);
    setReqFormData({
      requirementName: req.requirementName || '',
      category: req.category || 'Others',
      description: req.description || '',
      quantityRequired: req.quantityRequired || 1,
      unit: req.unit || 'piece',
      academicYear: req.academicYear || selectedAcademicYear,
      term: req.term || selectedTerm,
      classId: req.classId || null,
      deadline: req.deadline ? req.deadline.split('T')[0] : null,
      activeStatus: req.activeStatus !== undefined ? req.activeStatus : true
    });
    setShowReqForm(true);
  };

  // ---- Formatting ----
  const formatUGX = (a) => !a || isNaN(a) ? 'UGX 0' : new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(a);
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
  };

  // ---- Filter requirements for current term and class ----
  const currentTermRequirements = useMemo(() => {
    let filtered = requirements.filter(r => 
      r.academicYear === selectedAcademicYear && 
      r.term === selectedTerm &&
      r.activeStatus !== false
    );
    
    // If a class is selected, filter by class
    if (selectedClass) {
      filtered = filtered.filter(r => 
        r.classId === parseInt(selectedClass) || r.classId === null
      );
    }
    
    console.log('📊 Filtered requirements:', filtered);
    return filtered;
  }, [requirements, selectedAcademicYear, selectedTerm, selectedClass]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
        <p className="mt-3 text-gray-500">Loading requirements...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-600" />
            School Requirements
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage class-specific requirements per academic year and term</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select 
              value={selectedAcademicYear} 
              onChange={async (e) => {
                const year = e.target.value;
                setSelectedAcademicYear(year);
                if (selectedStudent) {
                  await loadStudentDetail(selectedStudent);
                }
              }}
              className="bg-transparent text-sm font-medium border-none focus:ring-0 outline-none"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
            <span className="text-gray-300">|</span>
            <select 
              value={selectedTerm} 
              onChange={async (e) => {
                const term = e.target.value;
                setSelectedTerm(term);
                if (selectedStudent) {
                  await loadStudentDetail(selectedStudent);
                }
              }}
              className="bg-transparent text-sm font-medium border-none focus:ring-0 outline-none"
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
          
          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <GraduationCap className="w-4 h-4 text-gray-400" />
            <select 
              value={selectedClass} 
              onChange={(e) => {
                const classId = e.target.value;
                setSelectedClass(classId);
                if (selectedStudent) {
                  if (classId && selectedStudent.class?.id !== parseInt(classId)) {
                    clearStudent();
                  }
                }
              }}
              className="bg-transparent text-sm font-medium border-none focus:ring-0 outline-none min-w-[120px]"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => { 
              setEditingReq(null); 
              setReqFormData({
                requirementName: '',
                category: 'Others',
                description: '',
                quantityRequired: 1,
                unit: 'piece',
                academicYear: selectedAcademicYear,
                term: selectedTerm,
                classId: selectedClass ? parseInt(selectedClass) : null,
                deadline: null,
                activeStatus: true
              });
              setShowReqForm(true); 
            }}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Requirement
          </button>
        </div>
      </div>

      {/* Filter Info Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filters:</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            {selectedAcademicYear}
          </span>
          <span className="text-gray-300">→</span>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            {selectedTerm}
          </span>
          {selectedClass && (
            <>
              <span className="text-gray-300">→</span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                {classes.find(c => c.id === parseInt(selectedClass))?.className || 'Selected Class'}
              </span>
            </>
          )}
        </div>
        <div className="ml-auto text-xs text-gray-400">
          Showing {currentTermRequirements.length} requirement(s) for this selection
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="relative max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search student by name, admission number or class..."
            value={globalSearch}
            onChange={e => handleGlobalSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white shadow-sm"
          />
          {isSearching && <Loader2 className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 animate-spin" />}
        </div>
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-20 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <p className="text-xs font-medium text-gray-500">{searchResults.length} students found</p>
              <span className="text-xs text-gray-400">{selectedTerm} • {selectedAcademicYear}</span>
            </div>
            {searchResults.map(s => (
              <button key={s.id} onClick={() => selectStudent(s)}
                className="w-full flex items-center gap-4 p-4 hover:bg-indigo-50 transition text-left border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                  {s.fullName?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{s.fullName}</p>
                  <p className="text-xs text-gray-500">{s.studentNumber || 'N/A'} • {s.class?.className || 'No class'}</p>
                </div>
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== STUDENT DETAIL VIEW ===== */}
      {selectedStudent ? (
        <div className="space-y-6">
          <button onClick={clearStudent} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800">
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-inner">
                {selectedStudent.fullName?.charAt(0)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                <InfoField label="Full Name" value={selectedStudent.fullName} />
                <InfoField label="Admission No." value={selectedStudent.studentNumber} />
                <InfoField label="Class" value={selectedStudent.class?.className} />
                <InfoField label="Gender" value={selectedStudent.gender} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={() => {
                setSelectedReqsForStudent([]);
                setSelectAll(false);
                setBroughtItems({});
                setSearchRequirements('');
                setShowAssignToStudent(true);
              }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 inline-flex items-center gap-2 transition">
                <PlusCircle className="w-4 h-4" /> Assign Multiple Requirements
              </button>
              <span className="text-xs text-gray-400">
                {selectedTerm} • {selectedAcademicYear}
              </span>
              <button 
                onClick={() => loadStudentDetail(selectedStudent)}
                className="p-2 hover:bg-gray-100 rounded-lg transition ml-auto"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {studentReqLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <>
              {/* Live Student Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MiniCard icon={<ClipboardList className="w-4 h-4" />} label="Assigned" value={studentStats.total} color="indigo" />
                <MiniCard icon={<CheckCircle className="w-4 h-4" />} label="Completed" value={studentStats.completed} color="emerald" />
                <MiniCard icon={<Clock className="w-4 h-4" />} label="Partial" value={studentStats.partial} color="amber" />
                <MiniCard icon={<AlertCircle className="w-4 h-4" />} label="Pending" value={studentStats.pending} color="rose" />
                <MiniCard icon={<TrendingUp className="w-4 h-4" />} label="Progress" value={`${studentStats.completionPercentage}%`} color="blue" />
              </div>

              {/* Debug Info */}
              <div className={`p-3 rounded-xl text-xs ${studentReqList.length > 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                <strong>{studentReqList.length > 0 ? '✅' : '⚠️'}</strong> 
                Found <strong>{studentReqList.length}</strong> requirements for {selectedStudent.fullName} 
                ({selectedTerm} {selectedAcademicYear}) – including Partial and Pending.
              </div>

              {/* Requirements Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">Requirements for {selectedStudent.fullName}</h3>
                    <p className="text-xs text-gray-400">{selectedTerm} • {selectedAcademicYear}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {studentStats.completed} / {studentStats.total} completed
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                        <th className="p-4 text-left">Requirement</th>
                        <th className="p-4 text-center">School Required</th>
                        <th className="p-4 text-center">Brought</th>
                        <th className="p-4 text-center">Remaining</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentReqList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-400">
                            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>No requirements assigned yet for {selectedTerm} {selectedAcademicYear}</p>
                            <p className="text-xs mt-1">Click "Assign Multiple Requirements" above</p>
                          </td>
                        </tr>
                      ) : (
                        studentReqList.map(item => {
                          const required = item.requiredQuantity || 0;
                          const brought = item.quantityReceived || 0;
                          const remaining = Math.max(0, required - brought);
                          const isCleared = remaining === 0 && brought > 0;
                          
                          return (
                            <tr key={item.id} className="hover:bg-gray-50 transition">
                              <td className="p-4 font-medium">
                                <div className="font-semibold text-gray-800">{item.requirement?.requirementName || 'Unknown'}</div>
                                {item.requirement?.category && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                                    {item.requirement.category}
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center font-bold text-indigo-600">{required}</td>
                              <td className="p-4 text-center text-emerald-600 font-bold">{brought}</td>
                              <td className="p-4 text-center">
                                {isCleared ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                    <Check className="w-3.5 h-3.5" /> Cleared
                                  </span>
                                ) : (
                                  <span className="text-rose-600 font-bold">{remaining}</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                  item.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                                  'bg-rose-100 text-rose-700'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {remaining > 0 && (
                                    <button 
                                      onClick={() => {
                                        setReceivingItem({ ...item, balance: remaining });
                                        setReceiveQty(1);
                                        setReceiveCondition('Good');
                                        setReceiveRemarks('');
                                        setReceiveModal(true);
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                                    >
                                      <Plus className="w-3 h-3" /> Receive
                                    </button>
                                  )}
                                  <button 
                                    onClick={async () => {
                                      if (window.confirm('Remove this requirement assignment?')) {
                                        try {
                                          await api.delete(`/requirements/student-requirement/${item.id}`, authConfig);
                                          toast.success('Assignment removed');
                                          await loadStudentDetail(selectedStudent);
                                        } catch (e) {
                                          toast.error('Failed to remove assignment');
                                        }
                                      }
                                    }}
                                    className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition"
                                    title="Unassign"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* History & Fees Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-500" /> Receiving History
                  </h3>
                  <div className="overflow-hidden border border-gray-100 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Requirement</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-center">Condition</th>
                          <th className="p-3 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {studentHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-400">No historical receiving logs found.</td>
                          </tr>
                        ) : (
                          studentHistory.map(log => {
                            const reqName = log.requirement?.requirementName || 
                                           log.Requirement?.requirementName || 
                                           log.studentRequirement?.requirement?.requirementName || 
                                           'Unknown';
                            
                            return (
                              <tr key={log.id} className="hover:bg-gray-50 transition">
                                <td className="p-3 whitespace-nowrap text-gray-500">
                                  {formatDate(log.receivedAt || log.updatedAt || log.createdAt)} 
                                  <span className="text-[10px] text-gray-400 ml-1">
                                    {formatTime(log.receivedAt || log.updatedAt || log.createdAt)}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold text-gray-700">
                                  {reqName}
                                </td>
                                <td className="p-3 text-center font-bold text-indigo-600">{log.quantityReceived}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    log.condition === 'Good' ? 'bg-green-100 text-green-700' : 
                                    log.condition === 'Damaged' ? 'bg-red-100 text-red-700' : 
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {log.condition || 'N/A'}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-500 text-xs max-w-xs truncate" title={log.remarks}>
                                  {log.remarks || '—'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Student Fee Balance */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" /> Student Fee Balance
                  </h3>
                  {feeStatus.loading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-gray-400 -mt-2 mb-2">
                        {selectedTerm} • {selectedAcademicYear}
                      </div>
                      {!feeStatus.hasRecord ? (
                        <div className="py-6 text-center">
                          <div className="text-gray-400">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No fee records for this term</p>
                            <p className="text-xs text-gray-400 mt-1">No payment data found for {selectedTerm} {selectedAcademicYear}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2">
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-500">Required Fees</span>
                            <span className="font-bold text-gray-800">{formatUGX(feeStatus.totalFee)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-500">Amount Paid</span>
                            <span className="font-bold text-emerald-600">{formatUGX(feeStatus.amountPaid)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-500">Balance</span>
                            <span className={`font-bold text-lg ${feeStatus.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatUGX(feeStatus.balance)}
                            </span>
                          </div>
                          {feeStatus.balance === 0 && feeStatus.totalFee > 0 && (
                            <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-center">
                              <span className="text-xs font-semibold text-emerald-700">✅ Fully Paid for {selectedTerm}</span>
                            </div>
                          )}
                          {feeStatus.balance > 0 && (
                            <div className="mt-2 p-2 bg-rose-50 rounded-lg text-center">
                              <span className="text-xs font-semibold text-rose-700">⚠️ Outstanding Balance: {formatUGX(feeStatus.balance)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ===== MAIN DASHBOARD OVERVIEW & ALL REQUIREMENTS TAB ===== */
        <div className="space-y-6">
          {/* Dashboard Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniCard icon={<Layers className="w-5 h-5" />} label="Total Templates" value={dashboardStats.totalRequirements} color="indigo" />
            <MiniCard icon={<ClipboardList className="w-5 h-5" />} label="Total Assigned" value={dashboardStats.totalAssignments} color="emerald" />
            <MiniCard icon={<CheckCircle className="w-5 h-5" />} label="Completed Reqs" value={dashboardStats.completed} color="blue" />
            <MiniCard icon={<TrendingUp className="w-5 h-5" />} label="School Progress" value={`${dashboardStats.completionPercentage || 0}%`} color="amber" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Requirements Templates</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Active templates for {selectedTerm} {selectedAcademicYear}
                  {selectedClass && ` • ${classes.find(c => c.id === parseInt(selectedClass))?.className}`}
                </p>
              </div>
              <div className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                Found {currentTermRequirements.length} active requirement(s)
                {selectedClass && ` for this class`}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-center">Required Qty</th>
                    <th className="p-4 text-center">Class</th>
                    <th className="p-4 text-center">Term</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTermRequirements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No template rules configured for this selection.</p>
                        <p className="text-xs mt-1">Click "New Requirement" to create one for {selectedTerm} {selectedAcademicYear}</p>
                      </td>
                    </tr>
                  ) : (
                    currentTermRequirements.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{req.requirementName}</div>
                          {req.description && <div className="text-xs text-gray-400 max-w-xs truncate">{req.description}</div>}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">{req.category}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-indigo-600">
                          {req.quantityRequired} {req.unit || 'pieces'}
                        </td>
                        <td className="p-4 text-center text-xs">
                          {req.classId ? (
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-bold">
                              {classes.find(c => c.id === req.classId)?.className || 'Class-bound'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold">
                              Whole School
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-xs font-semibold text-gray-600">
                          {req.term}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setAssigningReq(req);
                                setSelectedClassForAssign('');
                                setAssignClassModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <Users className="w-3.5 h-3.5" /> Bulk Assign
                            </button>
                            <button onClick={() => handleEditReq(req)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteReq(req.id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition" title="Delete">
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
          </div>
        </div>
      )}

      {/* ================= MODAL: RECEIVE SINGLE REQUIREMENT ITEM ================= */}
      {receiveModal && receivingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-lg font-bold text-gray-800">Receive Items</h3>
              <button onClick={() => { setReceiveModal(false); setReceivingItem(null); }} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-xl space-y-1">
              <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Item being received</p>
              <h4 className="font-bold text-indigo-900">{receivingItem.requirement?.requirementName || 'Unknown Item'}</h4>
              <p className="text-xs text-indigo-700">Remaining to fulfill requirement: {receivingItem.balance}</p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="block font-semibold text-gray-700">Quantity Brought Now</label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setReceiveQty(q => Math.max(1, q - 1))}
                    className="p-2 border rounded-xl hover:bg-gray-50 transition"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <input 
                    type="number" 
                    min={1} 
                    max={receivingItem.balance} 
                    value={receiveQty} 
                    onChange={e => setReceiveQty(Math.min(receivingItem.balance, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center py-2 border rounded-xl font-bold text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button 
                    type="button" 
                    onClick={() => setReceiveQty(q => Math.min(receivingItem.balance, q + 1))}
                    className="p-2 border rounded-xl hover:bg-gray-50 transition"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setReceiveQty(receivingItem.balance)}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition"
                  >
                    Set Max ({receivingItem.balance})
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-gray-700">Physical Condition Status</label>
                <select 
                  value={receiveCondition} 
                  onChange={e => setReceiveCondition(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 font-medium"
                >
                  <option value="Good">Excellent / Good / New</option>
                  <option value="Damaged">Damaged / Needs Check</option>
                  <option value="Incomplete">Incomplete Packet</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-gray-700">Administrative Remarks</label>
                <textarea 
                  rows={2}
                  placeholder="Optional notes e.g., 'brought inside clean blue bag'"
                  value={receiveRemarks}
                  onChange={e => setReceiveRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button 
                onClick={() => { setReceiveModal(false); setReceivingItem(null); }}
                className="flex-1 py-2.5 border rounded-xl hover:bg-gray-50 text-sm font-semibold transition text-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleReceive}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GLOBAL REQ FORM (NEW/EDIT) ================= */}
      {showReqForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 my-8 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingReq ? 'Edit Requirement Template' : 'Create New Requirement'}
              </h3>
              <button 
                onClick={() => {
                  setShowReqForm(false);
                  setEditingReq(null);
                }} 
                className="p-1.5 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Requirement Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Toilet Paper (3 Rolls), Ream of Paper"
                  value={reqFormData.requirementName}
                  onChange={e => setReqFormData({ ...reqFormData, requirementName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 text-sm font-medium shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Category</label>
                  <select 
                    value={reqFormData.category} 
                    onChange={e => setReqFormData({ ...reqFormData, category: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 text-sm font-medium"
                  >
                    <option value="Stationery">Stationery</option>
                    <option value="Hygiene">Hygiene & Sanitation</option>
                    <option value="Academics">Academics & Books</option>
                    <option value="Domestic">Domestic & Boarding</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Required Quantity</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={reqFormData.quantityRequired}
                    onChange={e => setReqFormData({ ...reqFormData, quantityRequired: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 text-sm font-medium shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Quantity Unit</label>
                  <input 
                    type="text" 
                    placeholder="piece, roll, ream"
                    value={reqFormData.unit}
                    onChange={e => setReqFormData({ ...reqFormData, unit: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 text-sm font-medium shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Academic Year</label>
                  <select 
                    value={reqFormData.academicYear} 
                    onChange={e => setReqFormData({ ...reqFormData, academicYear: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 text-sm font-medium"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Term</label>
                  <select 
                    value={reqFormData.term} 
                    onChange={e => setReqFormData({ ...reqFormData, term: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 text-sm font-medium"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Target Class</label>
                  <select 
                    value={reqFormData.classId || ''} 
                    onChange={e => setReqFormData({ ...reqFormData, classId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 text-sm font-medium"
                  >
                    <option value="">Whole School</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-0.5">Leave as "Whole School" to apply to all classes</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Deadline (Optional)</label>
                <input 
                  type="date" 
                  value={reqFormData.deadline || ''}
                  onChange={e => setReqFormData({ ...reqFormData, deadline: e.target.value || null })}
                  className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 text-sm font-medium shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Description Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Optional clarification on specifications..."
                  value={reqFormData.description}
                  onChange={e => setReqFormData({ ...reqFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="activeStatusCheck"
                  checked={reqFormData.activeStatus}
                  onChange={e => setReqFormData({ ...reqFormData, activeStatus: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="activeStatusCheck" className="font-semibold text-gray-700 select-none">
                  Template active & eligible for assignments
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button 
                type="button"
                onClick={() => {
                  setShowReqForm(false);
                  setEditingReq(null);
                }}
                className="flex-1 py-2.5 border rounded-xl hover:bg-gray-50 text-sm font-semibold transition text-gray-600"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={submittingReq}
                onClick={handleAddRequirement}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {submittingReq ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ASSIGN MULTIPLE REQUIREMENTS TO SELECTED STUDENT ================= */}
      {showAssignToStudent && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Assign Requirements</h3>
                <p className="text-xs text-gray-500 mt-0.5">Assigning templates to {selectedStudent.fullName} for {selectedTerm} {selectedAcademicYear}</p>
              </div>
              <button onClick={() => setShowAssignToStudent(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Sub-search for requirements inside modal */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search requirement templates..."
                value={searchRequirements}
                onChange={e => setSearchRequirements(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-[250px] border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0">
                  <tr>
                    <th className="p-3 text-center w-12">
                      <button 
                        type="button" 
                        onClick={toggleSelectAll}
                        className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                      >
                        {selectAll ? <CheckSquare className="w-5 h-5 mx-auto" /> : <Square className="w-5 h-5 mx-auto text-gray-400" />}
                      </button>
                    </th>
                    <th className="p-3 text-left">Requirement Name</th>
                    <th className="p-3 text-center">Required Qty</th>
                    <th className="p-3 text-center w-36">Brought Now (Qty)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getFilteredRequirements().length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">
                        No templates matching criteria for {selectedTerm} {selectedAcademicYear} found.
                      </td>
                    </tr>
                  ) : (
                    getFilteredRequirements().map(req => {
                      const isChecked = selectedReqsForStudent.includes(req.id);
                      return (
                        <tr key={req.id} className={`hover:bg-gray-50 transition ${isChecked ? 'bg-indigo-50/30' : ''}`}>
                          <td className="p-3 text-center">
                            <button 
                              type="button" 
                              onClick={() => toggleRequirementSelection(req.id)}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 mx-auto text-indigo-600" />
                              ) : (
                                <Square className="w-5 h-5 mx-auto text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-gray-800">{req.requirementName}</span>
                            <span className="inline-block ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                              {req.category}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-600">
                            {req.quantityRequired} {req.unit || 'piece'}
                          </td>
                          <td className="p-3">
                            <input 
                              type="number" 
                              min={0}
                              max={req.quantityRequired}
                              disabled={!isChecked}
                              value={broughtItems[req.id] || 0}
                              onChange={e => {
                                const val = Math.min(req.quantityRequired, Math.max(0, parseInt(e.target.value) || 0));
                                setBroughtItems({ ...broughtItems, [req.id]: val });
                              }}
                              className="w-20 mx-auto block text-center border rounded-lg text-xs font-bold py-1 disabled:opacity-40 outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button 
                onClick={() => setShowAssignToStudent(false)}
                className="flex-1 py-2.5 border rounded-xl hover:bg-gray-50 text-sm font-semibold transition text-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignMultipleToStudent}
                disabled={assigningToStudent || selectedReqsForStudent.length === 0}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {assigningToStudent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Assigning...
                  </>
                ) : (
                  <>
                    Assign Selected ({selectedReqsForStudent.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BULK ASSIGN TO ENTIRE CLASS ================= */}
      {assignClassModal && assigningReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Bulk Assign to Class</h3>
                <p className="text-xs text-gray-400 mt-0.5">Assign requirement template to all students in a class</p>
              </div>
              <button onClick={() => { setAssignClassModal(false); setAssigningReq(null); }} className="p-1.5 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl space-y-1">
              <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Template Rule Selected</p>
              <h4 className="font-bold text-indigo-900">{assigningReq.requirementName}</h4>
              <p className="text-xs text-indigo-700">{assigningReq.quantityRequired} {assigningReq.unit || 'pieces'} Required</p>
              <p className="text-xs text-indigo-400 font-medium">Term: {assigningReq.term} • Year: {assigningReq.academicYear}</p>
            </div>

            <div className="space-y-1.5 text-sm">
              <label className="block font-semibold text-gray-700">Select Target Class</label>
              <select 
                value={selectedClassForAssign} 
                onChange={e => setSelectedClassForAssign(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-gray-800 font-semibold"
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button 
                onClick={() => { setAssignClassModal(false); setAssigningReq(null); }}
                className="flex-1 py-2.5 border rounded-xl hover:bg-gray-50 text-sm font-semibold transition text-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignClass}
                disabled={!selectedClassForAssign}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                Confirm Bulk Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requirements;