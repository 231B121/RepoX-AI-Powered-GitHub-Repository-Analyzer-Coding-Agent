const AgentRun = require("../models/AgentRun");

function computeAllowedFiles(issue) {
  const allowed = [];
  if (issue.filePath) {
    allowed.push(issue.filePath);
  }
  // Deliberately conservative today: single-file fixes only.
  return allowed;
}

async function planFix(issue) {
  const allowedFiles = computeAllowedFiles(issue);

  if (allowedFiles.length === 0) {
    throw new Error("This issue has no associated file — cannot generate a code fix.");
  }

  const agentRun = await AgentRun.create({
    issueId: issue._id,
    repositoryId: issue.repositoryId,
    status: "PLANNING",
    allowedFiles,
  });

  return agentRun;
}

module.exports = { planFix, computeAllowedFiles };