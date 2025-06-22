import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, DollarSign, FileText, Plus, Edit, Trash2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/v1/admin/users"],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/v1/admin/templates"],
  });

  const { data: allShipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ["/api/v1/admin/shipments"],
  });

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((user: any) => user.isActive).length;
  const totalShipments = allShipments.length;
  const completedShipments = allShipments.filter((shipment: any) => shipment.status === "completed").length;
  const totalRevenue = totalUsers * 29.99; // Sample pricing
  const monthlyRevenue = totalRevenue;

  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/users"] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user",
      });
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return apiRequest(`/api/v1/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/users"] });
      toast({
        title: "User status updated",
        description: "User status has been successfully updated.",
      });
    },
  });

  if (usersLoading || templatesLoading || shipmentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage users, orders, and system settings
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShipments}</div>
              <p className="text-xs text-muted-foreground">
                {completedShipments} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">
                {templates.filter((t: any) => t.is_active).length} active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users Management</TabsTrigger>
            <TabsTrigger value="orders">Orders Overview</TabsTrigger>
            <TabsTrigger value="templates">Declaration Templates</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.company_name}</div>
                          <div className="text-xs text-gray-400">
                            Joined {format(new Date(user.created_at), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {user.is_superuser && (
                          <Badge variant="destructive">Admin</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus.mutate({ 
                            userId: user.id, 
                            isActive: !user.isActive 
                          })}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser.mutate(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Overview */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All User Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allShipments.map((shipment: any) => (
                    <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{shipment.name}</div>
                        <div className="text-sm text-gray-500">
                          User: {shipment.user_email || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-400">
                          Created {format(new Date(shipment.created_at), "MMM dd, yyyy HH:mm")}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          shipment.status === "completed" ? "default" :
                          shipment.status === "processing" ? "secondary" : "destructive"
                        }
                      >
                        {shipment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Management */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Declaration Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template: any) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-500">
                          {template.fields?.length || 0} fields configured
                        </div>
                        <div className="text-xs text-gray-400">
                          Updated {format(new Date(template.updated_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Analytics */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="text-sm text-gray-500">Total Revenue</div>
                        <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="text-sm text-gray-500">Average per User</div>
                        <div className="text-2xl font-bold">
                          ${totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : "0.00"}
                        </div>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">Subscription Plans</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Basic Plan ($29.99/month)</span>
                          <span>{totalUsers} users</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Premium Plan ($59.99/month)</span>
                          <span>0 users</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}