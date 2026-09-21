const Queue = require("bull");

const scanQueue = new Queue("repository-scan", process.env.REDIS_URL);

module.exports = scanQueue;