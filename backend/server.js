require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, getDBStatus } = require("./config/db");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET"],
  })
);

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