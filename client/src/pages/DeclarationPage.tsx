import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Zap, CheckCircle, AlertTriangle, Settings, Plus } from "lucide-react";
import DeclarationViewer from "@/components/DeclarationViewer";
import TemplateStudio from "@/components/TemplateStudio";
import DocumentTypeManager from "@/components/DocumentTypeManager";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/AppLayout";

interface Template {
  id: number;
  name: string;
  is_active: boolean;
  field_count: number;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: number;
  fileName: string;
  documentType: string;
  extractedData: any;
  status: string;
  createdAt: string;
}

export default function DeclarationPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<any>({});
  const [activeTab, setActiveTab] = useState("studio");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/v1/declarations/templates'],
  });

  // Fetch user documents
  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['/api/v1/shipments/'],
  });

  // Get all documents from shipments
  const allDocuments = shipments.flatMap((shipment: any) => 
    (shipment.documents || []).map((doc: any) => ({
      ...doc,
      shipmentId: shipment.id,
      shipmentName: shipment.name
    }))
  );

  // Preview empty declaration
  const { data: emptyDeclaration, isLoading: previewLoading } = useQuery({
    queryKey: ['/api/v1/declarations/templates', selectedTemplate, 'preview'],
    enabled: !!selectedTemplate,
  });

  // Generate declaration from document
  const generateDeclaration = useMutation({
    mutationFn: async ({ documentId, templateId }: { documentId: number; templateId: number }) => {
      return apiRequest(`/api/v1/declarations/generate/${documentId}?template_id=${templateId}`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      setExtractedData(data.extracted_data || {});
      setActiveTab("declaration");
      toast({
        title: "Декларация сгенерирована",
        description: `Автоматически заполнено ${data.statistics?.filled_fields || 0} полей из ${data.statistics?.total_fields || 0}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка генерации",
        description: error.message || "Не удалось сгенерировать декларацию",
        variant: "destructive",
      });
    },
  });

  // Test OCR extraction
  const testOCR = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest(`/api/v1/declarations/test-ocr`, {
        method: 'POST',
        body: JSON.stringify({ document_id: documentId }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "OCR тест завершен",
        description: `Извлечено ${data.text_length} символов с точностью ${Math.round((data.confidence || 0) * 100)}%`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка OCR",
        description: error.message || "Не удалось протестировать OCR",
        variant: "destructive",
      });
    },
  });

  const handleGenerateDeclaration = () => {
    if (!selectedDocument || !selectedTemplate) {
      toast({
        title: "Выберите документ и шаблон",
        description: "Для генерации декларации нужно выбрать документ и шаблон",
        variant: "destructive",
      });
      return;
    }

    generateDeclaration.mutate({
      documentId: selectedDocument,
      templateId: selectedTemplate,
    });
  };

  const handleTestOCR = () => {
    if (!selectedDocument) {
      toast({
        title: "Выберите документ",
        description: "Для тестирования OCR нужно выбрать документ",
        variant: "destructive",
      });
      return;
    }

    testOCR.mutate(selectedDocument);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Universal Declaration System</h1>
            <p className="text-muted-foreground">
              Configure templates, process documents, and generate declarations automatically
            </p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Phase 1: Template Studio
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="studio">Template Studio</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="generation">Generation</TabsTrigger>
          </TabsList>

        <TabsContent value="studio" className="space-y-6">
          <TemplateStudio />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentTypeManager />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Доступные Шаблоны Деклараций</CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8">Загрузка шаблонов...</div>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template: Template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {template.field_count} полей
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {template.is_active && (
                            <Badge variant="default">Активный</Badge>
                          )}
                          {selectedTemplate === template.id && (
                            <Badge variant="outline">Выбран</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTemplate && emptyDeclaration && (
            <Card>
              <CardHeader>
                <CardTitle>Предварительный Просмотр</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Пустая форма декларации - будет автоматически заполнена после загрузки документов
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {emptyDeclaration.statistics?.total_fields || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Всего полей</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">0</div>
                    <div className="text-sm text-muted-foreground">Заполнено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {emptyDeclaration.fields?.filter((f: any) => f.required).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Обязательных</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">99%</div>
                    <div className="text-sm text-muted-foreground">Точность OCR</div>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveTab("documents")}
                  className="w-full"
                  disabled={!selectedTemplate}
                >
                  Продолжить к загрузке документов
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ваши Документы</CardTitle>
              <p className="text-sm text-muted-foreground">
                Выберите документ для автоматического заполнения декларации
              </p>
            </CardHeader>
            <CardContent>
              {shipmentsLoading ? (
                <div className="text-center py-8">Загрузка документов...</div>
              ) : allDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Нет загруженных документов. Загрузите документы в разделе "Отправления".
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {allDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDocument === doc.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedDocument(doc.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{doc.fileName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {doc.shipmentName} • {doc.documentType}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={doc.status === "completed" ? "default" : "secondary"}
                          >
                            {doc.status === "completed" ? "Обработан" : "Ожидает"}
                          </Badge>
                          {selectedDocument === doc.id && (
                            <Badge variant="outline">Выбран</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDocument && selectedTemplate && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Готово к генерации</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleTestOCR}
                      variant="outline"
                      disabled={testOCR.isPending}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      {testOCR.isPending ? "Тестируем..." : "Тест OCR"}
                    </Button>
                    <Button
                      onClick={handleGenerateDeclaration}
                      disabled={generateDeclaration.isPending}
                      className="gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      {generateDeclaration.isPending ? "Генерируем..." : "Генерировать Декларацию"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="declaration" className="space-y-4">
          {selectedTemplate && emptyDeclaration ? (
            <DeclarationViewer
              extractedData={extractedData}
              templateName={emptyDeclaration.template_name}
              editable={true}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Декларация не сгенерирована</h3>
                <p className="text-muted-foreground mb-4">
                  Сначала выберите шаблон и документ, затем нажмите "Генерировать Декларацию"
                </p>
                <Button onClick={() => setActiveTab("templates")} variant="outline">
                  Вернуться к выбору шаблона
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}