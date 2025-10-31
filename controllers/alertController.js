import Alert from "../models/Alert.js";

export const getAlerts = async (req, res) => {
  const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
  res.json({ success: true, alerts });
};
