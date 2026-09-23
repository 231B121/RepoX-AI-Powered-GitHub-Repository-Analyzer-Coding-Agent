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
  } else if (importantUntested.length > 0) {
    const untestedNames = importantUntested.map((p) => p.split("/").pop());
    const sampleList = untestedNames.slice(0, 5).join(", ");
    const moreCount = untestedNames.length > 5 ? ` (+${untestedNames.length - 5} more)` : "";

    issues.push({
      repositoryId,
      category: "TESTING",
      severity: "LOW",
      title: `Expand unit test coverage (${importantUntested.length} modules untested)`,
      description: `Repository has ${testFiles.length} active test file(s), but ${importantUntested.length} modules currently lack dedicated unit tests: ${sampleList}${moreCount}.`,
      filePath: importantUntested[0],
      evidence: `${testFiles.length} test files indexed for ${sourceFiles.length} source files`,
      recommendation: `Add unit tests covering main functions in ${sampleList}.`,
      confidence: 0.75,
    });
  }

  return issues;
}

module.exports = { analyzeTests };