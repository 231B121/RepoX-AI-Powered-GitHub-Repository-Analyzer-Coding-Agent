import { useEffect, useState } from "react";

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError("Could not reach backend"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>GitHub Repo Doctor</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {health && (
        <ul>
          <li>Status: {health.status}</li>
          <li>App: {health.app}</li>
          <li>Database: {health.database}</li>
        </ul>
      )}
    </div>
  );
}

export default App;