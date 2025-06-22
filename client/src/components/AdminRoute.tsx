import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import AdminLoginPage from "@/pages/AdminLoginPage";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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

  // If logged in but not admin, redirect to dashboard
  if (!user.is_superuser) {
    setLocation("/dashboard");
    return null;
  }

  // If admin user, show admin content
  return <>{children}</>;
}