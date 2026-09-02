// SecretaryTopbar.jsx – WITH STAFF NOTIFICATIONS & SEARCH
import {
  Search,
  Bell,
  Mail,
  CalendarDays,
  ChevronDown,
  UserPlus,
  CreditCard,
  GraduationCap,
  Award,
  FileText,
  Clock,
  CheckCircle,
  X,
  Users,
  School,
  BookOpen,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Zap,
  User,
  DollarSign,
  FileSearch,
  ArrowRight,
  Loader2,
  BookMarked,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  Briefcase
} from "lucide-react";

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

// ---------- 24-HOUR FILTER ----------
const isWithinLast24Hours = (timestamp) => {
  if (!timestamp) return true;
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 24;
};

// ---------- LOCALSTORAGE KEYS ----------
const READ_NOTIFICATIONS_KEY = "readNotifications";
const SHOWN_PROGRESS_KEY = "shownProgressNotifications";

const SecretaryTopbar = () => {
  const navigate = useNavigate();
  const today = new Date();
  const currentDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ================= STATE =================
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [showProgressAlert, setShowProgressAlert] = useState(false);
  const [progressAlertMessage, setProgressAlertMessage] = useState("");

  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem(READ_NOTIFICATIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shownProgressIds, setShownProgressIds] = useState(() => {
    try {
      const saved = localStorage.getItem(SHOWN_PROGRESS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allFees, setAllFees] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allStaff, setAllStaff] = useState([]);   // NEW: staff list

  // Refs
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const intervalRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const alertTimeoutRef = useRef(null);

  // ================= SAVE READ NOTIFICATIONS =================
  const saveReadNotifications = (ids) => {
    try {
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids));
      setReadNotificationIds(ids);
    } catch (error) {
      console.error("Error saving read notifications:", error);
    }
  };

  const saveShownProgressIds = (ids) => {
    try {
      localStorage.setItem(SHOWN_PROGRESS_KEY, JSON.stringify(ids));
      setShownProgressIds(ids);
    } catch (e) { /* ignore */ }
  };

  // ================= MARK AS READ =================
  const markNotificationsAsRead = (notificationIds) => {
    const newReadIds = [...new Set([...readNotificationIds, ...notificationIds])];
    saveReadNotifications(newReadIds);

    setAllNotifications((prev) =>
      prev.map((n) => {
        if (notificationIds.includes(n.id)) {
          return { ...n, read: true };
        }
        return n;
      })
    );

    const updatedUnread = allNotifications.filter((n) => !newReadIds.includes(n.id));
    setUnreadNotifications(updatedUnread);
    setUnreadCount(updatedUnread.length);
  };

  const markAllAsRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    markNotificationsAsRead(allIds);
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) setNewActivityCount(0);
  };

  const handleNotificationClick = (notification) => {
    markNotificationsAsRead([notification.id]);
    setShowNotifications(false);

    if (notification.action && notification.action !== "/secretary/dashboard") {
      try {
        navigate(notification.action);
      } catch (error) {
        console.error("Navigation error:", error);
        toast.error("Could not open: " + notification.action);
      }
    } else {
      toast.success("Notification marked as read");
    }
  };

  // ================= LOAD SEARCH DATA =================
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [studentsRes, feesRes, teachersRes, classesRes, staffRes] = await Promise.all([
          api.get("/students", config),
          api.get("/fees", config),
          api.get("/teachers", config),
          api.get("/classes", config),
          api.get("/staff", config),  // NEW: fetch staff
        ]);
        setAllStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
        setAllFees(Array.isArray(feesRes.data) ? feesRes.data : []);
        setAllTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
        setAllClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
        setAllStaff(Array.isArray(staffRes.data) ? staffRes.data : []);
      } catch (error) {
        console.error("Search data load error:", error);
      }
    };
    loadSearchData();
  }, []);

  // ================= PERFORM SEARCH =================
  const performSearch = useCallback(
    (query) => {
      if (!query || query.length < 1) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const searchTerm = query.toLowerCase().trim();
      const results = [];

      const students = Array.isArray(allStudents) ? allStudents : [];
      const fees = Array.isArray(allFees) ? allFees : [];
      const teachers = Array.isArray(allTeachers) ? allTeachers : [];
      const classes = Array.isArray(allClasses) ? allClasses : [];
      const staff = Array.isArray(allStaff) ? allStaff : [];

      // Students
      students.forEach((student) => {
        const name = student.fullName?.toLowerCase() || "";
        const number = student.studentNumber?.toLowerCase() || "";
        const className = student.class?.className?.toLowerCase() || "";

        if (name.includes(searchTerm) || number.includes(searchTerm) || className.includes(searchTerm)) {
          results.push({
            id: student.id,
            type: "student",
            icon: <User className="w-5 h-5 text-blue-500" />,
            title: student.fullName || "Unknown",
            subtitle: `ID: ${student.studentNumber || "N/A"}`,
            details: `${student.class?.className || "No Class"}`,
            path: `/secretary/students/${student.id}`,
            action: "view_student",
            studentId: student.id,
            category: "Student",
          });
        }
      });

      // Fees
      fees.forEach((fee) => {
        const studentName = fee.student?.fullName?.toLowerCase() || "";
        const studentNumber = fee.student?.studentNumber?.toLowerCase() || "";

        if (studentName.includes(searchTerm) || studentNumber.includes(searchTerm)) {
          results.push({
            id: fee.id,
            type: "fee",
            icon: <DollarSign className="w-5 h-5 text-green-500" />,
            title: fee.student?.fullName || "Unknown Student",
            subtitle: `Amount: ${formatUGX(fee.amountPaid || 0)}`,
            details: `Term: ${fee.term || "N/A"}`,
            path: `/secretary/fees`,
            action: "view_fee",
            feeId: fee.id,
            category: "Payment",
          });
        }
      });

      // Teachers
      teachers.forEach((teacher) => {
        const name = teacher.fullName?.toLowerCase() || "";
        const email = teacher.email?.toLowerCase() || "";
        const phone = teacher.phoneNumber || "";

        if (name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm)) {
          results.push({
            id: teacher.id,
            type: "teacher",
            icon: <Award className="w-5 h-5 text-orange-500" />,
            title: teacher.fullName || "Unknown Teacher",
            subtitle: `Teacher`,
            details: `Subject: ${teacher.subject?.subjectName || "N/A"}`,
            path: `/secretary/teachers`,
            action: "view_teacher",
            teacherId: teacher.id,
            category: "Teacher",
          });
        }
      });

      // Classes
      classes.forEach((cls) => {
        const name = cls.className?.toLowerCase() || "";
        const teacher = cls.classTeacher?.toLowerCase() || "";

        if (name.includes(searchTerm) || teacher.includes(searchTerm)) {
          results.push({
            id: cls.id,
            type: "class",
            icon: <School className="w-5 h-5 text-purple-500" />,
            title: cls.className || "Unknown Class",
            subtitle: `Class`,
            details: `Teacher: ${cls.classTeacher || "N/A"}`,
            path: `/secretary/classes`,
            action: "view_class",
            classId: cls.id,
            category: "Class",
          });
        }
      });

      // ===== NEW: STAFF =====
      staff.forEach((staffMember) => {
        const name = staffMember.fullName?.toLowerCase() || "";
        const position = staffMember.position?.toLowerCase() || "";
        const department = staffMember.department?.toLowerCase() || "";
        const phone = staffMember.phoneNumber || "";
        const email = staffMember.email?.toLowerCase() || "";

        if (name.includes(searchTerm) || position.includes(searchTerm) || 
            department.includes(searchTerm) || phone.includes(searchTerm) || 
            email.includes(searchTerm)) {
          results.push({
            id: staffMember.id,
            type: "staff",
            icon: <Briefcase className="w-5 h-5 text-indigo-500" />,
            title: staffMember.fullName || "Unknown Staff",
            subtitle: `${staffMember.position || "Staff"} · ${staffMember.department || "General"}`,
            details: `ID: ${staffMember.employeeNumber || "N/A"}`,
            path: `/secretary/staff/${staffMember.id}`,
            action: "view_staff",
            staffId: staffMember.id,
            category: "Staff",
          });
        }
      });

      const limitedResults = results.slice(0, 10);
      setSearchResults(limitedResults);
      setShowSearchResults(limitedResults.length > 0);
      setIsSearching(false);
    },
    [allStudents, allFees, allTeachers, allClasses, allStaff]
  );

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 200);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);

    if (result.action === "view_student") {
      navigate(`/secretary/students/${result.studentId}`);
    } else if (result.action === "view_fee") {
      navigate(`/secretary/fees/${result.feeId}`);
    } else if (result.action === "view_teacher") {
      navigate(`/secretary/teachers/${result.teacherId}`);
    } else if (result.action === "view_class") {
      navigate(`/secretary/classes/${result.classId}`);
    } else if (result.action === "view_staff") {
      navigate(`/secretary/staff/${result.staffId}`);
    } else {
      navigate(result.path);
    }
  };

  // ================= FORMAT HELPERS =================
  const formatUGX = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "UGX 0";
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
  };

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const currentReadIds = readNotificationIds;

      // 1. System notifications
      let systemNotifications = [];
      try {
        const notifRes = await api.get("/notifications/my", config);
        const fetched = Array.isArray(notifRes.data) ? notifRes.data : notifRes.data?.data || [];
        systemNotifications = fetched
          .filter((n) => isWithinLast24Hours(n.createdAt))
          .map((n) => ({
            id: n.id,
            type: n.type || "system",
            icon: getIconForType(n.type),
            title: n.title || "Notification",
            message: n.message || "",
            time: n.createdAt || new Date(),
            timestamp: new Date(n.createdAt || new Date()).getTime(),
            read: currentReadIds.includes(n.id),
            action: n.actionLink || "/secretary/dashboard",
            actionLabel: n.actionLabel || "View",
            creator: n.creator?.Fname || "System",
          }));
      } catch (err) {
        console.warn("System notif fetch error:", err);
      }

      // 2. Local data
      const [studentsRes, feesRes, teachersRes, marksRes, classesRes, staffRes] = await Promise.all([
        api.get("/students", config),
        api.get("/fees", config),
        api.get("/teachers", config),
        api.get("/marks", config),
        api.get("/classes", config),
        api.get("/staff", config),  // NEW
      ]);

      const extractData = (res) => {
        const d = res?.data;
        if (Array.isArray(d)) return d;
        if (d?.data && Array.isArray(d.data)) return d.data;
        if (d?.success === true && Array.isArray(d?.data)) return d.data;
        return [];
      };

      const students = extractData(studentsRes);
      const fees = extractData(feesRes);
      const teachers = extractData(teachersRes);
      const marks = extractData(marksRes);
      const classes = extractData(classesRes);
      const staff = extractData(staffRes);

      const localNotifications = [];

      // Students (24h)
      students.slice(0, 5).forEach((student) => {
        const createdAt = student.createdAt || student.created_at || new Date();
        if (isWithinLast24Hours(createdAt)) {
          const id = `student-${student.id}`;
          localNotifications.push({
            id,
            type: "student",
            icon: <UserPlus className="w-5 h-5 text-blue-500" />,
            title: "🎓 New Student Registered",
            message: `${student.fullName || "Student"} has been registered in ${student.class?.className || "School"}`,
            time: createdAt,
            timestamp: new Date(createdAt).getTime(),
            read: currentReadIds.includes(id),
            action: `/secretary/students/${student.id}`,
            actionLabel: "View Student",
          });
        }
      });

      // Fees (24h)
      fees.slice(0, 5).forEach((fee) => {
        const paid = Number(fee.amountPaid || fee.amount_paid || fee.paid || 0);
        const createdAt = fee.createdAt || fee.created_at || fee.paymentDate || new Date();
        if (isWithinLast24Hours(createdAt) && paid > 0) {
          const id = `fee-${fee.id}`;
          const studentName = fee.student?.fullName || fee.student_name || "Student";
          localNotifications.push({
            id,
            type: "fee",
            icon: <CreditCard className="w-5 h-5 text-purple-500" />,
            title: "💰 Fee Payment Received",
            message: `${formatUGX(paid)} payment received from ${studentName}`,
            time: createdAt,
            timestamp: new Date(createdAt).getTime(),
            read: currentReadIds.includes(id),
            action: `/secretary/fees`,
            actionLabel: "View Payment",
          });
        }
      });

      // Teachers (24h)
      teachers.slice(0, 3).forEach((teacher) => {
        const createdAt = teacher.createdAt || teacher.created_at || new Date();
        if (isWithinLast24Hours(createdAt)) {
          const id = `teacher-${teacher.id}`;
          localNotifications.push({
            id,
            type: "teacher",
            icon: <Award className="w-5 h-5 text-orange-500" />,
            title: "👨‍🏫 New Teacher Joined",
            message: `${teacher.fullName || "Teacher"} has joined as a teacher`,
            time: createdAt,
            timestamp: new Date(createdAt).getTime(),
            read: currentReadIds.includes(id),
            action: `/secretary/teachers`,
            actionLabel: "View Teacher",
          });
        }
      });

      // ===== NEW: STAFF (24h) =====
      staff.slice(0, 3).forEach((staffMember) => {
        const createdAt = staffMember.createdAt || staffMember.created_at || new Date();
        if (isWithinLast24Hours(createdAt)) {
          const id = `staff-${staffMember.id}`;
          localNotifications.push({
            id,
            type: "staff",
            icon: <Briefcase className="w-5 h-5 text-indigo-500" />,
            title: "👤 New Staff Member Added",
            message: `${staffMember.fullName || "Staff"} (${staffMember.position || "Position"}) has been added to ${staffMember.department || "General"}`,
            time: createdAt,
            timestamp: new Date(createdAt).getTime(),
            read: currentReadIds.includes(id),
            action: `/secretary/staff/${staffMember.id}`,
            actionLabel: "View Staff",
          });
        }
      });

      // ====== PROGRESS NOTIFICATIONS (unchanged) ======
      const progressNotifications = [];

      if (teachers.length > 0 && marks.length > 0) {
        const studentClassMap = {};
        students.forEach((s) => {
          studentClassMap[s.id] = s.classId;
        });

        teachers.forEach((teacher) => {
          const teacherId = teacher.id;
          const teacherMarks = marks.filter((m) => String(m.teacherId) === String(teacherId));
          const classId = teacher.classId;
          const classStudents = students.filter((s) => s.classId === classId);
          const totalStudents = classStudents.length;

          const studentsWithMarks = new Set();
          teacherMarks.forEach((m) => {
            if (m.studentId) studentsWithMarks.add(String(m.studentId));
          });
          const submittedCount = studentsWithMarks.size;

          const completionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
          const pendingCount = totalStudents - submittedCount;

          if (totalStudents > 0) {
            if (completionRate === 100) {
              const id = `progress-complete-${teacherId}`;
              const message = `🎉 ${teacher.fullName} has finished marking all ${totalStudents} students!`;
              progressNotifications.push({
                id,
                type: "progress",
                icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                title: "✅ Teacher Marks Complete",
                message,
                time: new Date(),
                timestamp: Date.now(),
                read: currentReadIds.includes(id),
                action: "/secretary/marks",
                actionLabel: "View Progress",
              });

              if (!currentReadIds.includes(id) && !shownProgressIds.includes(id)) {
                const newShown = [...shownProgressIds, id];
                saveShownProgressIds(newShown);
                toast.success(message, { duration: 5000 });
                setProgressAlertMessage(message);
                setShowProgressAlert(true);
                clearTimeout(alertTimeoutRef.current);
                alertTimeoutRef.current = setTimeout(() => setShowProgressAlert(false), 8000);
              }
            } else if (completionRate >= 75 && completionRate < 100) {
              const id = `progress-near-${teacherId}`;
              const message = `📊 ${teacher.fullName} is almost done! ${submittedCount}/${totalStudents} students marked (${completionRate}%), ${pendingCount} remaining.`;
              progressNotifications.push({
                id,
                type: "progress",
                icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
                title: "📊 Teacher Progress Update",
                message,
                time: new Date(),
                timestamp: Date.now(),
                read: currentReadIds.includes(id),
                action: "/secretary/marks",
                actionLabel: "View Progress",
              });

              if (!currentReadIds.includes(id) && !shownProgressIds.includes(id)) {
                const newShown = [...shownProgressIds, id];
                saveShownProgressIds(newShown);
                toast.success(message, { duration: 5000 });
                setProgressAlertMessage(message);
                setShowProgressAlert(true);
                clearTimeout(alertTimeoutRef.current);
                alertTimeoutRef.current = setTimeout(() => setShowProgressAlert(false), 8000);
              }
            }
          }
        });
      }

      // Merge all
      const allNotifs = [...systemNotifications, ...localNotifications, ...progressNotifications];

      const seenIds = new Set();
      const deduped = allNotifs.filter((n) => {
        if (seenIds.has(n.id)) return false;
        seenIds.add(n.id);
        return true;
      });

      deduped.sort((a, b) => b.timestamp - a.timestamp);

      setAllNotifications(deduped);
      const unread = deduped.filter((n) => !n.read);
      setUnreadNotifications(unread);
      setUnreadCount(unread.length);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error("Notifications Error:", error);
      setIsLoading(false);
    }
  }, [readNotificationIds, shownProgressIds]);

  const getIconForType = (type) => {
    switch (type) {
      case "info":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "announcement":
        return <Megaphone className="w-5 h-5 text-purple-500" />;
      case "staff":
        return <Briefcase className="w-5 h-5 text-indigo-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // ================= POLLING =================
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIconBg = (type) => {
    switch (type) {
      case "student":
        return "bg-blue-50";
      case "marks":
        return "bg-green-50";
      case "fee":
        return "bg-purple-50";
      case "teacher":
        return "bg-orange-50";
      case "system":
        return "bg-emerald-50";
      case "progress":
        return "bg-purple-50";
      case "staff":
        return "bg-indigo-50";
      default:
        return "bg-gray-50";
    }
  };

  // ================= PROGRESS ALERT POPUP =================
  const ProgressAlert = () => {
    if (!showProgressAlert) return null;
    return (
      <div className="fixed top-24 right-4 bg-white rounded-2xl shadow-2xl border border-purple-200 p-4 max-w-sm z-50 animate-slide-in-right">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm">📊 Teacher Progress</p>
            <p className="text-sm text-gray-600 mt-0.5">{progressAlertMessage}</p>
          </div>
          <button
            onClick={() => setShowProgressAlert(false)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setShowProgressAlert(false);
              navigate("/secretary/marks");
            }}
            className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition"
          >
            View Progress
          </button>
          <button
            onClick={() => setShowProgressAlert(false)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  // ================= RENDER =================
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm relative">
      <ProgressAlert />

      {/* LEFT SECTION */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* SEARCH BAR */}
        <div className="relative w-full max-w-md" ref={searchRef}>
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search students, payments, staff, teachers..."
            value={searchQuery}
            onChange={handleSearchInput}
            onFocus={() => {
              if (searchResults.length > 0 && searchQuery.trim()) {
                setShowSearchResults(true);
              }
            }}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />

          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
            </div>
          )}

          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[450px] overflow-hidden z-50">
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {searchResults.length} result{searchResults.length > 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[380px]">
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-none transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-white transition">
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {result.title}
                        </p>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                          {result.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{result.subtitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{result.details}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && searchQuery.trim() && !isSearching && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 text-center z-50">
              <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">No results found for "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-1">
                Try searching for students, payments, staff, or teachers
              </p>
            </div>
          )}
        </div>

        {/* DATE */}
        <div className="hidden xl:flex items-center gap-2 text-slate-500 whitespace-nowrap">
          <CalendarDays size={18} />
          <span className="text-sm">{currentDate}</span>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* MAIL */}
        <button className="relative p-3 rounded-xl hover:bg-slate-100 transition">
          <Mail size={22} className="text-slate-600" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            className="relative p-3 rounded-xl hover:bg-slate-100 transition"
          >
            <Bell size={22} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold px-1.5 animate-pulse">
                {unreadCount}
              </span>
            )}
            {newActivityCount > 0 && unreadCount === 0 && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-ping"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[420px] max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-1">(last 24h)</span>
                </div>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Mark all read
                </button>
              </div>

              <div className="overflow-y-auto max-h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : unreadNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No unread notifications</p>
                    <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition bg-purple-50/30 border-l-4 border-l-purple-500"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(
                          notification.type
                        )}`}
                      >
                        {notification.icon || <Bell className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                          <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5 animate-pulse"></span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(notification.time)}
                          </span>
                          {notification.actionLabel && (
                            <span className="text-xs font-medium text-purple-600">
                              {notification.actionLabel} →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {allNotifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/secretary/notification");
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1 mx-auto"
                  >
                    View all notifications ({allNotifications.length}) →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="flex items-center gap-3 border-l pl-4 cursor-pointer whitespace-nowrap">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            S
          </div>
          <div className="hidden md:block">
            <h4 className="text-sm font-semibold text-gray-800">School Secretary</h4>
            <p className="text-xs text-slate-500">Secretary Account</p>
          </div>
          <ChevronDown size={18} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default SecretaryTopbar;