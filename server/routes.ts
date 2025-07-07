import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import path from "path";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the FastAPI backend server
  const backendPath = path.join(process.cwd(), "backend");
  const pythonProcess = spawn("python", ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"], {
    cwd: backendPath,
    stdio: "inherit",
  });

  // Phase 1: Universal Template System API Routes
  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/declarations/templates", {
        headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {}
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch templates" });
      }
      
      const templates = await response.json();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Template service unavailable" });
    }
  });

  // Phase 1 Step 2: Document Type Configuration API Routes
  // Get all document types
  app.get("/api/document-types", async (req, res) => {
    try {
      // For now, return mock data since backend doesn't have document types yet
      const documentTypes = [
        {
          id: 1,
          name: "Russian Customs Declaration",
          category: "customs",
          description: "Russian Federation customs declaration form",
          file_extensions: [".pdf", ".jpg", ".png"],
          ocr_config: {
            language: "rus+eng",
            preprocessing: true,
            confidence_threshold: 0.8
          },
          validation_rules: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: "Commercial Invoice",
          category: "invoice",
          description: "International commercial invoice document",
          file_extensions: [".pdf", ".doc", ".docx"],
          ocr_config: {
            language: "auto",
            preprocessing: true,
            confidence_threshold: 0.85
          },
          validation_rules: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          name: "Shipping Manifest",
          category: "shipping",
          description: "Cargo shipping manifest and bill of lading",
          file_extensions: [".pdf", ".xlsx"],
          ocr_config: {
            language: "eng",
            preprocessing: true,
            confidence_threshold: 0.9
          },
          validation_rules: [],
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      res.json(documentTypes);
    } catch (error) {
      res.status(500).json({ error: "Document type service unavailable" });
    }
  });

  // Create document type
  app.post("/api/document-types", async (req, res) => {
    try {
      // Mock creation for now
      const newDocumentType = {
        id: Date.now(),
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      res.status(201).json(newDocumentType);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document type" });
    }
  });

  // Update document type
  app.put("/api/document-types/:id", async (req, res) => {
    try {
      const updatedDocumentType = {
        id: parseInt(req.params.id),
        ...req.body,
        updated_at: new Date().toISOString()
      };
      res.json(updatedDocumentType);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document type" });
    }
  });

  // Delete document type
  app.delete("/api/document-types/:id", async (req, res) => {
    try {
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document type" });
    }
  });

  // Get template by ID
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/declarations/templates/${req.params.id}/preview`, {
        headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {}
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Template not found" });
      }
      
      const template = await response.json();
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Template service unavailable" });
    }
  });

  // Setup multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // Handle file upload endpoints specifically
  app.post("/api/v1/shipments/:id/documents", upload.single('file'), async (req, res) => {
    try {
      const backendUrl = `http://localhost:8000/api/v1/shipments/${req.params.id}/documents`;
      
      const formData = new FormData();
      
      if (req.file) {
        formData.append('file', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });
      }
      
      if (req.body.document_type) {
        formData.append('document_type', req.body.document_type);
      }
      
      const headers: Record<string, string> = {
        ...formData.getHeaders(), // Get proper boundary headers from form-data
      };
      
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      const data = await response.text();
      res.status(response.status);
      res.set("Content-Type", response.headers.get("content-type") || "application/json");
      res.send(data);
    } catch (error) {
      console.error("File upload proxy error:", error);
      res.status(500).json({ error: "File upload failed" });
    }
  });

  // Proxy all other API requests to FastAPI backend
  app.use("/api", async (req, res) => {
    try {
      const backendUrl = `http://localhost:8000${req.originalUrl}`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      
      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };
      
      if (req.method !== "GET" && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
      
      const response = await fetch(backendUrl, fetchOptions);
      const data = await response.text();
      
      res.status(response.status);
      res.set("Content-Type", response.headers.get("content-type") || "application/json");
      res.send(data);
    } catch (error) {
      console.error("Backend proxy error:", error);
      res.status(500).json({ error: "Backend service unavailable" });
    }
  });

  const httpServer = createServer(app);

  // Cleanup on exit
  process.on("exit", () => {
    pythonProcess.kill();
  });

  return httpServer;
}
