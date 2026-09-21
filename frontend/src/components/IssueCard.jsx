import { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Wrench,
  Play,
  Copy,
  Check,
  FileCode,
  Loader2,
  ChevronDown,
  ChevronUp,
  GitPullRequest,
  ExternalLink,
} from "lucide-react";

export default function IssueCard({
  issue,
  handleExplain,
  isExplaining,
  handleGenerateFix,
  isGeneratingFix,
  fixData,
  handleValidate,
  isValidating,
  validationData,
  handleCreatePR,
  isCreatingPR,
  prData,
}) {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  // Copy file path to clipboard
  const handleCopyPath = () => {
    if (!issue.filePath) return;
    const fullPath = issue.lineNumber
      ? `${issue.filePath}:${issue.lineNumber}`
      : issue.filePath;
    navigator.clipboard.writeText(fullPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Copy patch code to clipboard
  const handleCopyPatch = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const getSeverityIcon = (sev) => {
    switch (sev) {
      case "CRITICAL":
        return <ShieldAlert size={14} />;
      case "HIGH":
        return <AlertTriangle size={14} />;
      case "MEDIUM":
        return <AlertCircle size={14} />;
      case "LOW":
        return <Info size={14} />;
      default:
        return <Info size={14} />;
    }
  };

  const patchCode = fixData?.diff || fixData?.proposedContent;

  return (
    <div className={`issue-card severity-${issue.severity}`}>
      <div className="issue-card-top">
        <div className="issue-badges-row">
          <span className={`badge-severity badge-sev-${issue.severity}`}>
            {getSeverityIcon(issue.severity)}
            <span>{issue.severity}</span>
          </span>

          <span className="badge-category">
            {issue.category?.replace("_", " ")}
          </span>

          {issue.confidence && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {(issue.confidence * 100).toFixed(0)}% conf
            </span>
          )}
        </div>

        {issue.filePath && (
          <div className="file-location-badge">
            <FileCode size={14} />
            <span>
              {issue.filePath}
              {issue.lineNumber ? `:${issue.lineNumber}` : ""}
            </span>
            <button
              className="copy-mini-btn"
              onClick={handleCopyPath}
              title="Copy file path"
            >
              {copiedPath ? (
                <Check size={13} style={{ color: "#15803d" }} />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        )}
      </div>

      <h3 className="issue-title">{issue.title}</h3>
      <p className="issue-description">{issue.description}</p>

      {/* Evidence or Recommendation Toggle */}
      {(issue.evidence || issue.recommendation) && (
        <div style={{ marginBottom: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setShowEvidence(!showEvidence)}
            style={{
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.2rem 0",
            }}
          >
            <span>{showEvidence ? "Hide Details & Evidence" : "View Details & Evidence"}</span>
            {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showEvidence && (
            <div className="issue-evidence-box">
              {issue.recommendation && (
                <p style={{ marginBottom: issue.evidence ? "0.4rem" : 0 }}>
                  <strong>Recommendation:</strong> {issue.recommendation}
                </p>
              )}
              {issue.evidence && (
                <p>
                  <strong>Evidence:</strong> <code>{issue.evidence}</code>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Explanation Card if available */}
      {issue.explanation?.cause && (
        <div className="ai-explanation-card">
          <div className="ai-exp-header">
            <h5>
              <Sparkles size={16} />
              <span>AI Root Cause & Impact Analysis</span>
            </h5>
            {issue.explanation.confidence && (
              <span className="ai-confidence-pill">
                {(issue.explanation.confidence * 100).toFixed(0)}% Confidence
              </span>
            )}
          </div>

          <div className="ai-exp-item">
            <strong>Underlying Cause:</strong>
            <p>{issue.explanation.cause}</p>
          </div>

          <div className="ai-exp-item">
            <strong>System Impact:</strong>
            <p>{issue.explanation.impact}</p>
          </div>

          <div className="ai-exp-item">
            <strong>Recommended Fix:</strong>
            <p>{issue.explanation.recommendation}</p>
          </div>
        </div>
      )}

      {/* Fix Patch Diff Viewer if available */}
      {fixData?.status === "PATCH_READY" && patchCode && (
        <div className="diff-viewer-card">
          <div className="diff-header">
            <h5>
              <Wrench size={15} />
              <span>Proposed AI Patch</span>
            </h5>
            <button
              className="copy-mini-btn"
              onClick={() => handleCopyPatch(patchCode)}
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-card)",
                padding: "0.25rem 0.5rem",
                borderRadius: "5px",
                display: "inline-flex",
                gap: "0.3rem",
                color: "#000000",
                fontSize: "0.75rem",
              }}
            >
              {copiedPatch ? <Check size={13} style={{ color: "#15803d" }} /> : <Copy size={13} />}
              <span>{copiedPatch ? "Copied" : "Copy Code"}</span>
            </button>
          </div>

          <pre className="diff-code-window">{patchCode}</pre>

          {/* Sandbox Action Bar */}
          <div className="sandbox-action-bar">
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Agent Run ID: <code>{fixData.agentRunId}</code>
            </span>

            <button
              className="btn-sandbox-validate"
              onClick={() => handleValidate(fixData.agentRunId)}
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Validating in Sandbox...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Validate Fix in Sandbox</span>
                </>
              )}
            </button>
          </div>

          {/* Sandbox Execution Terminal Output */}
          {validationData && (
            <div className="terminal-box">
              <div className="terminal-bar">
                <div className="mac-dots">
                  <span className="mac-dot dot-red"></span>
                  <span className="mac-dot dot-yellow"></span>
                  <span className="mac-dot dot-green"></span>
                </div>
                <span className="terminal-title">
                  Sandbox Output — {validationData.status}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color:
                      validationData.status === "VALIDATED"
                        ? "#10b981"
                        : "#ef4444",
                  }}
                >
                  {validationData.status === "VALIDATED" ? "PASSED" : "FAILED"}
                </span>
              </div>
              <pre className="terminal-output">
                {validationData.output || "Sandbox execution finished with no log output."}
              </pre>
            </div>
          )}

          {/* GitHub Pull Request Creation Section */}
          {(prData?.pullRequestUrl || validationData?.pullRequestUrl || fixData?.pullRequestUrl) ? (
            <div className="pr-success-box">
              <div className="pr-success-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <GitPullRequest size={17} style={{ color: "#16a34a" }} />
                  <span className="pr-success-title">Pull Request Created on GitHub!</span>
                </div>
                <span className="badge-pr-live">PR Live</span>
              </div>
              <p className="pr-success-desc">
                Dispatched from authorized account <strong>231B121 (Gourav ojha)</strong> with automated branch, commit, and Docker sandbox test pass.
              </p>
              <div style={{ marginTop: "0.6rem" }}>
                <a
                  href={prData?.pullRequestUrl || validationData?.pullRequestUrl || fixData?.pullRequestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-view-pr"
                >
                  <ExternalLink size={14} />
                  <span>Open Pull Request #{(prData?.pullRequestUrl || validationData?.pullRequestUrl || fixData?.pullRequestUrl).split("/").pop()} on GitHub</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="pr-action-box">
              <div className="pr-action-info">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <GitPullRequest size={16} style={{ color: "#0d9488" }} />
                  <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                    Submit as Official GitHub Contribution
                  </span>
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Branches, commits, and opens a Pull Request on GitHub under your account (231B121).
                </span>
              </div>

              <button
                className="btn-create-pr"
                onClick={() => handleCreatePR && handleCreatePR(fixData.agentRunId)}
                disabled={isCreatingPR}
              >
                {isCreatingPR ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Opening PR on GitHub...</span>
                  </>
                ) : (
                  <>
                    <GitPullRequest size={15} />
                    <span>🚀 Submit Pull Request to GitHub</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Blocked fix message */}
      {fixData?.status === "BLOCKED" && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem",
            borderRadius: "6px",
            background: "var(--high-bg)",
            border: "1px solid var(--high-border)",
            fontSize: "0.85rem",
            color: "var(--high-text)",
          }}
        >
          <strong>Automatic Fix Blocked:</strong>{" "}
          {fixData.errorMessage || fixData.reasoning || "File path missing or unsafe action flagged by security policy."}
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="issue-actions-row">
        {/* Explain button */}
        <button
          className="btn-action-outline btn-action-ai"
          onClick={() => handleExplain(issue._id)}
          disabled={isExplaining}
        >
          {isExplaining ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Analyzing Issue...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>{issue.explanation?.cause ? "Re-Explain with AI" : "Explain with AI"}</span>
            </>
          )}
        </button>

        {/* Generate Fix button */}
        <button
          className="btn-action-outline btn-action-fix"
          onClick={() => handleGenerateFix(issue._id)}
          disabled={isGeneratingFix}
        >
          {isGeneratingFix ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Synthesizing Fix...</span>
            </>
          ) : (
            <>
              <Wrench size={15} />
              <span>{fixData ? "Regenerate Patch" : "Generate AI Fix"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
