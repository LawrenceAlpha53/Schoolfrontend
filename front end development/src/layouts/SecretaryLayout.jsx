// import Header from './Header';
import { AppSettingsProvider } from '../Components/AppSettingsContext';
import { Outlet, useNavigate } from "react-router-dom";
import SecretarySidebar from "../components/SecretarySidebar";
import SecretaryTopbar from "../components/SecretaryTopbar";
import SecretaryIntelligencePanel from "../components/SecretaryIntelligencePanel";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const SecretaryLayout = () => {
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
    <div className="h-screen bg-slate-100 flex overflow-hidden">
      {/* <Header /> */}

      {/* LEFT SIDEBAR */}
      <div className="w-72 flex-shrink-0 relative">
        <SecretarySidebar />
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

      {/* CENTER AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOPBAR (FIXED SAFE Z-INDEX) */}
        <div className="h-20 flex-shrink-0 relative z-50 bg-white">
          <SecretaryTopbar />
        </div>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 min-w-0">
          <Outlet />
        </main>

      </div>

      {/* RIGHT PANEL */}
      <div className="w-80 flex-shrink-0">
        <SecretaryIntelligencePanel />
      </div>

    </div>
  );
};

export default SecretaryLayout;