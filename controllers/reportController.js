


import SensorData from "../models/SensorData.js";
import { Parser } from "json2csv";


const thresholds = {
  dustDensity: { warning: 70, critical: 150 },
  vibration: { warning: 1.0, critical: 2.0 },
};

const getStatus = (value, type) => {
  if (type === "dustDensity") {
    if (value > thresholds.dustDensity.critical) return "critical";
    if (value > thresholds.dustDensity.warning) return "warning";
    return "normal";
  }
  if (type === "vibration") {
    if (value > thresholds.vibration.critical) return "critical";
    if (value > thresholds.vibration.warning) return "warning";
    return "normal";
  }
  return "normal";
};

export const downloadReport = async (req, res) => {
  try {
    const { from, to, sensor } = req.query;

    if (!from || !to || !sensor)
      return res.status(400).json({ success: false, message: "from, to, and sensor are required" });

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const projection = { createdAt: 1 };
    if (sensor === "vibration") projection.vibration = 1;
    else if (sensor === "dustDensity") projection.dustDensity = 1;
    else return res.status(400).json({ success: false, message: "Invalid sensor type" });

    const sensors = await SensorData.find({
      createdAt: { $gte: fromDate, $lte: toDate },
    })
      .sort({ createdAt: 1 })
      .select(projection);

    if (!sensors.length) return res.status(404).json({ success: false, message: "No records found" });

    const rows = sensors.map((doc) => {
      const value = sensor === "vibration" ? doc.vibration : doc.dustDensity;
      const status = getStatus(value, sensor);
      return {
        Timestamp: doc.createdAt.toISOString(),
        Value: value?.toFixed(2),
        Status: status.toUpperCase(),
      };
    });

    const parser = new Parser({ fields: ["Timestamp", "Value", "Status"] });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`${sensor}_report_${from}_to_${to}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Error generating CSV:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
