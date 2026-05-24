import { Router } from "express";
import * as graph from "../controllers/graph.controller";

const router = Router();

// All graph endpoints are public — visualization doesn't require login
router.get("/",            graph.getGraph);         // full graph with optional filters
router.get("/filters",     graph.getFilterOptions); // available filter values
router.get("/node/:id",    graph.getNode);          // single node + connections

export default router;
