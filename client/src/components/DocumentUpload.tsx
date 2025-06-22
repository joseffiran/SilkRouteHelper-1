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
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
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
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shipments', shipmentId] });
      onUploadComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
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
        return <Badge variant="outline">Missing</Badge>;
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

  const handleSubmit = () => {
    if (selectedFile && selectedDocumentType) {
      uploadMutation.mutate({ documentType: selectedDocumentType, file: selectedFile });
    }
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
              const isSelected = selectedDocumentType === docType.key;
              
              return (
                <div
                  key={docType.key}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 
                    status === 'completed' ? 'border-green-200 bg-green-50 dark:bg-green-950' :
                    'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDocumentType(docType.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{docType.label}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{docType.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Upload Area */}
        {selectedDocumentType && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Upload {REQUIRED_DOCUMENT_TYPES.find(d => d.key === selectedDocumentType)?.label}
            </h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">
                {selectedFile ? selectedFile.name : "Drag and drop your file here"}
              </p>
              <p className="text-gray-500 mb-4">
                or click to browse files
              </p>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  Browse Files
                </Button>
              </Label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={uploadMutation.isPending}
                  className="ml-4"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload & Process"}
                </Button>
              </div>
            )}

            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading and starting OCR processing...</span>
                  <span>Processing</span>
                </div>
                <Progress value={45} className="w-full" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}