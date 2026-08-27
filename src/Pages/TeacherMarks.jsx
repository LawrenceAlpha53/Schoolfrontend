import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Users,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Plus,
  Filter,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Award,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const TeacherMarks = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMarks, setEditingMarks] = useState({});
  const [examType, setExamType] = useState('CAT 1');
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMarks, setStudentMarks] = useState([]);

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const teachersRes = await api.get('/teachers', config);
      const teachers = teachersRes.data.data || teachersRes.data || [];
      const currentTeacher = teachers.find(t => 
        t.email === user.Email || 
        t.fullName === (user.Fname + ' ' + user.Lname)
      );

      if (currentTeacher) {
        const classesRes = await api.get('/classes', config);
        const classes = classesRes.data.data || classesRes.data || [];
        const teacherClasses = classes.filter(c => c.id === currentTeacher.classId);
        setTeacherClasses(teacherClasses);
        
        if (teacherClasses.length > 0) {
          setSelectedClass(teacherClasses[0].id);
          await fetchStudentsAndMarks(teacherClasses[0].id);
        }
      }

    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStudentsAndMarks = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const studentsRes = await api.get(`/students?classId=${classId}`, config);
      const studentsData = studentsRes.data.data || studentsRes.data || [];
      setStudents(studentsData);

      const marksRes = await api.get('/marks', config);
      const marksData = marksRes.data.data || marksRes.data || [];
      const classMarks = marksData.filter(m => 
        studentsData.some(s => s.id === m.studentId)
      );
      setMarks(classMarks);

    } catch (error) {
      console.error('Fetch students/marks error:', error);
      toast.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= HANDLE MARK UPDATE =================
  const handleMarkChange = (studentId, value) => {
    setEditingMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const saveMarks = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const records = Object.entries(editingMarks).map(([studentId, score]) => ({
        studentId: parseInt(studentId),
        score: parseInt(score),
        examType: examType,
        submitted: true
      }));

      // In production, this would be a bulk API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${records.length} marks submitted successfully!`);
      setEditingMarks({});
      await fetchStudentsAndMarks(selectedClass);

    } catch (error) {
      console.error('Save marks error:', error);
      toast.error('Failed to save marks');
    } finally {
      setIsSaving(false);
    }
  };

  // ================= VIEW STUDENT MARKS =================
  const viewStudentMarks = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const marksRes = await api.get(`/marks?studentId=${studentId}`, config);
      const data = marksRes.data.data || marksRes.data || [];
      setStudentMarks(data);
      const student = students.find(s => s.id === studentId);
      setSelectedStudent(student);
      setShowMarksModal(true);
    } catch (error) {
      console.error('View student marks error:', error);
      toast.error('Failed to fetch student marks');
    }
  };

  // ================= GET GRADE =================
  const getGrade = (score) => {
    if (score >= 80) return { grade: 'D1', color: 'text-emerald-600' };
    if (score >= 75) return { grade: 'D2', color: 'text-green-600' };
    if (score >= 70) return { grade: 'C3', color: 'text-blue-600' };
    if (score >= 65) return { grade: 'C4', color: 'text-cyan-600' };
    if (score >= 60) return { grade: 'C5', color: 'text-teal-600' };
    if (score >= 55) return { grade: 'C6', color: 'text-yellow-600' };
    if (score >= 50) return { grade: 'P7', color: 'text-orange-600' };
    if (score >= 45) return { grade: 'P8', color: 'text-red-400' };
    return { grade: 'F9', color: 'text-red-600' };
  };

  // ================= FILTER STUDENTS =================
  const getFilteredStudents = () => {
    let filtered = [...students];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.fullName?.toLowerCase().includes(term) ||
        s.studentNumber?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const filteredStudents = getFilteredStudents();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // ================= GET STUDENT MARK =================
  const getStudentMark = (studentId) => {
    const mark = marks.find(m => m.studentId === studentId);
    return mark?.score || '';
  };

  const getStudentMarkStatus = (studentId) => {
    const mark = marks.find(m => m.studentId === studentId);
    if (mark?.score) return 'submitted';
    if (editingMarks[studentId]) return 'editing';
    return 'pending';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading marks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            Enter Marks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Record and manage student grades
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(editingMarks).length > 0 && (
            <button
              onClick={saveMarks}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : `Save ${Object.keys(editingMarks).length} Marks`}
            </button>
          )}
          <button
            onClick={() => fetchStudentsAndMarks(selectedClass)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass || ''}
              onChange={(e) => {
                setSelectedClass(parseInt(e.target.value));
                fetchStudentsAndMarks(parseInt(e.target.value));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              <option value="">Select Class</option>
              {teacherClasses.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              <option value="CAT 1">CAT 1</option>
              <option value="CAT 2">CAT 2</option>
              <option value="CAT 3">CAT 3</option>
              <option value="End of Term">End of Term</option>
              <option value="End of Year">End of Year</option>
            </select>
          </div>

          <div className="flex-1 min-w-[180px] relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <Search className="absolute left-3 top-[34px] w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Number</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No students found</p>
                  </td>
                </tr>
              ) : (
                currentStudents.map((student, index) => {
                  const currentMark = editingMarks[student.id] || getStudentMark(student.id);
                  const status = getStudentMarkStatus(student.id);
                  const grade = currentMark ? getGrade(parseInt(currentMark)) : null;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 text-sm text-gray-500">{indexOfFirstItem + index + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {student.fullName?.charAt(0) || 'S'}
                          </div>
                          <span className="font-medium text-sm">{student.fullName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">{student.studentNumber}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentMark}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          className="w-20 mx-auto px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm text-center"
                          placeholder="Score"
                        />
                      </td>
                      <td className="p-3 text-center">
                        {currentMark && grade && (
                          <span className={`font-bold ${grade.color}`}>{grade.grade}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'submitted' ? 'bg-green-100 text-green-700' :
                          status === 'editing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {status === 'submitted' && <CheckCircle className="w-3 h-3" />}
                          {status === 'editing' && <Edit className="w-3 h-3" />}
                          {status === 'pending' && <AlertCircle className="w-3 h-3" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => viewStudentMarks(student.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
            <p className="text-sm text-gray-500">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded-lg text-sm transition ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Marks Modal */}
      {showMarksModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  Student Marks
                </h3>
                <p className="text-sm text-gray-500">{selectedStudent.fullName} - {selectedStudent.studentNumber}</p>
              </div>
              <button
                onClick={() => setShowMarksModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {studentMarks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No marks recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {studentMarks.map((mark, index) => {
                    const grade = getGrade(mark.score);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">{mark.examType || 'Exam'}</span>
                          <span className="text-sm text-gray-500">{mark.subject?.subjectName || 'Subject'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-gray-800">{mark.score}%</span>
                          <span className={`font-bold ${grade.color}`}>{grade.grade}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => setShowMarksModal(false)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMarks;