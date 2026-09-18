const mongoose = require("mongoose");

const agentRunSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue", required: true },
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Repository", required: true },
    status: {
      type: String,
      enum: [
        "PLANNING",
        "GENERATING_PATCH",
        "PATCH_READY",
        "FAILED",
        "BLOCKED",
        "VALIDATED",
        "VALIDATION_FAILED",
      ],
      default: "PLANNING",
    },
    allowedFiles: [String],
    proposedContent: String,
    diff: String,
    errorMessage: String,
    validationOutput: String,
    pullRequestUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AgentRun", agentRunSchema);