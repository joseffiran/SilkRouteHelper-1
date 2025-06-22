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
  app.use("/api", (req, res) => {
    const backendUrl = `http://localhost:8000${req.originalUrl}`;
    
    fetch(backendUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
      } as HeadersInit,
      body: req.method === "GET" ? undefined : JSON.stringify(req.body),
    })
      .then(async (response) => {
        const data = await response.text();
        res.status(response.status);
        res.set(Object.fromEntries(response.headers.entries()));
        res.send(data);
      })
      .catch((error) => {
        console.error("Backend proxy error:", error);
        res.status(500).json({ error: "Backend service unavailable" });
      });
  });

  const httpServer = createServer(app);

  // Cleanup on exit
  process.on("exit", () => {
    pythonProcess.kill();
  });

  return httpServer;
}
