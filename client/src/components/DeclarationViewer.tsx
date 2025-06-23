import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeclarationData {
  success: boolean;
  declaration_text: string;
  extracted_fields: Record<string, any>;
  template_type: string;
  generated_at: string;
  confidence_score: number;
}

interface DeclarationViewerProps {
  declaration: DeclarationData;
  documentName?: string;
}

export function DeclarationViewer({ declaration, documentName }: DeclarationViewerProps) {
  const { toast } = useToast();

  if (!declaration.success) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Declaration Generation Failed
          </CardTitle>
          <CardDescription>
            Unable to generate declaration from {documentName || "document"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(declaration.declaration_text);
      toast({
        title: "Copied to clipboard",
        description: "Declaration text has been copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadDeclaration = () => {
    const blob = new Blob([declaration.declaration_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `declaration_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Declaration downloaded",
      description: "Declaration has been saved to your downloads",
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceText = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-4">
      {/* Header with status and actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Russian Customs Declaration Generated</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`${getConfidenceColor(declaration.confidence_score)} text-white`}
              >
                {getConfidenceText(declaration.confidence_score)} Confidence ({Math.round(declaration.confidence_score * 100)}%)
              </Badge>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadDeclaration}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          <CardDescription>
            Generated from {documentName || "uploaded document"} • {declaration.template_type} • {new Date(declaration.generated_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Extracted fields summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extracted Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {declaration.extracted_fields.declaration_number && (
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Declaration Number</dt>
                <dd className="mt-1 font-mono text-sm">{declaration.extracted_fields.declaration_number}</dd>
              </div>
            )}
            
            {declaration.extracted_fields.edn_number && (
              <div>
                <dt className="font-medium text-sm text-muted-foreground">EDN Number</dt>
                <dd className="mt-1 font-mono text-sm">{declaration.extracted_fields.edn_number}</dd>
              </div>
            )}

            {declaration.extracted_fields.recipient_info?.company_name && (
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Recipient Company</dt>
                <dd className="mt-1 text-sm">{declaration.extracted_fields.recipient_info.company_name}</dd>
              </div>
            )}

            {declaration.extracted_fields.recipient_info?.inn && (
              <div>
                <dt className="font-medium text-sm text-muted-foreground">INN</dt>
                <dd className="mt-1 font-mono text-sm">{declaration.extracted_fields.recipient_info.inn}</dd>
              </div>
            )}

            {declaration.extracted_fields.goods_info?.code && (
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Goods Code</dt>
                <dd className="mt-1 font-mono text-sm">{declaration.extracted_fields.goods_info.code}</dd>
              </div>
            )}

            {declaration.extracted_fields.goods_info?.value && (
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Invoice Value</dt>
                <dd className="mt-1 font-mono text-sm">{declaration.extracted_fields.goods_info.value}</dd>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Declaration text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Declaration
          </CardTitle>
          <CardDescription>
            Formatted Russian customs declaration ready for submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed max-h-96 overflow-auto">
              {declaration.declaration_text}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}