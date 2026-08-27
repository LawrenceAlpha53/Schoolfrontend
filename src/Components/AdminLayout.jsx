import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import IntelligencePanel from "./IntelligencePanel";

const AdminLayout = ({ children }) => {
  return (
    <div className="h-screen w-full bg-slate-100 overflow-hidden">
      
      {/* Main Container */}
      <div className="flex h-full">

        {/* LEFT SIDEBAR */}
        <div className="w-72 shrink-0">
          <Sidebar />
        </div>

        {/* CENTER SECTION */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* TOPBAR */}
          <Topbar />

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>

        </div>

        {/* RIGHT PANEL */}
        <div className="w-80 shrink-0 border-l border-slate-200 bg-white">
          <IntelligencePanel />
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;