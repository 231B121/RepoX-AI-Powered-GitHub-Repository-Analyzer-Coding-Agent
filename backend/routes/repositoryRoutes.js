const express = require("express");
const { ingestRepository } = require("../controllers/repositoryController");
const { analyzeRepository } = require("../controllers/analysisController");

const router = express.Router();
router.post("/ingest", ingestRepository);
router.post("/:id/analyze", analyzeRepository);

module.exports = router;