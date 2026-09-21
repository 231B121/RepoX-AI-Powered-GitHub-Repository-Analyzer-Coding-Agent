import { GitBranch, Star, FileCode, ExternalLink, ShieldCheck, Play, Lock, Globe, Sparkles } from "lucide-react";

export default function RepoOverviewCard({
  result,
  handleStartScan,
  scanId,
  scanStatus,
}) {
  if (!result) return null;

  const { metadata, fileCount } = result;

  // Language color map helper
  const getLanguageColor = (lang) => {
    switch (lang?.toLowerCase()) {
      case "javascript":
        return "#f1e05a";
      case "typescript":
        return "#3178c6";
      case "python":
        return "#3572A5";
      case "go":
        return "#00ADD8";
      case "rust":
        return "#dea584";
      case "html":
        return "#e34c26";
      case "css":
        return "#563d7c";
      default:
        return "#2dd4bf";
    }
  };

  const isScanning = scanStatus === "PENDING" || scanStatus === "RUNNING";

  return (
    <div className="repo-card">
      <div className="repo-header">
        <div className="repo-title-group">
          <h2 className="repo-full-name">
            <a
              href={`https://github.com/${metadata.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open GitHub Repository"
            >
              <span>{metadata.fullName}</span>
              <ExternalLink size={18} className="repo-link-icon" />
            </a>
          </h2>

          <div className="repo-visibility-badge">
            <span className="visibility-dot"></span>
            {metadata.isPrivate ? (
              <>
                <Lock size={13} />
                <span>Private</span>
              </>
            ) : (
              <>
                <Globe size={13} />
                <span>Public Repo</span>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="repo-desc">
        {metadata.description || "No repository description provided on GitHub."}
      </p>

      {/* Stats Grid - Balanced Medium Pills */}
      <div className="repo-stats-grid">
        <div className="stat-pill">
          <span
            className="lang-dot"
            style={{
              background: getLanguageColor(metadata.language),
              boxShadow: `0 0 6px ${getLanguageColor(metadata.language)}`
            }}
          ></span>
          <span className="stat-label">Language:</span>
          <strong className="stat-val">{metadata.language || "Unknown"}</strong>
        </div>

        <div className="stat-pill">
          <GitBranch size={16} className="stat-icon-branch" />
          <span className="stat-label">Branch:</span>
          <strong className="stat-val">{metadata.defaultBranch || "main"}</strong>
        </div>

        <div className="stat-pill">
          <Star size={16} className="stat-icon-star" />
          <span className="stat-label">Stars:</span>
          <strong className="stat-val">{metadata.stars ?? 0}</strong>
        </div>

        <div className="stat-pill">
          <FileCode size={16} className="stat-icon-files" />
          <span className="stat-label">Files Indexed:</span>
          <strong className="stat-val">{fileCount}</strong>
        </div>
      </div>

      {/* Scan CTA Banner - Well-Proportioned Medium Banner */}
      <div className="scan-cta-box">
        <div className="scan-cta-info">
          <h4>
            <ShieldCheck size={20} className="shield-icon" />
            <span>Ready for Deep Diagnostic Audit</span>
          </h4>
          <p>
            Run security scans, code quality rules, test suite audits, and AI-powered fixes.
          </p>
        </div>

        <button
          className="btn-scan"
          onClick={handleStartScan}
          disabled={scanId !== null}
        >
          {isScanning ? (
            <>
              <Sparkles size={17} className="animate-spin" />
              <span>Scanning In Progress...</span>
            </>
          ) : scanId ? (
            <>
              <ShieldCheck size={17} />
              <span>Scan Initiated</span>
            </>
          ) : (
            <>
              <Play size={17} fill="currentColor" />
              <span>Start Health Scan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
