const Scan = require("../models/Scan");
const Issue = require("../models/Issue");
const Repository = require("../models/Repository");
const { getFileTree } = require("../github/repository");
const { analyzeDependencies } = require("../analyzer/dependencies");
const { analyzeCodeQuality } = require("../analyzer/codeQuality");
const { analyzeTests } = require("../analyzer/tests");
const { analyzeDocumentation } = require("../analyzer/documentation");
const { analyzeSecurity } = require("../analyzer/security");

async function runFullScan(scanId) {
  const scan = await Scan.findById(scanId);
  if (!scan || scan.status !== "PENDING") {
    // already run, or doesn't exist — do nothing (idempotency guard)
    return;
  }

  scan.status = "RUNNING";
  scan.startedAt = new Date();
  await scan.save();

  try {
    const repository = await Repository.findById(scan.repositoryId);
    if (!repository) {
      throw new Error(`Repository not found: ${scan.repositoryId}`);
    }
    const { owner, repo, defaultBranch } = repository;

    const tree = await getFileTree(owner, repo, defaultBranch);
    const filePaths = (tree || []).map((f) => f.path);

    const [dependencyIssues, codeQualityIssues, testIssues, docIssues, securityIssues] =
      await Promise.all([
        analyzeDependencies(owner, repo, defaultBranch, repository._id, filePaths).catch((e) => {
          console.warn("[analyzeDependencies error]:", e.message);
          return [];
        }),
        analyzeCodeQuality(owner, repo, defaultBranch, filePaths, repository._id).catch((e) => {
          console.warn("[analyzeCodeQuality error]:", e.message);
          return [];
        }),
        Promise.resolve(analyzeTests(filePaths, repository._id)).catch((e) => {
          console.warn("[analyzeTests error]:", e.message);
          return [];
        }),
        analyzeDocumentation(owner, repo, defaultBranch, filePaths, repository._id).catch((e) => {
          console.warn("[analyzeDocumentation error]:", e.message);
          return [];
        }),
        analyzeSecurity(owner, repo, defaultBranch, filePaths, repository._id).catch((e) => {
          console.warn("[analyzeSecurity error]:", e.message);
          return [];
        }),
      ]);

    const grouped = {
      DEPENDENCY: dependencyIssues || [],
      CODE_QUALITY: codeQualityIssues || [],
      TESTING: testIssues || [],
      DOCUMENTATION: docIssues || [],
      SECURITY: securityIssues || [],
    };

    const allIssues = Object.values(grouped).flat().map((issue) => ({
      ...issue,
      scanId: scan._id,
      repositoryId: repository._id,
    }));

    if (allIssues.length > 0) {
      await Issue.insertMany(allIssues);
    }

    scan.status = "COMPLETED";
    scan.completedAt = new Date();
    scan.totalIssues = allIssues.length;
    scan.byCategory = Object.fromEntries(
      Object.entries(grouped).map(([k, v]) => [k, v.length])
    );
    await scan.save();
  } catch (err) {
    scan.status = "FAILED";
    scan.errorMessage = err.message;
    scan.completedAt = new Date();
    await scan.save();
  }
}

module.exports = { runFullScan };