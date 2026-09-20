const { getFileContent } = require("../github/repository");
const Repository = require("../models/Repository");
const Scan = require("../models/Scan");
const { scanForInjection } = require("../security/injectionScanner");
const { logAction } = require("../core/audit");

async function buildContext(issue) {
  let repositoryId = issue.repositoryId;
  if (!repositoryId && issue.scanId) {
    const scan = await Scan.findById(issue.scanId);
    if (scan) {
      repositoryId = scan.repositoryId;
      issue.repositoryId = repositoryId;
      await issue.save().catch(() => {});
    }
  }

  const repository = await Repository.findById(repositoryId);
  if (!repository) {
    throw new Error("Repository not found for this issue");
  }

  const targetFilePath = issue.filePath || (issue.category === "DEPENDENCY" ? "package.json" : null);

  if (!issue.filePath && targetFilePath) {
    issue.filePath = targetFilePath;
    await issue.save().catch(() => {});
  }

  let fileContent = null;
  if (targetFilePath) {
    try {
      fileContent = await getFileContent(
        repository.owner,
        repository.repo,
        targetFilePath,
        repository.defaultBranch
      );
      // Cap size — never send an enormous file whole
      if (fileContent.length > 8000) {
        fileContent = fileContent.slice(0, 8000) + "\n... [truncated]";
      }

      // after fetching fileContent:
      const injectionCheck = scanForInjection(fileContent);
      if (injectionCheck.suspicious) {
        console.warn(`Possible prompt injection detected in ${targetFilePath}:`, injectionCheck.matches);
        logAction({
          repositoryId: issue.repositoryId,
          action: "PROMPT_INJECTION_DETECTED",
          outcome: "BLOCKED",
          detail: `Suspicious pattern detected in ${targetFilePath}: ${injectionCheck.matches.join(", ")}`,
        });
        // Flag it, don't block it — Day 6's system prompt hierarchy is the real defense.
        // This is a logged tripwire for human review, not a hard stop.
      }
    } catch {
      fileContent = null; // file might have moved/been deleted since the scan
    }
  }

  return {
    repoLanguage: repository.language,
    filePath: targetFilePath,
    fileContent, // null if unavailable — reasoningService must handle this
  };
}

module.exports = { buildContext };