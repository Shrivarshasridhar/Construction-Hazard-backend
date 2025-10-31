


import express from "express";
import { getSensors, updateSettings, getSettings } from "../controllers/sensorController.js";
import { downloadReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/", protect, getSensors);


router.get("/settings", protect, getSettings);


router.put("/settings", protect, updateSettings);


router.get("/download", protect, downloadReport);

export default router;
