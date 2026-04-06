import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole, requiredPermission }) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = localStorage.getItem("userRole");

  if (requiredRole && userRole && userRole !== requiredRole) {
    if (userRole === "client") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/employees" replace />;
  }

  if (requiredPermission) {
    let permissions = [];
    try {
      permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
    } catch {
      permissions = [];
    }

    if (!permissions.includes(requiredPermission)) {
      if (userRole === "client") {
        return <Navigate to="/dashboard" replace />;
      }
      return <Navigate to="/employees" replace />;
    }
  }

  return children;
}