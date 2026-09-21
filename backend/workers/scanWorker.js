require("dotenv").config({ override: true });
const mongoose = require("mongoose");
const scanQueue = require("../queue/scanQueue");
const { runFullScan } = require("../jobs/runFullScan");

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Worker connected to MongoDB");
});

scanQueue.process(async (job) => {
  console.log(`Processing scan ${job.data.scanId}`);
  await runFullScan(job.data.scanId);
});

console.log("Scan worker started, waiting for jobs...");