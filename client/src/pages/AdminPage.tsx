import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Settings, Eye, FileText, Save, X, User } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/AppLayout";
import { TemplateManager } from "@/components/TemplateManager";

// Schema for creating/editing templates
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  is_active: z.boolean().default(false),
});

const fieldSchema = z.object({
  field_name: z.string().min(1, "Field name is required"),
  label_ru: z.string().min(1, "Russian label is required"),
  extraction_rules: z.object({
    type: z.enum(["regex", "keyword", "position", "line_contains"]),
    pattern: z.string().optional(),
    keyword: z.string().optional(),
    line_number: z.number().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number()
    }).optional()
  }),
});

const userSchema = z.object({
  email: z.string().email("Valid email is required"),
  companyName: z.string().min(1, "Company name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  is_superuser: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type TemplateFormData = z.infer<typeof templateSchema>;
type FieldFormData = z.infer<typeof fieldSchema>;
type UserFormData = z.infer<typeof userSchema>;

interface Template {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  fields?: TemplateField[];
}

interface TemplateField {
  id: number;
  template_id: number;
  field_name: string;
  label_ru: string;
  extraction_rules: any;
}

interface AdminUser {
  id: number;
  email: string;
  companyName: string;
  isActive: boolean;
  is_superuser: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      is_active: false,
    },
  });

  const fieldForm = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      field_name: "",
      label_ru: "",
      extraction_rules: {
        type: "regex",
        pattern: "",
      },
    },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      companyName: "",
      password: "",
      is_superuser: false,
      isActive: true,
    },
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ["/api/v1/admin/templates"],
  });

  // Fetch template fields
  const { data: templateFields = [], isLoading: fieldsLoading } = useQuery<TemplateField[]>({
    queryKey: ["/api/v1/admin/templates", selectedTemplate?.id, "fields"],
    enabled: !!selectedTemplate?.id,
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/v1/admin/users"],
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await apiRequest("/api/v1/admin/templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/templates"] });
      setTemplateDialogOpen(false);
      templateForm.reset();
      toast({
        title: "Template created",
        description: "Declaration template created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: FieldFormData) => {
      const response = await apiRequest(`/api/v1/admin/templates/${selectedTemplate?.id}/fields`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/v1/admin/templates", selectedTemplate?.id, "fields"] 
      });
      setFieldDialogOpen(false);
      fieldForm.reset();
      setEditingField(null);
      toast({
        title: "Field created",
        description: "Template field created successfully",
      });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (data: FieldFormData) => {
      const response = await apiRequest(`/api/v1/admin/templates/fields/${editingField?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/v1/admin/templates", selectedTemplate?.id, "fields"] 
      });
      setFieldDialogOpen(false);
      fieldForm.reset();
      setEditingField(null);
      toast({
        title: "Field updated",
        description: "Template field updated successfully",
      });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      await apiRequest(`/api/v1/admin/templates/fields/${fieldId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/v1/admin/templates", selectedTemplate?.id, "fields"] 
      });
      toast({
        title: "Field deleted",
        description: "Template field deleted successfully",
      });
    },
  });

  // User management mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/users"] });
      setUserDialogOpen(false);
      userForm.reset();
      setEditingUser(null);
      toast({
        title: "User created",
        description: "User created successfully",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<UserFormData>) => {
      const response = await apiRequest(`/api/v1/admin/users/${editingUser?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/users"] });
      setUserDialogOpen(false);
      userForm.reset();
      setEditingUser(null);
      toast({
        title: "User updated",
        description: "User updated successfully",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/users"] });
      toast({
        title: "User deleted",
        description: "User deleted successfully",
      });
    },
  });

  // Predefined field templates based on Russian customs declaration
  const predefinedFields = [
    {
      field_name: "declaration_number",
      label_ru: "Грузовая таможенная декларация №",
      extraction_rules: { type: "regex", pattern: "ГРУЗОВАЯ ТАМОЖЕННАЯ ДЕКЛАРАЦИЯ\\s+№\\s*([A-Z0-9]+)" }
    },
    {
      field_name: "exporter_company",
      label_ru: "Экспортер/грузоотп.",
      extraction_rules: { type: "keyword", keyword: "Экспортер/грузоотп" }
    },
    {
      field_name: "importer_company", 
      label_ru: "Импортер/грузопол.",
      extraction_rules: { type: "keyword", keyword: "Импортер/грузопол" }
    },
    {
      field_name: "country_origin",
      label_ru: "Страна:",
      extraction_rules: { type: "keyword", keyword: "Страна:" }
    },
    {
      field_name: "declarant_representative",
      label_ru: "Декларант/представитель",
      extraction_rules: { type: "keyword", keyword: "Декларант/представитель" }
    },
    {
      field_name: "reference_number",
      label_ru: "Справочный номер",
      extraction_rules: { type: "regex", pattern: "Справочный номер[\\s\\n]+([0-9.]+)" }
    },
    {
      field_name: "total_packages",
      label_ru: "Всего наим. т-ов",
      extraction_rules: { type: "regex", pattern: "Всего наим\\.\\s*т-ов[\\s\\n]+([0-9]+)" }
    },
    {
      field_name: "packages_count",
      label_ru: "Кол-во мест",
      extraction_rules: { type: "regex", pattern: "Кол-во мест[\\s\\n]+([0-9]+)" }
    },
    {
      field_name: "responsible_person",
      label_ru: "Лицо, ответст. за финан. урегулирование",
      extraction_rules: { type: "keyword", keyword: "Лицо, ответст. за финан. урегулирование" }
    },
    {
      field_name: "departure_country",
      label_ru: "Страна отправления",
      extraction_rules: { type: "keyword", keyword: "Страна отправления" }
    },
    {
      field_name: "destination_country",
      label_ru: "Страна назначения",
      extraction_rules: { type: "keyword", keyword: "Страна назначения" }
    },
    {
      field_name: "transport_border",
      label_ru: "Транспортное средство на границе",
      extraction_rules: { type: "keyword", keyword: "Транспортное средство на границе" }
    },
    {
      field_name: "customs_cost",
      label_ru: "Общ. тамож. стоим-ть",
      extraction_rules: { type: "regex", pattern: "Общ\\. тамож\\. стоим-ть[\\s\\n]+([0-9,]+)" }
    },
    {
      field_name: "currency_rate",
      label_ru: "Курс валюты",
      extraction_rules: { type: "regex", pattern: "Курс валюты[\\s\\n]+([0-9,]+)" }
    },
    {
      field_name: "payment_deferral",
      label_ru: "Отсрочка платежей",
      extraction_rules: { type: "keyword", keyword: "Отсрочка платежей" }
    },
    {
      field_name: "warehouse_name",
      label_ru: "Наименование склада",
      extraction_rules: { type: "keyword", keyword: "Наименование склада" }
    },
    {
      field_name: "customs_location",
      label_ru: "Таможня и страна назначения",
      extraction_rules: { type: "keyword", keyword: "Таможня и страна назначения" }
    },
    {
      field_name: "location_date",
      label_ru: "Место и дата:",
      extraction_rules: { type: "regex", pattern: "Место и дата:[\\s\\n]+([^\\n]+)" }
    },
    {
      field_name: "gtd_number",
      label_ru: "№ ГТД:",
      extraction_rules: { type: "regex", pattern: "№ ГТД:[\\s\\n]+([0-9/]+)" }
    },
    {
      field_name: "contract_date",
      label_ru: "№ и дата договора:",
      extraction_rules: { type: "regex", pattern: "№ и дата договора:[\\s\\n]+([^\\n]+)" }
    }
  ];

  const addPredefinedFields = async () => {
    if (!selectedTemplate) return;

    for (const field of predefinedFields) {
      try {
        await apiRequest(`/api/v1/admin/templates/${selectedTemplate.id}/fields`, {
          method: "POST",
          body: JSON.stringify(field),
        });
      } catch (error) {
        console.error("Error adding field:", field.field_name, error);
      }
    }

    queryClient.invalidateQueries({ 
      queryKey: ["/api/v1/admin/templates", selectedTemplate.id, "fields"] 
    });

    toast({
      title: "Fields added",
      description: "Russian customs declaration fields added successfully",
    });
  };

  const onSubmitTemplate = (data: TemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  const onSubmitField = (data: FieldFormData) => {
    if (editingField) {
      updateFieldMutation.mutate(data);
    } else {
      createFieldMutation.mutate(data);
    }
  };

  const openFieldDialog = (field?: TemplateField) => {
    if (field) {
      setEditingField(field);
      fieldForm.reset({
        field_name: field.field_name,
        label_ru: field.label_ru,
        extraction_rules: field.extraction_rules,
      });
    } else {
      setEditingField(null);
      fieldForm.reset();
    }
    setFieldDialogOpen(true);
  };

  const openUserDialog = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      userForm.reset({
        email: user.email,
        companyName: user.companyName,
        password: "", // Don't populate password
        is_superuser: user.is_superuser,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      userForm.reset();
    }
    setUserDialogOpen(true);
  };

  const onSubmitUser = (data: UserFormData) => {
    if (editingUser) {
      // Don't send password if it's empty when editing
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateUserMutation.mutate(updateData);
    } else {
      createUserMutation.mutate(data);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage declaration templates and extraction rules
            </p>
          </div>
          
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Declaration Template</DialogTitle>
                <DialogDescription>
                  Create a new template for customs declarations
                </DialogDescription>
              </DialogHeader>
              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-4">
                  <FormField
                    control={templateForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Russian Customs Declaration 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={templateForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Template</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Use this template for new declarations
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTemplateMutation.isPending}>
                      {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="fields">Template Fields</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Declaration Templates</CardTitle>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500 mb-4">No templates created yet</p>
                    <Button onClick={() => setTemplateDialogOpen(true)}>
                      Create your first template
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(template.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {template.is_active && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fields">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Template Fields</CardTitle>
                    {selectedTemplate && (
                      <p className="text-sm text-muted-foreground">
                        Editing: {selectedTemplate.name}
                      </p>
                    )}
                  </div>
                  {selectedTemplate && (
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={addPredefinedFields}
                        size="sm"
                      >
                        Add Russian Declaration Fields
                      </Button>
                      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Field
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {editingField ? "Edit Field" : "Add Field"}
                            </DialogTitle>
                            <DialogDescription>
                              Configure data extraction rules for this field
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...fieldForm}>
                            <form onSubmit={fieldForm.handleSubmit(onSubmitField)} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={fieldForm.control}
                                  name="field_name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Field Name (System)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g. declaration_number" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={fieldForm.control}
                                  name="label_ru"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Russian Label</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g. Номер декларации" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={fieldForm.control}
                                name="extraction_rules.type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Extraction Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select extraction method" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="regex">Regular Expression</SelectItem>
                                        <SelectItem value="keyword">Keyword Search</SelectItem>
                                        <SelectItem value="position">Position-based</SelectItem>
                                        <SelectItem value="line_contains">Line Contains</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={fieldForm.control}
                                name="extraction_rules.pattern"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Pattern/Keyword</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="e.g. ГРУЗОВАЯ ТАМОЖЕННАЯ ДЕКЛАРАЦИЯ\s+№\s*([A-Z0-9]+)" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <div className="text-xs text-muted-foreground">
                                      For regex: use capturing groups (). For keyword: enter the text to search for.
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setFieldDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={createFieldMutation.isPending || updateFieldMutation.isPending}>
                                  {editingField ? "Update Field" : "Add Field"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedTemplate ? (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500">Select a template to manage its fields</p>
                  </div>
                ) : fieldsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : templateFields.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500 mb-4">No fields configured for this template</p>
                    <div className="space-x-2">
                      <Button onClick={() => openFieldDialog()}>Add Custom Field</Button>
                      <Button variant="outline" onClick={addPredefinedFields}>
                        Add Russian Declaration Fields
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templateFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-medium">{field.label_ru}</h4>
                              <p className="text-sm text-gray-500">{field.field_name}</p>
                            </div>
                            <Badge variant="outline">
                              {field.extraction_rules?.type || 'N/A'}
                            </Badge>
                          </div>
                          {field.extraction_rules?.pattern && (
                            <p className="text-xs text-gray-400 mt-1 font-mono">
                              {field.extraction_rules.pattern}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openFieldDialog(field)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteFieldMutation.mutate(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="template-manager">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingUser ? "Edit User" : "Create User"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingUser ? "Update user information and permissions" : "Create a new user account"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...userForm}>
                        <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
                          <FormField
                            control={userForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="user@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Company Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Password {editingUser && "(leave empty to keep current)"}
                                </FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex space-x-4">
                            <FormField
                              control={userForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Active User</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Allow user to log in
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={userForm.control}
                              name="is_superuser"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Admin User</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Grant admin permissions
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                              {editingUser ? "Update User" : "Create User"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500 mb-4">No users found</p>
                    <Button onClick={() => setUserDialogOpen(true)}>
                      Create first user
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">{user.email}</h3>
                            <p className="text-sm text-gray-500">{user.companyName}</p>
                            <p className="text-xs text-gray-400">
                              Created: {format(new Date(user.createdAt), "PPP")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {user.is_superuser && (
                              <Badge variant="default">Admin</Badge>
                            )}
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openUserDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteUserMutation.mutate(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}