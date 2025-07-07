import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Settings, 
  FileText, 
  Trash2, 
  Edit, 
  Eye,
  Copy,
  Download,
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Document Type Schema
const documentTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  file_extensions: z.array(z.string()).min(1, "At least one file extension required"),
  ocr_config: z.object({
    language: z.string().default("auto"),
    preprocessing: z.boolean().default(true),
    confidence_threshold: z.number().min(0).max(1).default(0.8),
  }),
  validation_rules: z.array(z.object({
    field_name: z.string(),
    rule_type: z.enum(["required", "pattern", "length", "range"]),
    rule_value: z.string(),
  })).optional(),
  is_active: z.boolean().default(true),
});

type DocumentType = z.infer<typeof documentTypeSchema>;

interface DocumentTypeManagerProps {
  onDocumentTypeSelect?: (documentType: DocumentType) => void;
}

export default function DocumentTypeManager({ onDocumentTypeSelect }: DocumentTypeManagerProps) {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for creating/editing document types
  const form = useForm<DocumentType>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      file_extensions: [".pdf"],
      ocr_config: {
        language: "auto",
        preprocessing: true,
        confidence_threshold: 0.8,
      },
      validation_rules: [],
      is_active: true,
    },
  });

  // Fetch document types
  const { data: documentTypes = [], isLoading } = useQuery<DocumentType[]>({
    queryKey: ["/api/document-types"],
  });

  // Create document type mutation
  const createDocumentType = useMutation({
    mutationFn: (data: DocumentType) => apiRequest("/api/document-types", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-types"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Document type created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create document type",
        variant: "destructive",
      });
    },
  });

  // Update document type mutation
  const updateDocumentType = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DocumentType> }) =>
      apiRequest(`/api/document-types/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-types"] });
      toast({
        title: "Success",
        description: "Document type updated successfully",
      });
    },
  });

  // Delete document type mutation
  const deleteDocumentType = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/document-types/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-types"] });
      toast({
        title: "Success",
        description: "Document type deleted successfully",
      });
    },
  });

  const handleSubmit = (data: DocumentType) => {
    createDocumentType.mutate(data);
  };

  const predefinedCategories = [
    "customs",
    "shipping",
    "invoice",
    "contract",
    "certificate",
    "permit",
    "identification",
    "financial",
    "legal",
    "other"
  ];

  const supportedLanguages = [
    { value: "auto", label: "Auto-detect" },
    { value: "rus+eng", label: "Russian + English" },
    { value: "uzb+eng", label: "Uzbek + English" },
    { value: "eng", label: "English only" },
    { value: "rus", label: "Russian only" },
    { value: "multi", label: "Multi-language" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Type Configuration</h2>
          <p className="text-muted-foreground">
            Configure document types for universal processing and OCR optimization
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Document Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Document Type</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Russian Customs Declaration" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {predefinedCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe this document type and its use case..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ocr_config.language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OCR Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {supportedLanguages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ocr_config.confidence_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confidence Threshold</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            placeholder="0.8"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDocumentType.isPending}>
                    {createDocumentType.isPending ? "Creating..." : "Create Document Type"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Document Types</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading document types...</div>
          ) : documentTypes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Document Types</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first document type to begin universal processing
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create Document Type
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {documentTypes.map((docType: any) => (
                <Card 
                  key={docType.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedDocumentType?.id === docType.id 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedDocumentType(docType);
                    onDocumentTypeSelect?.(docType);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{docType.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={docType.is_active ? "default" : "secondary"}>
                          {docType.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{docType.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">OCR Language:</span>
                        <div className="font-medium">{docType.ocr_config?.language || "auto"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <div className="font-medium">{((docType.ocr_config?.confidence_threshold || 0.8) * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Extensions:</span>
                        <div className="font-medium">{docType.file_extensions?.join(", ") || ".pdf"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rules:</span>
                        <div className="font-medium">{docType.validation_rules?.length || 0} rules</div>
                      </div>
                    </div>
                    
                    {docType.description && (
                      <p className="text-muted-foreground mt-3 text-sm">
                        {docType.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Categories</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organize document types by category for better management
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {predefinedCategories.map((category) => {
                  const count = documentTypes.filter((dt: any) => dt.category === category).length;
                  return (
                    <div 
                      key={category}
                      className="p-4 border rounded-lg text-center hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="font-medium capitalize">{category}</div>
                      <div className="text-sm text-muted-foreground">{count} types</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Universal Processing Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Global configuration for document type processing
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default OCR Language</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Default Confidence Threshold</Label>
                  <Input type="number" min="0" max="1" step="0.1" defaultValue="0.8" />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Processing Statistics</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{documentTypes.length}</div>
                    <div className="text-sm text-muted-foreground">Document Types</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {documentTypes.filter((dt: any) => dt.is_active).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Types</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {new Set(documentTypes.map((dt: any) => dt.category)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}