import { 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  FileCode, 
  Cpu, 
  Layers, 
  BookOpen, 
  FlaskConical, 
  Package, 
  Shield, 
  RefreshCw 
} from "lucide-react";

export default function ScanDashboard({
  scan,
  handleRestartScan,
}) {
  if (!scan) return null;

  const { status, byCategory, totalIssues, errorMessage } = scan.scan || {};
  const issues = scan.issues || [];

  // Calculate Health Score: Starts at 100, drops with severity
  const calculateHealthScore = () => {
    let score = 100;
    issues.forEach((issue) => {
      switch (issue.severity) {
        case "CRITICAL":
          score -= 20;
          break;
        case "HIGH":
          score -= 10;
          break;
        case "MEDIUM":
          score -= 4;
          break;
        case "LOW":
          score -= 1;
          break;
        default:
          break;
      }
    });
    return Math.max(12, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();

  const getHealthGrade = (score) => {
    if (score >= 90) return { grade: "A+", label: "Excellent", color: "#15803d", bg: "var(--success-bg)", border: "var(--success-border)" };
    if (score >= 80) return { grade: "A", label: "Good", color: "#15803d", bg: "var(--success-bg)", border: "var(--success-border)" };
    if (score >= 65) return { grade: "B", label: "Fair", color: "#a16207", bg: "var(--medium-bg)", border: "var(--medium-border)" };
    if (score >= 45) return { grade: "C", label: "Needs Attention", color: "#c2410c", bg: "var(--high-bg)", border: "var(--high-border)" };
    return { grade: "D", label: "Critical Risk", color: "#b91c1c", bg: "var(--critical-bg)", border: "var(--critical-border)" };
  };

  const gradeInfo = getHealthGrade(healthScore);

  // Calculate severity breakdown
  const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
  const highCount = issues.filter((i) => i.severity === "HIGH").length;
  const mediumCount = issues.filter((i) => i.severity === "MEDIUM").length;
  const lowCount = issues.filter((i) => i.severity === "LOW" || i.severity === "INFO").length;

  const getCategoryIcon = (category) => {
    switch (category) {
      case "SECURITY":
        return <Shield size={16} style={{ color: "#b91c1c" }} />;
      case "DEPENDENCY":
        return <Package size={16} style={{ color: "#c2410c" }} />;
      case "CODE_QUALITY":
        return <CodeIcon size={16} style={{ color: "#2563eb" }} />;
      case "TESTING":
        return <FlaskConical size={16} style={{ color: "#15803d" }} />;
      case "DOCUMENTATION":
        return <BookOpen size={16} style={{ color: "#7c3aed" }} />;
      default:
        return <Layers size={16} style={{ color: "#52525b" }} />;
    }
  };

  return (
    <div className="scan-dashboard-wrapper">
      {/* Scan Header Bar */}
      <div className="scan-header-bar">
        <div className="scan-title-group">
          <h2>
            <Activity size={20} style={{ color: "#000000" }} />
            <span>Repository Health & Security Audit</span>
          </h2>
          <p>
            Scan ID: <code style={{ color: "#52525b", background: "#f4f4f5", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>{scan.scan?._id || "active"}</code>
          </p>
        </div>

        <div>
          {status === "COMPLETED" && (
            <span className="scan-status-badge status-badge-completed">
              <CheckCircle2 size={15} />
              <span>Completed</span>
            </span>
          )}
          {(status === "PENDING" || status === "RUNNING") && (
            <span className="scan-status-badge status-badge-running">
              <Sparkles size={15} className="animate-spin" />
              <span>{status === "PENDING" ? "Queued" : "Analyzing..."}</span>
            </span>
          )}
          {status === "FAILED" && (
            <span className="scan-status-badge status-badge-failed">
              <AlertCircle size={15} />
              <span>Scan Failed</span>
            </span>
          )}
        </div>
      </div>

      {/* Active Scanning Animation */}
      {(status === "PENDING" || status === "RUNNING") && (
        <div className="active-scan-container">
          <div className="radar-circle-wrapper">
            <div className="radar-sweep-blade"></div>
            <div className="radar-center-icon">
              <Cpu size={30} />
            </div>
          </div>

          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.4rem" }}>
            Automated Diagnostic Scanner Active
          </h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: "550px", margin: "0 auto", fontSize: "0.9rem" }}>
            Inspecting repository source tree, evaluating code complexity, running deterministic rules,
            and parsing package manifests.
          </p>

          <div className="scan-step-tracker">
            <div className="scan-step-item">
              <CheckCircle2 size={14} style={{ color: "#15803d" }} />
              <span>Tree Extracted</span>
            </div>
            <div className="scan-step-item">
              <Sparkles size={14} className="animate-spin" style={{ color: "#000000" }} />
              <span>Code Quality & AST</span>
            </div>
            <div className="scan-step-item">
              <Shield size={14} style={{ color: "#b91c1c" }} />
              <span>Security Auditing</span>
            </div>
            <div className="scan-step-item">
              <FlaskConical size={14} style={{ color: "#2563eb" }} />
              <span>Test Coverage</span>
            </div>
            <div className="scan-step-item">
              <BookOpen size={14} style={{ color: "#7c3aed" }} />
              <span>Docs Verification</span>
            </div>
          </div>
        </div>
      )}

      {/* Failed State */}
      {status === "FAILED" && (
        <div
          className="active-scan-container"
          style={{ borderColor: "rgba(244, 63, 94, 0.4)" }}
        >
          <div
            className="empty-state-icon"
            style={{ background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e" }}
          >
            <AlertCircle size={32} />
          </div>
          <h3 style={{ color: "#fca5a5", marginBottom: "0.5rem" }}>
            Scan encountered an error
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {errorMessage || "Unable to complete repository analysis. Please check backend logs or try again."}
          </p>
          {handleRestartScan && (
            <button className="btn-primary" onClick={handleRestartScan}>
              <RefreshCw size={16} />
              <span>Retry Scan</span>
            </button>
          )}
        </div>
      )}

      {/* Completed State: Metrics & Dashboard */}
      {status === "COMPLETED" && (
        <>
          {/* Key Metrics Grid */}
          <div className="metrics-grid">
            {/* Health Score */}
            <div className="metric-card health-score-card">
              <div
                className="metric-icon-box"
                style={{ background: gradeInfo.bg, color: gradeInfo.color, border: `1px solid ${gradeInfo.border}` }}
              >
                <Activity size={20} />
              </div>
              <div className="metric-data">
                <h4>Health Score</h4>
                <div className="metric-value">
                  {healthScore}
                  <span style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    /100
                  </span>
                  <span
                    className="health-grade-pill"
                    style={{ background: gradeInfo.bg, color: gradeInfo.color, border: `1px solid ${gradeInfo.border}` }}
                  >
                    Grade {gradeInfo.grade}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Issues */}
            <div className="metric-card">
              <div
                className="metric-icon-box"
                style={{ background: "#f4f4f5", color: "#000000" }}
              >
                <Layers size={20} />
              </div>
              <div className="metric-data">
                <h4>Total Issues</h4>
                <div className="metric-value">{totalIssues ?? issues.length}</div>
              </div>
            </div>

            {/* High & Critical Risk */}
            <div className="metric-card">
              <div
                className="metric-icon-box"
                style={{ background: "var(--critical-bg)", color: "var(--critical-text)", border: "1px solid var(--critical-border)" }}
              >
                <ShieldAlert size={20} />
              </div>
              <div className="metric-data">
                <h4>High / Critical</h4>
                <div className="metric-value" style={{ color: criticalCount + highCount > 0 ? "var(--critical-text)" : "var(--success-text)" }}>
                  {criticalCount + highCount}
                </div>
              </div>
            </div>

            {/* Medium & Low */}
            <div className="metric-card">
              <div
                className="metric-icon-box"
                style={{ background: "var(--medium-bg)", color: "var(--medium-text)", border: "1px solid var(--medium-border)" }}
              >
                <AlertTriangle size={20} />
              </div>
              <div className="metric-data">
                <h4>Medium / Low</h4>
                <div className="metric-value">{mediumCount + lowCount}</div>
              </div>
            </div>
          </div>

          {/* Category Breakdown Card */}
          {byCategory && Object.keys(byCategory).length > 0 && (
            <div className="categories-card">
              <h3>
                <Layers size={16} style={{ color: "#000000" }} />
                <span>Issues by Audit Category</span>
              </h3>

              <div className="category-badges-row">
                {Object.entries(byCategory).map(([category, count]) => (
                  <div key={category} className="cat-badge-item">
                    {getCategoryIcon(category)}
                    <span style={{ fontWeight: 500 }}>{category.replace("_", " ")}</span>
                    <span className="cat-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CodeIcon({ size, style }) {
  return <FileCode size={size} style={style} />;
}
