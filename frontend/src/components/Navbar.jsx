import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import GithubIcon from "./GithubIcon";

export default function Navbar() {
  const [backendStatus, setBackendStatus] = useState("checking"); // 'online' | 'offline' | 'checking'

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("http://localhost:5000/health");
        if (res.ok) {
          const data = await res.json();
          if (data.database === "connected") {
            setBackendStatus("online");
          } else {
            setBackendStatus("degraded");
          }
        } else {
          setBackendStatus("offline");
        }
      } catch {
        setBackendStatus("offline");
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href="/" className="brand-wrapper">
          <div className="brand-icon">
            <Sparkles size={26} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <span className="brand-title">RepoX</span>
              <span className="brand-badge">AI Doctor v2.0</span>
            </div>
          </div>
        </a>

        <div className="nav-actions">
          {backendStatus === "online" && (
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>API & DB Connected</span>
            </div>
          )}

          {backendStatus === "degraded" && (
            <div
              className="status-indicator"
              style={{
                background: "var(--medium-bg)",
                borderColor: "var(--medium-border)",
                color: "var(--medium-text)",
              }}
            >
              <span className="status-dot" style={{ background: "#eab308" }}></span>
              <span>DB Connecting...</span>
            </div>
          )}

          {backendStatus === "offline" && (
            <div
              className="status-indicator"
              style={{
                background: "var(--critical-bg)",
                borderColor: "var(--critical-border)",
                color: "var(--critical-text)",
              }}
            >
              <span className="status-dot" style={{ background: "#ef4444" }}></span>
              <span>Backend Offline</span>
            </div>
          )}

          <a
            href="https://github.com/231B121/RepoX-AI-Powered-GitHub-Repository-Analyzer-Coding-Agent"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            <GithubIcon size={20} />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
