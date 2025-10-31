
import mqtt from "mqtt";
import SensorData from "./models/SensorData.js";
import Alert from "./models/Alert.js";
import Settings from "./models/Settings.js";
import { sendAlertEmail } from "./services/emailService.js";

export default function startMqttSubscriber(io) {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const opts = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    protocolVersion: 4, // MQTT 3.1.1
    reconnectPeriod: 2000,
  };
  const client = mqtt.connect(brokerUrl, opts);

  const emailCooldown = new Map();
  const EMAIL_COOLDOWN_MS = (Number(process.env.EMAIL_COOLDOWN_MINUTES) || 30) * 60 * 1000;

  function shouldSendEmail(key) {
    const now = Date.now();
    const last = emailCooldown.get(key) || 0;
    if (now - last > EMAIL_COOLDOWN_MS) {
      emailCooldown.set(key, now);
      return true;
    }
    return false;
  }

  client.on("connect", () => {
    console.log("[MQTT] Connected to broker:", brokerUrl);
    client.subscribe("construction/hazard", { qos: 1 }, (err) => {
      if (err) console.error("[MQTT] Subscribe error:", err);
      else console.log("[MQTT] Subscribed to topic: construction/hazard");
    });
  });

  client.on("reconnect", () => console.log("[MQTT] Reconnecting..."));
  client.on("error", (err) => console.error("[MQTT] Error:", err));

  client.on("message", async (topic, payload) => {
    try {
      const raw = payload.toString();
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (e) {
        console.warn("[MQTT] Invalid JSON, ignoring:", raw);
        return;
      }

      const doc = {
        deviceId: msg.deviceId || (topic.split("/")[1] ?? "unknown"),
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        dustDensity: msg.dustDensity != null
          ? Number(msg.dustDensity)
          : msg.dust != null
            ? Number(msg.dust)
            : 0,
        vibration: msg.vibration != null ? Number(msg.vibration) : 0,
        vibrationVoltage: msg.vibrationVoltage != null ? Number(msg.vibrationVoltage) : undefined,
        raw: msg,
      };

      const saved = await SensorData.create(doc);

      if (io) io.emit("newSensorData", saved);
      console.log("[MQTT] Saved & emitted:", saved._id);

      try {
        const settings = await Settings.findOne().lean();
        const dustThresh = settings?.dustThreshold ?? 70;
        const vibThresh = settings?.vibrationThreshold ?? 1.0;

        if (saved.dustDensity != null && saved.dustDensity > dustThresh) {
          const severity = saved.dustDensity > dustThresh * 2 ? "critical" : "warning";
          const alert = await Alert.create({
            type: "dust",
            message: `Dust threshold crossed on ${saved.deviceId}: ${saved.dustDensity}`,
            severity,
            timestamp: new Date(),
          });
          if (io) io.emit("newAlert", alert);
          console.log("[ALERT] Dust alert created:", alert._id);

          const key = `${saved.deviceId}:dust`;
          if (shouldSendEmail(key)) {
            const subject = `ALERT: Dust ${severity.toUpperCase()} on ${saved.deviceId}`;
            const text = `Device: ${saved.deviceId}\nType: Dust\nSeverity: ${severity}\nValue: ${saved.dustDensity}\nTime: ${new Date().toLocaleString()}`;
            sendAlertEmail(subject, text);
          } else {
            console.log("[ALERT] Dust email suppressed (cooldown).");
          }
        }

        if (saved.vibration != null && saved.vibration > vibThresh) {
          const severity = saved.vibration > vibThresh * 2 ? "critical" : "warning";
          const alert = await Alert.create({
            type: "vibration",
            message: `Vibration threshold crossed on ${saved.deviceId}: ${saved.vibration}`,
            severity,
            timestamp: new Date(),
          });
          if (io) io.emit("newAlert", alert);
          console.log("[ALERT] Vibration alert created:", alert._id);

          const key = `${saved.deviceId}:vibration`;
          if (shouldSendEmail(key)) {
            const subject = `ALERT: Vibration ${severity.toUpperCase()} on ${saved.deviceId}`;
            const text = `Device: ${saved.deviceId}\nType: Vibration\nSeverity: ${severity}\nValue: ${saved.vibration}\nTime: ${new Date().toLocaleString()}`;
            sendAlertEmail(subject, text);
          } else {
            console.log("[ALERT] Vibration email suppressed (cooldown).");
          }
        }
      } catch (errAlert) {
        console.error("[MQTT] Alert check error:", errAlert);
      }
    } catch (err) {
      console.error("[MQTT] Message handling error:", err);
    }
  });

  return client;
}
