import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import AdminLoginPage from "@/pages/AdminLoginPage";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Debug logging
  console.log("AdminRoute - User:", user);
  console.log("AdminRoute - IsLoading:", isLoading);
  console.log("AdminRoute - Is Superuser:", user?.is_superuser);

  // Handle non-admin user redirection in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && user && !user.is_superuser) {
      console.log("Redirecting non-admin user to dashboard");
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not logged in, show admin login
  if (!user) {
    console.log("No user found, showing admin login");
    return <AdminLoginPage />;
  }

  // If logged in but not admin, show loading while redirecting
  if (!user.is_superuser) {
    console.log("User is not superuser, showing loading while redirecting");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If admin user, show admin content
  console.log("Admin user confirmed, showing admin content");
  return <>{children}</>;
}