const { getFileContent } = require("../github/repository");

const EXPECTED_SECTIONS = [
  { key: "installation", pattern: /install/i, label: "Installation instructions" },
  { key: "usage", pattern: /usage|getting started/i, label: "Usage instructions" },
  { key: "env", pattern: /environment variable|\.env/i, label: "Environment configuration" },
  { key: "license", pattern: /license/i, label: "License information" },
];

async function analyzeDocumentation(owner, repo, defaultBranch, filePaths, repositoryId) {
  const issues = [];
  const readmePath = filePaths.find((p) => /^readme\.md$/i.test(p));

  if (!readmePath) {
    issues.push({
      repositoryId,
      category: "DOCUMENTATION",
      severity: "MEDIUM",
      title: "No README found",
      description: "Repository does not contain a README.md at the root.",
      evidence: "No file matching README.md found in file tree",
      recommendation: "Add a README describing the project, installation, and usage.",
      confidence: 0.95,
    });
    return issues;
  }

  const content = await getFileContent(owner, repo, readmePath, defaultBranch);

  for (const section of EXPECTED_SECTIONS) {
    if (!section.pattern.test(content)) {
      issues.push({
        repositoryId,
        category: "DOCUMENTATION",
        severity: "LOW",
        title: `README missing: ${section.label}`,
        description: `No content matching "${section.label}" was detected in the README.`,
        filePath: readmePath,
        evidence: `Pattern /${section.pattern.source}/ not found in README content`,
        recommendation: `Consider adding a section covering ${section.label.toLowerCase()}.`,
        confidence: 0.5,
      });
    }
  }

  return issues;
}

module.exports = { analyzeDocumentation };
