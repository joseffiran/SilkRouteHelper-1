import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Package, FileText, Clock, CheckCircle, TrendingUp, Users, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Shipment } from "@shared/schema";
import AppLayout from "@/components/AppLayout";

const createShipmentSchema = z.object({
  name: z.string().min(1, "Shipment name is required"),
});

type CreateShipmentData = z.infer<typeof createShipmentSchema>;

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const form = useForm<CreateShipmentData>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      name: "",
    },
  });

  const { data: shipments = [], isLoading } = useQuery<Shipment[]>({
    queryKey: ["/api/v1/shipments/"],
    enabled: !!user,
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (data: CreateShipmentData) => {
      const response = await apiRequest("/api/v1/shipments/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (newShipment: Shipment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/shipments/"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Declaration created",
        description: "Your new shipment has been created. Start by uploading your documents.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shipment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateShipmentData) => {
    createShipmentMutation.mutate(data);
  };

  // Calculate statistics from shipments data
  const stats = useMemo(() => {
    if (!shipments || shipments.length === 0) {
      return { total: 0, processing: 0, completed: 0, this_month: 0 };
    }

    const total = shipments.length;
    const processing = shipments.filter(s => s.status === 'processing').length;
    const completed = shipments.filter(s => s.status === 'completed').length;
    const this_month = shipments.filter(s => {
      const shipmentDate = new Date(s.createdAt);
      const now = new Date();
      return shipmentDate.getMonth() === now.getMonth() && 
             shipmentDate.getFullYear() === now.getFullYear();
    }).length;

    return { total, processing, completed, this_month };
  }, [shipments]);

  const recentShipments = shipments.slice(0, 3);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back, {user?.companyName || 'User'}
            </h1>
            <p className="text-muted-foreground">
              Manage your customs declarations and track shipment progress
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-5 w-5" />
                New Declaration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Declaration</DialogTitle>
                <DialogDescription>
                  Start a new customs declaration by creating a shipment. You'll be able to upload documents in the next step.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipment Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Electronics from China - January 2025" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createShipmentMutation.isPending}>
                      {createShipmentMutation.isPending ? "Creating..." : "Create & Upload Documents"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All time declarations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                Ready for download
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.this_month}</div>
              <p className="text-xs text-muted-foreground">
                New declarations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Shipments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Shipments</CardTitle>
                <Link href="/shipments">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentShipments.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No shipments yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                    Create your first declaration
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentShipments.map((shipment) => (
                    <Link key={shipment.id} href={`/shipments/${shipment.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">{shipment.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(shipment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shipment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            shipment.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shipment.status === 'processing' ? 'Processing' : 
                             shipment.status === 'completed' ? 'Completed' : 'Draft'}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <Plus className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Create New Declaration</div>
                      <div className="text-xs text-gray-500">Start processing a new shipment</div>
                    </div>
                  </div>
                </Button>

                <Link href="/documents">
                  <Button 
                    className="w-full justify-start h-auto p-4"
                    variant="outline"
                  >
                    <div className="flex items-center">
                      <FileText className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">View All Documents</div>
                        <div className="text-xs text-gray-500">Browse uploaded documents</div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link href="/reports">
                  <Button 
                    className="w-full justify-start h-auto p-4"
                    variant="outline"
                  >
                    <div className="flex items-center">
                      <TrendingUp className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">View Reports</div>
                        <div className="text-xs text-gray-500">Analytics and insights</div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        {stats.total === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Getting Started with SilkRoute OS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-blue-800">
                  Welcome to SilkRoute OS! Follow these simple steps to create your first customs declaration:
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium text-blue-900">Create Shipment</p>
                      <p className="text-sm text-blue-700">Start by creating a new declaration</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium text-blue-900">Upload Documents</p>
                      <p className="text-sm text-blue-700">Add your commercial invoice and packing list</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium text-blue-900">Review & Download</p>
                      <p className="text-sm text-blue-700">AI extracts data, you review and download</p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Get Started Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}