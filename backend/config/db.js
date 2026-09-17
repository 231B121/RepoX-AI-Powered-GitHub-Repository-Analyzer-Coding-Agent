const mongoose = require("mongoose");

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
}

function getDBStatus() {
  // 1 = connected, 0 = disconnected, 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState === 1 ? "connected" : "unreachable";
}

module.exports = { connectDB, getDBStatus };