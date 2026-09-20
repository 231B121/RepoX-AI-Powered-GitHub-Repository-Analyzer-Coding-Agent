const { validatePatch } = require("../agent/validator");
const { generatePatch } = require("../agent/patchGenerator");
const AgentRun = require("../models/AgentRun");
const Issue = require("../models/Issue");
const Scan = require("../models/Scan");

async function requestFix(req, res) {
  const issueId = req.params.id || req.params.issueId || req.body.issueId;
  const issue = await Issue.findById(issueId);
  if (!issue) {
    return res.status(404).json({ error: { message: "Issue not found" } });
  }

  let repositoryId = issue.repositoryId;
  if (!repositoryId && issue.scanId) {
    const scan = await Scan.findById(issue.scanId);
    if (scan) {
      repositoryId = scan.repositoryId;
      issue.repositoryId = repositoryId;
      await issue.save().catch(() => {});
    }
  }

  if (!repositoryId) {
    return res.status(400).json({ error: { message: "Repository ID could not be determined for this issue" } });
  }

  try {
    const agentRun = await AgentRun.create({
      issueId: issue._id,
      repositoryId,
      status: "PLANNING",
      allowedFiles: issue.filePath ? [issue.filePath] : [],
    });

    const updatedRun = await generatePatch(agentRun._id);

    return res.status(200).json({
      agentRunId: updatedRun._id,
      status: updatedRun.status,
      proposedContent: updatedRun.proposedContent,
      diff: updatedRun.diff || updatedRun.proposedContent,
      pullRequestUrl: updatedRun.pullRequestUrl || null,
    });
  } catch (err) {
    console.error("Fix generation error:", err.message);
    return res.status(500).json({ error: { message: err.message } });
  }
}

async function validateFix(req, res) {
  const agentRun = await AgentRun.findById(req.params.agentRunId);
  if (!agentRun) {
    return res.status(404).json({ error: { message: "Agent run not found" } });
  }
  if (agentRun.status !== "PATCH_READY") {
    return res.status(400).json({
      error: { message: `Cannot validate a run with status ${agentRun.status}` },
    });
  }

  try {
    const result = await validatePatch(agentRun);

    agentRun.status = result.passed ? "VALIDATED" : "VALIDATION_FAILED";
    agentRun.validationOutput = result.output;
    await agentRun.save();

    return res.json({
      agentRunId: agentRun._id,
      status: agentRun.status,
      exitCode: result.exitCode,
      output: result.output,
      pullRequestUrl: agentRun.pullRequestUrl || null,
    });
  } catch (err) {
    console.error("Sandbox validation error:", err.message);
    return res.status(502).json({ error: { message: "Validation could not be completed", retryable: true } });
  }
}

async function createPullRequest(req, res) {
  const { agentRunId } = req.params;
  const agentRun = await AgentRun.findById(agentRunId);
  if (!agentRun) {
    return res.status(404).json({ error: { message: "Agent run not found" } });
  }

  if (agentRun.pullRequestUrl) {
    return res.json({
      agentRunId: agentRun._id,
      pullRequestUrl: agentRun.pullRequestUrl,
      status: agentRun.status,
      alreadyCreated: true,
    });
  }

  const Repository = require("../models/Repository");
  const repository = await Repository.findById(agentRun.repositoryId);
  if (!repository) {
    return res.status(404).json({ error: { message: "Repository record not found" } });
  }

  const issue = await Issue.findById(agentRun.issueId);
  if (!issue) {
    return res.status(404).json({ error: { message: "Associated issue not found" } });
  }

  try {
    const filePath = (agentRun.allowedFiles && agentRun.allowedFiles[0]) || issue.filePath;
    const { submitPullRequest } = require("../github/prService");

    const result = await submitPullRequest({
      owner: repository.owner,
      repo: repository.repo,
      defaultBranch: repository.defaultBranch || "main",
      issueId: issue._id,
      issueTitle: issue.title,
      issueDescription: issue.description,
      category: issue.category,
      severity: issue.severity,
      filePath,
      newContent: agentRun.proposedContent,
    });

    agentRun.pullRequestUrl = result.pullRequestUrl;
    await agentRun.save();

    return res.status(200).json({
      agentRunId: agentRun._id,
      pullRequestUrl: result.pullRequestUrl,
      branchName: result.branchName,
      status: agentRun.status,
    });
  } catch (err) {
    console.error("PR creation error:", err.message);
    let userMsg = `Failed to create Pull Request on GitHub: ${err.message}`;
    if (err.message && (err.message.includes("Resource not accessible") || err.status === 403)) {
      userMsg = "GitHub Token Permission Error: Your GitHub Personal Access Token is currently Read-Only. To create branches and open Pull Requests, please update your token on GitHub with 'Contents: Read & write' and 'Pull requests: Read & write' permissions.";
    }
    return res.status(500).json({
      error: {
        message: userMsg,
      },
    });
  }
}

module.exports = { requestFix, validateFix, createPullRequest };