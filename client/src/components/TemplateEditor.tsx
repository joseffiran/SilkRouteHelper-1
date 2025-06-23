import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, Edit2, Trash2, Move } from "lucide-react";

interface TemplateField {
  id?: number;
  field_name: string;
  label_ru: string;
  box_number: string;
  data_type: string;
  keywords: string[];
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface TemplateEditorProps {
  templateId?: number;
  templateName: string;
  backgroundImage?: string;
  fields: TemplateField[];
  onSave: (fields: TemplateField[]) => void;
  onFieldUpdate: (field: TemplateField) => void;
}

export function TemplateEditor({
  templateId,
  templateName,
  backgroundImage,
  fields: initialFields,
  onSave,
  onFieldUpdate
}: TemplateEditorProps) {
  const [fields, setFields] = useState<TemplateField[]>(initialFields);
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isCreating || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newField: TemplateField = {
      field_name: `field_${fields.length + 1}`,
      label_ru: `Поле ${fields.length + 1}`,
      box_number: `${fields.length + 1}`,
      data_type: "text",
      keywords: [],
      coordinates: {
        x: Math.max(0, Math.min(95, x)),
        y: Math.max(0, Math.min(95, y)),
        width: 5,
        height: 3
      }
    };

    setFields([...fields, newField]);
    setSelectedField(newField);
    setIsCreating(false);
  }, [isCreating, fields]);

  const handleFieldClick = (field: TemplateField, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedField(field);
  };

  const updateSelectedField = (updates: Partial<TemplateField>) => {
    if (!selectedField) return;

    const updatedField = { ...selectedField, ...updates };
    setSelectedField(updatedField);
    
    const updatedFields = fields.map(f => 
      f === selectedField ? updatedField : f
    );
    setFields(updatedFields);
    onFieldUpdate(updatedField);
  };

  const deleteField = (fieldToDelete: TemplateField) => {
    const updatedFields = fields.filter(f => f !== fieldToDelete);
    setFields(updatedFields);
    if (selectedField === fieldToDelete) {
      setSelectedField(null);
    }
  };

  const handleSave = () => {
    onSave(fields);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
      {/* Canvas Area */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Template: {templateName}</CardTitle>
            <CardDescription>
              Click fields to edit them, or create new fields by clicking "Add Field" then clicking on the form
            </CardDescription>
            <div className="flex gap-2">
              <Button
                variant={isCreating ? "default" : "outline"}
                onClick={() => setIsCreating(!isCreating)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? "Click on form to place field" : "Add Field"}
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-full">
            <div
              ref={canvasRef}
              className="relative w-full h-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-gray-50"
              onClick={handleCanvasClick}
              style={{
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
            >
              {/* Render field boxes */}
              {fields.map((field, index) => (
                <div
                  key={index}
                  className={`absolute border-2 cursor-pointer transition-all ${
                    selectedField === field
                      ? 'border-blue-500 bg-blue-100 bg-opacity-50'
                      : 'border-red-500 bg-red-100 bg-opacity-30'
                  }`}
                  style={{
                    left: `${field.coordinates.x}%`,
                    top: `${field.coordinates.y}%`,
                    width: `${field.coordinates.width}%`,
                    height: `${field.coordinates.height}%`,
                  }}
                  onClick={(e) => handleFieldClick(field, e)}
                >
                  <div className="absolute -top-6 left-0 text-xs font-medium bg-white px-1 rounded border">
                    {field.box_number}
                  </div>
                  <div className="absolute top-0 right-0 p-1">
                    <Move className="h-3 w-3 text-gray-600" />
                  </div>
                </div>
              ))}

              {/* Instructions overlay when no background */}
              {!backgroundImage && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">Upload a background image of your form</p>
                    <p className="text-sm">Then add fields by clicking "Add Field" and placing them on the form</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Editor Panel */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Field Properties</CardTitle>
            <CardDescription>
              {selectedField ? `Editing: ${selectedField.label_ru}` : "Select a field to edit its properties"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedField ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="field-name">Field Name (System)</Label>
                  <Input
                    id="field-name"
                    value={selectedField.field_name}
                    onChange={(e) => updateSelectedField({ field_name: e.target.value })}
                    placeholder="e.g., importer_name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label-ru">Label (Russian)</Label>
                  <Input
                    id="label-ru"
                    value={selectedField.label_ru}
                    onChange={(e) => updateSelectedField({ label_ru: e.target.value })}
                    placeholder="e.g., Получатель/Импортер"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="box-number">Box Number</Label>
                  <Input
                    id="box-number"
                    value={selectedField.box_number}
                    onChange={(e) => updateSelectedField({ box_number: e.target.value })}
                    placeholder="e.g., 8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-type">Data Type</Label>
                  <Select
                    value={selectedField.data_type}
                    onValueChange={(value) => updateSelectedField({ data_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Search Keywords</Label>
                  <Textarea
                    id="keywords"
                    value={selectedField.keywords.join(', ')}
                    onChange={(e) => updateSelectedField({ 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    })}
                    placeholder="e.g., Получатель, Импортер, ИНН"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated keywords to help find this field in documents
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="x-coord">X Position (%)</Label>
                    <Input
                      id="x-coord"
                      type="number"
                      value={selectedField.coordinates.x.toFixed(1)}
                      onChange={(e) => updateSelectedField({
                        coordinates: {
                          ...selectedField.coordinates,
                          x: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="y-coord">Y Position (%)</Label>
                    <Input
                      id="y-coord"
                      type="number"
                      value={selectedField.coordinates.y.toFixed(1)}
                      onChange={(e) => updateSelectedField({
                        coordinates: {
                          ...selectedField.coordinates,
                          y: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (%)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={selectedField.coordinates.width.toFixed(1)}
                      onChange={(e) => updateSelectedField({
                        coordinates: {
                          ...selectedField.coordinates,
                          width: parseFloat(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (%)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={selectedField.coordinates.height.toFixed(1)}
                      onChange={(e) => updateSelectedField({
                        coordinates: {
                          ...selectedField.coordinates,
                          height: parseFloat(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteField(selectedField)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Field
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Edit2 className="mx-auto h-12 w-12 mb-4" />
                <p>Select a field on the form to edit its properties</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Field List */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">All Fields ({fields.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded border cursor-pointer ${
                    selectedField === field ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedField(field)}
                >
                  <div>
                    <p className="text-sm font-medium">{field.label_ru}</p>
                    <p className="text-xs text-muted-foreground">Box {field.box_number}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {field.data_type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}