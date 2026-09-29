import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";
import { PageLoader } from "../components/ui.jsx";

/** Redirects to /login (and back afterwards) when signed out; optional role check. */
export function RequireAuth({ children, role }) {
  const { user, loading, isAdmin, isInstructor } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (role === "admin" && !isAdmin) return <Navigate to="/" replace />;
  if (role === "instructor" && !isInstructor) return <Navigate to="/" replace />;
  return children;
}
