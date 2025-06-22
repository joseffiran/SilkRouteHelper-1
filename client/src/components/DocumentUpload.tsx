import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle, Package } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

// Document types as defined in Phase 2 requirements
const REQUIRED_DOCUMENT_TYPES = [
  { key: 'invoice', label: 'Invoice', description: 'Commercial invoice for the shipment' },
  { key: 'packing_list', label: 'Packing List', description: 'Detailed list of package contents' },
  { key: 'certificate_of_quality', label: 'Certificate of Quality', description: 'Quality assurance certificate' },
  { key: 'customs_declaration', label: 'Customs Declaration', description: 'Customs declaration form' },
  { key: 'bill_of_lading', label: 'Bill of Lading', description: 'Shipping document' },
  { key: 'origin_certificate', label: 'Certificate of Origin', description: 'Product origin certification' }
];

interface DocumentUploadProps {
  shipmentId: number;
  onUploadComplete?: () => void;
  existingDocuments?: any[];
}

interface DocumentUploadData {
  documentType: string;
  file: File;
}

export default function DocumentUpload({ shipmentId, onUploadComplete, existingDocuments = [] }: DocumentUploadProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingTypes, setUploadingTypes] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ documentType, file }: DocumentUploadData) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      const response = await fetch(`/api/v1/shipments/${shipmentId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `Document uploaded and processing started`,
      });
      setSelectedFile(null);
      setSelectedDocumentType(null);
      setUploadingTypes(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedDocumentType || '');
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/shipments/'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/shipments', shipmentId] });
      onUploadComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingTypes(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedDocumentType || '');
        return newSet;
      });
    },
  });

  // Check which document types are already uploaded
  const getDocumentStatus = (documentType: string) => {
    const existing = existingDocuments.find(doc => doc.document_type === documentType);
    return existing ? existing.status : 'missing';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Package className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-[#ff0808] text-[#ffffff]">Missing</Badge>;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDirectUpload = (file: File, documentType: string) => {
    setUploadingTypes(prev => new Set(prev).add(documentType));
    uploadMutation.mutate({ documentType, file });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Document Upload
        </CardTitle>
        <CardDescription>
          Upload your required customs documents. Each document type will be processed with OCR for data extraction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Type Checklist */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Required Documents</h3>
          <div className="grid gap-3">
            {REQUIRED_DOCUMENT_TYPES.map((docType) => {
              const status = getDocumentStatus(docType.key);
              const isUploading = uploadMutation.isPending && selectedDocumentType === docType.key;
              
              return (
                <div
                  key={docType.key}
                  className={`p-4 rounded-lg border transition-all ${
                    status === 'completed' ? 'border-green-200 bg-green-50 dark:bg-green-950' :
                    status === 'processing' ? 'border-blue-200 bg-blue-50 dark:bg-blue-950' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">{docType.label}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{docType.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      {getStatusBadge(status)}
                      {status === 'missing' && !uploadingTypes.has(docType.key) && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedDocumentType(docType.key);
                                handleDirectUpload(file, docType.key);
                              }
                            }}
                            className="hidden"
                            id={`file-upload-${docType.key}`}
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="cursor-pointer"
                            onClick={() => {
                              const input = document.getElementById(`file-upload-${docType.key}`) as HTMLInputElement;
                              input?.click();
                            }}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      )}
                      {uploadingTypes.has(docType.key) && (
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-blue-600">Uploading...</div>
                          <Progress value={45} className="w-20" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload Progress Display */}
        {uploadMutation.isPending && (
          <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Uploading and processing document...</span>
              <span>Processing</span>
            </div>
            <Progress value={45} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}