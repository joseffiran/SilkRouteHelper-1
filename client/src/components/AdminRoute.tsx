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

  // Handle non-admin user redirection in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && user && !user.is_superuser) {
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
    return <AdminLoginPage />;
  }

  // If logged in but not admin, show loading while redirecting
  if (!user.is_superuser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If admin user, show admin content
  return <>{children}</>;
}