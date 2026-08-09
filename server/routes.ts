import type { Express } from "express";
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { storage } from "./storage";
import { insertCostProfileSchema, insertRegionSchema } from "@shared/schema";
import { NATIONAL_CONTEXT } from "./seed-data";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/regions", async (_req, res) => {
    const data = await storage.getRegions();
    res.json(data);
  });

  app.get("/api/regions/:id", async (req, res) => {
    const region = await storage.getRegion(req.params.id);
    if (!region) return res.status(404).json({ message: "Region not found" });
    res.json(region);
  });

  app.patch("/api/regions/:id", async (req, res) => {
    const parsed = insertRegionSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid region patch", errors: parsed.error.flatten() });
    const updated = await storage.updateRegion(req.params.id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Region not found" });
    res.json(updated);
  });

  app.get("/api/cost-profiles", async (req, res) => {
    const regionId = typeof req.query.regionId === "string" ? req.query.regionId : undefined;
    const data = await storage.getCostProfiles(regionId);
    res.json(data);
  });

  app.get("/api/cost-profiles/:id", async (req, res) => {
    const profile = await storage.getCostProfile(Number(req.params.id));
    if (!profile) return res.status(404).json({ message: "Cost profile not found" });
    res.json(profile);
  });

  app.patch("/api/cost-profiles/:id", async (req, res) => {
    const parsed = insertCostProfileSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid cost profile patch", errors: parsed.error.flatten() });
    const updated = await storage.updateCostProfile(Number(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "Cost profile not found" });
    res.json(updated);
  });

  app.post("/api/cost-profiles", async (req, res) => {
    const parsed = insertCostProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid cost profile", errors: parsed.error.flatten() });
    const created = await storage.createCostProfile(parsed.data);
    res.status(201).json(created);
  });

  app.get("/api/national-context", async (_req, res) => {
    res.json(NATIONAL_CONTEXT);
  });

  return httpServer;
}
