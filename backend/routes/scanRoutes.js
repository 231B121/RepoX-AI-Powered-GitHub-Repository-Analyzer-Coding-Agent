const express = require("express");
const { startScan, getScan } = require("../controllers/scanController");

const router = express.Router();
router.post("/repositories/:id/scans", startScan);
router.get("/scans/:scanId", getScan);

module.exports = router;