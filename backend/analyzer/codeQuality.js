const { ESLint } = require("eslint");
const { getFileContent } = require("../github/repository");

const SEVERITY_MAP = { 1: "LOW", 2: "MEDIUM" }; // ESLint: 1=warn, 2=error

// Common Node.js and Web browser globals to prevent false positives on standard APIs
const STANDARD_GLOBALS = {
  // Node.js globals
  require: "readonly",
  module: "readonly",
  exports: "readonly",
  process: "readonly",
  console: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  Buffer: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  setImmediate: "readonly",
  clearImmediate: "readonly",
  global: "readonly",
  // Web & Browser globals
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  fetch: "readonly",
  alert: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  AbortController: "readonly",
  FormData: "readonly",
  Headers: "readonly",
  Request: "readonly",
  Response: "readonly",
};

async function analyzeCodeQuality(owner, repo, defaultBranch, filePaths, repositoryId) {
  try {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
              ecmaFeatures: {
                jsx: true,
              },
            },
            globals: STANDARD_GLOBALS,
          },
          rules: {
            // Error prevention & logic bugs
            "no-undef": "error",
            "no-dupe-keys": "error",
            "no-duplicate-case": "error",
            "no-unreachable": "error",
            "no-self-assign": "error",
            "no-self-compare": "error",
            "no-constant-condition": "warn",
            "no-debugger": "error",
            "valid-typeof": "error",
            "use-isnan": "error",
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-async-promise-executor": "error",
            "no-compare-neg-zero": "error",
            "no-loss-of-precision": "error",

            // Code hygiene & modern practices
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            eqeqeq: ["warn", "smart"],
            "no-var": "warn",
            "prefer-const": "warn",
            "no-empty": ["warn", { allowEmptyCatch: true }],
            "no-extra-semi": "warn",
          },
        },
      ],
    });

    const issues = [];

    // Tight scan: include .js, .mjs, .cjs, .jsx, .ts, .tsx
    const codeFiles = filePaths
      .filter((f) => /\.(js|mjs|cjs|jsx)$/i.test(f))
      .filter((f) => !f.includes("node_modules") && !f.includes("dist") && !f.includes("build"))
      .slice(0, 60);

    for (const filePath of codeFiles) {
      let content;
      try {
        content = await getFileContent(owner, repo, filePath, defaultBranch);
      } catch {
        continue; // unreadable or binary file
      }

      try {
        const results = await eslint.lintText(content, { filePath });

        for (const result of results) {
          if (!result.messages || result.messages.length === 0) continue;

          // Group messages by ruleId within this file so we do not spam duplicate issues
          const ruleGroups = {};
          for (const msg of result.messages) {
            if (msg.message && msg.message.includes("File ignored because")) continue;
            const rule = msg.ruleId || "syntax-error";
            if (!ruleGroups[rule]) {
              ruleGroups[rule] = {
                rule,
                severity: SEVERITY_MAP[msg.severity] || "LOW",
                messages: [],
                lines: [],
              };
            }
            ruleGroups[rule].messages.push(msg.message);
            if (msg.line) ruleGroups[rule].lines.push(msg.line);
          }

          // Emit one consolidated issue per rule violation per file
          for (const group of Object.values(ruleGroups)) {
            const uniqueLines = [...new Set(group.lines)].sort((a, b) => a - b);
            const lineStr = uniqueLines.length === 1
              ? `line ${uniqueLines[0]}`
              : `lines ${uniqueLines.slice(0, 8).join(", ")}${uniqueLines.length > 8 ? ` (+${uniqueLines.length - 8} more)` : ""}`;

            // Clean up description
            const summaryDesc = group.messages.length === 1
              ? `${group.messages[0]} (on ${lineStr})`
              : `${group.messages.length} occurrences found on ${lineStr}: ${[...new Set(group.messages)].slice(0, 3).join("; ")}${group.messages.length > 3 ? "..." : ""}`;

            issues.push({
              repositoryId,
              category: "CODE_QUALITY",
              severity: group.severity,
              title: `${group.rule} (${group.messages.length} occurrence${group.messages.length > 1 ? "s" : ""})`,
              description: summaryDesc,
              filePath,
              lineNumber: uniqueLines[0],
              evidence: `ESLint rule "${group.rule}" triggered on ${lineStr}`,
              recommendation: `Address the ${group.rule} violations across ${lineStr} in ${filePath}.`,
              confidence: 0.95,
            });
          }
        }
      } catch (lintErr) {
        console.warn(`Skipping linting for ${filePath}:`, lintErr.message);
      }
    }

    return issues;
  } catch (err) {
    console.error("Code quality analysis failed:", err.message);
    return [];
  }
}

module.exports = { analyzeCodeQuality };