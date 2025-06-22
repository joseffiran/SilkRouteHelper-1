import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Package, FileText, Clock, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Shipment } from "@shared/schema";
import ShipmentCard from "@/components/ShipmentCard";
import ShipmentDetails from "@/components/ShipmentDetails";
import DocumentUpload from "@/components/DocumentUpload";
import AppLayout from "@/components/AppLayout";

const createShipmentSchema = z.object({
  name: z.string().min(1, "Shipment name is required"),
});

type CreateShipmentData = z.infer<typeof createShipmentSchema>;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [uploadingShipment, setUploadingShipment] = useState<Shipment | null>(null);
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

  // Calculate statistics from shipments data
  const stats = useMemo(() => {
    if (!shipments || shipments.length === 0) {
      return { total: 0, processing: 0, completed: 0, this_month: 0 };
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: shipments.length,
      processing: shipments.filter(s => s.status === 'processing').length,
      completed: shipments.filter(s => s.status === 'completed').length,
      this_month: shipments.filter(s => new Date(s.createdAt) >= thisMonth).length
    };
  }, [shipments]);

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (data: CreateShipmentData): Promise<Shipment> => {
      const response = await apiRequest('/api/v1/shipments/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Shipment created",
        description: "New shipment has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/shipments/"] });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create shipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateShipment = (data: CreateShipmentData) => {
    createShipmentMutation.mutate(data);
  };

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
  };

  const handleUploadDocuments = (shipment: Shipment) => {
    setUploadingShipment(shipment);
  };

  // Calculate stats
  const totalShipments = shipments.length;
  const processingShipments = shipments.filter((s: Shipment) => s.status === 'processing').length;
  const completedShipments = shipments.filter((s: Shipment) => s.status === 'completed').length;
  const totalDocuments = shipments.reduce((acc: number, s: Shipment) => {
    const extractedData = s.extractedData as any;
    return acc + (extractedData?.processed_files?.length || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-shipping-fast text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SilkRoute OS</h1>
                <p className="text-xs text-gray-500">Declaration Helper</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-primary font-medium">Dashboard</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Shipments</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Documents</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Reports</a>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <i className="fas fa-bell text-lg"></i>
              </button>
              <div className="relative">
                <button 
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-sm"></i>
                  </div>
                  <span className="hidden md:block font-medium">{user?.companyName}</span>
                  <i className="fas fa-chevron-down text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.companyName}
              </h1>
              <p className="text-gray-600 mt-2">Manage your customs declarations efficiently</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Shipment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Shipment</DialogTitle>
                  <DialogDescription>
                    Create a new shipment to start processing documents and declarations.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateShipment)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipment Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter shipment name..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createShipmentMutation.isPending}>
                        {createShipmentMutation.isPending ? "Creating..." : "Create Shipment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Shipments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalShipments}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shipping-fast text-primary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-500 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-500 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.this_month}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar text-blue-500 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Shipments */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Recent Shipments</CardTitle>
              <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : shipments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-box text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments yet</h3>
                <p className="text-gray-600 mb-4">Create your first shipment to get started</p>
                <Button className="bg-primary hover:bg-primary/90">
                  <i className="fas fa-plus mr-2"></i>
                  Create Shipment
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                              <i className="fas fa-box text-primary text-sm"></i>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{shipment.name}</div>
                              <div className="text-sm text-gray-500">ID: SH-{shipment.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shipment.status === "completed" 
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            <i className={`mr-1 ${
                              shipment.status === "completed" 
                                ? "fas fa-check-circle" 
                                : "fas fa-clock"
                            }`}></i>
                            {shipment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary hover:text-primary/80 mr-3">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
