// import Header from './Header';
import { AppSettingsProvider } from '../Components/AppSettingsContext';
import { Outlet, useNavigate } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";
import TeacherTopbar from "../components/TeacherTopbar";
import TeacherIntelligencePanel from "../components/TeacherIntelligencePanel";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const TeacherLayout = () => {
  const navigate = useNavigate();

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
    <div className="h-screen bg-slate-100 overflow-hidden">
     {/* <Header /> */}

      {/* LEFT SIDEBAR */}
      <div className="fixed left-0 top-0 w-72 h-screen z-50">
        <TeacherSidebar />
        {/* Logout Button at bottom of sidebar */}
        <div className="absolute bottom-0 left-0 w-72 p-4 border-t border-slate-200 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-all duration-200 group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="fixed right-0 top-0 w-80 h-screen z-40">
        <TeacherIntelligencePanel />
      </div>

      {/* CENTER CONTENT */}
      <div className="ml-72 mr-80 h-screen flex flex-col">

        <div className="h-20 flex-shrink-0 w-full">
          <TeacherTopbar />
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default TeacherLayout;