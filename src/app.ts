import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import apiRouter from "./routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.get("/", (_req, res) => {
  res.json({ name: "afterfall-api", status: "running" });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Basic error translator so unexpected errors are still JSON
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error("[api] unhandled error", error);
  res.status(500).json({ message });
});
