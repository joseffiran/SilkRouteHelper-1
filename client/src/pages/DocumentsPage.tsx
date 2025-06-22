import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertCircle, Package } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function DocumentsPage() {
  const { user } = useAuth();

  const { data: shipments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/v1/shipments/"],
    enabled: !!user,
  });

  // Extract all documents from all shipments
  const allDocuments = shipments.flatMap(shipment => 
    (shipment.documents || []).map((doc: any) => ({
      ...doc,
      shipmentName: shipment.name,
      shipmentId: shipment.id
    }))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "invoice":
        return "Commercial Invoice";
      case "packing_list":
        return "Packing List";
      case "certificate_of_quality":
        return "Certificate of Quality";
      case "customs_declaration":
        return "Customs Declaration";
      case "bill_of_lading":
        return "Bill of Lading";
      case "origin_certificate":
        return "Certificate of Origin";
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              View and manage all uploaded documents across your shipments
            </p>
          </div>
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
        ) : allDocuments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
              <p className="text-gray-500 mb-4">
                Documents will appear here once you upload them to your shipments
              </p>
              <Link href="/shipments">
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-50">
                  <Package className="mr-2 h-3 w-3" />
                  View Shipments
                </Badge>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{document.original_filename}</CardTitle>
                    {getStatusIcon(document.status)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {getDocumentTypeLabel(document.document_type)}
                    </p>
                    <Link href={`/shipments/${document.shipmentId}`}>
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-50">
                        {document.shipmentName}
                      </Badge>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={`text-xs ${getStatusColor(document.status)}`}>
                        {document.status === "processing" ? "Processing" : 
                         document.status === "completed" ? "Completed" : 
                         document.status === "error" ? "Error" : "Uploaded"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Uploaded</span>
                      <span className="text-sm">
                        {format(new Date(document.created_at), "PPP")}
                      </span>
                    </div>
                    {document.extracted_data && Object.keys(document.extracted_data).length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Data Extracted</span>
                        <span className="text-sm text-green-600">
                          {Object.keys(document.extracted_data).length} fields
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}