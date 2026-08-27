import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserPlus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  GraduationCap,
  Users
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // ================= STATE =================
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    studentNumber: "",
    gender: "",
    dateOfBirth: "",
    classId: "",
    parentName: "",
    parentPhone: "",
    address: "",
    status: "",
    medicalcondition: ""
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});

  // ================= FETCH STUDENT DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const [studentRes, classesRes] = await Promise.all([
          api.get(`/students/${id}`, config),
          api.get("/classes", config)
        ]);

        const student = studentRes.data || {};
        const classesData = classesRes.data || [];

        // Set form data
        setFormData({
          fullName: student.fullName || "",
          studentNumber: student.studentNumber || "",
          gender: student.gender || "",
          dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : "",
          classId: student.classId || student.class?.id || "",
          parentName: student.parentName || "",
          parentPhone: student.parentPhone || "",
          address: student.address || "",
          status: student.status || "Active",
          medicalcondition: student.medicalcondition || ""
        });
        
        setOriginalData(student);
        setClasses(Array.isArray(classesData) ? classesData : []);

      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load student data");
        navigate("/secretary/students");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  // ================= HANDLE INPUT CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // ================= VALIDATE FORM =================
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.studentNumber.trim()) {
      newErrors.studentNumber = "Student number is required";
    }
    
    if (!formData.classId) {
      newErrors.classId = "Class is required";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix all errors");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Prepare data for update
      const updateData = {
        fullName: formData.fullName.trim(),
        studentNumber: formData.studentNumber.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null,
        classId: parseInt(formData.classId),
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        address: formData.address.trim(),
        status: formData.status,
        medicalcondition: formData.medicalcondition || null
      };

      await api.put(`/students/${id}`, updateData, config);
      
      toast.success("Student updated successfully!");
      navigate("/secretary/students");
      
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update student");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= CANCEL =================
  const handleCancel = () => {
    navigate("/secretary/students");
  };

  // ================= LOADING STATE =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-purple-600" />
            Edit Student
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Update student information in the system
          </p>
        </div>
      </div>

      {/* ================= FORM ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          
          {/* Personal Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Student Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentNumber"
                  value={formData.studentNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.studentNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., S-2024-001"
                />
                {errors.studentNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.studentNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Academic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.classId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className}
                    </option>
                  ))}
                </select>
                {errors.classId && (
                  <p className="text-xs text-red-500 mt-1">{errors.classId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              Parent/Guardian Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parent Name
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter parent name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parent Phone
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., 0772 123 456"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter residential address"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              Medical Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Medical Condition
              </label>
              <select
                name="medicalcondition"
                value={formData.medicalcondition}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="none">None</option>
                <option value="allergy">Allergy</option>
                <option value="asthma">Asthma</option>
                <option value="diabetes">Diabetes</option>
                <option value="epilepsy">Epilepsy</option>
                <option value="sicklecell">Sickle Cell</option>
                <option value="heartcondition">Heart Condition</option>
                <option value="visualImpairment">Visual Impairment</option>
                <option value="hearingImpairement">Hearing Impairment</option>
                <option value="physicalDisability">Physical Disability</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Student
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudent;