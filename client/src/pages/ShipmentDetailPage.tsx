import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import { Link } from "wouter";

interface Document {
  id: number;
  document_type: string;
  original_filename: string;
  status: string;
  extracted_data?: any;
  created_at: string;
  updated_at: string;
}

interface Shipment {
  id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  documents: Document[];
  extracted_data?: any;
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const shipmentId = parseInt(params.id || "0");

  // Poll shipment details every 3 seconds for real-time status updates
  const { data: shipment, isLoading, error } = useQuery({
    queryKey: ['/api/v1/shipments', shipmentId],
    refetchInterval: 3000, // Poll every 3 seconds as specified in Phase 2
    refetchIntervalInBackground: true,
    enabled: !!shipmentId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'uploaded':
        return <Badge variant="outline"><Package className="w-3 h-3 mr-1" />Uploaded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeLabel = (documentType: string) => {
    const typeMap: Record<string, string> = {
      'invoice': 'Commercial Invoice',
      'packing_list': 'Packing List',
      'certificate_of_quality': 'Certificate of Quality',
      'customs_declaration': 'Customs Declaration',
      'bill_of_lading': 'Bill of Lading',
      'origin_certificate': 'Certificate of Origin'
    };
    return typeMap[documentType] || documentType;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-6">
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Shipment Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The shipment you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {shipment.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Shipment ID: #{shipment.id} • Created {new Date(shipment.created_at).toLocaleDateString()}
          </p>
        </div>
        {getStatusBadge(shipment.status)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Document Upload Section */}
        <div className="lg:col-span-1">
          <DocumentUpload 
            shipmentId={shipment.id} 
            existingDocuments={shipment.documents || []}
          />
        </div>

        {/* Document Status List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Status
              </CardTitle>
              <CardDescription>
                Real-time status of uploaded documents and their OCR processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shipment.documents && shipment.documents.length > 0 ? (
                <div className="space-y-4">
                  {shipment.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">
                            {getDocumentTypeLabel(document.document_type)}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {document.original_filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded {new Date(document.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(document.status)}
                        {document.status === 'completed' && document.extracted_data && (
                          <p className="text-xs text-green-600 mt-1">
                            {Object.keys(document.extracted_data).length} fields extracted
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Documents Uploaded
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload your customs documents to get started with OCR processing.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Extracted Data Preview */}
      {shipment.documents && shipment.documents.some(doc => doc.status === 'completed' && doc.extracted_data) && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Data Preview</CardTitle>
              <CardDescription>
                Key information extracted from your uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {shipment.documents
                  .filter(doc => doc.status === 'completed' && doc.extracted_data)
                  .map((document) => (
                    <div key={document.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">
                        {getDocumentTypeLabel(document.document_type)}
                      </h4>
                      <div className="space-y-2">
                        {document.extracted_data && Object.entries(document.extracted_data).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-600 dark:text-gray-400">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span className="ml-2 text-gray-900 dark:text-gray-100">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}