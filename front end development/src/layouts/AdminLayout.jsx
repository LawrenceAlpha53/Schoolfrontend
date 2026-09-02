// AdminLayout.jsx - WITH LOGOUT
import Sidebar from "../components/Sidebar";
import Header from "./Header";
import TopBar from "../components/TopBar";
import IntelligencePanel from "../components/IntelligencePanel";
import { Outlet, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Show confirmation
    if (window.confirm("Are you sure you want to logout?")) {
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      toast.success("Logged out successfully!");
      
      // Navigate to login
      navigate('/');
    }
  };

  return (
   
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex">
 
      {/* LEFT SIDEBAR - Fixed width */}
      <div className="w-64 lg:w-72 shrink-0 h-full border-r border-slate-200 bg-white flex flex-col">
        <Sidebar />
        
        {/* Logout Button at bottom of sidebar */}
        <div className="mt-auto p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-all duration-200 group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* CENTER AREA */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* TOPBAR - Fixed height */}
        <div className="shrink-0 h-16 bg-white border-b border-slate-200">
          <TopBar />
        </div>

        {/* CONTENT - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          <Outlet />
        </div>

      </div>

      {/* RIGHT PANEL - Fixed width */}
      <div className="w-80 shrink-0 h-full border-l border-slate-200 bg-white overflow-y-auto">
        <IntelligencePanel />
      </div>

    </div>
  );
};

export default AdminLayout;