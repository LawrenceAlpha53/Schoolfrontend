import SecretaryDashboardCards from "../components/SecretaryDashboardCards";
import SecretaryQuickActions from "../components/SecretaryQuickActions";
import SecretaryAnalytics from "../Components/SecretaryAnalytics";
import SecretaryRecentActivities from "../components/SecretaryRecentActivities";

const SecretaryDashboard = () => {
  return (
    <div className="space-y-6 w-full min-w-0">

      <SecretaryDashboardCards />

      <SecretaryQuickActions />

      <SecretaryAnalytics />

      <SecretaryRecentActivities />

    </div>
  );
};

export default SecretaryDashboard;