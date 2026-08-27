import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const StudentRegistration = () => {

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    studentNumber: "",
    fullName: "",
    gender: "",
    dateOfBirth: "",
    classId: "",
    parentName: "",
    parentPhone: "",
    address: "",
    status: "Active",
    nationality: "",
    medicalcondition: "none"
  });

  // ================= FETCH CLASSES =================
  useEffect(() => {

    const fetchClasses = async () => {
      try {

        const token = localStorage.getItem("token");

        // 🔥 IMPORTANT FIX: force correct endpoint
        const res = await api.get("/classes", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log("Classes Loaded:", res.data);

        setClasses(res.data);

      } catch (error) {
        console.log("Class Error:", error);
        toast.error("Failed to load classes");
      }
    };

    fetchClasses();
  }, []);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await api.post("/students", formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Student Registered Successfully");

      setFormData({
        studentNumber: "",
        fullName: "",
        gender: "",
        dateOfBirth: "",
        classId: "",
        parentName: "",
        parentPhone: "",
        address: "",
        status: "Active",
        nationality: "",
        medicalcondition: "none"
      });

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* ================= HEADER (FIXED - IMPORTANT) ================= */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-slate-800">
          Student Registration Form
        </h1>
        <p className="text-slate-500">
          Fill in all required student information before submission
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow">

        {/* ================= BASIC INFO ================= */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Basic Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              name="studentNumber"
              value={formData.studentNumber}
              onChange={handleChange}
              className="border p-3 rounded-xl"
              placeholder="Student Number"
              required
            />

            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="border p-3 rounded-xl"
              placeholder="Full Name"
              required
            />

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="border p-3 rounded-xl"
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="border p-3 rounded-xl"
            />

          </div>
        </div>

        {/* ================= CLASS DROPDOWN (FIXED) ================= */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Select Class
          </h2>

          <select
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            className="border p-3 rounded-xl w-full"
            required
          >
            <option value="">Select Class</option>

            {classes.length > 0 ? (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className}
                </option>
              ))
            ) : (
              <option disabled>Loading classes...</option>
            )}
          </select>
        </div>

        {/* ================= PARENT ================= */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Parent / Guardian
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              className="border p-3 rounded-xl"
              placeholder="Parent Name"
            />

            <input
              name="parentPhone"
              value={formData.parentPhone}
              onChange={handleChange}
              className="border p-3 rounded-xl"
              placeholder="Parent Phone"
            />

          </div>
        </div>

        {/* ================= MEDICAL ================= */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Medical Condition
          </h2>

          <select
            name="medicalcondition"
            value={formData.medicalcondition}
            onChange={handleChange}
            className="border p-3 rounded-xl w-full"
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

        {/* ================= ADDRESS ================= */}
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="border p-3 rounded-xl w-full"
          rows="3"
          placeholder="Address"
        />

        {/* ================= SUBMIT ================= */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white py-4 rounded-xl font-bold"
        >
          {loading ? "Registering..." : "Register Student"}
        </button>

      </form>
    </div>
  );
};

export default StudentRegistration;