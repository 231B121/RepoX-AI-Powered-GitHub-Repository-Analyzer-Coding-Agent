const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Repository" },
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: "Scan" },
    agentRunId: { type: mongoose.Schema.Types.ObjectId, ref: "AgentRun" },
    action: { type: String, required: true }, // e.g. "SCAN_STARTED", "PR_CREATED"
    outcome: { type: String, enum: ["SUCCESS", "FAILURE", "BLOCKED"], required: true },
    detail: String, // short, human-readable — NEVER raw file content or secrets
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);