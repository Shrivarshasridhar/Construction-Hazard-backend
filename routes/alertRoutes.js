


import express from "express";
import Alert from "../models/Alert.js";

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ timestamp: -1 }) 
      .limit(5); 
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
});


router.post("/", async (req, res) => {
  try {
    const { type, message, severity } = req.body;
    if (!type || !message) return res.status(400).json({ message: "Type and message required" });

    const alert = new Alert({
      type,
      message,
      severity: severity || "info",
    });

    await alert.save();
    res.status(201).json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save alert" });
  }
});

export default router;
