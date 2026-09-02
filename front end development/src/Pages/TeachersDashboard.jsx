import TeacherDashboardCards from "../components/TeacherDashboardCards";
import TeacherQuickActions from "../components/TeacherQuickActions";
import TeacherAnalytics from "../components/TeacherAnalytics";
import TeacherRecentActivity from "../components/TeacherRecentActivity";

const TeacherDashboard = () => {
  return (
    <div className="space-y-6 w-full min-w-0">

      <TeacherDashboardCards />

      <TeacherQuickActions />

      <TeacherAnalytics />

      <TeacherRecentActivity />

    </div>
  );
};

export default TeacherDashboard;