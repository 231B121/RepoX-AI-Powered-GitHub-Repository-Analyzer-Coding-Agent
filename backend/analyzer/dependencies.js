const semver = require("semver");
const { getFileContent } = require("../github/repository");

async function fetchLatestVersion(packageName) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data["dist-tags"]?.latest || null;
  } catch {
    return null;
  }
}

// Known deprecated or high-risk packages to flag
const DEPRECATED_OR_RISKY = {
  request: "Package 'request' is officially deprecated. Use fetch, axios, or undici instead.",
  "node-uuid": "Package 'node-uuid' is deprecated. Use 'uuid' instead.",
  nomnom: "Package 'nomnom' is deprecated. Use 'commander' or 'yargs' instead.",
};

async function analyzeDependencies(owner, repo, defaultBranch, repositoryId, filePaths = []) {
  const issues = [];

  // Find all package.json files across the repository tree (e.g. backend/package.json, frontend/package.json)
  const packageJsonFiles = filePaths.filter(
    (p) => p === "package.json" || p.endsWith("/package.json")
  );

  const targets = packageJsonFiles.length > 0 ? packageJsonFiles : ["package.json"];

  for (const pkgPath of targets) {
    let pkgRaw;
    try {
      pkgRaw = await getFileContent(owner, repo, pkgPath, defaultBranch);
    } catch {
      continue;
    }

    let pkg;
    try {
      pkg = JSON.parse(pkgRaw);
    } catch {
      continue;
    }

    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const outdatedDeps = [];

    for (const [name, versionRange] of Object.entries(deps)) {
      // Check deprecated/risky list
      if (DEPRECATED_OR_RISKY[name]) {
        issues.push({
          repositoryId,
          category: "DEPENDENCY",
          severity: "MEDIUM",
          title: `Deprecated dependency: ${name} in ${pkgPath}`,
          description: DEPRECATED_OR_RISKY[name],
          filePath: pkgPath,
          evidence: `"${name}": "${versionRange}" declared in ${pkgPath}`,
          recommendation: `Replace '${name}' with a maintained, modern alternative.`,
          confidence: 0.95,
        });
      }

      // Check outdated versions
      const currentMin = semver.minVersion(String(versionRange))?.version;
      const latest = await fetchLatestVersion(name);

      if (!currentMin || !latest) continue;

      if (semver.lt(currentMin, latest)) {
        const majorBehind = semver.major(latest) > semver.major(currentMin);
        outdatedDeps.push({
          name,
          current: currentMin,
          latest,
          majorBehind,
          versionRange,
        });
      }
    }

    // Group outdated dependencies for this package.json into prioritized issues
    const majorOutdated = outdatedDeps.filter((d) => d.majorBehind);
    const minorOutdated = outdatedDeps.filter((d) => !d.majorBehind);

    if (majorOutdated.length > 0) {
      const names = majorOutdated.map((d) => d.name).join(", ");
      const details = majorOutdated
        .map((d) => `${d.name} (${d.current} → ${d.latest})`)
        .join("; ");

      issues.push({
        repositoryId,
        category: "DEPENDENCY",
        severity: "MEDIUM",
        title: `${majorOutdated.length} major outdated dependenc${majorOutdated.length > 1 ? "ies" : "y"} in ${pkgPath}`,
        description: `The following packages in ${pkgPath} are one or more major versions behind latest: ${details}.`,
        filePath: pkgPath,
        evidence: `Major version diff detected for: ${names}`,
        recommendation: `Review breaking change changelogs before upgrading major versions of: ${names}.`,
        confidence: 0.95,
      });
    }

    if (minorOutdated.length > 0) {
      const details = minorOutdated
        .slice(0, 5)
        .map((d) => `${d.name} (${d.current} → ${d.latest})`)
        .join("; ");

      issues.push({
        repositoryId,
        category: "DEPENDENCY",
        severity: "LOW",
        title: `${minorOutdated.length} updateable dependenc${minorOutdated.length > 1 ? "ies" : "y"} in ${pkgPath}`,
        description: `Minor/patch updates available in ${pkgPath}: ${details}${minorOutdated.length > 5 ? ` (+${minorOutdated.length - 5} more)` : ""}.`,
        filePath: pkgPath,
        evidence: `Non-breaking updates available for ${minorOutdated.map((d) => d.name).join(", ")}`,
        recommendation: `Run 'npm update' in ${pkgPath.replace(/\/package\.json$/, "") || "."} to upgrade safely.`,
        confidence: 0.9,
      });
    }
  }

  return issues;
}

module.exports = { analyzeDependencies, fetchLatestVersion };