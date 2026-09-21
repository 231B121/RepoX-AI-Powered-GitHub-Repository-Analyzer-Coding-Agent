import { useState, useMemo } from "react";
import { Search, CheckCircle2, FileCode, LayoutGrid, List } from "lucide-react";
import IssueCard from "./IssueCard";

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const CATEGORIES = [
  "ALL",
  "SECURITY",
  "DEPENDENCY",
  "CODE_QUALITY",
  "TESTING",
  "DOCUMENTATION",
];

export default function IssuesExplorer({
  issues,
  handleExplain,
  explainingIssueId,
  handleGenerateFix,
  generatingFixId,
  fixesByIssue,
  handleValidate,
  validatingByRunId,
  validationsByRunId,
  handleCreatePR,
  creatingPRByRunId,
  prsByRunId,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState("file"); // 'file' | 'list'

  // Count by severity
  const severityCounts = useMemo(() => {
    const counts = { ALL: issues.length };
    SEVERITIES.slice(1).forEach((sev) => {
      counts[sev] = issues.filter((i) => i.severity === sev).length;
    });
    return counts;
  }, [issues]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return issues.filter((issue) => {
      const matchesSearch =
        !query ||
        issue.title?.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query) ||
        issue.filePath?.toLowerCase().includes(query) ||
        issue.category?.toLowerCase().includes(query);

      const matchesSeverity =
        selectedSeverity === "ALL" || issue.severity === selectedSeverity;

      const matchesCategory =
        selectedCategory === "ALL" || issue.category === selectedCategory;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [issues, searchQuery, selectedSeverity, selectedCategory]);

  // Group filtered issues by filePath so all problems in a file are bundled together
  const groupedByFile = useMemo(() => {
    const groups = {};
    filteredIssues.forEach((issue) => {
      const fileKey = issue.filePath || "Repository-Wide / Configuration";
      if (!groups[fileKey]) {
        groups[fileKey] = [];
      }
      groups[fileKey].push(issue);
    });
    return groups;
  }, [filteredIssues]);

  const fileKeys = Object.keys(groupedByFile);

  return (
    <div className="issues-explorer-section">
      <div className="issues-toolbar">
        {/* Search & View Mode Row */}
        <div className="toolbar-search-row">
          <div className="issue-search-box">
            <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Filter by title, file, code rule..."
              className="issue-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === "file" ? "active" : ""}`}
                onClick={() => setViewMode("file")}
                title="Group issues by file"
              >
                <LayoutGrid size={14} />
                <span>By File ({fileKeys.length})</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="View all individual issues"
              >
                <List size={14} />
                <span>All Issues ({filteredIssues.length})</span>
              </button>
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <strong>{filteredIssues.length}</strong> total
            </div>
          </div>
        </div>

        {/* Severity Filters */}
        <div className="filter-group-row">
          <span className="filter-label">Severity:</span>
          {SEVERITIES.map((sev) => {
            const count = severityCounts[sev] || 0;
            if (sev !== "ALL" && count === 0) return null;

            return (
              <button
                key={sev}
                type="button"
                className={`filter-btn ${selectedSeverity === sev ? "active" : ""}`}
                onClick={() => setSelectedSeverity(sev)}
              >
                {sev} {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="filter-group-row">
          <span className="filter-label">Category:</span>
          {CATEGORIES.map((cat) => {
            const count =
              cat === "ALL"
                ? issues.length
                : issues.filter((i) => i.category === cat).length;
            if (cat !== "ALL" && count === 0) return null;

            return (
              <button
                key={cat}
                type="button"
                className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.replace("_", " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issues List or Grouped By File */}
      {filteredIssues.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon" style={{ background: "var(--success-bg)", color: "var(--success-text)" }}>
            <CheckCircle2 size={32} />
          </div>
          <h3>No Issues Found</h3>
          <p>
            {issues.length === 0
              ? "Awesome! No code quality, security, or dependency issues detected in this repository."
              : "No issues match your current filter criteria. Try clearing search or selecting 'ALL'."}
          </p>
        </div>
      ) : viewMode === "file" ? (
        /* Grouped By File View */
        <div className="file-groups-container">
          {fileKeys.map((filePath) => {
            const fileIssues = groupedByFile[filePath];
            const severitiesInFile = [...new Set(fileIssues.map((i) => i.severity))];

            return (
              <div key={filePath} className="file-group-card">
                <div className="file-group-header">
                  <div className="file-group-title">
                    <FileCode size={17} style={{ color: "#000000" }} />
                    <span className="file-group-path">{filePath}</span>
                    <span className="file-group-count">
                      {fileIssues.length} {fileIssues.length === 1 ? "problem" : "problems"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    {severitiesInFile.map((sev) => (
                      <span
                        key={sev}
                        className={`badge-severity badge-sev-${sev}`}
                        style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem" }}
                      >
                        {sev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="file-group-body">
                  {fileIssues.map((issue) => {
                    const fixData = fixesByIssue[issue._id];
                    const runId = fixData?.agentRunId;
                    const isValidating = runId ? validatingByRunId[runId] : false;
                    const validationData = runId ? validationsByRunId[runId] : null;
                    const isCreatingPR = runId ? creatingPRByRunId[runId] : false;
                    const prData = runId ? prsByRunId[runId] : null;

                    return (
                      <IssueCard
                        key={issue._id}
                        issue={issue}
                        handleExplain={handleExplain}
                        isExplaining={explainingIssueId === issue._id}
                        handleGenerateFix={handleGenerateFix}
                        isGeneratingFix={generatingFixId === issue._id}
                        fixData={fixData}
                        handleValidate={handleValidate}
                        isValidating={isValidating}
                        validationData={validationData}
                        handleCreatePR={handleCreatePR}
                        isCreatingPR={isCreatingPR}
                        prData={prData}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat List View */
        <div className="issues-list">
          {filteredIssues.map((issue) => {
            const fixData = fixesByIssue[issue._id];
            const runId = fixData?.agentRunId;
            const isValidating = runId ? validatingByRunId[runId] : false;
            const validationData = runId ? validationsByRunId[runId] : null;
            const isCreatingPR = runId ? creatingPRByRunId[runId] : false;
            const prData = runId ? prsByRunId[runId] : null;

            return (
              <IssueCard
                key={issue._id}
                issue={issue}
                handleExplain={handleExplain}
                isExplaining={explainingIssueId === issue._id}
                handleGenerateFix={handleGenerateFix}
                isGeneratingFix={generatingFixId === issue._id}
                fixData={fixData}
                handleValidate={handleValidate}
                isValidating={isValidating}
                validationData={validationData}
                handleCreatePR={handleCreatePR}
                isCreatingPR={isCreatingPR}
                prData={prData}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
