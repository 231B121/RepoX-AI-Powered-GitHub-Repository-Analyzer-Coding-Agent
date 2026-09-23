const Scan = require("../models/Scan");
const Repository = require("../models/Repository");
const Issue = require("../models/Issue");
const scanQueue = require("../queue/scanQueue");
const { runFullScan } = require("../jobs/runFullScan");
const { getRepositoryMetadata } = require("../github/repository");

async function startScan(req, res) {
  try {
    const { id } = req.params;
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: { message: "Repository not found" } });
    }

    let defaultBranch = repository.defaultBranch;
    if (!defaultBranch) {
      try {
        const metadata = await getRepositoryMetadata(repository.owner, repository.repo);
        defaultBranch = metadata?.defaultBranch || "main";
      } catch (err) {
        console.warn("[startScan] Could not fetch branch metadata, defaulting to main:", err.message);
        defaultBranch = "main";
      }
    }

    const scan = await Scan.create({
      repositoryId: repository._id,
      commitSha: defaultBranch,
      status: "PENDING",
    });

    const scanId = scan._id.toString();

    let queued = false;
    if (scanQueue) {
      try {
        // Enqueue with a 1.5s timeout so unresponsive Redis doesn't block response
        await Promise.race([
          scanQueue.add({ scanId }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Queue add timed out")), 1500)
          ),
        ]);
        queued = true;
        console.log(`[Scan] Scan ${scanId} queued via Bull`);
      } catch (queueErr) {
        console.warn(
          `[Scan] Bull queue unavailable (${queueErr.message}). Falling back to direct background execution.`
        );
      }
    }

    // Direct background execution fallback
    if (!queued) {
      setImmediate(async () => {
        try {
          console.log(`[Scan] Direct background execution running for scan ${scanId}...`);
          await runFullScan(scanId);
          console.log(`[Scan] Direct scan completed for scan ${scanId}`);
        } catch (scanErr) {
          console.error(`[Scan] Direct execution error for scan ${scanId}:`, scanErr);
        }
      });
    }

    return res.status(202).json({ scanId: scan._id, status: scan.status });
  } catch (err) {
    console.error("[startScan] Error:", err);
    return res.status(500).json({ error: { message: err.message || "Failed to start scan" } });
  }
}

async function getScan(req, res) {
  try {
    const scan = await Scan.findById(req.params.scanId);
    if (!scan) {
      return res.status(404).json({ error: { message: "Scan not found" } });
    }

    const response = { scan };
    if (scan.status === "COMPLETED") {
      response.issues = await Issue.find({ scanId: scan._id });
    }
    return res.json(response);
  } catch (err) {
    console.error("[getScan] Error:", err);
    return res.status(500).json({ error: { message: err.message || "Failed to fetch scan" } });
  }
}

module.exports = { startScan, getScan };