const Issue = require("../models/Issue");
const { buildContext } = require("../analyzer/contextBuilder");
const { explainIssue } = require("../ai/reasoningService");

async function analyzeIssue(req, res) {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: { message: "Issue not found" } });
  }

  try {
    const context = await buildContext(issue);
    const explanation = await explainIssue(issue, context);

    issue.explanation = { ...explanation, generatedAt: new Date() };
    await issue.save();

    return res.json({ issue });
  } catch (err) {
    console.error("AI reasoning failed:", err.message);
    return res.status(502).json({
      error: { message: "Could not generate a reliable explanation for this issue", retryable: true },
    });
  }
}

module.exports = { analyzeIssue };