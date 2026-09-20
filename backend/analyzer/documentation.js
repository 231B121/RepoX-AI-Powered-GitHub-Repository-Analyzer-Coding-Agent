const { getFileContent } = require("../github/repository");

const EXPECTED_SECTIONS = [
  { key: "installation", pattern: /install/i, label: "Installation instructions" },
  { key: "usage", pattern: /usage|getting started/i, label: "Usage instructions" },
  { key: "env", pattern: /environment variable|\.env/i, label: "Environment configuration" },
  { key: "license", pattern: /license/i, label: "License information" },
];

async function analyzeDocumentation(owner, repo, defaultBranch, filePaths, repositoryId) {
  const issues = [];
  const readmePath = filePaths.find((p) => /^readme\.md$/i.test(p) || /\/readme\.md$/i.test(p));

  if (!readmePath) {
    issues.push({
      repositoryId,
      category: "DOCUMENTATION",
      severity: "MEDIUM",
      title: "No README found",
      description: "Repository does not contain a README.md documentation file at the root.",
      evidence: "No file matching README.md found in repository tree",
      recommendation: "Add a README.md describing the project purpose, architecture, installation, and usage.",
      confidence: 0.95,
    });
    return issues;
  }

  let content = "";
  try {
    content = await getFileContent(owner, repo, readmePath, defaultBranch);
  } catch {
    return issues;
  }

  const missingSections = [];
  for (const section of EXPECTED_SECTIONS) {
    if (!section.pattern.test(content)) {
      missingSections.push(section);
    }
  }

  if (missingSections.length > 0) {
    const missingLabels = missingSections.map((s) => s.label);
    const missingPatterns = missingSections.map((s) => `/${s.pattern.source}/i`).join(", ");

    issues.push({
      repositoryId,
      category: "DOCUMENTATION",
      severity: missingSections.length >= 3 ? "MEDIUM" : "LOW",
      title: `README incomplete: Missing ${missingLabels.length} standard section${missingLabels.length > 1 ? "s" : ""}`,
      description: `${readmePath} is missing standard documentation: ${missingLabels.join(", ")}.`,
      filePath: readmePath,
      evidence: `Missing patterns in ${readmePath}: ${missingPatterns}`,
      recommendation: `Update ${readmePath} by adding dedicated sections for: ${missingLabels.join(", ")}.`,
      confidence: 0.9,
    });
  }

  return issues;
}

module.exports = { analyzeDocumentation };