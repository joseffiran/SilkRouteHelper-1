import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Eye } from "lucide-react";
import { Shipment } from "@shared/schema";
import { format } from "date-fns";

interface ShipmentCardProps {
  shipment: Shipment;
  onViewDetails: (shipment: Shipment) => void;
  onUploadDocuments: (shipment: Shipment) => void;
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

export default function ShipmentCard({ shipment, onViewDetails, onUploadDocuments }: ShipmentCardProps) {
  const hasExtractedData = shipment.extractedData && Object.keys(shipment.extractedData).length > 0;
  const processedFiles = shipment.extractedData?.processed_files?.length || 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{shipment.name}</CardTitle>
          <CardDescription>
            Created {format(new Date(shipment.createdAt), "MMM dd, yyyy")}
          </CardDescription>
        </div>
        <Badge variant={getStatusBadgeVariant(shipment.status)}>
          {shipment.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <FileText className="mr-1 h-4 w-4" />
              {processedFiles} files processed
            </div>
            {hasExtractedData && (
              <div className="flex items-center">
                <Eye className="mr-1 h-4 w-4" />
                Data extracted
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUploadDocuments(shipment)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewDetails(shipment)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}