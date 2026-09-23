const Queue = require("bull");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const isTls = redisUrl.startsWith("rediss://");

const scanQueue = new Queue("repository-scan", redisUrl, {
  redis: isTls
    ? {
        tls: { rejectUnauthorized: false },
      }
    : undefined,
});

scanQueue.on("error", (err) => {
  console.warn("[Bull Queue Warning]:", err.message);
});

module.exports = scanQueue;