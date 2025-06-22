import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Package, X } from "lucide-react";
import { Shipment } from "@shared/schema";
import { format } from "date-fns";

interface ShipmentDetailsProps {
  shipment: Shipment;
  onClose: () => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "processing":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

export default function ShipmentDetails({ shipment, onClose }: ShipmentDetailsProps) {
  const extractedData = shipment.extractedData as any;
  const ocrText = extractedData?.ocr_text || "";
  const processedFiles = extractedData?.processed_files || [];

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>{shipment.name}</span>
            <Badge variant={getStatusBadgeVariant(shipment.status)}>
              {shipment.status}
            </Badge>
          </CardTitle>
          <CardDescription className="flex items-center space-x-4 mt-2">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              Created {format(new Date(shipment.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
            </div>
            {shipment.updatedAt !== shipment.createdAt && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                Updated {format(new Date(shipment.updatedAt), "MMMM dd, yyyy 'at' h:mm a")}
              </div>
            )}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Processed Files Section */}
        {processedFiles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Processed Files ({processedFiles.length})
            </h3>
            <div className="space-y-2">
              {processedFiles.map((file: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.file_path.split('/').pop()}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {file.extraction_status} • Text length: {file.text_length} characters
                      </p>
                    </div>
                  </div>
                  <Badge variant={file.extraction_status === 'completed' ? 'default' : 'secondary'}>
                    {file.extraction_status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* OCR Extracted Text Section */}
        {ocrText && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Extracted Text Content</h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">OCR Results</CardTitle>
                <CardDescription>
                  Text extracted from uploaded documents ({ocrText.length} characters)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full rounded-md border p-4">
                  <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                    {ocrText}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!ocrText && processedFiles.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents processed yet</h3>
            <p className="text-muted-foreground">
              Upload documents to this shipment to start OCR processing and see extracted data here.
            </p>
          </div>
        )}

        {/* Shipment Metadata */}
        <Separator />
        <div>
          <h3 className="text-lg font-semibold mb-3">Shipment Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Shipment ID:</span>
              <p className="text-muted-foreground">#{shipment.id}</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <p className="text-muted-foreground">{shipment.status}</p>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <p className="text-muted-foreground">
                {format(new Date((shipment as any).created_at || shipment.createdAt), "MMM dd, yyyy")}
              </p>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <p className="text-muted-foreground">
                {format(new Date((shipment as any).updated_at || shipment.updatedAt), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}