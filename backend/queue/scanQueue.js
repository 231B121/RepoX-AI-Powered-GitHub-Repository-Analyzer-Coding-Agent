const Queue = require("bull");

let scanQueue = null;

const redisUrlRaw = process.env.REDIS_URL ? process.env.REDIS_URL.trim() : "";
const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

// In production (Render etc.), only initialize Bull if an external REDIS_URL is provided (not 127.0.0.1)
const shouldInitializeRedis = Boolean(
  redisUrlRaw && (!isProduction || (!redisUrlRaw.includes("127.0.0.1") && !redisUrlRaw.includes("localhost")))
);

if (shouldInitializeRedis) {
  let redisUrl = redisUrlRaw;
  if (redisUrl.includes("upstash.io") && redisUrl.startsWith("redis://")) {
    redisUrl = redisUrl.replace(/^redis:\/\//, "rediss://");
  }
  const isTls = redisUrl.startsWith("rediss://") || redisUrl.includes("upstash.io");

  try {
    scanQueue = new Queue("repository-scan", redisUrl, {
      redis: {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          if (times > 3) return null; // cease retries if Redis is unavailable
          return Math.min(times * 500, 2000);
        },
        ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
      },
    });

    scanQueue.on("error", (err) => {
      console.warn("[Bull Queue Warning]:", err.message);
    });
  } catch (err) {
    console.warn("[Bull Queue] Initialization error:", err.message);
    scanQueue = null;
  }
} else {
  console.log(
    "[Queue] No external REDIS_URL detected. Direct background execution will be used for scans."
  );
}

module.exports = scanQueue;