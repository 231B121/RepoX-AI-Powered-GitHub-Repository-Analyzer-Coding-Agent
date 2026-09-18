const Scan = require("../models/Scan");
const Repository = require("../models/Repository");
const Issue = require("../models/Issue");
const scanQueue = require("../queue/scanQueue");
const { getRepositoryMetadata } = require("../github/repository");

async function startScan(req, res) {
  const { id } = req.params;
  const repository = await Repository.findById(id);
  if (!repository) {
    return res.status(404).json({ error: { message: "Repository not found" } });
  }

  const metadata = await getRepositoryMetadata(repository.owner, repository.repo);

  const scan = await Scan.create({
    repositoryId: repository._id,
    commitSha: metadata.defaultBranch, // refined to a real SHA next iteration
    status: "PENDING",
  });

  await scanQueue.add({ scanId: scan._id.toString() });

  return res.status(202).json({ scanId: scan._id, status: scan.status });
}

async function getScan(req, res) {
  const scan = await Scan.findById(req.params.scanId);
  if (!scan) {
    return res.status(404).json({ error: { message: "Scan not found" } });
  }

  const response = { scan };
  if (scan.status === "COMPLETED") {
    response.issues = await Issue.find({ scanId: scan._id });
  }
  return res.json(response);
}

module.exports = { startScan, getScan };