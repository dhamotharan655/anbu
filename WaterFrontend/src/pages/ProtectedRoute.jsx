import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ page, children }) => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const permissions = JSON.parse(sessionStorage.getItem("permissions") || "[]");

  // Not logged in → redirect to login
  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  // BIGADMIN ALWAYS HAS FULL ACCESS
  if (role === "bigadmin") {
    return children;
  }

  // ADMIN → must have permission
  if (role === "admin") {
    if (!page) {
      return children;
    }

    // Check if user has the main permission
    if (permissions.includes(page)) {
      return children;
    }

    // Special cases: check for related permissions
    if (page === "staff" && permissions.includes("add-staff")) {
      return children;
    }

    return <Navigate to="/home" replace />;
  }

  // Unknown role → force logout
  return <Navigate to="/admin-login" replace />;
};

export default ProtectedRoute;
