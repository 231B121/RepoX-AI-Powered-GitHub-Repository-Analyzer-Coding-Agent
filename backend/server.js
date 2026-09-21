require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const { connectDB, getDBStatus } = require("./config/db");
const repositoryRoutes = require("./routes/repositoryRoutes");
const scanRoutes = require("./routes/scanRoutes");
const issueRoutes = require("./routes/issueRoutes");
const fixRoutes = require("./routes/fixRoutes");
const requestLogger = require("./middleware/requestLogger");

const app = express();   // 👈 pehle app banao

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(requestLogger);

// 👇 ab saari routes yahan, app ke ban jaane ke baad
app.use("/api/repositories", repositoryRoutes);
app.use("/api", scanRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/fix", fixRoutes);
app.use("/api/fixes", fixRoutes);   // 👈 ye line yahan aayi

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