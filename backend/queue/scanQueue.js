const Queue = require("bull");

let scanQueue = null;

const redisUrlRaw = (process.env.REDIS_URL || "").trim();

// Strictly check if REDIS_URL points to a local loopback address
const isLoopback =
  redisUrlRaw.includes("127.0.0.1") ||
  redisUrlRaw.includes("localhost") ||
  redisUrlRaw.includes("::1") ||
  redisUrlRaw.includes("0.0.0.0");

// Only attempt Redis connection if:
// 1) An explicit remote URL is provided (e.g. Upstash, AWS, Render Redis, etc.)
// 2) Or USE_LOCAL_REDIS=true is explicitly set for local dev testing
const shouldInitializeRedis = Boolean(
  redisUrlRaw && (!isLoopback || process.env.USE_LOCAL_REDIS === "true")
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
      console.warn("[Bull Queue Warning]:", err?.message || err);
    });
  } catch (err) {
    console.warn("[Bull Queue] Initialization error:", err?.message || err);
    scanQueue = null;
  }
} else {
  console.log(
    "[Queue] No remote REDIS_URL detected. Direct in-process asynchronous scanner is active."
  );
}

module.exports = scanQueue;