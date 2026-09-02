import DaboardCards from "../Components/DasboardCards";
// import Analyticschart from "../components/Analyticschart";
import RecentActivities from "../Components/RecentActivities";
import QuickActions from "../components/QuickActions";
// import AIInsight from "../components/Allnsight";

const AdminDashboard = () => {
  return (
    <div className="space-y-6 w-full min-w-0">

      <DaboardCards />

      <QuickActions />

      <div className="w-full overflow-hidden min-w-0">
        {/* <Analyticschart /> */}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full min-w-0">

        <div className="w-full min-w-0 ">
          <RecentActivities />
        </div>

        <div className="w-full min-w-0 overflow-hidden">
          {/* <AIInsight /> */}
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;