import mqtt from "mqtt";
import SensorData from "../models/SensorData.js";
import { io } from "../server.js";   

const client = mqtt.connect("mqtt://broker.hivemq.com");
const topic = "construction/hazard";

client.on("connect", () => {
  console.log(" Connected to MQTT broker, subscribing to:", topic);
  client.subscribe(topic);
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    const sensorData = new SensorData({
      dustDensity: data.dustDensity,
      vibration: data.vibration,
      timestamp: data.timestamp,
      raw: data, 
    });

    await sensorData.save();

    
    io.emit("newSensorData", sensorData);

    console.log("Saved & broadcasted:", sensorData);
  } catch (err) {
    console.error("MQTT message error:", err);
  }
});

