import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { router } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

// Serve demo page
app.use(express.static(path.join(__dirname, "../public")));

// Security headers (skip for demo page)
app.use(helmet());

// CORS — allow the configured frontend origin
const allowedOrigins = [env.corsOrigin, `http://localhost:${env.port}`];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Parse JSON bodies
app.use(express.json());

// Health check (no auth needed)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// All API routes mounted under /api
app.use("/api", router);

// Centralized error handler — must be last
app.use(errorHandler);
