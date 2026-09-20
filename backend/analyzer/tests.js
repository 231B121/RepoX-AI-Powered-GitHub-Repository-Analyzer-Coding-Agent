const TEST_PATTERNS = [/\.test\.js$/, /\.spec\.js$/, /^__tests__\//];

function isTestFile(path) {
  return TEST_PATTERNS.some((pattern) => pattern.test(path));
}

function isSourceFile(path) {
  return path.endsWith(".js") && !isTestFile(path) && !path.includes("node_modules");
}

// Turns "src/services/orderService.js" into "orderService"
// so we can match it against "orderService.test.js" regardless of folder
function baseName(path) {
  return path.split("/").pop().replace(/\.(test\.|spec\.)?js$/, "");
}

function analyzeTests(filePaths, repositoryId) {
  const sourceFiles = filePaths.filter(isSourceFile);
  const testFiles = filePaths.filter(isTestFile);
  const testedNames = new Set(testFiles.map(baseName));

  const issues = [];

  // Flag important-looking untested modules — today, "important" means
  // anything under src/ that isn't a config/index file, kept intentionally simple
  const importantUntested = sourceFiles.filter((path) => {
    const name = baseName(path);
    const isConfigOrIndex = ["index", "config", "app"].includes(name);
    return !isConfigOrIndex && !testedNames.has(name);
  });

  if (testFiles.length === 0 && sourceFiles.length > 0) {
    issues.push({
      repositoryId,
      category: "TESTING",
      severity: "HIGH",
      title: "No test files detected",
      description: `Repository has ${sourceFiles.length} source file(s) but no files matching common test conventions (*.test.js, *.spec.js, __tests__/).`,
      evidence: "No files matched test naming conventions",
      recommendation: "Introduce a test suite, starting with the most critical modules.",
      confidence: 0.9,
    });
  } else {
    for (const path of importantUntested.slice(0, 20)) {
      issues.push({
        repositoryId,
        category: "TESTING",
        severity: "MEDIUM",
        title: `No test file found for ${path}`,
        description: `No corresponding test file was found for this module by naming convention.`,
        filePath: path,
        evidence: `No file named ${baseName(path)}.test.js or ${baseName(path)}.spec.js found`,
        recommendation: `Add tests covering the main behaviors of ${path}.`,
        confidence: 0.6,
      });
    }
  }

  return issues;
}

module.exports = { analyzeTests };