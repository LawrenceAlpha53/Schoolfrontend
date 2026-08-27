// CreateUser.jsx - Updated with Base Salary for Teachers, Secretaries, and Staff
import { useEffect, useState } from "react";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  UserPlus, Users, Info, Mail, Lock, User, School, GraduationCap,
  Briefcase, Shield, Eye, EyeOff, CheckCircle, XCircle, Loader2,
  ArrowLeft, RefreshCw, Search, Filter, Trash2, Edit, MoreVertical,
  UserCheck, UserX, CalendarDays, Phone, Building, BookOpen, Clock,
  AlertCircle, BookMarked, Library, ListChecks, MapPin, Globe,
  Heart, Calendar, IdCard, PhoneCall, Home, User as UserIcon, DollarSign
} from "lucide-react";

const CreateUser = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ================= STATE =================
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);

  // ================= FORM DATA =================
  const [formData, setFormData] = useState({
    // User fields (for roles that have user accounts)
    Fname: "",
    Lname: "",
    Email: "",
    Phonenumber: "",
    password: "",
    role: "student",
    nin: "",
    BaseSalary: "",      // Unified for all paid roles (teacher, secretary, staff)
    
    // Student specific fields
    studentNumber: "",
    gender: "",
    dateOfBirth: "",
    classId: "",
    parentName: "",
    parentPhone: "",
    address: "",
    nationality: "",
    medicalcondition: "none",
    Section: "none",
    status: "Active",
    
    // Teacher fields
    subjectId: "",
    
    // Staff (non-teaching) specific fields
    position: "",
    department: "",
    hireDate: "",
    employeeNumber: "",
    alternativePhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    notes: "",
    
    // Common fields
    className: ""
  });

  // ================= CLASSES & SUBJECTS =================
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // ================= FETCH USERS =================
  const fetchUsers = async (showToast = false) => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      try {
        const response = await axios.get('/users', config);
        const usersData = response.data?.data || response.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
        setHasFetchedUsers(true);
        if (showToast) toast.success(`Loaded ${usersData.length} users`);
      } catch (error) {
        console.log('Users fetch error:', error.message);
        setUsers([]);
        if (showToast) toast.error('Could not load users.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // ================= FETCH CLASSES & SUBJECTS =================
  const fetchOptions = async () => {
    try {
      setIsLoadingOptions(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      let classesData = [], subjectsData = [];
      try {
        const classesRes = await axios.get('/classes', config);
        classesData = classesRes.data?.data || classesRes.data || [];
      } catch (e) { console.log('Classes fetch error:', e.message); }
      
      try {
        const subjectsRes = await axios.get('/subjects', config);
        subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
      } catch (e) { console.log('Subjects fetch error:', e.message); }
      
      setClasses(Array.isArray(classesData) ? classesData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      console.error('Error fetching options:', error);
      setClasses([]);
      setSubjects([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // ================= INITIAL EFFECTS =================
  useEffect(() => {
    const roleFromUrl = searchParams.get("role");
    if (roleFromUrl) {
      setFormData(prev => ({ ...prev, role: roleFromUrl }));
    }
    fetchUsers();
    fetchOptions();
  }, [searchParams]);

  // ================= HANDLE FORM CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ================= CREATE USER / STAFF =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Common validations ---
    if (!formData.Fname || !formData.Email) {
      toast.error('Full Name and Email are required');
      return;
    }

    // --- Role-specific validations ---
    if (formData.role === 'staff') {
      if (!formData.position) {
        toast.error('Position is required for staff');
        return;
      }
    } else {
      if (!formData.password) {
        toast.error('Password is required for this role');
        return;
      }
    }

    if (formData.role === 'teacher' && (!formData.classId || !formData.subjectId)) {
      toast.error('Please assign a class and subject for the teacher');
      return;
    }

    if (formData.role === 'student' && !formData.classId) {
      toast.error('Please assign a class for the student');
      return;
    }

    // Validate BaseSalary for paid roles (teacher, secretary, staff)
    const paidRoles = ['teacher', 'secretary', 'staff'];
    if (paidRoles.includes(formData.role) && (!formData.BaseSalary || isNaN(formData.BaseSalary))) {
      toast.error('Please enter a valid Base Salary');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // ----- CASE: STAFF (no user account) -----
      if (formData.role === 'staff') {
        const staffPayload = {
          fullName: `${formData.Fname} ${formData.Lname}`.trim(),
          employeeNumber: formData.employeeNumber || undefined,
          position: formData.position,
          department: formData.department || null,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          phoneNumber: formData.Phonenumber || null,
          alternativePhone: formData.alternativePhone || null,
          email: formData.Email || null,
          hireDate: formData.hireDate || null,
          status: formData.status || 'Active',
          address: formData.address || null,
          emergencyContactName: formData.emergencyContactName || null,
          emergencyContactPhone: formData.emergencyContactPhone || null,
          notes: formData.notes || null,
          nin: formData.nin || null,
          BaseSalary: formData.BaseSalary || null,
        };

        const response = await axios.post('/staff', staffPayload, config);
        if (response.data?.success) {
          toast.success(`✅ Staff ${formData.Fname} created!`);
          resetForm();
          await fetchUsers(true);
        } else {
          toast.error(response.data?.message || 'Failed to create staff');
        }
        setLoading(false);
        return;
      }

      // ----- CASE: OTHER ROLES (user account) -----
      const userPassword = formData.role === 'student'
        ? formData.Email.split('@')[0] + '123'
        : formData.password;

      const userPayload = {
        Fname: formData.Fname,
        Lname: formData.Lname || "",
        Email: formData.Email,
        Phonenumber: formData.Phonenumber || "",
        password: userPassword,
        role: formData.role,
        nin: (formData.role === 'secretary' || formData.role === 'teacher') 
              ? formData.nin 
              : undefined
      };

      const response = await axios.post("/auth/register", userPayload, config);
      if (response.data?.user || response.data) {
        const newUser = response.data?.user || response.data;

        // ----- TEACHER: create Teacher record -----
        if (formData.role === 'teacher' && newUser?.id) {
          await axios.post('/teachers', {
            fullName: `${formData.Fname} ${formData.Lname}`.trim(),
            email: formData.Email,
            phoneNumber: formData.Phonenumber,
            classId: parseInt(formData.classId),
            subjectId: parseInt(formData.subjectId),
            userId: newUser.id,
            nationalId: formData.nin || null,
            basicSalary: formData.BaseSalary || null,   // ✅ BaseSalary for teacher
          }, config);
          toast.success(`✅ Teacher ${formData.Fname} created!`);
        } 
        // ----- STUDENT: create Student record -----
        else if (formData.role === 'student' && newUser?.id) {
          await axios.post('/students', {
            fullName: `${formData.Fname} ${formData.Lname}`.trim(),
            studentNumber: formData.studentNumber || `STU-${Date.now().toString().slice(-6)}`,
            gender: formData.gender || '',
            dateOfBirth: formData.dateOfBirth || null,
            classId: parseInt(formData.classId),
            parentName: formData.parentName || '',
            parentPhone: formData.parentPhone || '',
            address: formData.address || '',
            status: formData.status || 'Active',
            nationality: formData.nationality || '',
            medicalcondition: formData.medicalcondition || 'none',
            Section: formData.Section || 'none',
            userId: newUser.id
          }, config);
          toast.success(`✅ Student ${formData.Fname} created! Default password: ${userPassword}`);
        }
        // ----- SECRETARY: create Staff record for payroll (and keep user account) -----
        else if (formData.role === 'secretary' && newUser?.id) {
          // Create a Staff record for the secretary so they appear in payroll
          await axios.post('/staff', {
            fullName: `${formData.Fname} ${formData.Lname}`.trim(),
            position: 'Secretary',
            department: 'Administration',
            phoneNumber: formData.Phonenumber || null,
            email: formData.Email,
            hireDate: formData.hireDate || new Date().toISOString().split('T')[0],
            status: formData.status || 'Active',
            nin: formData.nin || null,
            BaseSalary: formData.BaseSalary || null,
            // We don't link userId to Staff because Staff is standalone
          }, config);
          toast.success(`✅ Secretary ${formData.Fname} created! A staff record was also created for payroll.`);
        }
        // ----- ADMIN (just user) -----
        else {
          toast.success(`✅ ${formData.role} ${formData.Fname} created!`);
        }

        resetForm();
        await fetchUsers(true);
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || "Failed to create user/staff");
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE USER =================
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/users/${userToDelete.id}`, config);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setFormData({
      Fname: "", Lname: "", Email: "", Phonenumber: "", password: "", role: "student",
      nin: "",
      BaseSalary: "",
      studentNumber: "", gender: "", dateOfBirth: "", classId: "",
      parentName: "", parentPhone: "", address: "", nationality: "",
      medicalcondition: "none", Section: "none", status: "Active",
      subjectId: "",
      position: "", department: "", hireDate: "", employeeNumber: "",
      alternativePhone: "", emergencyContactName: "", emergencyContactPhone: "",
      notes: "",
      className: ""
    });
  };

  // ================= FILTER USERS =================
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.Fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // ================= GET ROLE BADGE =================
  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700',
      teacher: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700',
      secretary: 'bg-amber-100 text-amber-700',
      staff: 'bg-indigo-100 text-indigo-700'
    };
    const icons = {
      admin: <Shield className="w-3 h-3" />,
      teacher: <BookOpen className="w-3 h-3" />,
      student: <GraduationCap className="w-3 h-3" />,
      secretary: <Briefcase className="w-3 h-3" />,
      staff: <Users className="w-3 h-3" />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
        {icons[role]}
        {role}
      </span>
    );
  };

  // ================= RENDER =================
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-purple-600" />
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage users, teachers, students, and staff
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => fetchUsers(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= CREATE FORM ================= */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">
              Create {formData.role === 'staff' ? 'Non-Teaching Staff' : formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="secretary">Secretary</option>
                <option value="admin">Admin</option>
                <option value="staff">Non-Teaching Staff</option>
              </select>
            </div>

            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-purple-600" /> Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                  <input type="text" name="Fname" placeholder="First Name" value={formData.Fname} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input type="text" name="Lname" placeholder="Last Name" value={formData.Lname} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" /> Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" name="Email" placeholder="email@example.com" value={formData.Email} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" name="Phonenumber" placeholder="Phone Number" value={formData.Phonenumber} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* ========== NIN FIELD ========== */}
            {(formData.role === 'teacher' || formData.role === 'staff' || formData.role === 'secretary') && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-red-600" /> National ID (NIN)
                </h3>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="nin" placeholder="Enter National ID Number" value={formData.nin} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm" />
                </div>
                <p className="text-xs text-gray-400 mt-1">National Identification Number (e.g., CM1234567890A1)</p>
              </div>
            )}

            {/* ========== BASE SALARY – FOR TEACHER, SECRETARY, STAFF ========== */}
            {(formData.role === 'teacher' || formData.role === 'secretary' || formData.role === 'staff') && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Base Salary
                </h3>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    name="BaseSalary"
                    placeholder="e.g., 1200000"
                    value={formData.BaseSalary}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Monthly base salary in UGX (e.g., 1200000)</p>
              </div>
            )}

            {/* ========== PASSWORD FIELD (hidden for staff) ========== */}
            {formData.role !== 'staff' && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-600" /> Security
                </h3>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange}
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" required={formData.role !== 'student'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.role === 'student' && (
                  <p className="text-xs text-blue-500 mt-1">Students get auto-generated password: email username + "123"</p>
                )}
              </div>
            )}

            {/* ========== STUDENT FIELDS ========== */}
            {formData.role === 'student' && (
              <div className="space-y-4">
                {/* Student Info */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Student Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Number *</label>
                      <input type="text" name="studentNumber" placeholder="e.g., STU-2024-001" value={formData.studentNumber} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                      <select name="classId" value={formData.classId} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white" required>
                        <option value="">Select Class</option>
                        {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.className}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white">
                        <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
                      <select name="Section" value={formData.Section} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white">
                        <option value="">Select</option><option value="Day">Day</option><option value="Boarding">Boarding</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationality</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" name="nationality" placeholder="e.g., Ugandan" value={formData.nationality} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                      <select name="status" value={formData.status} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white">
                        <option value="Active">Active</option><option value="Inactive">Inactive</option>
                        <option value="Graduated">Graduated</option><option value="Transferred">Transferred</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical Condition</label>
                      <div className="relative">
                        <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select name="medicalcondition" value={formData.medicalcondition} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white">
                          <option value="none">None</option><option value="allergy">Allergy</option>
                          <option value="asthma">Asthma</option><option value="diabetes">Diabetes</option>
                          <option value="epilepsy">Epilepsy</option><option value="sicklecell">Sickle Cell</option>
                          <option value="heartcondition">Heart Condition</option><option value="visualImpairment">Visual</option>
                          <option value="hearingImpairement">Hearing</option><option value="physicalDisability">Physical</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent/Guardian */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Parent/Guardian Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent/Guardian Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" name="parentName" placeholder="Parent/Guardian Name" value={formData.parentName} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent/Guardian Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="tel" name="parentPhone" placeholder="Parent Phone" value={formData.parentPhone} onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4" /> Address Information
                  </h3>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea name="address" placeholder="Full Address" value={formData.address} onChange={handleChange}
                      rows="2" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm resize-none" />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Students use email username + "123" as default password
                  </p>
                </div>
              </div>
            )}

            {/* ========== TEACHER FIELDS ========== */}
            {formData.role === 'teacher' && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-700">Teacher Assignment</h3>
                  <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                    {subjects.length} subjects available
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Class *</label>
                  <select name="classId" value={formData.classId} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white" required>
                    <option value="">Select Class</option>
                    {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Subject *</label>
                  <select name="subjectId" value={formData.subjectId} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white" required>
                    <option value="">Select Subject</option>
                    {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.subjectName}</option>)}
                  </select>
                </div>
                <div className="text-xs text-blue-500 bg-blue-50 p-2 rounded-lg border border-blue-100">
                  💡 Teacher will be assigned to <strong>{classes.find(c => c.id === parseInt(formData.classId))?.className || 'No class'}</strong> teaching <strong>{subjects.find(s => s.id === parseInt(formData.subjectId))?.subjectName || 'No subject'}</strong>
                </div>
              </div>
            )}

            {/* ========== STAFF (NON-TEACHING) FIELDS ========== */}
            {formData.role === 'staff' && (
              <div className="space-y-4">
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h3 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Staff Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Position *</label>
                      <input type="text" name="position" placeholder="e.g., Accountant, Warden" value={formData.position} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                      <input type="text" name="department" placeholder="e.g., Finance, Kitchen" value={formData.department} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Hire Date</label>
                      <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee Number (optional)</label>
                      <input type="text" name="employeeNumber" placeholder="e.g., STF-0001" value={formData.employeeNumber} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                      <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Alternative Phone</label>
                      <input type="tel" name="alternativePhone" placeholder="Alternative phone" value={formData.alternativePhone} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                      <select name="status" value={formData.status} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name</label>
                      <input type="text" name="emergencyContactName" placeholder="Name" value={formData.emergencyContactName} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
                      <input type="tel" name="emergencyContactPhone" placeholder="Phone" value={formData.emergencyContactPhone} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea name="notes" placeholder="Additional notes..." value={formData.notes} onChange={handleChange}
                    rows="2" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-sm resize-none" />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><UserPlus className="w-4 h-4" /> Create {formData.role === 'staff' ? 'Staff' : formData.role}</>}
            </button>
          </form>
        </div>

        {/* ================= USER LIST ================= */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-800">Users ({filteredUsers.length})</h2>
            </div>
            <button onClick={() => fetchUsers(true)} className="p-2 hover:bg-gray-100 rounded-lg transition" title="Refresh">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
            </div>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="secretary">Secretary</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {/* User List */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {isLoadingUsers ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-purple-500 animate-spin" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No users found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr><th className="text-left p-3 font-medium text-gray-500">User</th><th className="text-left p-3 font-medium text-gray-500">Email</th><th className="text-left p-3 font-medium text-gray-500">Role</th><th className="text-center p-3 font-medium text-gray-500">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.Fname?.charAt(0) || 'U'}
                          </div>
                          <div><span className="font-medium">{user.Fname} {user.Lname}</span><p className="text-xs text-gray-400">{user.Email}</p></div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 truncate max-w-[150px]">{user.Email}</td>
                      <td className="p-3">{getRoleBadge(user.role)}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete User</h3>
              <p className="text-gray-500 text-sm mb-4">Are you sure you want to delete <span className="font-semibold text-gray-700">{userToDelete.Fname}</span>? This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
                <button onClick={handleDeleteUser} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateUser;