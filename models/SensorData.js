
import mongoose from "mongoose";

const sensorDataSchema = new mongoose.Schema({
  deviceId: { type: String, default: "unknown" }, 
  timestamp: { type: Date, default: Date.now },

  
  dustDensity: { type: Number, required: true },  
  vibration: { type: Number, required: true },    

  
  status: {
    type: String,
    enum: ["normal", "warning", "critical", "info"],
    default: "info",
  },

  
  raw: { type: mongoose.Schema.Types.Mixed }, 

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("SensorData", sensorDataSchema);
