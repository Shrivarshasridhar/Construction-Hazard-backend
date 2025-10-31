import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ["info", "warning", "critical"], 
    default: "info" 
  },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Alert", alertSchema);
