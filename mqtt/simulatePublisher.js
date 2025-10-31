
import mqtt from "mqtt";
import dotenv from "dotenv";
dotenv.config();

const broker = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com";
const client = mqtt.connect(broker);
const topic = "construction/hazard";

client.on("connect", () => {
  console.log("Simulator connected to broker:", broker);

  setInterval(() => {
    const payload = {
      deviceId: "esp32_01",
      timestamp: Date.now(),
      dust: +(Math.random() * 300).toFixed(2),           
      vibrationVoltage: +(Math.random() * 3.0).toFixed(3),
      temperature: +(20 + Math.random() * 10).toFixed(2),
      gasLevel: +(Math.random() * 100).toFixed(2)
    };
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) console.error("publish err", err);
    });
    console.log("Published:", payload);
  }, 5000);
});
