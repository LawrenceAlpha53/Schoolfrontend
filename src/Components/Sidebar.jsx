import Header from "../layouts/Header";
import { useNavigate, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Send, History,Inbox, Wallet, GraduationCap, BookOpen, School,
  ClipboardList, CreditCard, FileText, CalendarDays, UserCog,
  Settings, Bell, BarChart3, LogOut, Shield, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useSchool } from "../Pages/SchoolContext";   // <-- NEW IMPORT

const Sidebar = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { schoolName, loading } = useSchool();   // <-- GET THE SCHOOL NAME

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "" },
    { title: "Students", icon: Users, path: "students" },
    { title: "Teachers", icon: GraduationCap, path: "teachers" },
    { title: "Classes", icon: School, path: "adminclasses" },
    { title: "Subjects", icon: BookOpen, path: "adminsubjects" },
    { title: "Attendance", icon: ClipboardList, path: "attendances" },
    { title: "Fees", icon: CreditCard, path: "adminfees" },

{ title: "Pay-Roll", icon: CreditCard, path: "admin-payroll" },


{title: "Sms Dashboard", icon: LayoutDashboard, path: "sms-dashboard"},
{title: "Compose Sms", icon:  Send, path: "sms-compose"},
{title: "Sms template", icon: FileText, path: "sms-temsplate"},
{title: "Sms History", icon: History, path: "sms-history"},
{title: "Sms inbox", icon: Inbox, path: "sms-inbox"},
{title: "Sms Balance", icon: Wallet, path: "sms-balance"},
{title: "Bulk-Numbers", icon: Wallet, path: "bulk-phonenumbers"},


    { title: "Reports", icon: FileText, path: "reports" },
    { title: "Timetable", icon: CalendarDays, path: "timetable" },
    { title: "Analytics", icon: BarChart3, path: "analytics" },
    { title: "User Management", icon: UserCog, path: "create-user" },
    { title: "Admin Management", icon: Shield, path: "admin-management" },
    { title: "Notifications", icon: Bell, path: "notificatons" },
    { title: "Settings", icon: Settings, path: "settings" },
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
    <aside
      className={`h-screen bg-white border-r border-gray-200 shadow-xl shadow-gray-200/30 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Logo */}
      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-gray-100`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-200">
            <School className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              {/* DYNAMIC SCHOOL NAME */}
              <h1 className="text-lg font-bold text-red-500 tracking-tight truncate max-w-[200px]">
                {loading ? 'Loading...' : (schoolName || 'SchoolERP')}
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">Admin Control Panel</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <Header />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {!isCollapsed && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
            Main Navigation
          </p>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
              title={isCollapsed ? item.title : ''}
            >
              <div className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              {!isCollapsed && <span className="text-sm">{item.title}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* User & Logout */}
      <div className="border-t border-gray-100 p-3">
        {!isCollapsed && (
          <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                A
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Administrator</h3>
                <p className="text-xs text-gray-400">Full Access</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${
            isCollapsed ? 'justify-center' : 'px-3'
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;