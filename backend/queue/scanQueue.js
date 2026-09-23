const Queue = require("bull");

let redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
if (redisUrl.includes("upstash.io") && redisUrl.startsWith("redis://")) {
  redisUrl = redisUrl.replace(/^redis:\/\//, "rediss://");
}
const isTls = redisUrl.startsWith("rediss://") || redisUrl.includes("upstash.io");

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