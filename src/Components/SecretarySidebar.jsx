import Header from "../layouts/Header";
import {
  LayoutDashboard, Users, CreditCard, FileText, ClipboardList,
  Bell, Settings, LogOut, CalendarDays, BookOpen, Award,
  BarChart3, MessageSquare, School, ClipboardCheck, GraduationCap,
  Send, Inbox, History, Wallet, MessageCircle
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useSchool } from "../Pages/SchoolContext";   // <-- NEW IMPORT

const SecretarySidebar = () => {
  const navigate = useNavigate();
  const { schoolName } = useSchool();   // <-- GET THE SCHOOL NAME

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/secretary" },
    { name: "Student Records", icon: Users, path: "/secretary/students" },
    { name: "Class Management", icon: School, path: "/secretary/classmanagement" },
    { name: "Subject Management", icon: BookOpen, path: "/secretary/subjectmanagement" },
    { name: "Teacher Management", icon: Award, path: "/secretary/teachermanagement" },
    { name: "Fees Management", icon: CreditCard, path: "/secretary/feesmanagement" },
    { name: "Attendance Tracking", icon: ClipboardCheck, path: "/secretary/attendance" },
    { name: "Reports & Analytics", icon: BarChart3, path: "/secretary/reports" },
    { name: "Report Cards", icon: GraduationCap, path: "/secretary/reports-section" },
    { name: "Communications", icon: MessageSquare, path: "communications" },
    { name: "Timetable", icon: CalendarDays, path: "/secretary/timetable" },
    { name: "SMS Dashboard", icon: LayoutDashboard, path: "/secretary/sms/dashboard" },

    { name: "Compose SMS", icon: Send, path: "/secretary/sms/compose" },
     { name: "Bulk-PhoneNumbers", icon: Send, path: "/secretary/bulk/phonenumbers" },
    
    { name: "SMS Templates", icon: FileText, path: "/secretary/sms/templates" },
    { name: "SMS History", icon: History, path: "/secretary/sms/history" },
    { name: "Requirements", icon: History, path: "requirements" },
    { name: "SMS Inbox", icon: Inbox, path: "/secretary/sms/inbox" },
    { name: "SMS Balance", icon: Wallet, path: "/secretary/sms/balance" },
    { name: "Notifications", icon: Bell, path: "/secretary/notification" },
    { name: "System Settings", icon: Settings, path: "/secretary/settings" },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      toast.success("Logged out successfully!");
      navigate('/');
    }
  };

  return (
    <aside className="h-full bg-white border-r border-slate-200 flex flex-col">
      {/* LOGO */}
      <div className="h-20 flex items-center px-6 border-b">
        <div className="w-12 h-12 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-lg">
          s
        </div>
        <div className="ml-3">
          {/* DYNAMIC SCHOOL NAME */}
          <h2 className="font-bold text-red-500 truncate max-w-[200px]">
            {schoolName || 'Secretary Portal'}
          </h2>
          <p className="text-xs text-slate-500">School Management</p>
        </div>
      </div>
      <Header />
      

      {/* MENU */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default SecretarySidebar;