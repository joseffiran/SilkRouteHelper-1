import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Package, FileText, Clock, CheckCircle, Truck } from "lucide-react";
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

export default function ShipmentsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
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
        title: "Shipment created",
        description: "Your new shipment has been created successfully.",
      });
      // Navigate to the new shipment for document upload
      setLocation(`/shipments/${newShipment.id}`);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "processing":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
            <p className="text-muted-foreground">
              Manage your shipments and track their declaration status
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Declaration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Declaration</DialogTitle>
                <DialogDescription>
                  Start a new customs declaration by creating a shipment and uploading your documents.
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
                          <Input placeholder="e.g. Electronics from China - January 2025" {...field} />
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
                      {createShipmentMutation.isPending ? "Creating..." : "Create Shipment"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments yet</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first declaration
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Declaration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <Link href={`/shipments/${shipment.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{shipment.name}</CardTitle>
                      {getStatusIcon(shipment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(shipment.createdAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                          {shipment.status === "processing" ? "Processing" : 
                           shipment.status === "completed" ? "Completed" : "Draft"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Documents</span>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span className="text-sm">
                            {(shipment as any).documents?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}