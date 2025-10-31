
// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import startMqttSubscriber from "./mqttSubscriber.js";
// import alertRoutes from "./routes/alertRoutes.js";
// import authRoutes from "./routes/authRoutes.js";
// import sensorRoutes from "./routes/sensorRoutes.js";
// import cors from "cors";

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.get("/", (req, res) => res.send("API running..."));

// app.use("/api/alerts", alertRoutes);
// app.use("/api/users", authRoutes); 
// app.use("/api/sensors", sensorRoutes);

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", (socket) => {
//   console.log("Frontend connected:", socket.id);

//   socket.on("get-history", async ({ limit = 50 } = {}) => {
//     const Reading = (await import("./models/SensorData.js")).default;
//     const docs = await Reading.find().sort({ createdAt: -1 }).limit(limit).lean();
//     socket.emit("history", docs.reverse());
//   });
// });

// (async function start() {
//   try {
//     await connectDB();
//     startMqttSubscriber(io);

//     const PORT = process.env.PORT || 5000;
//     server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   } catch (err) {
//     console.error("Failed to start server", err);
//     process.exit(1);
//   }
// })();

// export { io };

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

/* ✅ Step 1: Define allowed origins */
const allowedOrigins = [
  "http://localhost:5173", // Local frontend
  "https://construction-hazard-frontend.vercel.app", // Deployed frontend
  "https://construction-hazard-backend.onrender.com", // Backend itself
];

/* ✅ Step 2: Configure CORS */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman) or whitelisted ones
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ Blocked by CORS: ${origin}`);
      callback(new Error("CORS not allowed from this origin"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

/* ✅ Step 3: Basic API Routes */
app.get("/", (req, res) =>
  res.send("✅ Construction Hazard API is running and CORS-enabled!")
);
app.use("/api/alerts", alertRoutes);
app.use("/api/users", authRoutes);
app.use("/api/sensors", sensorRoutes);

/* ✅ Step 4: Create HTTP + Socket.io server */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/* ✅ Step 5: Handle Socket.io connections */
io.on("connection", (socket) => {
  console.log("⚡ Frontend connected:", socket.id);

  socket.on("get-history", async ({ limit = 50 } = {}) => {
    try {
      const Reading = (await import("./models/SensorData.js")).default;
      const docs = await Reading.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      socket.emit("history", docs.reverse());
    } catch (err) {
      console.error("Error fetching history:", err.message);
      socket.emit("error", "Failed to fetch sensor history");
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`⚠️ Socket disconnected: ${socket.id}, reason: ${reason}`);
  });
});

/* ✅ Step 6: Start Server + MongoDB + MQTT */
(async function start() {
  try {
    await connectDB();
    startMqttSubscriber(io);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();

export { io };
