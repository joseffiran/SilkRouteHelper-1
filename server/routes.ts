import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the FastAPI backend server
  const backendPath = path.join(process.cwd(), "backend");
  const pythonProcess = spawn("python", ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"], {
    cwd: backendPath,
    stdio: "inherit",
  });

  // Proxy API requests to FastAPI backend
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
