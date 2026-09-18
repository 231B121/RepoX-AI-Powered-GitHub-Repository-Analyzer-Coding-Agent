const Repository = require("../models/Repository");
const { parseGitHubUrl } = require("../github/parseUrl");
const { getRepositoryMetadata, getFileTree } = require("../github/repository");

async function ingestRepository(req, res) {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: { message: "Repository URL is required" } });
  }

  try {
    const { owner, repo } = parseGitHubUrl(url);
    const metadata = await getRepositoryMetadata(owner, repo);
    const tree = await getFileTree(owner, repo, metadata.defaultBranch);

    const repository = await Repository.findOneAndUpdate(
      { owner, repo },
      {
        owner,
        repo,
        fullName: metadata.fullName,
        defaultBranch: metadata.defaultBranch,
        language: metadata.language,
      },
      { upsert: true, returnDocument: "after" }
    );

    return res.json({
      repositoryId: repository._id,
      metadata,
      tree,
      fileCount: tree.length,
    });
  } catch (err) {
    console.error("Ingest repository error:", err.message);
    return res.status(400).json({ error: { message: err.message } });
  }
}

module.exports = { ingestRepository };