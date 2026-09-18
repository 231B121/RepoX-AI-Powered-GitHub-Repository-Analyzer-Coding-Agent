const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    fullName: { type: String, required: true },
    defaultBranch: { type: String, required: true },
    lastCommitSha: { type: String },
    language: String,
  },
  { timestamps: true }
);

// Prevent duplicate rows for the same owner/repo
repositorySchema.index({ owner: 1, repo: 1 }, { unique: true });

module.exports = mongoose.model("Repository", repositorySchema);