import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, Copy, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface DeclarationField {
  id: string;
  label: string;
  value: string;
  confidence?: number;
  section: string;
  required: boolean;
}

interface DeclarationViewerProps {
  extractedData?: Record<string, any>;
  templateName?: string;
  onFieldUpdate?: (fieldId: string, value: string) => void;
  editable?: boolean;
}

export default function DeclarationViewer({ 
  extractedData = {}, 
  templateName = "Грузовая Таможенная Декларация",
  onFieldUpdate,
  editable = true 
}: DeclarationViewerProps) {
  const [declarationFields, setDeclarationFields] = useState<DeclarationField[]>([]);
  const { toast } = useToast();

  // Define the exact 54 fields matching the official Russian customs declaration
  const officialFields: Omit<DeclarationField, 'value' | 'confidence'>[] = [
    // Header and Basic Information
    { id: "declaration_type", label: "1. Тип декларации", section: "header", required: true },
    { id: "sender_exporter", label: "2. Отправитель/Экспортер", section: "sender", required: true },
    { id: "sender_by_order", label: "2. по поручению:", section: "sender", required: false },
    { id: "additional_sheet", label: "3. Доб.лист", section: "header", required: false },
    { id: "sender_spec", label: "4. Отпр. спец", section: "sender", required: false },
    { id: "total_goods_names", label: "5. Всего наим. т-ов", section: "goods", required: true },
    { id: "total_packages", label: "6. Кол-во мест", section: "goods", required: true },
    { id: "reference_number", label: "7. Справочный номер", section: "header", required: false },
    
    // Recipient and Financial
    { id: "recipient_importer", label: "8. Получатель/Импортер", section: "recipient", required: true },
    { id: "financial_person", label: "9. Лицо, ответственное за финансовое урегулирование", section: "financial", required: true },
    { id: "country_first_destination", label: "10. Страна 1-го назнач.", section: "location", required: true },
    { id: "trading_country", label: "11. Торг. страна", section: "location", required: true },
    { id: "customs_value", label: "12. Таможенная стоимость", section: "financial", required: true },
    { id: "field_13", label: "13. [Поле 13]", section: "location", required: false },
    { id: "declarant_representative", label: "14. Декларант/представитель", section: "declarant", required: true },
    
    // Geographic Information
    { id: "dispatch_country", label: "15. Страна отправления", section: "location", required: true },
    { id: "origin_country_code", label: "15a. Код страны отправл.", section: "location", required: true },
    { id: "origin_country", label: "16. Страна происхождения", section: "location", required: true },
    { id: "destination_country", label: "17. Страна назначения", section: "location", required: true },
    { id: "destination_country_code", label: "17a. Код страны назнач.", section: "location", required: true },
    
    // Transport Information
    { id: "transport_identity_departure", label: "18. Транспортное средство при отправлении", section: "transport", required: true },
    { id: "container_number", label: "19. Номер контейнера", section: "transport", required: false },
    { id: "delivery_terms", label: "20. Условия поставки", section: "transport", required: true },
    { id: "transport_border", label: "21. Транспортное средство на границе", section: "transport", required: true },
    { id: "currency_invoice", label: "22. Валюта и общая фактурная стоимость", section: "financial", required: true },
    { id: "exchange_rate", label: "23. Курс валюты", section: "financial", required: true },
    { id: "nature_transaction", label: "24. Характер сделки", section: "financial", required: true },
    
    // Transport Details
    { id: "transport_mode_border", label: "25. Вид транспорта на границе", section: "transport", required: true },
    { id: "transport_mode_inland", label: "26. Вид транспорта внутри страны", section: "transport", required: false },
    { id: "loading_place", label: "27. Место погрузки/разгрузки", section: "transport", required: true },
    { id: "financial_banking_info", label: "28. Финансовые и банковские сведения", section: "financial", required: false },
    { id: "customs_office_border", label: "29. Таможня на границе", section: "customs", required: true },
    { id: "goods_location", label: "30. Место досмотра товара", section: "customs", required: true },
    
    // Goods Details
    { id: "packages_marks_numbers", label: "31. Грузовые места и описание товаров", section: "goods", required: true },
    { id: "item_number", label: "32. Товар №", section: "goods", required: true },
    { id: "commodity_code", label: "33. Код товара", section: "goods", required: true },
    { id: "country_origin_code", label: "34. Код страны происх.", section: "goods", required: true },
    { id: "gross_mass", label: "35. Вес брутто (кг)", section: "goods", required: true },
    { id: "net_mass", label: "38. Вес нетто (кг)", section: "goods", required: true },
    { id: "customs_procedure_code", label: "37. Процедура", section: "customs", required: true },
    { id: "quota", label: "39. Квота", section: "customs", required: false },
    
    // Additional Information
    { id: "general_declaration", label: "40. Общая декларация/предшествующий документ", section: "customs", required: false },
    { id: "additional_units", label: "41. Доп.ед.изм.", section: "goods", required: false },
    { id: "item_price", label: "42. Фактур. стоим. т-ра", section: "financial", required: true },
    { id: "adjustment_field_43", label: "43. [Поле 43]", section: "financial", required: false },
    { id: "additional_information", label: "44. Дополнительная информация", section: "customs", required: false },
    { id: "adjustment_field_45", label: "45. [Корректировки]", section: "financial", required: false },
    { id: "statistical_value", label: "46. Статистическая стоимость", section: "financial", required: false },
    
    // Payment Calculations
    { id: "duty_calculation_type", label: "47. Исчисление - Вид", section: "payments", required: true },
    { id: "duty_base", label: "47. Основа начисления", section: "payments", required: true },
    { id: "duty_rate", label: "47. Ставка", section: "payments", required: true },
    { id: "duty_amount", label: "47. Сумма", section: "payments", required: true },
    { id: "payment_method", label: "47. СП", section: "payments", required: true },
    { id: "payment_deferral", label: "48. Отсрочка платежей", section: "payments", required: false },
    { id: "warehouse_name", label: "49. Наименование склада", section: "customs", required: false },
    
    // Final Information
    { id: "responsible_person", label: "50. Доверитель", section: "declarant", required: true },
    { id: "customs_office_declaration", label: "51. Таможенный орган подачи декларации", section: "customs", required: true },
    { id: "invalidity_guarantee", label: "52. Гарантия недействительна для", section: "customs", required: false },
    { id: "customs_destination_office", label: "53. Таможня и страна назначения", section: "customs", required: false },
    { id: "place_date_signature", label: "54. Место и дата:", section: "declarant", required: true }
  ];

  // Initialize fields with extracted data
  useEffect(() => {
    const fields = officialFields.map(field => ({
      ...field,
      value: extractedData[field.id] || "",
      confidence: extractedData[`${field.id}_confidence`] || undefined
    }));
    setDeclarationFields(fields);
  }, [extractedData]);

  // Group fields by section
  const fieldsBySection = declarationFields.reduce((acc, field) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, DeclarationField[]>);

  const sectionNames = {
    header: "Заголовок декларации",
    sender: "Отправитель/Экспортер",
    recipient: "Получатель/Импортер",
    declarant: "Декларант и подписи",
    location: "Географическая информация",
    transport: "Транспорт и перевозка",
    goods: "Товары и упаковка",
    customs: "Таможенные процедуры",
    financial: "Финансовая информация",
    payments: "Расчет платежей"
  };

  const sectionColors = {
    header: "bg-blue-50 border-blue-200",
    sender: "bg-green-50 border-green-200",
    recipient: "bg-purple-50 border-purple-200",
    declarant: "bg-orange-50 border-orange-200",
    location: "bg-yellow-50 border-yellow-200",
    transport: "bg-indigo-50 border-indigo-200",
    goods: "bg-pink-50 border-pink-200",
    customs: "bg-red-50 border-red-200",
    financial: "bg-teal-50 border-teal-200",
    payments: "bg-gray-50 border-gray-200"
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setDeclarationFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, value } : field
      )
    );
    onFieldUpdate?.(fieldId, value);
  };

  const copyToClipboard = () => {
    const declarationText = generateDeclarationText();
    navigator.clipboard.writeText(declarationText);
    toast({
      title: "Скопировано",
      description: "Декларация скопирована в буфер обмена",
    });
  };

  const downloadDeclaration = () => {
    const declarationText = generateDeclarationText();
    const blob = new Blob([declarationText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `declaration_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateDeclarationText = () => {
    let text = `${templateName}\n`;
    text += `Дата генерации: ${new Date().toLocaleString('ru-RU')}\n\n`;
    
    Object.entries(fieldsBySection).forEach(([sectionKey, fields]) => {
      text += `=== ${sectionNames[sectionKey as keyof typeof sectionNames]} ===\n`;
      fields.forEach(field => {
        if (field.value) {
          text += `${field.label}: ${field.value}\n`;
        }
      });
      text += '\n';
    });
    
    return text;
  };

  const getCompletionStats = () => {
    const totalFields = declarationFields.length;
    const filledFields = declarationFields.filter(f => f.value.trim()).length;
    const requiredFields = declarationFields.filter(f => f.required).length;
    const filledRequiredFields = declarationFields.filter(f => f.required && f.value.trim()).length;
    
    return {
      totalFields,
      filledFields,
      requiredFields,
      filledRequiredFields,
      completionPercent: Math.round((filledFields / totalFields) * 100),
      requiredPercent: Math.round((filledRequiredFields / requiredFields) * 100)
    };
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {templateName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Официальная форма с полями 1-54
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyToClipboard} className="gap-2">
                <Copy className="h-4 w-4" />
                Копировать
              </Button>
              <Button onClick={downloadDeclaration} className="gap-2">
                <Download className="h-4 w-4" />
                Скачать
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.filledFields}/{stats.totalFields}</div>
              <div className="text-sm text-muted-foreground">Заполнено полей</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completionPercent}%</div>
              <div className="text-sm text-muted-foreground">Общая готовность</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.filledRequiredFields}/{stats.requiredFields}</div>
              <div className="text-sm text-muted-foreground">Обязательные поля</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.requiredPercent}%</div>
              <div className="text-sm text-muted-foreground">Готовность к подаче</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration Fields by Section */}
      {Object.entries(fieldsBySection).map(([sectionKey, fields]) => (
        <Card key={sectionKey} className={`border-2 ${sectionColors[sectionKey as keyof typeof sectionColors]}`}>
          <CardHeader>
            <CardTitle className="text-lg">
              {sectionNames[sectionKey as keyof typeof sectionNames]}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">
                {fields.filter(f => f.value.trim()).length}/{fields.length} полей
              </Badge>
              <Badge variant="secondary">
                {fields.filter(f => f.required && f.value.trim()).length}/{fields.filter(f => f.required).length} обязательных
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={field.id} className="font-medium">
                      {field.label}
                    </Label>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Обязательное
                      </Badge>
                    )}
                    {field.confidence && (
                      <Badge 
                        variant={field.confidence > 0.8 ? "default" : "secondary"} 
                        className="text-xs gap-1"
                      >
                        {field.confidence > 0.8 ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {Math.round(field.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  
                  {field.label.includes("описание") || field.label.includes("Дополнительная") ? (
                    <Textarea
                      id={field.id}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={`Введите ${field.label.toLowerCase()}`}
                      disabled={!editable}
                      className={field.confidence && field.confidence > 0.8 ? "bg-green-50" : ""}
                    />
                  ) : (
                    <Input
                      id={field.id}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={`Введите ${field.label.toLowerCase()}`}
                      disabled={!editable}
                      className={field.confidence && field.confidence > 0.8 ? "bg-green-50" : ""}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { DeclarationViewer };