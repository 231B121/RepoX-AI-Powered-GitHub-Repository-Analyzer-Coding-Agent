require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, getDBStatus } = require("./config/db");
const repositoryRoutes = require("./routes/repositoryRoutes");
const scanRoutes = require("./routes/scanRoutes");
const issueRoutes = require("./routes/issueRoutes");
const fixRoutes = require("./routes/fixRoutes");

const app = express();   // 👈 pehle app banao

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// 👇 ab saari routes yahan, app ke ban jaane ke baad
app.use("/api/repositories", repositoryRoutes);
app.use("/api", scanRoutes);
app.use("/api/issues", issueRoutes);
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