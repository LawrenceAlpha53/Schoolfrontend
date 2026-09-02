// TeacherMarksEntry.jsx – with dynamic exam dropdown (only incomplete exams shown)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FileText, Users, Search, RefreshCw, Loader2, CheckCircle, Edit, Save,
  X, ChevronLeft, ChevronRight, Download, Printer, AlertCircle, BarChart3,
  GraduationCap, BookOpen, School, Clock, Calendar, CheckCheck,
  Target, Trophy, UserX, PieChart, Lock, ArrowUp, ArrowDown,
  Eye, Award, TrendingUp, User, Mail, Phone, MapPin,
  ThumbsUp, ThumbsDown, MinusCircle, History, FileSpreadsheet,
  UserCheck, UserXIcon, UserPlus, CalendarDays, Activity,
  ClipboardList, BookMarked, AlertTriangle, ChevronDown,
  Clipboard, Send, FileText as FileIcon, ListChecks, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ==================== CONSTANTS ====================
const ALL_EXAM_TYPES = [
  'Mid-Term Exam',
  'End of Term Exam',
  'Beginning of Term Test',
  'Weekly Test',
  'Coursework',
  'Mock Examination'
];

// ==================== GRADING FUNCTIONS ====================
const getGradeUNEB = (score) => {
  const num = Number(score);
  if (isNaN(num) || num === 0) return { grade: '-', color: 'text-gray-400', bg: 'bg-gray-50' };
  if (num >= 80) return { grade: 'D1', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (num >= 75) return { grade: 'D2', color: 'text-green-600', bg: 'bg-green-50' };
  if (num >= 70) return { grade: 'C3', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (num >= 65) return { grade: 'C4', color: 'text-cyan-600', bg: 'bg-cyan-50' };
  if (num >= 60) return { grade: 'C5', color: 'text-teal-600', bg: 'bg-teal-50' };
  if (num >= 55) return { grade: 'C6', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  if (num >= 50) return { grade: 'P7', color: 'text-orange-600', bg: 'bg-orange-50' };
  if (num >= 45) return { grade: 'P8', color: 'text-red-400', bg: 'bg-red-50' };
  return { grade: 'F9', color: 'text-red-600', bg: 'bg-red-50' };
};

const notifyAnalyticsUpdate = (marks) => {
  const event = new CustomEvent('marksSaved', {
    detail: {
      timestamp: new Date().toISOString(),
      count: marks.length,
      message: 'Marks saved successfully',
    },
  });
  window.dispatchEvent(event);
  localStorage.setItem('marksUpdated', new Date().toISOString());
  localStorage.setItem('marksUpdateCount', marks.length.toString());
};

const calculateStats = (students, marks, gradeSystem) => {
  const validMarks = marks.filter(m =>
    m.score !== null && m.score !== undefined &&
    m.score !== '' && m.score !== 'ABS' && !isNaN(Number(m.score))
  );
  const scores = validMarks.map(m => Number(m.score)).filter(s => s >= 0 && s <= 100);
  const total = students.length || 0;
  const submitted = validMarks.length;
  const pending = Math.max(0, total - submitted);

  const studentPassed = new Set();
  validMarks.forEach(m => {
    const score = Number(m.score);
    if (score >= 50) studentPassed.add(m.studentId);
  });
  const passed = studentPassed.size;
  const passRate = total ? Math.min(Math.round((passed / total) * 100), 100) : 0;

  const highest = scores.length ? Math.max(...scores) : 0;
  const lowest = scores.length ? Math.min(...scores) : 0;
  const avg = scores.length ? Math.min(Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10, 100) : 0;
  const completion = total ? Math.min(Math.round((submitted / total) * 100), 100) : 0;

  return {
    totalStudents: total,
    submittedCount: submitted,
    pendingCount: pending,
    completionRate: completion,
    highestScore: highest,
    lowestScore: lowest,
    averageScore: avg,
    passRate,
  };
};

const calculatePromotionStats = (students) => {
  const total = students.length;
  const promoted = students.filter(s => s.promotionStatus === 'promoted').length;
  const notPromoted = students.filter(s => s.promotionStatus === 'not_promoted').length;
  const repeated = students.filter(s => s.promotionStatus === 'repeated').length;
  const pending = students.filter(s => s.promotionStatus === 'pending' || !s.promotionStatus).length;
  return { total, promoted, notPromoted, repeated, pending };
};

const TeacherMarksEntry = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [examType, setExamType] = useState('Mid-Term Exam');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [editingMarks, setEditingMarks] = useState({});
  const [selectedGradeSystem, setSelectedGradeSystem] = useState('uneb');
  const [teacherId, setTeacherId] = useState(null);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [absentModal, setAbsentModal] = useState({ open: false, student: null });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentTerm, setCurrentTerm] = useState('Term 3');
  const [currentAcademicYear, setCurrentAcademicYear] = useState(new Date().getFullYear().toString());
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewFilter, setViewFilter] = useState('current');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedViewClass, setSelectedViewClass] = useState(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const [viewMode, setViewMode] = useState('marks');
  const [promotionDecisions, setPromotionDecisions] = useState({});
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isSubmittingPromotion, setIsSubmittingPromotion] = useState(false);

  const [sendingSms, setSendingSms] = useState(false);
  const [smsEligibility, setSmsEligibility] = useState({ eligible: false, feeClear: false, reqCompleted: false });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMarks, setStudentMarks] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [promotionStatus, setPromotionStatus] = useState('pending');
  const [isUpdatingPromotion, setIsUpdatingPromotion] = useState(false);
  const [studentStats, setStudentStats] = useState({ avg: 0, highest: 0, lowest: 0, passRate: 0, total: 0 });
  const [missingSubjects, setMissingSubjects] = useState([]);

  const [reportExamType, setReportExamType] = useState(examType);
  const [reportTerm, setReportTerm] = useState(currentTerm);
  const [reportAcademicYear, setReportAcademicYear] = useState(currentAcademicYear);

  // Lock state
  const [lockedExamTypes, setLockedExamTypes] = useState(new Set());

  const inputRefs = useRef({});

  const stats = useMemo(() => calculateStats(students, marks, selectedGradeSystem), [students, marks, selectedGradeSystem]);
  const promotionStats = useMemo(() => calculatePromotionStats(students), [students]);

  // ---------- COMPUTE COMPLETED EXAM TYPES ----------
  const completedExamTypes = useMemo(() => {
    if (!selectedSubject || !students.length) return new Set();
    const studentIds = new Set(students.map(s => s.id));
    const completed = new Set();
    for (const exam of ALL_EXAM_TYPES) {
      // For this subject, term, and year, check if every student has a mark for this exam
      const examMarks = marks.filter(m =>
        Number(m.subjectId) === Number(selectedSubject) &&
        m.examType === exam &&
        m.term === currentTerm &&
        m.academicYear === currentAcademicYear
      );
      const studentsWithMarks = new Set(examMarks.map(m => m.studentId));
      // Check if all students have a mark (score not null and not ABS)
      const allPresent = studentIds.size > 0 && [...studentIds].every(id => {
        const mark = examMarks.find(m => Number(m.studentId) === Number(id));
        return mark && mark.score !== null && mark.score !== undefined && mark.score !== 'ABS';
      });
      if (allPresent) {
        completed.add(exam);
      }
    }
    return completed;
  }, [marks, students, selectedSubject, currentTerm, currentAcademicYear]);

  // ---------- AVAILABLE EXAM TYPES (incomplete) ----------
  const availableExamTypes = useMemo(() => {
    return ALL_EXAM_TYPES.filter(et => !completedExamTypes.has(et));
  }, [completedExamTypes]);

  // ---------- Auto‑switch to first available exam if current is completed ----------
  useEffect(() => {
    if (availableExamTypes.length > 0 && completedExamTypes.has(examType)) {
      setExamType(availableExamTypes[0]);
    }
  }, [availableExamTypes, examType, completedExamTypes]);

  // ---------- FETCH CURRENT TERM ----------
  const fetchCurrentTerm = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get('/settings/school', config);
      if (res.data?.success && res.data.data) {
        if (res.data.data.currentTerm) setCurrentTerm(res.data.data.currentTerm);
        if (res.data.data.currentAcademicYear) setCurrentAcademicYear(res.data.data.currentAcademicYear);
        setReportTerm(res.data.data.currentTerm || 'Term 3');
        setReportAcademicYear(res.data.data.currentAcademicYear || new Date().getFullYear().toString());
      }
    } catch (error) {
      console.warn('Could not fetch current term, using defaults');
    }
  }, []);
  useEffect(() => { fetchCurrentTerm(); }, [fetchCurrentTerm]);

  // ---------- CACHE ----------
  const STORAGE_KEY = 'teacherMarksCache';
  const CLASS_TEACHER_KEY = 'classTeacherStatus';
  const LOCK_CACHE_KEY = 'lockedExamTypes';
  const saveToCache = (teacherId, marksData, submittedStatus) => {
    const cache = { teacherId, marks: marksData, isSubmitted: submittedStatus, timestamp: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  };
  const loadFromCache = (currentTeacherId) => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const cache = JSON.parse(raw);
      if (cache.teacherId === currentTeacherId) return cache;
    } catch (e) {}
    return null;
  };

  // ---------- FETCH INITIAL DATA ----------
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let currentTeacher = null;
      try {
        const meRes = await api.get('/teachers/me', config);
        if (meRes.data?.success) {
          currentTeacher = meRes.data.data;
        }
      } catch {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const allTeachers = (await api.get('/teachers', config)).data?.data || [];
        currentTeacher = allTeachers.find(t =>
          Number(t.userId) === Number(user.id) || t.email === user.Email
        );
      }
      if (!currentTeacher) throw new Error('Teacher not found');
      setTeacherId(Number(currentTeacher.id));

      const newClassTeacherFlag = !!currentTeacher.isClassTeacher;
      const previousFlag = localStorage.getItem(CLASS_TEACHER_KEY) === 'true';
      
      if (newClassTeacherFlag && !previousFlag) {
        const className = currentTeacher.class?.className || currentTeacher.Class?.className || 'your class';
        toast.success(`🎉 You have been assigned as the Class Teacher of ${className}!`, {
          duration: 8000,
          icon: '👨‍🏫',
        });
        localStorage.setItem(CLASS_TEACHER_KEY, 'true');
      } else if (!newClassTeacherFlag && previousFlag) {
        localStorage.setItem(CLASS_TEACHER_KEY, 'false');
      } else if (!newClassTeacherFlag && !previousFlag) {
        localStorage.setItem(CLASS_TEACHER_KEY, 'false');
      }
      setIsClassTeacher(newClassTeacherFlag);

      let assignedClasses = [];
      try {
        const classesRes = await api.get('/teachers/me/classes', config);
        assignedClasses = classesRes.data?.data || classesRes.data || [];
        setAvailableClasses(assignedClasses);
        setTeacherClasses(assignedClasses);
      } catch (err) {
        console.warn('Could not fetch teacher classes', err);
        setAvailableClasses([]);
        setTeacherClasses([]);
      }

      let subjectsData = [];
      try {
        const subjectsRes = await api.get('/teachers/me/subjects', config);
        subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
        setTeacherSubjects(subjectsData);
      } catch (err) {
        console.warn('Could not fetch teacher subjects', err);
        setTeacherSubjects([]);
      }

      let initialClass = null;
      let initialSubject = null;

      if (currentTeacher.classId) {
        const classRes = await api.get(`/classes/${currentTeacher.classId}`, config);
        const classData = classRes.data?.data || classRes.data;
        if (classData) {
          initialClass = classData;
          setSelectedViewClass(classData);
        }
      }
      if (!initialClass && assignedClasses.length > 0) {
        initialClass = assignedClasses[0];
        setSelectedViewClass(assignedClasses[0]);
      }

      if (initialClass && subjectsData.length > 0) {
        const classSubjects = subjectsData.filter(s => Number(s.classId) === Number(initialClass.id));
        if (classSubjects.length > 0) {
          initialSubject = classSubjects[0];
        } else {
          initialSubject = subjectsData[0];
        }
      } else if (subjectsData.length > 0) {
        initialSubject = subjectsData[0];
      }

      if (initialClass) {
        setSelectedClass(Number(initialClass.id));
        setSelectedViewClass(initialClass);
        setTeacherClasses([initialClass]);
      }
      if (initialSubject) {
        setSelectedSubject(Number(initialSubject.id));
      } else {
        setSelectedSubject(null);
        if (subjectsData.length === 0) {
          toast('You have no subjects assigned. Please contact admin.', { icon: '⚠️' });
        }
      }

      let studentsData = [];
      if (selectedClass) {
        try {
          const res = await api.get(`/students?classId=${selectedClass}`, config);
          studentsData = res.data?.data || res.data || [];
        } catch {
          const all = await api.get('/students', config);
          const allStudentsData = all.data?.data || all.data || [];
          studentsData = allStudentsData.filter(s => Number(s.classId) === Number(selectedClass));
        }
      }
      setStudents(studentsData);
      setAllStudents(studentsData);

      let marksData = [];
      let submittedStatus = false;
      try {
        const res = await api.get(`/marks/teacher/${currentTeacher.id}`, config);
        marksData = res.data?.data || res.data || [];
        submittedStatus = marksData.length > 0;
      } catch (e) { console.warn('Failed to fetch marks from server, using cache if available'); }

      let normalizedMarks = marksData.map(m => ({
        id: m.id,
        studentId: Number(m.studentId || m.student_id),
        teacherId: Number(m.teacherId || m.teacher_id),
        subjectId: Number(m.subjectId || m.subject_id),
        score: m.score !== undefined ? m.score : m.marks,
        examType: m.examType || m.exam_type || 'Mid-Term Exam',
        term: m.term || m.term || currentTerm,
        academicYear: m.academicYear || m.academic_year || currentAcademicYear,
        submitted: m.submitted !== undefined ? m.submitted : true,
      }));

      if (normalizedMarks.length === 0) {
        const cache = loadFromCache(Number(currentTeacher.id));
        if (cache && cache.isSubmitted) {
          console.warn('Using cached marks because server returned empty.');
          normalizedMarks = cache.marks;
          submittedStatus = true;
        }
      }
      setMarks(normalizedMarks);
      setIsSubmitted(submittedStatus);
      setEditingMarks({});

      // Load locked exam types from cache
      const lockedRaw = sessionStorage.getItem(LOCK_CACHE_KEY);
      if (lockedRaw) {
        try {
          const lockedArray = JSON.parse(lockedRaw);
          setLockedExamTypes(new Set(lockedArray));
        } catch (e) {}
      }
    } catch (error) {
      setFetchError(error.message);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, currentTerm, currentAcademicYear]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  // ---------- Filter subjects based on selected class ----------
  const availableSubjectsForClass = useMemo(() => {
    if (!selectedClass || !teacherSubjects.length) return teacherSubjects;
    return teacherSubjects.filter(s => Number(s.classId) === Number(selectedClass));
  }, [teacherSubjects, selectedClass]);

  useEffect(() => {
    const available = availableSubjectsForClass;
    if (available.length > 0) {
      const currentSubjectExists = available.some(s => Number(s.id) === Number(selectedSubject));
      if (!currentSubjectExists) {
        setSelectedSubject(Number(available[0].id));
      }
    } else {
      setSelectedSubject(null);
    }
  }, [availableSubjectsForClass, selectedSubject]);

  // ---------- SAVE MARK (with lock check) ----------
  const saveSingleMark = async (studentId, score, moveFocus = true) => {
    if (!selectedSubject) {
      toast.error('No subject selected. Please select a subject from the dropdown.');
      return false;
    }
    if (!selectedClass) {
      toast.error('No class selected. Please select a class.');
      return false;
    }
    // Check if current exam is locked
    if (lockedExamTypes.has(examType)) {
      toast.error(`The exam "${examType}" is locked. You cannot edit marks.`);
      return false;
    }

    const subjectBelongsToClass = teacherSubjects.some(s => 
      Number(s.id) === Number(selectedSubject) && Number(s.classId) === Number(selectedClass)
    );
    if (!subjectBelongsToClass) {
      toast.error('The selected subject does not belong to the selected class. Please choose a valid subject.');
      return false;
    }

    if (!teacherId) { toast.error('Teacher ID missing. Reload.'); return false; }
    const numScore = parseInt(score, 10);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) { toast.error('Score must be 0–100'); return false; }

    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    const targetId = Number(studentId);
    const existing = marks.find(m => Number(m.studentId) === targetId);

    setMarks(prev => {
      const filtered = prev.filter(m => Number(m.studentId) !== targetId);
      return [...filtered, {
        id: existing?.id || 'temp-' + targetId,
        studentId: targetId,
        teacherId,
        subjectId: selectedSubject,
        score: numScore,
        examType,
        term: currentTerm,
        academicYear: currentAcademicYear,
        submitted: true,
      }];
    });
    setEditingMarks(prev => { const next = { ...prev }; delete next[targetId]; return next; });

    try {
      let response;
      if (existing && !String(existing.id).startsWith('temp-')) {
        response = await api.put(`/marks/${existing.id}`, { score: numScore }, config);
      } else {
        response = await api.post('/marks', {
          studentId: targetId,
          subjectId: selectedSubject,
          teacherId,
          score: numScore,
          examType,
          term: currentTerm,
          academicYear: currentAcademicYear,
          submitted: true,
        }, config);
      }
      if (response.data?.success) {
        if (!existing) {
          setMarks(prev => prev.map(m => (m.id === 'temp-' + targetId ? { ...m, id: response.data.data.id } : m)));
        }
        notifyAnalyticsUpdate(marks);
        toast.success('Mark saved!');
        if (moveFocus) focusNextStudent(targetId);
        return true;
      }
      throw new Error('Save failed');
    } catch (error) {
      console.error('Save mark error:', error);
      toast.error(error.response?.data?.message || 'Failed to save mark');
      setMarks(prev => prev.filter(m => Number(m.studentId) !== targetId).concat(existing || []));
      return false;
    }
  };

  const saveAllMarks = async () => {
    if (!selectedSubject) { toast.error('No subject selected.'); return; }
    if (!selectedClass) { toast.error('No class selected.'); return; }
    if (lockedExamTypes.has(examType)) {
      toast.error(`The exam "${examType}" is locked. You cannot edit marks.`);
      return;
    }
    const subjectBelongsToClass = teacherSubjects.some(s => 
      Number(s.id) === Number(selectedSubject) && Number(s.classId) === Number(selectedClass)
    );
    if (!subjectBelongsToClass) {
      toast.error('Selected subject does not belong to selected class.');
      return;
    }
    if (!teacherId) { toast.error('Teacher ID missing.'); return; }
    const entries = Object.entries(editingMarks);
    if (!entries.length) return;

    setIsSaving(true);
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    const newMarksList = entries.map(([studentId, score]) => ({
      studentId: Number(studentId),
      score: parseInt(score, 10),
    }));

    setMarks(prev => {
      const map = new Map(prev.map(m => [Number(m.studentId), m]));
      newMarksList.forEach(({ studentId, score }) => {
        map.set(studentId, {
          id: map.get(studentId)?.id || 'temp-' + studentId,
          studentId,
          teacherId,
          subjectId: selectedSubject,
          score,
          examType,
          term: currentTerm,
          academicYear: currentAcademicYear,
          submitted: true,
        });
      });
      return Array.from(map.values());
    });
    setEditingMarks({});

    try {
      for (const { studentId, score } of newMarksList) {
        const existing = marks.find(m => Number(m.studentId) === studentId);
        if (existing && !String(existing.id).startsWith('temp-')) {
          await api.put(`/marks/${existing.id}`, { score }, config);
        } else {
          const res = await api.post('/marks', {
            studentId,
            subjectId: selectedSubject,
            teacherId,
            score,
            examType,
            term: currentTerm,
            academicYear: currentAcademicYear,
            submitted: true,
          }, config);
          if (res.data?.success && res.data?.data?.id) {
            setMarks(prev => prev.map(m => (m.id === 'temp-' + studentId ? { ...m, id: res.data.data.id } : m)));
          }
        }
      }
      notifyAnalyticsUpdate(marks);
      toast.success('All marks saved!');
    } catch (error) {
      console.error('Bulk save error:', error);
      toast.error(error.response?.data?.message || 'Bulk save failed');
      fetchInitialData();
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- OTHER HELPERS ----------
  const handleMarkAbsent = async (studentId, reason) => {
    if (lockedExamTypes.has(examType)) {
      toast.error(`The exam "${examType}" is locked. You cannot mark absent.`);
      return;
    }
    if (!selectedSubject) { toast.error('No subject selected.'); return; }
    if (!selectedClass) { toast.error('No class selected.'); return; }
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await api.post('/marks/absent', { studentId, subjectId: selectedSubject, examType, reason }, config);
      toast.success('Marked absent');
      notifyAnalyticsUpdate(marks);
      fetchInitialData();
    } catch { toast.error('Failed to mark absent'); }
  };

  const handleSubmitMarks = async () => {
    if (stats.pendingCount > 0 && !window.confirm(`${stats.pendingCount} students without marks. Submit anyway?`)) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await api.post(`/marks/submit/${selectedClass}`, { subjectId: selectedSubject, examType }, config);
      // Mark this exam type as locked
      const newLocked = new Set(lockedExamTypes);
      newLocked.add(examType);
      setLockedExamTypes(newLocked);
      sessionStorage.setItem(LOCK_CACHE_KEY, JSON.stringify([...newLocked]));
      saveToCache(teacherId, marks, true);
      setIsSubmitted(true);
      toast.success('Marks submitted and locked!');
    } catch { toast.error('Submission failed'); }
  };

  const focusNextStudent = (currentStudentId) => {
    const idx = currentStudents.findIndex(s => Number(s.id) === Number(currentStudentId));
    if (idx !== -1 && idx < currentStudents.length - 1) {
      const nextStudent = currentStudents[idx + 1];
      inputRefs.current[nextStudent.id]?.focus();
    }
  };
  const focusPrevStudent = (currentStudentId) => {
    const idx = currentStudents.findIndex(s => Number(s.id) === Number(currentStudentId));
    if (idx > 0) {
      const prevStudent = currentStudents[idx - 1];
      inputRefs.current[prevStudent.id]?.focus();
    }
  };
  const handleKeyDown = (e, studentId, markVal) => {
    if (lockedExamTypes.has(examType)) {
      toast.error('This exam is locked. Cannot edit.');
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) focusPrevStudent(studentId);
      else saveSingleMark(studentId, markVal, true);
    } else if (e.key === 'ArrowDown') { e.preventDefault(); focusNextStudent(studentId); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusPrevStudent(studentId); }
  };

  // ---------- SMS (only class teacher) ----------
  const checkSmsEligibility = async (studentId) => {
    if (!isClassTeacher) { setSmsEligibility({ eligible: false, feeClear: false, reqCompleted: false }); return false; }
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const feeRes = await api.get(`/report-analytics/student/${studentId}/status?term=${currentTerm}&academicYear=${currentAcademicYear}`, config);
      const feeData = feeRes.data?.data || {};
      const feeClear = feeData.isEligible === true;
      let reqCompleted = false;
      try {
        const reqRes = await api.get(`/requirements/student/${studentId}?term=${currentTerm}&academicYear=${currentAcademicYear}`, config);
        const reqs = reqRes.data?.data || [];
        if (reqs.length === 0) reqCompleted = true;
        else reqCompleted = reqs.every(r => r.status === 'Completed');
      } catch (err) { reqCompleted = false; }
      const eligible = feeClear && reqCompleted;
      setSmsEligibility({ eligible, feeClear, reqCompleted });
      return eligible;
    } catch (error) {
      console.error('Error checking SMS eligibility:', error);
      setSmsEligibility({ eligible: false, feeClear: false, reqCompleted: false });
      return false;
    }
  };

  const sendReportSms = async (student) => {
    if (!isClassTeacher) { toast.error('Only class teacher can send SMS reports.'); return; }
    if (sendingSms) return;
    const eligible = await checkSmsEligibility(student.id);
    if (!eligible) { toast.error('Student not eligible (fees or requirements not cleared)'); return; }
    if (!window.confirm(`Send SMS report to parent of ${student.fullName}?`)) return;
    setSendingSms(true);
    try {
      const studentMarks = marks.filter(m => Number(m.studentId) === Number(student.id) && m.examType === reportExamType && m.term === reportTerm && m.academicYear === reportAcademicYear);
      const scores = studentMarks.map(m => Number(m.score)).filter(s => !isNaN(s) && s >= 0);
      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
      const passed = scores.filter(s => s >= 50).length;
      const total = scores.length;
      const className = student.class?.className || 'N/A';
      const message = `Dear Parent/Guardian,\n\nREPORT CARD for ${student.fullName} (${className})\nTerm: ${reportTerm} ${reportAcademicYear}\nExam: ${reportExamType}\nAverage Score: ${avg}%\nSubjects Passed: ${passed}/${total}\n\nPlease visit school to collect the full report card.\n\nThank you.`;
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        recipients: [student.parentPhone],
        message,
        category: 'report',
        recipientType: 'parent',
        isBulk: false,
        metadata: { studentId: student.id, term: reportTerm, academicYear: reportAcademicYear, examType: reportExamType }
      };
      const res = await api.post('/sms/send', payload, config);
      if (res.data?.success) {
        toast.success(`SMS sent to ${student.parentPhone || 'parent'}`);
      } else {
        throw new Error(res.data?.message || 'SMS send failed');
      }
    } catch (error) {
      console.error('Send SMS error:', error);
      toast.error(error.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSendingSms(false);
    }
  };

  // ---------- STUDENT MODAL ----------
  const openStudentModal = async (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
    setPromotionStatus(student.promotionStatus || 'pending');
    if (isClassTeacher) await checkSmsEligibility(student.id);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const marksRes = await api.get(`/marks/student/${student.id}`, config);
      const studentMarksData = marksRes.data?.data || marksRes.data || [];
      const subjectsRes = await api.get('/subjects', config);
      const allSubjects = subjectsRes.data?.data || subjectsRes.data || [];

      let filteredMarks = studentMarksData;
      if (!isClassTeacher) {
        const teacherSubjectIds = teacherSubjects.map(s => Number(s.id));
        filteredMarks = studentMarksData.filter(m => teacherSubjectIds.includes(Number(m.subjectId)));
      }

      const enrichedMarks = filteredMarks.map(m => {
        const subject = allSubjects.find(s => Number(s.id) === Number(m.subjectId));
        return { ...m, subjectName: subject?.subjectName || `Subject ${m.subjectId}` };
      });

      if (isClassTeacher) {
        const studentSubjectIds = new Set(enrichedMarks.map(m => Number(m.subjectId)));
        const missing = allSubjects.filter(s => Number(s.classId) === Number(student.classId) && !studentSubjectIds.has(Number(s.id))).map(s => s.subjectName);
        setMissingSubjects(missing);
      } else {
        setMissingSubjects([]);
      }

      const scores = enrichedMarks.filter(m => m.score !== null && m.score !== undefined && m.score !== 'ABS').map(m => Number(m.score));
      const avg = scores.length > 0 ? Math.min(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), 100) : 0;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;
      const passed = scores.filter(s => s >= 50).length;
      const passRate = scores.length > 0 ? Math.min(Math.round((passed / scores.length) * 100), 100) : 0;
      setStudentMarks(enrichedMarks);
      setStudentSubjects(allSubjects);
      setStudentStats({ avg, highest, lowest, passRate, total: scores.length });
      try {
        const historyRes = await api.get(`/students/promotion-history?studentId=${student.id}`, config);
        setPromotionHistory(historyRes.data?.data || []);
      } catch { setPromotionHistory([]); }
    } catch (error) {
      console.error('Error fetching student marks:', error);
      toast.error('Failed to load student marks');
    }
  };

  const handleUpdatePromotion = async (status) => {
    if (!isClassTeacher) { toast.error('Only class teacher can update promotion status.'); return; }
    const isPromoting = status === 'promoted';
    if (isPromoting) {
      if (currentTerm !== 'Term 3') { toast.error('Promotion only in Term 3'); return; }
      if (promotionStatus === 'promoted') {
        toast('Already promoted', { icon: '⚠️' });
        return;
      }
      setIsUpdatingPromotion(true);
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await api.post(`/students/promote/${selectedStudent.id}`, {
          term: currentTerm, academicYear: currentAcademicYear, remarks: 'Promoted based on academic performance',
        }, config);
        if (res.data?.success) {
          setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
          setAllStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
          setSelectedStudent(res.data.data);
          setPromotionStatus('promoted');
          toast.success(`✅ ${selectedStudent.fullName} promoted.`);
          setShowStudentModal(false);
          const freshRes = await api.get('/teachers/me/students', config);
          setStudents(freshRes.data?.data || []);
          setAllStudents(freshRes.data?.data || []);
        }
      } catch (error) { toast.error(error.response?.data?.message || 'Promotion failed'); }
      finally { setIsUpdatingPromotion(false); }
      return;
    }
    setIsUpdatingPromotion(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.put(`/students/${selectedStudent.id}`, { promotionStatus: status }, config);
      setPromotionStatus(status);
      toast.success(`Status updated to ${status.replace('_', ' ').toUpperCase()}`);
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, promotionStatus: status } : s));
      setAllStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, promotionStatus: status } : s));
    } catch (error) { toast.error('Failed to update status'); }
    finally { setIsUpdatingPromotion(false); }
  };

  // ---------- PROMOTION MANAGEMENT (only class teacher) ----------
  const fetchAttendanceSummary = useCallback(async () => {
    if (!isClassTeacher || !selectedClass) return;
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const summaries = {};
      for (const student of students) {
        try {
          const res = await api.get(`/attendance/student/${student.id}?term=${currentTerm}&academicYear=${currentAcademicYear}`, config);
          const records = res.data?.data || [];
          const total = records.length;
          const present = records.filter(r => r.status === 'present').length;
          const absent = records.filter(r => r.status === 'absent').length;
          const late = records.filter(r => r.status === 'late').length;
          const excused = records.filter(r => r.status === 'excused').length;
          const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
          summaries[student.id] = { total, present, absent, late, excused, attendanceRate };
        } catch (err) {
          summaries[student.id] = { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 0 };
        }
      }
      setAttendanceSummary(summaries);
    } catch (error) { console.error('Error fetching attendance:', error); toast.error('Failed to load attendance'); }
  }, [isClassTeacher, selectedClass, students, currentTerm, currentAcademicYear]);

  const getAutoRecommendation = (student) => {
    const filteredMarks = marks.filter(m => 
      Number(m.studentId) === Number(student.id) &&
      m.examType === reportExamType &&
      m.term === reportTerm &&
      m.academicYear === reportAcademicYear
    );
    const classMarks = marks.filter(m => 
      students.some(s => s.id === m.studentId) &&
      m.examType === reportExamType &&
      m.term === reportTerm &&
      m.academicYear === reportAcademicYear
    );
    const subjectIds = new Set(classMarks.map(m => m.subjectId));
    const totalSubjectsCount = subjectIds.size || 1;
    const studentSubjectIds = new Set(filteredMarks.map(m => m.subjectId));
    const hasAllSubjects = studentSubjectIds.size >= totalSubjectsCount;
    const scores = filteredMarks.map(m => Number(m.score)).filter(s => !isNaN(s) && s >= 0);
    const avg = scores.length > 0 ? scores.reduce((a,b) => a+b, 0) / scores.length : 0;
    const passedAll = scores.every(s => s >= 50);
    const attRate = attendanceSummary[student.id]?.attendanceRate || 0;
    if (hasAllSubjects && passedAll && attRate >= 80) return 'promote';
    else if (hasAllSubjects && !passedAll && attRate >= 80) return 'repeat';
    else return 'review';
  };

  useEffect(() => {
    if (viewMode === 'promotion' && isClassTeacher && students.length > 0 && Object.keys(attendanceSummary).length > 0) {
      const initialDecisions = {};
      students.forEach(student => {
        const auto = getAutoRecommendation(student);
        initialDecisions[student.id] = { status: auto, comment: '', finalStatus: student.promotionStatus || 'pending' };
      });
      setPromotionDecisions(initialDecisions);
    }
  }, [viewMode, students, attendanceSummary, reportExamType, reportTerm, reportAcademicYear, isClassTeacher]);

  useEffect(() => {
    if (viewMode === 'promotion' && isClassTeacher) fetchAttendanceSummary();
  }, [viewMode, fetchAttendanceSummary, isClassTeacher]);

  const handleDecisionChange = (studentId, field, value) => {
    setPromotionDecisions(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }));
  };

  const handleBulkDecision = (status) => {
    if (!isClassTeacher) { toast.error('Only class teacher can make decisions.'); return; }
    if (selectedStudents.length === 0) { toast.error('No students selected'); return; }
    setPromotionDecisions(prev => {
      const updated = { ...prev };
      selectedStudents.forEach(id => { if (updated[id]) updated[id].status = status; });
      return updated;
    });
    setSelectedStudents([]);
    toast.success(`Applied "${status}" to ${selectedStudents.length} students`);
  };

  const handleSubmitPromotionList = async () => {
    if (!isClassTeacher) { toast.error('Only class teacher can submit promotion list.'); return; }
    if (!selectedClass) { toast.error('No class selected'); return; }
    if (!window.confirm('Submit promotion list to admin?')) return;
    setIsSubmittingPromotion(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const decisions = Object.entries(promotionDecisions).map(([studentId, decision]) => ({
        studentId: parseInt(studentId),
        promote: decision.status === 'promote',
        remarks: decision.comment || decision.status
      }));
      const res = await api.post(`/class-teacher/finalize-promotion/${selectedClass}`, { decisions }, config);
      if (res.data?.success) {
        toast.success('Promotion list submitted to admin!');
        await fetchInitialData();
        setViewMode('marks');
      } else throw new Error(res.data?.message || 'Submission failed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    } finally { setIsSubmittingPromotion(false); }
  };

  const generatePromotionReport = () => {
    if (!isClassTeacher) { toast.error('Only class teacher can generate report.'); return; }
    const allSubjectIds = new Set(marks.filter(m => m.examType === reportExamType && m.term === reportTerm && m.academicYear === reportAcademicYear).map(m => m.subjectId));
    const subjectMap = {};
    teacherSubjects.forEach(s => subjectMap[s.id] = s.subjectName);
    allSubjectIds.forEach(id => {
      if (!subjectMap[id]) {
        const m = marks.find(mk => mk.subjectId === id);
        subjectMap[id] = m?.subject?.subjectName || `Subject ${id}`;
      }
    });

    const rows = students.map(student => {
      const studentMarks = marks.filter(m => Number(m.studentId) === Number(student.id) && m.examType === reportExamType && m.term === reportTerm && m.academicYear === reportAcademicYear);
      const row = {
        'Student Number': student.studentNumber || '',
        'Full Name': student.fullName || '',
      };
      const subjectIds = Object.keys(subjectMap);
      subjectIds.forEach(subId => {
        const mark = studentMarks.find(m => m.subjectId === Number(subId));
        row[subjectMap[subId] || `Subject ${subId}`] = mark?.score !== undefined && mark?.score !== null ? mark.score : '-';
      });
      const scores = studentMarks.map(m => Number(m.score)).filter(s => !isNaN(s) && s >= 0);
      const avg = scores.length > 0 ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : 'N/A';
      row['Average'] = avg;
      const passed = scores.filter(s => s >= 50).length;
      row['Passed'] = `${passed}/${scores.length}`;
      row['Grade'] = avg !== 'N/A' ? getGradeUNEB(Number(avg)).grade : '-';
      const dec = promotionDecisions[student.id] || { status: 'pending', comment: '' };
      row['Recommendation'] = dec.status;
      row['Comment'] = dec.comment;
      row['Final Status'] = student.promotionStatus || 'pending';
      return row;
    });

    if (rows.length === 0) { toast.error('No data to export'); return; }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `promotion_report_${reportExamType}_${reportTerm}_${reportAcademicYear}.csv`;
    link.click();
    toast.success('Report exported');
  };

  // ---------- HELPERS ----------
  const getStudentMark = (studentId) => {
    const target = Number(studentId);
    if (editingMarks[target] !== undefined) return editingMarks[target];
    const record = marks.find(m => Number(m.studentId) === target && m.examType === examType);
    return record?.score ?? '';
  };
  const getStudentStatus = (studentId) => {
    const target = Number(studentId);
    if (editingMarks[target] !== undefined) return 'editing';
    return marks.some(m => Number(m.studentId) === target && m.examType === examType && m.score !== null && m.score !== 'ABS') ? 'submitted' : 'pending';
  };

  const filteredStudents = useMemo(() => {
    let base = [];
    if (viewFilter === 'current') base = students;
    else if (viewFilter === 'promoted') base = allStudents.filter(s => s.promotionStatus === 'promoted');
    else base = allStudents;
    if (!searchTerm.trim()) return base;
    const term = searchTerm.toLowerCase();
    return base.filter(s =>
      (s.fullName || '').toLowerCase().includes(term) ||
      (s.studentNumber || '').toLowerCase().includes(term)
    );
  }, [viewFilter, students, allStudents, searchTerm]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportMarks = () => {
    const csv = 'Student Number,Student Name,Score,Grade,Status,Promotion Status\n' + filteredStudents.map(s => {
      const score = getStudentMark(s.id);
      const grade = score && score !== 'ABS' ? getGradeUNEB(score).grade : '-';
      const status = getStudentStatus(s.id);
      return `${s.studentNumber || ''},${s.fullName || ''},${score},${grade},${status},${s.promotionStatus || 'pending'}`;
    }).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `marks_${examType.replace(/\s+/g, '_')}_${currentTerm}.csv`;
    link.click();
    toast.success('Exported!');
  };

  const switchClass = (classObj) => {
    setSelectedViewClass(classObj);
    setSelectedClass(Number(classObj.id));
    setTeacherClasses([classObj]);
    const fetchStudentsForClass = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await api.get(`/students?classId=${classObj.id}`, config);
        const data = res.data?.data || res.data || [];
        setStudents(data);
        setAllStudents(data);
        setViewFilter('current');
        setShowClassDropdown(false);
        toast.success(`Switched to ${classObj.className}`);
      } catch (error) { toast.error('Failed to switch class'); }
    };
    fetchStudentsForClass();
  };

  const renderSubjectSelector = () => {
    const availableSubjects = availableSubjectsForClass;
    if (availableSubjects.length === 0) {
      return (
        <span className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1.5 rounded-full text-sm">
          <AlertCircle className="w-4 h-4" /> No subjects assigned to this class
        </span>
      );
    }
    return (
      <div className="relative">
        <select
          value={selectedSubject || ''}
          onChange={(e) => setSelectedSubject(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
          disabled={lockedExamTypes.has(examType)}
        >
          {availableSubjects.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
          ))}
        </select>
      </div>
    );
  };

  // ---------- RENDER ----------
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="font-semibold text-lg text-gray-800">{fetchError}</p>
        <button onClick={fetchInitialData} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md">
          Retry
        </button>
      </div>
    );
  }

  const isExamLocked = lockedExamTypes.has(examType);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            Marks Entry
            {isClassTeacher && (
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-300">
              👨‍🏫 Class Teacher
              </span>








            )}
            {!isClassTeacher && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
                Subject Teacher
              </span>
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
            <div className="relative">
              <button
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition"
              >
                <School className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">
                  {selectedViewClass?.className || teacherClasses[0]?.className || 'No Class'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showClassDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[180px] py-1">
                  {availableClasses.length === 0 && <div className="px-4 py-2 text-xs text-gray-400">No classes assigned</div>}
                  {availableClasses.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => switchClass(cls)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition flex items-center gap-2 ${Number(cls.id) === Number(selectedClass) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                    >
                      <School className="w-4 h-4" /> {cls.className}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {renderSubjectSelector()}
            {/* Assessment dropdown – shows only incomplete exams */}
            <div className="relative flex items-center gap-1">
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                disabled={availableExamTypes.length === 0}
              >
                {availableExamTypes.length === 0 ? (
                  <option value="">All exams completed</option>
                ) : (
                  availableExamTypes.map(et => (
                    <option key={et} value={et}>{et}</option>
                  ))
                )}
              </select>
              {isExamLocked && (
                <Lock className="w-4 h-4 text-amber-600" title="This exam is locked" />
              )}
            </div>
            <span className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-medium">
              <CalendarDays className="w-4 h-4 text-indigo-500" /> {currentTerm} {currentAcademicYear}
            </span>
            {isExamLocked && (
              <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium">
                <Lock className="w-4 h-4" /> Locked
              </span>
            )}
            {availableExamTypes.length === 0 && (
              <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
                <CheckCircle className="w-4 h-4" /> All exams completed
              </span>
            )}
            <div className="flex gap-1 bg-gray-100 rounded-full p-0.5">
              <button onClick={() => setViewFilter('current')} className={`px-3 py-1.5 text-xs rounded-full transition ${viewFilter === 'current' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>My Class</button>
              <button onClick={() => setViewFilter('promoted')} className={`px-3 py-1.5 text-xs rounded-full transition ${viewFilter === 'promoted' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Promoted</button>
              <button onClick={() => setViewFilter('all')} className={`px-3 py-1.5 text-xs rounded-full transition ${viewFilter === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>All Students</button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setViewMode('marks')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'marks' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FileText className="w-4 h-4 inline mr-1" /> Marks</button>
          {isClassTeacher && (
            <button onClick={() => setViewMode('promotion')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'promotion' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><ClipboardList className="w-4 h-4 inline mr-1" /> Promotion</button>
          )}
          <button onClick={() => setShowHistory(!showHistory)} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition"><History className="w-4 h-4" /> {showHistory ? 'Hide History' : 'Show History'}</button>
          {!isExamLocked && Object.keys(editingMarks).length > 0 && (
            <button onClick={saveAllMarks} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 transition shadow-md shadow-emerald-200"><Save className="w-4 h-4" /> Save ({Object.keys(editingMarks).length})</button>
          )}
          {!isExamLocked && availableExamTypes.length > 0 && (
            <button onClick={handleSubmitMarks} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-amber-200"><Lock className="w-4 h-4" /> Submit & Lock</button>
          )}
          <button onClick={exportMarks} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-md shadow-blue-200"><Download className="w-4 h-4" /> Export</button>
          <button onClick={() => window.print()} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition border border-gray-200"><Printer className="w-4 h-4" /> Print</button>
          <button onClick={fetchInitialData} className="bg-white hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition border border-gray-200"><RefreshCw className="w-4 h-4" /> Sync</button>
        </div>
      </div>

      {/* ===== PROMOTION STATS – ONLY CLASS TEACHER ===== */}
      {isClassTeacher && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-center"><p className="text-xs text-blue-600 font-medium">Total Students</p><p className="text-2xl font-bold text-blue-700">{promotionStats.total}</p></div>
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-center"><p className="text-xs text-emerald-600 font-medium">Promoted</p><p className="text-2xl font-bold text-emerald-700">{promotionStats.promoted}</p></div>
          <div className="bg-rose-50 rounded-xl p-3 border border-rose-200 text-center"><p className="text-xs text-rose-600 font-medium">Not Promoted</p><p className="text-2xl font-bold text-rose-700">{promotionStats.notPromoted}</p></div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-center"><p className="text-xs text-amber-600 font-medium">Repeating</p><p className="text-2xl font-bold text-amber-700">{promotionStats.repeated}</p></div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center"><p className="text-xs text-gray-600 font-medium">Pending</p><p className="text-2xl font-bold text-gray-700">{promotionStats.pending}</p></div>
        </div>
      )}

      {/* ===== STATS CARDS (common) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'border-l-blue-500 text-blue-500' },
          { label: 'Marks Saved', value: stats.submittedCount, icon: CheckCircle, color: 'border-l-green-500 text-green-500' },
          { label: 'Pending', value: stats.pendingCount, icon: Clock, color: 'border-l-yellow-500 text-yellow-500' },
          { label: 'Average', value: `${stats.averageScore}%`, icon: BarChart3, color: 'border-l-purple-500 text-purple-500' },
          { label: 'Highest', value: `${stats.highestScore}%`, icon: Trophy, color: 'border-l-emerald-500 text-emerald-500' },
          { label: 'Pass Rate', value: `${stats.passRate}%`, icon: Target, color: 'border-l-rose-500 text-rose-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex items-start gap-4">
            <div className={`w-1 self-stretch rounded-full bg-${card.color.split(' ')[0].split('-')[2]}-500`} />
            <div className="flex-1">
              <div className="flex justify-between items-center"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p><card.icon className={`w-5 h-5 ${card.color.split(' ')[1]}`} /></div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== PROGRESS BAR ===== */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold text-gray-700">Completion</span><span className="text-sm font-bold text-indigo-600">{Math.min(stats.completionRate, 100)}%</span></div>
        <div className="w-full bg-gray-100 rounded-full h-3"><div className="h-3 rounded-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${Math.min(stats.completionRate, 100)}%` }} /></div>
      </div>

      {/* ===== PROMOTION HISTORY – ONLY CLASS TEACHER ===== */}
      {isClassTeacher && showHistory && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><History className="w-5 h-5 text-indigo-600" /> Promotion History</h3>
            <span className="text-xs text-gray-400">{promotionHistory.length} records</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {promotionHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No promotion records found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <tr><th className="p-3 text-left">Student</th><th className="p-3 text-center">From</th><th className="p-3 text-center">To</th><th className="p-3 text-center">Term</th><th className="p-3 text-center">Date</th><th className="p-3 text-center">Promoted By</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {promotionHistory.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-800">{record.student?.fullName}</td>
                      <td className="p-3 text-center text-gray-600">{record.fromClass?.className}</td>
                      <td className="p-3 text-center text-emerald-600 font-medium">{record.toClass?.className}</td>
                      <td className="p-3 text-center text-gray-600">{record.term}</td>
                      <td className="p-3 text-center text-gray-500 text-xs">{new Date(record.promotionDate).toLocaleDateString()}</td>
                      <td className="p-3 text-center text-gray-600">{record.promoter?.Fname} {record.promoter?.Lname}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===== FILTERS ===== */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Grading</label>
          <select value={selectedGradeSystem} onChange={e => setSelectedGradeSystem(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500" disabled={isExamLocked}>
            <option value="uneb">🇺🇬 UNEB</option><option value="letter">Letter</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500" placeholder="Search by name or admission no..." />
          </div>
        </div>
      </div>

      {/* ===== STUDENTS TABLE ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Adm No</th>
                <th className="p-4 text-left">Student Name</th>
                <th className="p-4 text-center">Gender</th>
                <th className="p-4 text-center w-32">Mark</th>
                <th className="p-4 text-center">Grade</th>
                <th className="p-4 text-center">Status</th>
                {isClassTeacher && <th className="p-4 text-center">Promotion</th>}
                <th className="p-4 text-center">Class</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentStudents.length === 0 ? (
                <tr><td colSpan={10} className="p-16 text-center text-gray-400"><Users className="w-16 h-16 mx-auto mb-3 opacity-30" /><p className="text-lg font-medium">No students found</p></td></tr>
              ) : (
                currentStudents.map((student, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const markVal = getStudentMark(student.id);
                  const status = getStudentStatus(student.id);
                  const gradeObj = markVal && markVal !== 'ABS' ? getGradeUNEB(markVal) : { grade: '-', color: 'text-gray-400', bg: 'bg-gray-50' };
                  const hasSaved = marks.some(m => Number(m.studentId) === Number(student.id) && m.examType === examType && m.score !== null && m.score !== 'ABS');
                  const promotion = student.promotionStatus || 'pending';
                  const studentClass = student.class?.className || 'N/A';
                  const promotionColors = { pending: 'bg-gray-100 text-gray-600', promoted: 'bg-emerald-100 text-emerald-700', not_promoted: 'bg-rose-100 text-rose-700', repeated: 'bg-amber-100 text-amber-700' };
                  const isLocked = isExamLocked;
                  return (
                    <tr key={student.id} className={`hover:bg-gray-50 transition ${hasSaved ? 'border-l-4 border-l-emerald-500' : ''}`}>
                      <td className="p-4 text-gray-500">{globalIndex}</td>
                      <td className="p-4 font-mono text-xs text-gray-600">{student.studentNumber || 'N/A'}</td>
                      <td className="p-4 font-medium text-gray-800">{student.fullName}</td>
                      <td className="p-4 text-center text-gray-600">{student.gender || '-'}</td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <input
                            ref={el => inputRefs.current[student.id] = el}
                            type="number" min="0" max="100"
                            value={markVal}
                            onChange={e => {
                              if (isLocked) { toast.error('Exam is locked'); return; }
                              const val = e.target.value;
                              if (val === '') { setEditingMarks(prev => { const n = { ...prev }; delete n[Number(student.id)]; return n; }); return; }
                              const num = parseInt(val, 10);
                              if (!isNaN(num) && num >= 0 && num <= 100) setEditingMarks(prev => ({ ...prev, [Number(student.id)]: val }));
                            }}
                            onKeyDown={e => handleKeyDown(e, student.id, markVal)}
                            placeholder="--"
                            disabled={isLocked}
                            className={`w-24 px-3 py-2 text-center border rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : status === 'submitted' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : status === 'editing' ? 'border-amber-300 bg-amber-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                          />
                        </div>
                      </td>
                      <td className={`p-4 text-center font-bold ${gradeObj.color}`}>{gradeObj.grade}</td>
                      <td className="p-4 text-center">
                        {status === 'submitted' && <span className="text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full text-xs font-medium">✓ Saved</span>}
                        {status === 'editing' && <span className="text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full text-xs font-medium">✏️ Editing</span>}
                        {status === 'pending' && <span className="text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full text-xs font-medium">Pending</span>}
                      </td>
                      {isClassTeacher && (
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${promotionColors[promotion]}`}>
                            {promotion.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                      )}
                      <td className="p-4 text-center text-xs text-gray-500">{studentClass}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openStudentModal(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Student Performance"><Eye className="w-4 h-4" /></button>
                          {!isLocked && status === 'editing' && <button onClick={() => saveSingleMark(student.id, markVal, false)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition" title="Save this mark"><Save className="w-4 h-4" /></button>}
                          {!isLocked && <button onClick={() => setAbsentModal({ open: true, student })} className="p-2 text-gray-400 hover:text-rose-500 transition" title="Mark absent"><UserX className="w-4 h-4" /></button>}
                          {!isLocked && hasSaved && status !== 'editing' && (
                            <button onClick={() => { const saved = marks.find(m => Number(m.studentId) === Number(student.id) && m.examType === examType); if (saved) { setEditingMarks(prev => ({ ...prev, [student.id]: saved.score })); setTimeout(() => inputRefs.current[student.id]?.focus(), 100); } }} className="p-2 text-blue-500 hover:text-blue-700 transition" title="Edit saved mark"><Edit className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-100">
          <span className="text-sm text-gray-500">Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 border rounded-lg text-sm ${p === currentPage ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'border-gray-200 hover:bg-gray-100'}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* ===== GRADE DISTRIBUTION (common) ===== */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-indigo-600" /> Grade Distribution</h3>
        <div className="space-y-3">
          {['A', 'B', 'C', 'D', 'F'].map(g => {
            const count = marks.filter(m => {
              const score = Number(m.score);
              if (isNaN(score) || score === 0) return false;
              if (g === 'A') return score >= 80;
              if (g === 'B') return score >= 60 && score < 80;
              if (g === 'C') return score >= 50 && score < 60;
              if (g === 'D') return score >= 40 && score < 50;
              if (g === 'F') return score < 40;
              return false;
            }).length;
            const max = Math.max(marks.filter(m => !isNaN(Number(m.score))).length, 1);
            const width = (count / max) * 100;
            return (
              <div key={g} className="flex items-center gap-3">
                <span className="w-6 text-sm font-bold text-gray-600">{g}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden"><div className={`h-4 rounded-full ${g === 'A' ? 'bg-emerald-500' : g === 'B' ? 'bg-blue-500' : g === 'C' ? 'bg-cyan-500' : g === 'D' ? 'bg-yellow-500' : 'bg-rose-500'}`} style={{ width: `${width}%` }} /></div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== RANKING (common) ===== */}
      {students.length > 0 && (
        <details className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <summary className="font-semibold text-gray-800 cursor-pointer flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Class Ranking</summary>
          <div className="mt-4 max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs uppercase tracking-wider"><th className="p-2 text-left">#</th><th className="p-2 text-left">Name</th><th className="p-2 text-center">Score</th><th className="p-2 text-center">Grade</th></tr></thead>
              <tbody>
                {[...students].map(s => {
                  const mark = marks.find(m => Number(m.studentId) === Number(s.id) && m.examType === examType);
                  const score = mark?.score && mark.score !== 'ABS' ? Number(mark.score) : 0;
                  return { ...s, score, grade: score > 0 ? getGradeUNEB(score).grade : '-' };
                }).sort((a, b) => b.score - a.score).map((s, i) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="p-2">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</td>
                    <td className="p-2 font-medium text-gray-700">{s.fullName}</td>
                    <td className="p-2 text-center font-bold text-indigo-600">{s.score}%</td>
                    <td className="p-2 text-center font-semibold">{s.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* ===== PROMOTION VIEW (class teacher only) ===== */}
      {isClassTeacher && viewMode === 'promotion' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-indigo-600" /> Promotion Management – {selectedViewClass?.className || 'Class'}</h2>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
                <Printer className="w-4 h-4" /> Print Report
              </button>
              <button onClick={generatePromotionReport} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition"><Download className="w-4 h-4" /> Export Report</button>
              <button onClick={handleSubmitPromotionList} disabled={isSubmittingPromotion} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition disabled:opacity-50">
                {isSubmittingPromotion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit to Admin
              </button>
            </div>
          </div>

          {/* Exam Filter */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-gray-500">Exam Type</label>
              <select
                value={reportExamType}
                onChange={(e) => setReportExamType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
              >
                {ALL_EXAM_TYPES.map(et => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500">Term</label>
              <select
                value={reportTerm}
                onChange={(e) => setReportTerm(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
              >
                <option>Term 1</option>
                <option>Term 2</option>
                <option>Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500">Year</label>
              <input
                type="text"
                value={reportAcademicYear}
                onChange={(e) => setReportAcademicYear(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white w-24"
                placeholder="2026"
              />
            </div>
            <div className="flex-1 text-right text-xs text-gray-500">
              Showing {reportExamType} • {reportTerm} • {reportAcademicYear}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium text-gray-700">Bulk Actions:</span>
            <button onClick={() => handleBulkDecision('promote')} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200 transition">Promote Selected</button>
            <button onClick={() => handleBulkDecision('repeat')} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200 transition">Repeat Selected</button>
            <button onClick={() => handleBulkDecision('review')} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition">Review Selected</button>
            <span className="text-xs text-gray-500">{selectedStudents.length} selected</span>
            {selectedStudents.length > 0 && <button onClick={() => setSelectedStudents([])} className="text-xs text-rose-600 hover:text-rose-800">Clear Selection</button>}
          </div>

          <div className="overflow-x-auto" id="report-card-print">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="p-3 text-center"><input type="checkbox" onChange={(e) => { if (e.target.checked) setSelectedStudents(students.map(s => s.id)); else setSelectedStudents([]); }} checked={selectedStudents.length === students.length && students.length > 0} className="rounded border-gray-300" /></th>
                  <th className="p-3 text-left">Student</th>
                  {(() => {
                    const subIds = [...new Set(marks.filter(m => m.examType === reportExamType && m.term === reportTerm && m.academicYear === reportAcademicYear).map(m => m.subjectId))];
                    const subMap = {};
                    teacherSubjects.forEach(s => subMap[s.id] = s.subjectName);
                    subIds.forEach(id => {
                      if (!subMap[id]) {
                        const m = marks.find(mk => mk.subjectId === id);
                        subMap[id] = m?.subject?.subjectName || `Subj ${id}`;
                      }
                    });
                    return subIds.map(id => (
                      <th key={id} className="p-3 text-center">{subMap[id] || `Subj ${id}`}</th>
                    ));
                  })()}
                  <th className="p-3 text-center">Average</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-center">Passed</th>
                  <th className="p-3 text-center">Attendance</th>
                  <th className="p-3 text-center">Recommend</th>
                  <th className="p-3 text-center">Decision</th>
                  <th className="p-3 text-left">Comment</th>
                  <th className="p-3 text-center">Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.length === 0 ? (
                  <tr><td colSpan={20} className="p-8 text-center text-gray-400">No students in this class</td></tr>
                ) : (
                  students.map((student) => {
                    const studentMarks = marks.filter(m => Number(m.studentId) === Number(student.id) && m.examType === reportExamType && m.term === reportTerm && m.academicYear === reportAcademicYear);
                    const allSubIds = [...new Set(marks.filter(m => m.examType === reportExamType && m.term === reportTerm && m.academicYear === reportAcademicYear).map(m => m.subjectId))];
                    const subMap = {};
                    teacherSubjects.forEach(s => subMap[s.id] = s.subjectName);
                    allSubIds.forEach(id => {
                      if (!subMap[id]) {
                        const m = marks.find(mk => mk.subjectId === id && mk.examType === reportExamType && mk.term === reportTerm && mk.academicYear === reportAcademicYear);
                        subMap[id] = m?.subject?.subjectName || `Subj ${id}`;
                      }
                    });
                    const scores = studentMarks.map(m => Number(m.score)).filter(s => !isNaN(s) && s >= 0);
                    const avg = scores.length > 0 ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : 'N/A';
                    const passed = scores.filter(s => s >= 50).length;
                    const totalSubj = allSubIds.length;
                    const att = attendanceSummary[student.id] || { attendanceRate: 0 };
                    const autoRec = getAutoRecommendation(student);
                    const decision = promotionDecisions[student.id] || { status: 'pending', comment: '' };
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="p-3 text-center"><input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={(e) => { if (e.target.checked) setSelectedStudents(prev => [...prev, student.id]); else setSelectedStudents(prev => prev.filter(id => id !== student.id)); }} className="rounded border-gray-300" /></td>
                        <td className="p-3 font-medium text-gray-800">{student.fullName}</td>
                        {allSubIds.map(id => {
                          const mark = studentMarks.find(m => m.subjectId === id);
                          const score = mark?.score !== undefined && mark?.score !== null ? mark.score : '-';
                          return <td key={id} className="p-3 text-center">{score}</td>;
                        })}
                        <td className="p-3 text-center font-bold text-indigo-600">{avg}</td>
                        <td className="p-3 text-center font-bold">{avg !== 'N/A' ? getGradeUNEB(Number(avg)).grade : '-'}</td>
                        <td className="p-3 text-center">{passed}/{totalSubj}</td>
                        <td className="p-3 text-center"><span className={`font-medium ${att.attendanceRate >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>{att.attendanceRate}%</span></td>
                        <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${autoRec === 'promote' ? 'bg-emerald-100 text-emerald-700' : autoRec === 'repeat' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{autoRec.toUpperCase()}</span></td>
                        <td className="p-3 text-center">
                          <select value={decision.status} onChange={(e) => handleDecisionChange(student.id, 'status', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500">
                            <option value="promote">Promote</option><option value="repeat">Repeat</option><option value="review">Review</option>
                          </select>
                        </td>
                        <td className="p-3"><input type="text" value={decision.comment || ''} onChange={(e) => handleDecisionChange(student.id, 'comment', e.target.value)} placeholder="Reason..." className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500" /></td>
                        <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${student.promotionStatus === 'promoted' ? 'bg-emerald-100 text-emerald-700' : student.promotionStatus === 'not_promoted' ? 'bg-rose-100 text-rose-700' : student.promotionStatus === 'repeated' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{student.promotionStatus || 'pending'}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-gray-500">* Auto‑recommendation based on marks (≥50% in all subjects) and attendance (≥80%). Only class teacher sees this view.</div>
        </div>
      )}

      {/* ===== MODALS ===== */}
      {/* Absent Modal */}
      {absentModal.open && !isExamLocked && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="font-bold text-xl text-gray-800 mb-4">Mark Absent</h3>
            <p className="text-sm text-gray-600 mb-4">Student: <strong>{absentModal.student?.fullName}</strong></p>
            <div className="space-y-2">
              <button onClick={() => handleMarkAbsent(absentModal.student.id, 'ABS')} className="w-full px-4 py-2.5 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition text-left font-medium">ABS – Absent</button>
              <button onClick={() => handleMarkAbsent(absentModal.student.id, 'MIS')} className="w-full px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition text-left font-medium">MIS – Missed Paper</button>
              <button onClick={() => handleMarkAbsent(absentModal.student.id, 'EX')} className="w-full px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition text-left font-medium">EX – Excused</button>
            </div>
            <button onClick={() => setAbsentModal({ open: false, student: null })} className="mt-4 w-full px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* ===== STUDENT PERFORMANCE MODAL ===== */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between text-white border-b border-indigo-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg border border-white/20 uppercase">{selectedStudent.fullName?.charAt(0)}</div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{selectedStudent.fullName}</h2>
                  <p className="text-sm text-indigo-200 font-mono">{selectedStudent.studentNumber || 'NO-ID'} · {selectedStudent.class?.className || 'No Class'}</p>
                  <p className="text-xs text-indigo-300">{currentTerm} {currentAcademicYear}</p>
                </div>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-500">Average</p><p className="text-xl font-bold text-indigo-600">{studentStats.avg}%</p></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-500">Highest</p><p className="text-xl font-bold text-emerald-600">{studentStats.highest}%</p></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-500">Lowest</p><p className="text-xl font-bold text-rose-600">{studentStats.lowest}%</p></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-500">Pass Rate</p><p className="text-xl font-bold text-blue-600">{studentStats.passRate}%</p></div>
              </div>

              {isClassTeacher && missingSubjects.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-700"><AlertTriangle className="w-4 h-4" /><p className="text-sm font-medium">Missing Marks for: {missingSubjects.join(', ')}</p></div>
                  <p className="text-xs text-amber-600 mt-1">The student has no marks recorded for these subjects.</p>
                </div>
              )}

              {isClassTeacher && (
                <div className="mb-4 p-4 border rounded-xl bg-amber-50 border-amber-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div><p className="text-sm font-medium text-gray-700">Promotion Status</p><p className="text-lg font-bold capitalize text-amber-700">{promotionStatus.replace('_', ' ')}</p><p className="text-xs text-gray-400 mt-0.5">{currentTerm} {currentAcademicYear}</p></div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleUpdatePromotion('promoted')} disabled={isUpdatingPromotion || promotionStatus === 'promoted'} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${promotionStatus === 'promoted' ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}><ThumbsUp className="w-4 h-4" /> Promote</button>
                      <button onClick={() => handleUpdatePromotion('not_promoted')} disabled={isUpdatingPromotion || promotionStatus === 'not_promoted'} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${promotionStatus === 'not_promoted' ? 'bg-rose-100 text-rose-700 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}><ThumbsDown className="w-4 h-4" /> Not Promoted</button>
                      <button onClick={() => handleUpdatePromotion('repeated')} disabled={isUpdatingPromotion || promotionStatus === 'repeated'} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${promotionStatus === 'repeated' ? 'bg-amber-100 text-amber-700 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}><MinusCircle className="w-4 h-4" /> Repeat</button>
                      <button onClick={() => handleUpdatePromotion('pending')} disabled={isUpdatingPromotion || promotionStatus === 'pending'} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${promotionStatus === 'pending' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}>Reset</button>
                      {isUpdatingPromotion && <Loader2 className="w-5 h-5 animate-spin text-gray-500" />}
                    </div>
                  </div>
                  {currentTerm !== 'Term 3' && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Promotion is only allowed in Term 3. Current term: {currentTerm}</p>}
                </div>
              )}

              {isClassTeacher && (
                <div className="mb-4 p-4 border rounded-xl bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div><p className="text-sm font-medium text-gray-700">📱 SMS Report</p><p className="text-xs text-gray-500">{smsEligibility?.eligible ? '✅ Eligible – fees and requirements cleared' : '❌ Not eligible – check fees and requirements'}</p></div>
                    <button onClick={() => sendReportSms(selectedStudent)} disabled={!smsEligibility?.eligible || sendingSms} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${smsEligibility?.eligible && !sendingSms ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                      {sendingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      {sendingSms ? 'Sending...' : 'Send SMS Report'}
                    </button>
                  </div>
                  {!smsEligibility?.eligible && <p className="text-xs text-amber-600 mt-1">{!smsEligibility?.feeClear && '• Fee balance not cleared. '}{!smsEligibility?.reqCompleted && '• Requirements not fully completed.'}</p>}
                  {smsEligibility?.eligible && <p className="text-xs text-emerald-600 mt-1">✅ All fees cleared and requirements completed.</p>}
                </div>
              )}

              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Subject Marks
                <span className="text-xs text-gray-400 ml-2">
                  {studentMarks.filter(m => m.score !== null && m.score !== 'ABS').length} subjects recorded
                </span>
              </h3>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                    <tr><th className="p-3 text-left">Subject</th><th className="p-3 text-center">Score</th><th className="p-3 text-center">Grade</th><th className="p-3 text-center">Exam Type</th><th className="p-3 text-center">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentMarks.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">No marks recorded for this student</td></tr>
                    ) : (
                      studentMarks.map((mark, idx) => {
                        const grade = getGradeUNEB(mark.score);
                        const isAbsent = mark.score === 'ABS';
                        const status = (mark.score !== null && mark.score !== undefined && mark.score !== 'ABS') ? 'Saved' : 'Not Entered';
                        return (
                          <tr key={idx} className={`hover:bg-gray-50 transition ${isAbsent ? 'bg-red-50/50' : ''}`}>
                            <td className="p-3 font-medium text-gray-800">{mark.subjectName}{isAbsent && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ABSENT</span>}</td>
                            <td className={`p-3 text-center font-bold ${isAbsent ? 'text-red-500' : 'text-indigo-600'}`}>{mark.score !== null && mark.score !== undefined && mark.score !== 'ABS' ? `${mark.score}%` : 'ABS'}</td>
                            <td className={`p-3 text-center font-bold ${isAbsent ? 'text-red-500' : grade.color}`}>{mark.score !== null && mark.score !== undefined && mark.score !== 'ABS' ? grade.grade : '-'}</td>
                            <td className="p-3 text-center text-xs text-gray-500">{mark.examType || 'N/A'}</td>
                            <td className="p-3 text-center">{status === 'Saved' ? <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-medium">Saved</span> : <span className="text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-medium">Not Entered</span>}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowStudentModal(false)} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMarksEntry;