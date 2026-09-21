import { X, Loader2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import GithubIcon from "./GithubIcon";

export default function RepoInputSection({
  url,
  setUrl,
  handleSubmit,
  loading,
  error,
  setError,
}) {
  const sampleRepos = [
    {
      label: "RepoX-AI-Powered-GitHub-Repository-Analyzer-Coding-Agent",
      slug: "231B121/RepoX-AI-Powered-GitHub-Repository-Analyzer-Coding-Agent",
    },
    {
      label: "express",
      slug: "expressjs/express",
    },
    {
      label: "react",
      slug: "facebook/react",
    },
    {
      label: "Network-Packet-Sniffer-and-Monitoring-System-",
      slug: "231B121/Network-Packet-Sniffer-and-Monitoring-System-",
    },
  ];

  const handleSelectSample = (repoSlug) => {
    setUrl(`https://github.com/${repoSlug}`);
    setError(null);
  };

  return (
    <section className="hero-section">
      <div className="hero-pill">
        <Sparkles size={16} />
        <span>Next-Gen Autonomous Code Health</span>
      </div>

      <h1 className="hero-title">
        Audit & Fix Repositories with <span className="hero-gradient-text">AI Precision</span>
      </h1>

      <p className="hero-desc">
        Enter any public GitHub repository link. RepoX inspects architecture, dependencies,
        ESLint violations, test coverage, and generates tested patches right in your browser.
      </p>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-box-wrapper">
          <div className="search-input-inner">
            <GithubIcon size={22} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="https://github.com/owner/repository"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              spellCheck={false}
            />
            {url && !loading && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setUrl("");
                  setError(null);
                }}
                title="Clear input"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary search-submit-btn" disabled={loading || !url.trim()}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Ingesting...</span>
              </>
            ) : (
              <>
                <span>Ingest Repo</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Try Samples */}
      <div className="quick-samples">
        <span className="quick-samples-label">Try sample:</span>
        {sampleRepos.map((item) => (
          <button
            key={item.slug}
            type="button"
            className="sample-chip"
            onClick={() => handleSelectSample(item.slug)}
            title={`Load https://github.com/${item.slug}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="clear-btn"
            onClick={() => setError(null)}
            title="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
