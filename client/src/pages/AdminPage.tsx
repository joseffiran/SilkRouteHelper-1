import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Plus, Edit, Trash2, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DeclarationTemplate {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateField {
  id: number;
  template_id: number;
  field_name: string;
  label_ru: string;
  extraction_rules: any;
  created_at: string;
  updated_at: string;
}

export default function AdminPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<DeclarationTemplate | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateField, setShowCreateField] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/v1/admin/templates'],
    queryFn: async () => {
      const response = await apiRequest('/api/v1/admin/templates/');
      return response.json();
    },
  });

  // Fetch fields for selected template
  const { data: templateFields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/v1/admin/templates', selectedTemplate?.id, 'fields'],
    queryFn: async () => {
      const response = await apiRequest(`/api/v1/admin/templates/${selectedTemplate?.id}/fields`);
      return response.json();
    },
    enabled: !!selectedTemplate,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; is_active: boolean }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('is_active', data.is_active.toString());

      const response = await apiRequest('/api/v1/admin/templates/', {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Template created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/templates'] });
      setShowCreateTemplate(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create template", description: error.message, variant: "destructive" });
    },
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: { field_name: string; label_ru: string; extraction_rules: string }) => {
      const formData = new FormData();
      formData.append('field_name', data.field_name);
      formData.append('label_ru', data.label_ru);
      formData.append('extraction_rules', data.extraction_rules);

      const response = await apiRequest(`/api/v1/admin/templates/${selectedTemplate?.id}/fields`, {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Field created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/templates', selectedTemplate?.id, 'fields'] });
      setShowCreateField(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create field", description: error.message, variant: "destructive" });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (data: { id: number; field_name: string; label_ru: string; extraction_rules: string }) => {
      const formData = new FormData();
      formData.append('field_name', data.field_name);
      formData.append('label_ru', data.label_ru);
      formData.append('extraction_rules', data.extraction_rules);

      return apiRequest(`/api/v1/admin/fields/${data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });
    },
    onSuccess: () => {
      toast({ title: "Field updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/templates', selectedTemplate?.id, 'fields'] });
      setEditingField(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update field", description: error.message, variant: "destructive" });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      return apiRequest(`/api/v1/admin/fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
    },
    onSuccess: () => {
      toast({ title: "Field deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/admin/templates', selectedTemplate?.id, 'fields'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete field", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTemplateMutation.mutate({
      name: formData.get('name') as string,
      is_active: formData.get('is_active') === 'on',
    });
  };

  const handleCreateField = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const extractionRules = formData.get('extraction_rules') as string;
      JSON.parse(extractionRules); // Validate JSON
      
      createFieldMutation.mutate({
        field_name: formData.get('field_name') as string,
        label_ru: formData.get('label_ru') as string,
        extraction_rules: extractionRules,
      });
    } catch (error) {
      toast({ title: "Invalid JSON in extraction rules", variant: "destructive" });
    }
  };

  const handleUpdateField = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingField) return;

    const formData = new FormData(e.currentTarget);
    
    try {
      const extractionRules = formData.get('extraction_rules') as string;
      JSON.parse(extractionRules); // Validate JSON
      
      updateFieldMutation.mutate({
        id: editingField.id,
        field_name: formData.get('field_name') as string,
        label_ru: formData.get('label_ru') as string,
        extraction_rules: extractionRules,
      });
    } catch (error) {
      toast({ title: "Invalid JSON in extraction rules", variant: "destructive" });
    }
  };

  if (templatesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage declaration templates and extraction rules
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Templates Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Declaration Templates</CardTitle>
                <CardDescription>
                  Manage templates for different customs declaration types
                </CardDescription>
              </div>
              <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                      Add a new declaration template for OCR processing
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTemplate} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Uzbekistan Import Declaration 2025"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="is_active" name="is_active" />
                      <Label htmlFor="is_active">Set as active template</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateTemplate(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTemplateMutation.isPending}>
                        {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {templates && templates.length > 0 ? (
              <div className="space-y-3">
                {templates.map((template: DeclarationTemplate) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Created {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {template.is_active && (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Templates Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create your first declaration template to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Fields Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedTemplate ? `Fields - ${selectedTemplate.name}` : 'Template Fields'}
                </CardTitle>
                <CardDescription>
                  Configure field extraction rules for the selected template
                </CardDescription>
              </div>
              {selectedTemplate && (
                <Dialog open={showCreateField} onOpenChange={setShowCreateField}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Field
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Field</DialogTitle>
                      <DialogDescription>
                        Add a new extraction field for {selectedTemplate.name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateField} className="space-y-4">
                      <div>
                        <Label htmlFor="field_name">System Field Name</Label>
                        <Input
                          id="field_name"
                          name="field_name"
                          placeholder="e.g., sender_name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="label_ru">Russian Label</Label>
                        <Input
                          id="label_ru"
                          name="label_ru"
                          placeholder="e.g., Отправитель/Экспортер"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="extraction_rules">Extraction Rules (JSON)</Label>
                        <Textarea
                          id="extraction_rules"
                          name="extraction_rules"
                          placeholder='{"type": "regex", "pattern": "ИНН\\s(\\d{10})"}'
                          rows={4}
                          required
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Example: {`{"type": "regex", "pattern": "Invoice\\s*#?\\s*(\\w+)"}`}
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreateField(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createFieldMutation.isPending}>
                          {createFieldMutation.isPending ? "Creating..." : "Create Field"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTemplate ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Template Selected
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a template from the left to manage its fields.
                </p>
              </div>
            ) : fieldsLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : templateFields && templateFields.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Russian Label</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templateFields.map((field: TemplateField) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">{field.field_name}</TableCell>
                      <TableCell>{field.label_ru}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingField(field)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFieldMutation.mutate(field.id)}
                            disabled={deleteFieldMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Fields Configured
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add extraction fields to configure OCR data processing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Field Dialog */}
      <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
            <DialogDescription>
              Update the extraction field configuration
            </DialogDescription>
          </DialogHeader>
          {editingField && (
            <form onSubmit={handleUpdateField} className="space-y-4">
              <div>
                <Label htmlFor="edit_field_name">System Field Name</Label>
                <Input
                  id="edit_field_name"
                  name="field_name"
                  defaultValue={editingField.field_name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_label_ru">Russian Label</Label>
                <Input
                  id="edit_label_ru"
                  name="label_ru"
                  defaultValue={editingField.label_ru}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_extraction_rules">Extraction Rules (JSON)</Label>
                <Textarea
                  id="edit_extraction_rules"
                  name="extraction_rules"
                  defaultValue={JSON.stringify(editingField.extraction_rules, null, 2)}
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingField(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFieldMutation.isPending}>
                  {updateFieldMutation.isPending ? "Updating..." : "Update Field"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}