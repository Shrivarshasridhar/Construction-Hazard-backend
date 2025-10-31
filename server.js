
import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import startMqttSubscriber from "./mqttSubscriber.js";
import alertRoutes from "./routes/alertRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API running..."));

app.use("/api/alerts", alertRoutes);
app.use("/api/users", authRoutes); 
app.use("/api/sensors", sensorRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);

  socket.on("get-history", async ({ limit = 50 } = {}) => {
    const Reading = (await import("./models/SensorData.js")).default;
    const docs = await Reading.find().sort({ createdAt: -1 }).limit(limit).lean();
    socket.emit("history", docs.reverse());
  });
});

(async function start() {
  try {
    await connectDB();
    startMqttSubscriber(io);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
})();

export { io };
