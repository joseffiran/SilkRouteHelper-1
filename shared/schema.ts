import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  companyName: text("company_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  extractedData: jsonb("extracted_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Phase 1: Universal Template System
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  version: text("version").default("1.0"),
  outputFormat: text("output_format").default("JSON"),
  isActive: boolean("is_active").default(false),
  configJson: text("config_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const templateFields = pgTable("template_fields", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => templates.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // text, number, date, dropdown, checkbox, file, calculated
  position: integer("position").notNull(),
  required: boolean("required").default(false),
  defaultValue: text("default_value"),
  validationRules: text("validation_rules"), // JSON array
  displayConfig: text("display_config"), // JSON for UI positioning, styling
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentTypes = pgTable("document_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  filePatterns: text("file_patterns"), // JSON array of regex patterns
  extractionConfig: text("extraction_config"), // JSON configuration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documentFields = pgTable("document_fields", {
  id: serial("id").primaryKey(),
  documentTypeId: integer("document_type_id").notNull().references(() => documentTypes.id),
  name: text("name").notNull(),
  aliases: text("aliases"), // JSON array of alternative field names
  dataType: text("data_type").notNull(),
  extractionPatterns: text("extraction_patterns"), // JSON regex, coordinates, keywords
  validationRules: text("validation_rules"), // JSON validation rules
  confidenceThreshold: integer("confidence_threshold").default(80),
  fallbackStrategies: text("fallback_strategies"), // JSON array
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fieldMappings = pgTable("field_mappings", {
  id: serial("id").primaryKey(),
  sourceDocumentType: integer("source_document_type").notNull().references(() => documentTypes.id),
  sourceField: integer("source_field").notNull().references(() => documentFields.id),
  targetTemplate: integer("target_template").notNull().references(() => templates.id),
  targetField: integer("target_field").notNull().references(() => templateFields.id),
  transformationRule: text("transformation_rule"),
  priority: integer("priority").default(1),
  conditions: text("conditions"), // JSON for conditional mapping
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  hashedPassword: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateFieldSchema = createInsertSchema(templateFields).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentTypeSchema = createInsertSchema(documentTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentFieldSchema = createInsertSchema(documentFields).omit({
  id: true,
  createdAt: true,
});

export const insertFieldMappingSchema = createInsertSchema(fieldMappings).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplateField = z.infer<typeof insertTemplateFieldSchema>;
export type TemplateField = typeof templateFields.$inferSelect;
export type InsertDocumentType = z.infer<typeof insertDocumentTypeSchema>;
export type DocumentType = typeof documentTypes.$inferSelect;
export type InsertDocumentField = z.infer<typeof insertDocumentFieldSchema>;
export type DocumentField = typeof documentFields.$inferSelect;
export type InsertFieldMapping = z.infer<typeof insertFieldMappingSchema>;
export type FieldMapping = typeof fieldMappings.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type TokenResponse = z.infer<typeof tokenSchema>;
