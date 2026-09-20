const Repository = require("../models/Repository");
const { getFileTree } = require("../github/repository");
const { analyzeDependencies } = require("../analyzer/dependencies");
const { analyzeCodeQuality } = require("../analyzer/codeQuality");
const { analyzeTests } = require("../analyzer/tests");
const { analyzeDocumentation } = require("../analyzer/documentation");
const { analyzeSecurity } = require("../analyzer/security");

async function analyzeRepository(req, res) {
  try {
    const repository = await Repository.findById(req.params.id);
    if (!repository) {
      return res.status(404).json({ error: { message: "Repository not found" } });
    }

    const { owner, repo, defaultBranch } = repository;
    const tree = await getFileTree(owner, repo, defaultBranch);
    const filePaths = tree.map((f) => f.path);

    const [dependencyIssues, codeQualityIssues, testIssues, docIssues, securityIssues] =
      await Promise.all([
        analyzeDependencies(owner, repo, defaultBranch, repository._id, filePaths).catch(() => []),
        analyzeCodeQuality(owner, repo, defaultBranch, filePaths, repository._id).catch(() => []),
        Promise.resolve(analyzeTests(filePaths, repository._id)).catch(() => []),
        analyzeDocumentation(owner, repo, defaultBranch, filePaths, repository._id).catch(() => []),
        analyzeSecurity(owner, repo, defaultBranch, filePaths, repository._id).catch(() => []),
      ]);

    const allIssues = [
      ...dependencyIssues,
      ...codeQualityIssues,
      ...testIssues,
      ...docIssues,
      ...securityIssues,
    ];

    return res.json({
      repositoryId: repository._id,
      totalIssues: allIssues.length,
      issues: allIssues,
    });
  } catch (err) {
    console.error("Repository analysis error:", err.message);
    return res.status(500).json({ error: { message: err.message } });
  }
}

module.exports = { analyzeRepository };