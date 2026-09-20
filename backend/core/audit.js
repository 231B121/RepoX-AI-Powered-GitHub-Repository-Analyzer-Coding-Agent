const AuditLog = require("../models/AuditLog");

async function logAction({ repositoryId, scanId, agentRunId, action, outcome, detail }) {
  try {
    await AuditLog.create({ repositoryId, scanId, agentRunId, action, outcome, detail });
  } catch (err) {
    // Audit logging must never crash the actual operation it's logging
    console.error("Failed to write audit log:", err.message);
  }
}

module.exports = { logAction };