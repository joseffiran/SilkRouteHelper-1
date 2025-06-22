import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import path from "path";
import multer from "multer";
import FormData from "form-data";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the FastAPI backend server
  const backendPath = path.join(process.cwd(), "backend");
  const pythonProcess = spawn("python", ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"], {
    cwd: backendPath,
    stdio: "inherit",
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
      
      const headers: Record<string, string> = {};
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
