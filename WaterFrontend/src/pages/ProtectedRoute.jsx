import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ page, children }) => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const permissions = JSON.parse(sessionStorage.getItem("permissions") || "[]");

  console.log("DEBUG ProtectedRoute: page=", page, "token=", token, "role=", role, "permissions=", permissions);

  // Not logged in → redirect to login
  if (!token) {
    console.log("DEBUG ProtectedRoute: Redirecting to admin-login because token is missing");
    return <Navigate to="/admin-login" replace />;
  }

  // BIGADMIN ALWAYS HAS FULL ACCESS
  if (role === "bigadmin") {
    console.log("DEBUG ProtectedRoute: Allowing access because user is bigadmin");
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

    console.log("DEBUG ProtectedRoute: Admin does not have permission", page, "redirecting to /home");
    return <Navigate to="/home" replace />;
  }

  // Unknown role → force logout
  console.log("DEBUG ProtectedRoute: Redirecting to admin-login because of unknown role:", role);
  return <Navigate to="/admin-login" replace />;
};

export default ProtectedRoute;
