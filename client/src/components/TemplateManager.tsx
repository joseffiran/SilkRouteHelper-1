import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Save, X, FileText, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TemplateField {
  id?: number;
  field_name: string;
  label_ru: string;
  extraction_rules: {
    type: string;
    pattern?: string;
    keywords?: string[];
    max_distance?: number;
    keyword?: string;
  };
}

interface Template {
  id: number;
  name: string;
  is_active: boolean;
  fields?: TemplateField[];
}

interface TemplateManagerProps {
  onClose?: () => void;
}

export function TemplateManager({ onClose }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [newField, setNewField] = useState<TemplateField>({
    field_name: '',
    label_ru: '',
    extraction_rules: { type: 'regex', pattern: '' }
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiRequest('/api/v1/admin/templates');
      setTemplates(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    }
  };

  const loadTemplateFields = async (templateId: number) => {
    try {
      const response = await apiRequest(`/api/v1/admin/templates/${templateId}`);
      setSelectedTemplate(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load template fields",
        variant: "destructive"
      });
    }
  };

  const createTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('/api/v1/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          name: newTemplateName,
          is_active: 'false'
        })
      });

      toast({
        title: "Success",
        description: "Template created successfully"
      });

      setNewTemplateName('');
      setIsCreatingTemplate(false);
      loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  };

  const toggleTemplateStatus = async (template: Template) => {
    try {
      await apiRequest(`/api/v1/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          is_active: (!template.is_active).toString()
        })
      });

      toast({
        title: "Success",
        description: `Template ${template.is_active ? 'deactivated' : 'activated'}`
      });

      loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive"
      });
    }
  };

  const addField = async () => {
    if (!selectedTemplate || !newField.field_name || !newField.label_ru) {
      toast({
        title: "Error",
        description: "Field name and label are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest(`/api/v1/admin/templates/${selectedTemplate.id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          field_name: newField.field_name,
          label_ru: newField.label_ru,
          extraction_rules: JSON.stringify(newField.extraction_rules)
        })
      });

      toast({
        title: "Success",
        description: "Field added successfully"
      });

      setNewField({
        field_name: '',
        label_ru: '',
        extraction_rules: { type: 'regex', pattern: '' }
      });

      loadTemplateFields(selectedTemplate.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add field",
        variant: "destructive"
      });
    }
  };

  const updateField = async () => {
    if (!editingField?.id) return;

    try {
      await apiRequest(`/api/v1/admin/template-fields/${editingField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          field_name: editingField.field_name,
          label_ru: editingField.label_ru,
          extraction_rules: JSON.stringify(editingField.extraction_rules)
        })
      });

      toast({
        title: "Success",
        description: "Field updated successfully"
      });

      setEditingField(null);
      if (selectedTemplate) {
        loadTemplateFields(selectedTemplate.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive"
      });
    }
  };

  const deleteField = async (fieldId: number) => {
    try {
      await apiRequest(`/api/v1/admin/template-fields/${fieldId}`, {
        method: 'DELETE'
      });

      toast({
        title: "Success",
        description: "Field deleted successfully"
      });

      if (selectedTemplate) {
        loadTemplateFields(selectedTemplate.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete field",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Template Manager</h1>
          <p className="text-muted-foreground">Manage declaration templates and their extraction fields</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates
            </CardTitle>
            <CardDescription>Manage declaration templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create Template */}
            {isCreatingTemplate ? (
              <div className="space-y-3">
                <Input
                  placeholder="Template name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={createTemplate} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingTemplate(false)} 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setIsCreatingTemplate(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            )}

            <Separator />

            {/* Templates List */}
            <div className="space-y-3">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id ? 'border-primary' : ''
                  }`}
                  onClick={() => loadTemplateFields(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => toggleTemplateStatus(template)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Template Fields
            </CardTitle>
            <CardDescription>
              {selectedTemplate 
                ? `Manage fields for: ${selectedTemplate.name}`
                : "Select a template to manage its fields"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate ? (
              <>
                {/* Add New Field */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-medium">Add New Field</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="field_name">Field Name</Label>
                      <Input
                        id="field_name"
                        placeholder="declaration_number"
                        value={newField.field_name}
                        onChange={(e) => setNewField({
                          ...newField,
                          field_name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="label_ru">Russian Label</Label>
                      <Input
                        id="label_ru"
                        placeholder="Номер декларации"
                        value={newField.label_ru}
                        onChange={(e) => setNewField({
                          ...newField,
                          label_ru: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pattern">Extraction Pattern (Regex)</Label>
                    <Input
                      id="pattern"
                      placeholder="№\s*(\d+/\d+/\d+)"
                      value={newField.extraction_rules.pattern || ''}
                      onChange={(e) => setNewField({
                        ...newField,
                        extraction_rules: {
                          ...newField.extraction_rules,
                          pattern: e.target.value
                        }
                      })}
                    />
                  </div>

                  <Button onClick={addField} size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <Separator />

                {/* Existing Fields */}
                <div className="space-y-3">
                  <h4 className="font-medium">
                    Existing Fields ({selectedTemplate.fields?.length || 0})
                  </h4>
                  
                  {selectedTemplate.fields?.map((field) => (
                    <Card key={field.id} className="p-3">
                      {editingField?.id === field.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={editingField.field_name}
                              onChange={(e) => setEditingField({
                                ...editingField,
                                field_name: e.target.value
                              })}
                            />
                            <Input
                              value={editingField.label_ru}
                              onChange={(e) => setEditingField({
                                ...editingField,
                                label_ru: e.target.value
                              })}
                            />
                          </div>
                          <Input
                            value={editingField.extraction_rules.pattern || ''}
                            onChange={(e) => setEditingField({
                              ...editingField,
                              extraction_rules: {
                                ...editingField.extraction_rules,
                                pattern: e.target.value
                              }
                            })}
                          />
                          <div className="flex gap-2">
                            <Button onClick={updateField} size="sm">
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingField(null)} 
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{field.field_name}</h5>
                            <p className="text-sm text-muted-foreground">{field.label_ru}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Pattern: {field.extraction_rules.pattern || 'No pattern'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingField(field)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => field.id && deleteField(field.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a template to manage its fields
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}