import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  dustThreshold: { type: Number, default: 70 },
  vibrationThreshold: { type: Number, default: 1.0 }, 
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);
