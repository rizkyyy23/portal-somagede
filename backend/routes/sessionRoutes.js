import express from "express";
import {
  getAllSessions,
  createSession,
  deleteSession,
  deleteSessionByUserId,
  getDashboardStats,
} from "../controllers/sessionController.js";

const router = express.Router();

router.get("/sessions", getAllSessions);
router.post("/sessions", createSession);
router.delete("/sessions/user/:userId", deleteSessionByUserId);
router.delete("/sessions/:id", deleteSession);
router.get("/dashboard/stats", getDashboardStats);

export default router;
