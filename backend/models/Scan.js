const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Repository", required: true },
    commitSha: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    startedAt: Date,
    completedAt: Date,
    errorMessage: String,
    totalIssues: { type: Number, default: 0 },
    byCategory: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scan", scanSchema);