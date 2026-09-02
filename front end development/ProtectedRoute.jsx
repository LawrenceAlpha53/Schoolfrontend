// components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        console.log("🔍 ProtectedRoute - Checking auth...");
        console.log("🔍 Token exists:", !!token);
        console.log("🔍 User exists:", !!userStr);

        if (!token || !userStr) {
          console.log("❌ No token or user found");
          setIsAuthenticated(false);
          setUserRole(null);
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        console.log("🔍 User:", user);
        console.log("🔍 User role:", user.role);

        if (!user || !user.role) {
          console.log("❌ Invalid user data");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          setUserRole(null);
          setLoading(false);
          return;
        }

        const role = user.role.toLowerCase();
        setUserRole(role);
        setIsAuthenticated(true);
        console.log("✅ User authenticated, role:", role);

      } catch (error) {
        console.error("❌ Auth check error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to root (login page)
  if (!isAuthenticated) {
    console.log("🔒 Not authenticated, redirecting to login");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    const isRoleAllowed = normalizedAllowedRoles.includes(userRole);
    
    console.log("🔍 Role check:", {
      userRole,
      allowedRoles: normalizedAllowedRoles,
      isAllowed: isRoleAllowed
    });

    // Role not allowed - redirect to unauthorized
    if (!isRoleAllowed) {
      console.log("❌ Role not allowed");
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log("✅ Access granted to:", location.pathname);
  return <Outlet />;
};

export default ProtectedRoute;