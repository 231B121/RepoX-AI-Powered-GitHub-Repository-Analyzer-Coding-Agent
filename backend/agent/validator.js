const { prepareWorkdir, runInSandbox, cleanup } = require("../sandbox/runner");
const Repository = require("../models/Repository");
const Scan = require("../models/Scan");

async function validatePatch(agentRun) {
  const repository = await Repository.findById(agentRun.repositoryId);
  if (!repository) {
    throw new Error(`Repository not found for id ${agentRun.repositoryId}`);
  }

  let workdir;
  try {
    const targetFile = (agentRun.allowedFiles && agentRun.allowedFiles[0]) ? agentRun.allowedFiles[0] : "";
    workdir = await prepareWorkdir(
      repository.owner,
      repository.repo,
      repository.defaultBranch || "main",
      targetFile,
      agentRun.proposedContent
    );

    const { exitCode, output } = await runInSandbox(workdir, targetFile);

    return {
      passed: exitCode === 0,
      exitCode,
      output: output ? output.slice(-4000) : "No output from sandbox execution",
    };
  } finally {
    if (workdir) await cleanup(workdir);
  }
}

module.exports = { validatePatch };