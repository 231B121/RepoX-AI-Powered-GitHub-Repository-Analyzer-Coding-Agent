import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import RepoInputSection from "./components/RepoInputSection";
import RepoOverviewCard from "./components/RepoOverviewCard";
import ScanDashboard from "./components/ScanDashboard";
import IssuesExplorer from "./components/IssuesExplorer";
import { API_BASE_URL } from "./config";

function App() {
  // Repository Ingest State
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Scan State
  const [scanId, setScanId] = useState(null);
  const [scan, setScan] = useState(null);

  // AI Reasoning & Explanation State
  const [explainingIssueId, setExplainingIssueId] = useState(null);

  // AI Fix Generator State (mapped by issueId)
  const [generatingFixId, setGeneratingFixId] = useState(null);
  const [fixesByIssue, setFixesByIssue] = useState({});

  // Sandbox Validation State (mapped by agentRunId)
  const [validatingByRunId, setValidatingByRunId] = useState({});
  const [validationsByRunId, setValidationsByRunId] = useState({});

  // GitHub Pull Request State (mapped by agentRunId)
  const [creatingPRByRunId, setCreatingPRByRunId] = useState({});
  const [prsByRunId, setPrsByRunId] = useState({});

  // Submit GitHub Repository URL for Ingestion
  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    setError(null);
    setResult(null);
    setScanId(null);
    setScan(null);
    setFixesByIssue({});
    setValidationsByRunId({});
    setCreatingPRByRunId({});
    setPrsByRunId({});
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/repositories/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to ingest repository. Please verify the URL.");
      } else {
        setResult(data);
      }
    } catch {
      setError(`Could not connect to backend server at ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  }

  // Trigger Diagnostic Scan
  async function handleStartScan() {
    if (!result?.repositoryId) return;
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/repositories/${result.repositoryId}/scans`,
        { method: "POST" }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Could not start scan");
        return;
      }
      setScanId(data.scanId);
    } catch {
      setError("Could not reach backend to start scan");
    }
  }

  // Poll Scan Status until COMPLETED or FAILED
  useEffect(() => {
    if (!scanId || scan?.scan?.status === "COMPLETED" || scan?.scan?.status === "FAILED") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/scans/${scanId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error?.message || "Could not fetch scan status");
          return;
        }
        setScan(data);
      } catch {
        setError("Could not reach backend while polling scan status");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [scanId, scan]);

  // Request AI Explanation for an Issue
  async function handleExplain(issueId) {
    setExplainingIssueId(issueId);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/${issueId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Could not analyze issue with AI");
        return;
      }

      // Update issue in local scan state
      setScan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          issues: prev.issues.map((issue) =>
            issue._id === issueId ? data.issue : issue
          ),
        };
      });
    } catch {
      setError("Could not reach backend for AI explanation");
    } finally {
      setExplainingIssueId(null);
    }
  }

  // Request AI Fix Generation
  async function handleGenerateFix(issueId) {
    setGeneratingFixId(issueId);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/${issueId}/fix`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Could not generate fix for this issue");
        return;
      }

      setFixesByIssue((prev) => ({
        ...prev,
        [issueId]: data,
      }));
    } catch {
      setError("Could not reach backend to generate fix");
    } finally {
      setGeneratingFixId(null);
    }
  }

  // Validate AI Fix in Sandbox Runner
  async function handleValidate(agentRunId) {
    if (!agentRunId) return;

    setValidatingByRunId((prev) => ({ ...prev, [agentRunId]: true }));
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/fixes/${agentRunId}/validate`,
        { method: "POST" }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Could not validate fix in sandbox");
        return;
      }

      setValidationsByRunId((prev) => ({
        ...prev,
        [agentRunId]: data,
      }));
    } catch {
      setError("Could not reach backend to validate sandbox fix");
    } finally {
      setValidatingByRunId((prev) => ({ ...prev, [agentRunId]: false }));
    }
  }

  // Open Pull Request on GitHub
  async function handleCreatePR(agentRunId) {
    if (!agentRunId) return;

    setCreatingPRByRunId((prev) => ({ ...prev, [agentRunId]: true }));
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/fixes/${agentRunId}/pr`,
        { method: "POST" }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Could not create Pull Request on GitHub");
        return;
      }

      setPrsByRunId((prev) => ({
        ...prev,
        [agentRunId]: data,
      }));
    } catch {
      setError("Could not reach backend to create GitHub Pull Request");
    } finally {
      setCreatingPRByRunId((prev) => ({ ...prev, [agentRunId]: false }));
    }
  }

  // Restart scan handler
  const handleRestartScan = () => {
    setScanId(null);
    setScan(null);
    handleStartScan();
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Hero & Ingest Search Form */}
      <RepoInputSection
        url={url}
        setUrl={setUrl}
        handleSubmit={handleSubmit}
        loading={loading}
        error={error}
        setError={setError}
      />

      {/* Ingested Repository Overview Card */}
      {result && (
        <RepoOverviewCard
          result={result}
          handleStartScan={handleStartScan}
          scanId={scanId}
          scanStatus={scan?.scan?.status}
        />
      )}

      {/* Scan Dashboard & Active Diagnostic Scanner */}
      {scan && (
        <ScanDashboard
          scan={scan}
          handleRestartScan={handleRestartScan}
        />
      )}

      {/* Interactive Issues Explorer */}
      {scan?.scan?.status === "COMPLETED" && (
        <IssuesExplorer
          issues={scan.issues || []}
          handleExplain={handleExplain}
          explainingIssueId={explainingIssueId}
          handleGenerateFix={handleGenerateFix}
          generatingFixId={generatingFixId}
          fixesByIssue={fixesByIssue}
          handleValidate={handleValidate}
          validatingByRunId={validatingByRunId}
          validationsByRunId={validationsByRunId}
          handleCreatePR={handleCreatePR}
          creatingPRByRunId={creatingPRByRunId}
          prsByRunId={prsByRunId}
        />
      )}
    </div>
  );
}

export default App;