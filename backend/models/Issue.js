const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
    },
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
    },

    category: {
      type: String,
      enum: [
        "DEPENDENCY",
        "SECURITY",
        "CODE_QUALITY",
        "TESTING",
        "DOCUMENTATION",
        "PERFORMANCE",
        "CONFIGURATION",
        "CI_CD",
        "ARCHITECTURE",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    filePath: String,

    lineNumber: Number,

    evidence: String,

    recommendation: String,

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1,
    },

    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "FIXED", "IGNORED"],
      default: "OPEN",
    },

    // Day 7 - AI explanation
    explanation: {
      cause: String,
      impact: String,
      recommendation: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      filesReferenced: [String],
      generatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index issues by scan and category
issueSchema.index({ scanId: 1, category: 1 });

module.exports = mongoose.model("Issue", issueSchema);