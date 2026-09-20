const express = require("express");
const { analyzeIssue } = require("../controllers/issueController");
const { requestFix, validateFix } = require("../controllers/fixController");

const router = express.Router();
router.post("/:id/analyze", analyzeIssue);
router.post("/:id/fix", requestFix);
router.post("/runs/:agentRunId/validate", validateFix);

module.exports = router;