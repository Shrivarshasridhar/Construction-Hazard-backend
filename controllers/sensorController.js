


import SensorData from "../models/SensorData.js";
import Settings from "../models/Settings.js";
import { Parser } from "json2csv";


export const getSensors = async (req, res) => {
  try {
    const { from, to, sensor } = req.query;
    if (!from || !to || !sensor)
      return res
        .status(400)
        .json({ success: false, message: "from, to, and sensor are required" });

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const projection = { createdAt: 1, status: 1 }; 
    if (sensor === "vibration") projection.vibration = 1;
    else if (sensor === "dustDensity") projection.dustDensity = 1;
    else
      return res.status(400).json({ success: false, message: "Invalid sensor type" });

    const sensors = await SensorData.find({
      createdAt: { $gte: fromDate, $lte: toDate }, 
    })
      .sort({ createdAt: 1 }) 
      .select(projection);

    res.json({ success: true, sensors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) return res.json({ success: true, settings: {} });
    res.json({ success: true, settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const updateSettings = async (req, res) => {
  try {
    const { dustThreshold, vibrationThreshold } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ dustThreshold, vibrationThreshold });
    } else {
      if (dustThreshold != null) settings.dustThreshold = dustThreshold;
      if (vibrationThreshold != null)
        settings.vibrationThreshold = vibrationThreshold;
    }
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const downloadReport = async (req, res) => {
  try {
    const { from, to, sensor } = req.query;
    if (!from || !to || !sensor)
      return res
        .status(400)
        .json({ success: false, message: "from, to, and sensor are required" });

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const projection = { createdAt: 1, status: 1 }; 
    if (sensor === "vibration") projection.vibration = 1;
    else if (sensor === "dustDensity") projection.dustDensity = 1;
    else
      return res.status(400).json({ success: false, message: "Invalid sensor type" });

    const sensors = await SensorData.find({
      createdAt: { $gte: fromDate, $lte: toDate }, 
    })
      .sort({ createdAt: 1 })
      .select(projection);

    if (!sensors.length)
      return res
        .status(404)
        .json({ success: false, message: "No records found" });

    const rows = sensors.map((doc) => ({
      timestamp: doc.createdAt, 
      value: sensor === "vibration" ? doc.vibration : doc.dustDensity,
      status: doc.status,
    }));

    const parser = new Parser({ fields: ["timestamp", "value", "status"] });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`${sensor}_report_${from}_to_${to}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Error generating CSV:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
