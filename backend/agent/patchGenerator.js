const { getFileContent } = require("../github/repository");
const Repository = require("../models/Repository");
const Issue = require("../models/Issue");
const AgentRun = require("../models/AgentRun");
const { scanForInjection } = require("../security/injectionScanner");
const { logAction } = require("../core/audit");
const { getAgentClient } = require("./client");

const SYSTEM_PROMPT = `You are an automated code fix agent.
Your task is to fix the reported issue in the provided file.
Return ONLY the full updated content of the file. Do not include markdown code fences, comments outside the code, or explanations.`;

async function generatePatch(agentRunId) {
  const agentRun = await AgentRun.findById(agentRunId);
  if (!agentRun) {
    throw new Error("Agent run not found");
  }

  const issue = await Issue.findById(agentRun.issueId);
  if (!issue) {
    throw new Error("Issue not found");
  }

  const repository = await Repository.findById(agentRun.repositoryId);
  if (!repository) {
    throw new Error("Repository not found");
  }

  if (!issue.filePath) {
    agentRun.status = "BLOCKED";
    agentRun.errorMessage = "Issue does not specify a filePath";
    await agentRun.save();
    return agentRun;
  }

  agentRun.status = "GENERATING_PATCH";
  await agentRun.save();

  try {
    const fileContent = await getFileContent(
      repository.owner,
      repository.repo,
      issue.filePath,
      repository.defaultBranch
    );

    // after fetching fileContent:
    const injectionCheck = scanForInjection(fileContent);
    if (injectionCheck.suspicious) {
      console.warn(`Possible prompt injection detected in ${issue.filePath}:`, injectionCheck.matches);
      logAction({
        repositoryId: repository._id,
        agentRunId: agentRun._id,
        action: "PROMPT_INJECTION_DETECTED",
        outcome: "BLOCKED",
        detail: `Suspicious pattern detected in ${issue.filePath}: ${injectionCheck.matches.join(", ")}`,
      });
      // Flag it, don't block it — Day 6's system prompt hierarchy is the real defense.
      // This is a logged tripwire for human review, not a hard stop.
    }

    const prompt = `Issue to fix:
Title: ${issue.title}
Category: ${issue.category}
Severity: ${issue.severity}
Description: ${issue.description}
Evidence: ${issue.evidence || ""}
Recommendation: ${issue.recommendation || ""}

File: ${issue.filePath}
Original Content:
${fileContent}

Provide the complete updated file content that fixes this issue:`;

    const agent = getAgentClient();
    let proposedContent = await agent.generate({
      system: SYSTEM_PROMPT,
      prompt,
    });

    if (proposedContent.includes("```")) {
      const match = proposedContent.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)\n```/);
      if (match) {
        proposedContent = match[1];
      } else {
        proposedContent = proposedContent.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "");
      }
    }

    agentRun.status = "PATCH_READY";
    agentRun.allowedFiles = [issue.filePath];
    agentRun.proposedContent = proposedContent.trim();
    await agentRun.save();

    return agentRun;
  } catch (err) {
    agentRun.status = "FAILED";
    agentRun.errorMessage = err.message;
    await agentRun.save();
    throw err;
  }
}

module.exports = { generatePatch };
