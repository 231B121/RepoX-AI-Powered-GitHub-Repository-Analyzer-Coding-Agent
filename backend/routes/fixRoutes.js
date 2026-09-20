const express = require("express");
const { validateFix, createPullRequest } = require("../controllers/fixController");

const router = express.Router();
router.post("/:agentRunId/validate", validateFix);
router.post("/:agentRunId/pr", createPullRequest);

module.exports = router;