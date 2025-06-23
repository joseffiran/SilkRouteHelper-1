import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, User, LogOut, Settings, Truck } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", current: location === "/dashboard" },
    { name: "Shipments", href: "/shipments", current: location === "/shipments" },
    { name: "Documents", href: "/documents", current: location === "/documents" },
    { name: "Auto-Fill Declaration", href: "/declarations", current: location === "/declarations" },
    { name: "Reports", href: "/reports", current: location === "/reports" },
  ];

  // Add admin navigation for superusers
  const adminNavigation = user?.is_superuser ? [
    { name: "Admin Panel", href: "/admin", current: location.startsWith("/admin") },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/dashboard">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">SilkRoute OS</h1>
                    <p className="text-xs text-gray-500">Declaration Helper</p>
                  </div>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-6">
                {[...navigation, ...adminNavigation].map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={item.current ? "default" : "ghost"}
                      className={`${
                        item.current
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "text-gray-600 hover:text-gray-900"
                      } ${item.name === "Admin Panel" ? "bg-red-50 text-red-700 hover:bg-red-100" : ""}`}
                    >
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side - User menu and notifications */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.email?.substring(0, 2).toUpperCase() || "US"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.companyName || "Company User"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  {user?.is_superuser && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/admin">
                        <DropdownMenuItem className="text-red-600 font-medium">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}