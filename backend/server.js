require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, getDBStatus } = require("./config/db");
const repositoryRoutes = require("./routes/repositoryRoutes");
const scanRoutes = require("./routes/scanRoutes");
const issueRoutes = require("./routes/issueRoutes");
const fixRoutes = require("./routes/fixRoutes");
const scanQueue = require("./queue/scanQueue");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// Embedded scan worker for single-service deployments (e.g. Render Web Service)
if (process.env.SEPARATE_WORKER !== "true") {
  if (scanQueue) {
    const { runFullScan } = require("./jobs/runFullScan");
    try {
      scanQueue.process(async (job) => {
        console.log(`[Worker] Processing scan ${job.data.scanId}`);
        await runFullScan(job.data.scanId);
      });
      console.log("Embedded scan worker registered on Bull queue");
    } catch (workerErr) {
      console.warn("Could not register embedded worker on Bull queue:", workerErr.message);
    }
  } else {
    console.log("Bull queue inactive (no external Redis). Direct asynchronous scanner active.");
  }
}


app.use("/api/repositories", repositoryRoutes);
app.use("/api", scanRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/fixes", fixRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "GitHub Repo Doctor",
    database: getDBStatus(),
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  })
  .finally(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });