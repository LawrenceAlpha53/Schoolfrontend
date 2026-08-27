import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  School,
  BookOpen,
  Award,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Printer,
  Download,
  FileText,
  GraduationCap,
  UserCircle,
  Phone as PhoneIcon,
  Home,
  Star,
  BarChart3,
  PieChart,
  LineChart,
  CalendarDays
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [student, setStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [studentMarks, setStudentMarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [feeSummary, setFeeSummary] = useState({
    totalDemanded: 0,
    totalPaid: 0,
    balance: 0,
    paymentCount: 0
  });

  // ================= FETCH STUDENT DATA =================
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Fetch student details
        const studentRes = await api.get(`/students/${id}`, config);
        const studentData = studentRes.data || {};
        setStudent(studentData);

        // Fetch student's fees
        const feesRes = await api.get(`/fees/student/${id}`, config);
        const fees = Array.isArray(feesRes.data) ? feesRes.data : [];
        setStudentFees(fees);

        // Calculate fee summary
        let totalDemanded = 0;
        let totalPaid = 0;
        let paymentCount = 0;

        fees.forEach(fee => {
          const paid = Number(fee.amountPaid || fee.amount_paid || fee.paid || 0);
          const total = Number(fee.totalFee || fee.total_fee || fee.fee_amount || 0);
          totalDemanded += total;
          totalPaid += paid;
          if (paid > 0) paymentCount++;
        });

        setFeeSummary({
          totalDemanded,
          totalPaid,
          balance: totalDemanded - totalPaid,
          paymentCount
        });

        // Fetch student's marks
        const marksRes = await api.get(`/api/marks/student/${id}`, config);
        const marks = Array.isArray(marksRes.data) ? marksRes.data : [];
        setStudentMarks(marks);

      } catch (error) {
        console.error("Student fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchStudentData();
    }
  }, [id]);

  // ================= FORMAT HELPERS =================
  const formatUGX = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "UGX 0";
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-UG", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGrade = (score) => {
    if (score >= 80) return { grade: 'A', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-500">Student not found</p>
          <button 
            onClick={() => navigate('/secretary/students')}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/secretary/students')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{student.fullName}</h1>
            <p className="text-gray-500">Student Profile • {student.studentNumber}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold">
              {student.fullName?.charAt(0) || 'S'}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="font-semibold text-gray-800">{student.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Student ID</p>
              <p className="font-semibold text-gray-800">{student.studentNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Class</p>
              <p className="font-semibold text-gray-800">{student.class?.className || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gender</p>
              <p className="font-semibold text-gray-800">{student.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="font-semibold text-gray-800">{formatDate(student.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-sm font-semibold ${
                student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {student.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <PhoneIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Parent: {student.parentName || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{student.parentPhone || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{student.address || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Fees Demanded</p>
          <p className="text-lg font-bold text-blue-600">{formatUGX(feeSummary.totalDemanded)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Fees Paid</p>
          <p className="text-lg font-bold text-green-600">{formatUGX(feeSummary.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Balance</p>
          <p className={`text-lg font-bold ${feeSummary.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatUGX(feeSummary.balance)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Payment Records</p>
          <p className="text-lg font-bold text-purple-600">{feeSummary.paymentCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 text-sm font-medium transition ${
              activeTab === 'overview' 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-6 py-4 text-sm font-medium transition ${
              activeTab === 'fees' 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Fee History
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`px-6 py-4 text-sm font-medium transition ${
              activeTab === 'marks' 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GraduationCap className="w-4 h-4 inline mr-2" />
            Academic Performance
          </button>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="text-sm text-gray-500">Full Name:</span> <span className="font-medium">{student.fullName}</span></div>
                  <div><span className="text-sm text-gray-500">Student ID:</span> <span className="font-medium">{student.studentNumber}</span></div>
                  <div><span className="text-sm text-gray-500">Class:</span> <span className="font-medium">{student.class?.className || 'N/A'}</span></div>
                  <div><span className="text-sm text-gray-500">Gender:</span> <span className="font-medium">{student.gender || 'N/A'}</span></div>
                  <div><span className="text-sm text-gray-500">Date of Birth:</span> <span className="font-medium">{formatDate(student.dateOfBirth)}</span></div>
                  <div><span className="text-sm text-gray-500">Status:</span> <span className="font-medium">{student.status || 'Active'}</span></div>
                  <div><span className="text-sm text-gray-500">Parent Name:</span> <span className="font-medium">{student.parentName || 'N/A'}</span></div>
                  <div><span className="text-sm text-gray-500">Parent Phone:</span> <span className="font-medium">{student.parentPhone || 'N/A'}</span></div>
                  <div><span className="text-sm text-gray-500">Address:</span> <span className="font-medium">{student.address || 'N/A'}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Fees Tab */}
          {activeTab === 'fees' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Fee Payment History</h3>
              {studentFees.length === 0 ? (
                <p className="text-gray-500">No fee records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Term</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Total Fee</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Amount Paid</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentFees.map((fee, index) => {
                        const balance = (fee.totalFee || 0) - (fee.amountPaid || 0);
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 text-sm text-gray-600">{formatDate(fee.createdAt)}</td>
                            <td className="py-3 text-sm text-gray-600">{fee.term || 'N/A'}</td>
                            <td className="py-3 text-sm font-medium text-blue-600">{formatUGX(fee.totalFee)}</td>
                            <td className="py-3 text-sm font-medium text-green-600">{formatUGX(fee.amountPaid)}</td>
                            <td className={`py-3 text-sm font-medium ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {formatUGX(balance)}
                            </td>
                            <td className="py-3 text-sm text-gray-600">{fee.paymentMethod || 'N/A'}</td>
                            <td className="py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                balance <= 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {balance <= 0 ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Marks Tab */}
          {activeTab === 'marks' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Performance</h3>
              {studentMarks.length === 0 ? (
                <p className="text-gray-500">No marks records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Exam Type</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentMarks.map((mark, index) => {
                        const gradeInfo = getGrade(mark.score);
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 text-sm font-medium text-gray-800">
                              {mark.subject?.subjectName || mark.subject_name || 'N/A'}
                            </td>
                            <td className="py-3 text-sm text-gray-600">{mark.examType || 'N/A'}</td>
                            <td className="py-3 text-sm font-medium text-gray-800">{mark.score || 0}</td>
                            <td className="py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${gradeInfo.bg} ${gradeInfo.color}`}>
                                {gradeInfo.grade}
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-600">{mark.teacher?.fullName || mark.teacher_name || 'N/A'}</td>
                            <td className="py-3 text-sm text-gray-500">{formatDate(mark.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;