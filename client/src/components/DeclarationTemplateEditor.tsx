import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, FileText, User, Package, Truck, MapPin, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TemplateField {
  id?: number;
  field_name: string;
  label_ru: string;
  extraction_rules: {
    section: string;
    description: string;
    keywords: string[];
    required: boolean;
  };
}

interface Template {
  id: number;
  name: string;
  is_active: boolean;
  fields: TemplateField[];
}

interface DeclarationTemplateEditorProps {
  templateId?: number;
  onSave?: () => void;
}

// Predefined declaration sections based on actual customs declaration structure
const DECLARATION_SECTIONS = {
  "sender_info": {
    title: "Отправитель / Экспортер",
    icon: User,
    description: "Информация об отправителе товаров",
    color: "bg-blue-50 border-blue-200"
  },
  "recipient_info": {
    title: "Получатель / Импортер", 
    icon: Building,
    description: "Информация о получателе товаров",
    color: "bg-green-50 border-green-200"
  },
  "goods_info": {
    title: "Товары и Упаковка",
    icon: Package,
    description: "Описание товаров, количество, вес, стоимость",
    color: "bg-purple-50 border-purple-200"
  },
  "transport_info": {
    title: "Транспорт и Доставка",
    icon: Truck,
    description: "Информация о транспортировке и маршруте",
    color: "bg-orange-50 border-orange-200"
  },
  "customs_info": {
    title: "Таможенная Информация",
    icon: FileText,
    description: "Коды товаров, пошлины, льготы",
    color: "bg-red-50 border-red-200"
  },
  "location_info": {
    title: "Географические Данные",
    icon: MapPin,
    description: "Страны отправления и назначения",
    color: "bg-yellow-50 border-yellow-200"
  }
};

// Predefined field templates for easy setup
const FIELD_TEMPLATES = {
  sender_info: [
    { field_name: "sender_name", label_ru: "Наименование отправителя", keywords: ["отправитель", "экспортер", "поставщик"] },
    { field_name: "sender_address", label_ru: "Адрес отправителя", keywords: ["адрес отправителя", "адрес экспортера"] },
    { field_name: "sender_inn", label_ru: "ИНН отправителя", keywords: ["ИНН", "налоговый номер отправителя"] },
    { field_name: "sender_country", label_ru: "Страна отправителя", keywords: ["страна отправления", "страна экспорта"] }
  ],
  recipient_info: [
    { field_name: "recipient_name", label_ru: "Наименование получателя", keywords: ["получатель", "импортер", "покупатель"] },
    { field_name: "recipient_address", label_ru: "Адрес получателя", keywords: ["адрес получателя", "адрес импортера"] },
    { field_name: "recipient_inn", label_ru: "ИНН получателя", keywords: ["ИНН получателя", "налоговый номер получателя"] },
    { field_name: "recipient_country", label_ru: "Страна получателя", keywords: ["страна назначения", "страна импорта"] }
  ],
  goods_info: [
    { field_name: "goods_description", label_ru: "Наименование товара", keywords: ["наименование товара", "описание товара", "товар"] },
    { field_name: "goods_quantity", label_ru: "Количество", keywords: ["количество", "кол-во", "штук"] },
    { field_name: "goods_weight", label_ru: "Вес брутто", keywords: ["вес", "масса", "кг", "брутто"] },
    { field_name: "goods_value", label_ru: "Стоимость", keywords: ["стоимость", "цена", "сумма", "USD", "долларов"] },
    { field_name: "invoice_number", label_ru: "Номер инвойса", keywords: ["инвойс", "счет", "invoice"] },
    { field_name: "invoice_date", label_ru: "Дата инвойса", keywords: ["дата инвойса", "дата счета"] }
  ],
  transport_info: [
    { field_name: "transport_type", label_ru: "Вид транспорта", keywords: ["автомобильный", "железнодорожный", "авиа", "морской"] },
    { field_name: "transport_number", label_ru: "Номер ТС", keywords: ["номер автомобиля", "номер вагона", "рейс"] },
    { field_name: "border_crossing", label_ru: "Пункт пропуска", keywords: ["пункт пропуска", "граница", "КПП"] }
  ],
  customs_info: [
    { field_name: "hs_code", label_ru: "Код ТН ВЭД", keywords: ["ТН ВЭД", "код товара", "классификация"] },
    { field_name: "customs_procedure", label_ru: "Таможенная процедура", keywords: ["процедура", "режим", "40", "10"] },
    { field_name: "duty_rate", label_ru: "Ставка пошлины", keywords: ["пошлина", "ставка", "процент", "%"] }
  ],
  location_info: [
    { field_name: "country_origin", label_ru: "Страна происхождения", keywords: ["страна происхождения", "производитель"] },
    { field_name: "country_dispatch", label_ru: "Страна отправления", keywords: ["страна отправления", "отгрузка"] },
    { field_name: "country_destination", label_ru: "Страна назначения", keywords: ["страна назначения", "доставка"] }
  ]
};

export default function DeclarationTemplateEditor({ templateId, onSave }: DeclarationTemplateEditorProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [activeSection, setActiveSection] = useState("sender_info");
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load template data
  const { data: templateData, isLoading } = useQuery({
    queryKey: ["/api/v1/admin/templates", templateId],
    enabled: !!templateId,
  });

  useEffect(() => {
    if (templateData) {
      setTemplate(templateData);
    } else if (!templateId) {
      // Initialize new template
      setTemplate({
        id: 0,
        name: "",
        is_active: false,
        fields: []
      });
    }
  }, [templateData, templateId]);

  // Group fields by section
  const fieldsBySection = template?.fields?.reduce((acc, field) => {
    const section = field.extraction_rules?.section || "customs_info";
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, TemplateField[]>) || {};

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (updatedTemplate: Template) => {
      if (templateId) {
        return apiRequest(`/api/v1/admin/templates/${templateId}`, {
          method: "PUT",
          body: JSON.stringify(updatedTemplate),
        });
      } else {
        return apiRequest("/api/v1/admin/templates/", {
          method: "POST",
          body: JSON.stringify(updatedTemplate),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Шаблон сохранен",
        description: "Изменения успешно применены",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/templates"] });
      onSave?.();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка сохранения",
        description: error.message || "Не удалось сохранить шаблон",
        variant: "destructive",
      });
    },
  });

  const handleAddField = (section: string, fieldTemplate?: any) => {
    const newField: TemplateField = {
      field_name: fieldTemplate?.field_name || "",
      label_ru: fieldTemplate?.label_ru || "",
      extraction_rules: {
        section,
        description: fieldTemplate?.description || "",
        keywords: fieldTemplate?.keywords || [],
        required: false
      }
    };
    setEditingField(newField);
    setIsAddingField(true);
  };

  const handleSaveField = () => {
    if (!editingField || !template) return;

    const updatedFields = isAddingField 
      ? [...template.fields, editingField]
      : template.fields.map(f => f.id === editingField.id ? editingField : f);

    setTemplate({ ...template, fields: updatedFields });
    setEditingField(null);
    setIsAddingField(false);
  };

  const handleDeleteField = (fieldId: number) => {
    if (!template) return;
    setTemplate({
      ...template,
      fields: template.fields.filter(f => f.id !== fieldId)
    });
  };

  const handleQuickAddSection = (section: string) => {
    if (!template) return;
    
    const sectionFields = FIELD_TEMPLATES[section as keyof typeof FIELD_TEMPLATES] || [];
    const newFields = sectionFields.map(fieldTemplate => ({
      field_name: fieldTemplate.field_name,
      label_ru: fieldTemplate.label_ru,
      extraction_rules: {
        section,
        description: `Автоматическое извлечение: ${fieldTemplate.label_ru}`,
        keywords: fieldTemplate.keywords,
        required: false
      }
    }));

    setTemplate({
      ...template,
      fields: [...(template.fields || []), ...newFields]
    });

    toast({
      title: "Поля добавлены",
      description: `Добавлено ${newFields.length} полей в раздел "${DECLARATION_SECTIONS[section as keyof typeof DECLARATION_SECTIONS]?.title}"`,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Template Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Редактор Шаблона Декларации</span>
            <Button 
              onClick={() => saveTemplateMutation.mutate(template!)}
              disabled={!template || saveTemplateMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Сохранить
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Название шаблона</Label>
              <Input
                id="template-name"
                value={template?.name || ""}
                onChange={(e) => setTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Например: Российская таможенная декларация 2025"
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Switch
                checked={template?.is_active || false}
                onCheckedChange={(checked) => setTemplate(prev => prev ? { ...prev, is_active: checked } : null)}
              />
              <Label>Активный шаблон</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section-based Field Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Структура Декларации</CardTitle>
          <p className="text-sm text-muted-foreground">
            Организуйте поля по логическим разделам декларации для удобного редактирования
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="grid w-full grid-cols-6">
              {Object.entries(DECLARATION_SECTIONS).map(([key, section]) => {
                const Icon = section.icon;
                const fieldCount = fieldsBySection[key]?.length || 0;
                return (
                  <TabsTrigger key={key} value={key} className="flex flex-col gap-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{section.title.split(' ')[0]}</span>
                    {fieldCount > 0 && <Badge variant="secondary" className="text-xs">{fieldCount}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(DECLARATION_SECTIONS).map(([sectionKey, section]) => {
              const Icon = section.icon;
              const sectionFields = fieldsBySection[sectionKey] || [];
              
              return (
                <TabsContent key={sectionKey} value={sectionKey} className="space-y-4">
                  <div className={`p-4 rounded-lg border-2 ${section.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <h3 className="font-semibold">{section.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAddSection(sectionKey)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Добавить стандартные поля
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddField(sectionKey)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Новое поле
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{section.description}</p>

                    {/* Section Fields */}
                    <div className="space-y-2">
                      {sectionFields.map((field, index) => (
                        <div key={field.id || index} className="bg-white p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{field.label_ru}</span>
                                <Badge variant="outline" className="text-xs">
                                  {field.field_name}
                                </Badge>
                                {field.extraction_rules?.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Обязательное
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {field.extraction_rules?.description || "Описание не задано"}
                              </p>
                              {field.extraction_rules?.keywords && field.extraction_rules.keywords.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {field.extraction_rules.keywords.map((keyword, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingField(field);
                                  setIsAddingField(false);
                                }}
                              >
                                Редактировать
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => field.id && handleDeleteField(field.id)}
                              >
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {sectionFields.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>В этом разделе пока нет полей</p>
                          <p className="text-sm">Используйте кнопки выше для добавления полей</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Field Editor Modal/Form */}
      {editingField && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isAddingField ? "Добавить новое поле" : "Редактировать поле"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-name">Системное имя поля</Label>
                <Input
                  id="field-name"
                  value={editingField.field_name}
                  onChange={(e) => setEditingField({ ...editingField, field_name: e.target.value })}
                  placeholder="sender_name"
                />
              </div>
              <div>
                <Label htmlFor="field-label">Название на русском</Label>
                <Input
                  id="field-label"
                  value={editingField.label_ru}
                  onChange={(e) => setEditingField({ ...editingField, label_ru: e.target.value })}
                  placeholder="Наименование отправителя"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="field-description">Описание для извлечения</Label>
              <Textarea
                id="field-description"
                value={editingField.extraction_rules?.description || ""}
                onChange={(e) => setEditingField({
                  ...editingField,
                  extraction_rules: { 
                    ...editingField.extraction_rules, 
                    description: e.target.value,
                    section: editingField.extraction_rules?.section || activeSection,
                    keywords: editingField.extraction_rules?.keywords || [],
                    required: editingField.extraction_rules?.required || false
                  }
                })}
                placeholder="Как система должна находить это поле в документе"
              />
            </div>

            <div>
              <Label htmlFor="field-keywords">Ключевые слова (через запятую)</Label>
              <Input
                id="field-keywords"
                value={editingField.extraction_rules?.keywords?.join(", ") || ""}
                onChange={(e) => setEditingField({
                  ...editingField,
                  extraction_rules: {
                    ...editingField.extraction_rules,
                    section: editingField.extraction_rules?.section || activeSection,
                    description: editingField.extraction_rules?.description || "",
                    keywords: e.target.value.split(",").map(k => k.trim()).filter(k => k),
                    required: editingField.extraction_rules?.required || false
                  }
                })}
                placeholder="отправитель, экспортер, поставщик"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editingField.extraction_rules?.required || false}
                onCheckedChange={(checked) => setEditingField({
                  ...editingField,
                  extraction_rules: { 
                    ...editingField.extraction_rules, 
                    section: editingField.extraction_rules?.section || activeSection,
                    description: editingField.extraction_rules?.description || "",
                    keywords: editingField.extraction_rules?.keywords || [],
                    required: checked 
                  }
                })}
              />
              <Label>Обязательное поле</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveField}>
                {isAddingField ? "Добавить поле" : "Сохранить изменения"}
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingField(null);
                setIsAddingField(false);
              }}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}