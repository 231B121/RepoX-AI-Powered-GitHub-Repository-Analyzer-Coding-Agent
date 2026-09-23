const { getFileContent } = require("../github/repository");

const SECURITY_CHECKS = [
  {
    name: "AWS Access Key",
    pattern: /AKIA[0-9A-Z]{16}/,
    severity: "CRITICAL",
    confidence: 0.9,
    recommendation: "Revoke this AWS Access Key immediately and inject via AWS IAM or environment variables.",
  },
  {
    name: "GitHub Token",
    pattern: /gh[pousr]_[0-9a-zA-Z]{36,255}/,
    severity: "CRITICAL",
    confidence: 0.95,
    recommendation: "Revoke the exposed GitHub token immediately from GitHub Settings.",
  },
  {
    name: "Private Cryptographic Key",
    pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
    severity: "CRITICAL",
    confidence: 0.98,
    recommendation: "Remove private cryptographic keys from the codebase and add key paths to .gitignore.",
  },
  {
    name: "Slack Webhook or Token",
    pattern: /(xox[baprs]-[0-9a-zA-Z]{10,48}|https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9a-zA-Z]+)/,
    severity: "HIGH",
    confidence: 0.9,
    recommendation: "Move Slack webhooks and tokens to server-side environment variables.",
  },
  {
    name: "Stripe API Secret Key",
    pattern: /[sr]k_(live|test)_[0-9a-zA-Z]{24,34}/,
    severity: "HIGH",
    confidence: 0.9,
    recommendation: "Rotate the Stripe secret key in your Stripe dashboard and store in .env.",
  },
  {
    name: "Hardcoded Database Credentials",
    pattern: /mongodb(\+srv)?:\/\/[a-zA-Z0-9_.-]+:[^@\s"']+@[a-zA-Z0-9_.-]+/i,
    severity: "CRITICAL",
    confidence: 0.85,
    recommendation: "Extract database connection strings and passwords into environment variables.",
  },
  {
    name: "Hardcoded JWT Secret",
    pattern: /jwt\.(sign|verify)\s*\([^,]+,\s*["'][A-Za-z0-9_\-]{3,}["']/i,
    severity: "HIGH",
    confidence: 0.85,
    recommendation: "Use process.env.JWT_SECRET instead of hardcoding signing keys in source code.",
  },
  {
    name: "Hardcoded Secret or API Key Assignment",
    pattern: /(api[_-]?key|secret[_-]?key|client[_-]?secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i,
    severity: "HIGH",
    confidence: 0.6,
    recommendation: "Verify if this credential is active. Move secret keys to secret managers or environment variables.",
  },
  {
    name: "Direct eval() Code Execution",
    pattern: /\beval\s*\([^)]+\)/,
    severity: "HIGH",
    confidence: 0.85,
    recommendation: "Avoid eval(). Use JSON.parse(), direct property lookups, or safe parsers.",
  },
  {
    name: "child_process.exec Shell Execution",
    pattern: /child_process\.(exec|execSync)\s*\(/,
    severity: "HIGH",
    confidence: 0.75,
    recommendation: "Prefer child_process.execFile or execFileAsync with array arguments to prevent shell injection.",
  },
  {
    name: "Raw innerHTML / XSS Risk",
    pattern: /(\.innerHTML\s*=|dangerouslySetInnerHTML\s*=)/,
    severity: "MEDIUM",
    confidence: 0.7,
    recommendation: "Sanitize HTML using DOMPurify before inserting into the DOM or use textContent/safe React state.",
  },
];

async function analyzeSecurity(owner, repo, defaultBranch, filePaths, repositoryId) {
  const issues = [];

  // Check if sensitive files like .env are tracked in the Git tree
  const exposedEnvFiles = filePaths.filter(
    (p) => /(^\.env|\/\.env)(\.local|\.production|\.development)?$/i.test(p) && !p.includes(".example")
  );

  for (const envFile of exposedEnvFiles) {
    issues.push({
      repositoryId,
      category: "SECURITY",
      severity: "HIGH",
      title: `Sensitive environment file committed: ${envFile}`,
      description: `The file "${envFile}" is tracked in Git. Environment files often contain API keys, database credentials, and secrets.`,
      filePath: envFile,
      evidence: `File exists in repository tree: ${envFile}`,
      recommendation: `Remove ${envFile} from git tracking (git rm --cached) and add it to .gitignore.`,
      confidence: 0.95,
    });
  }

  // Filter candidate source and configuration files (exclude tests and test fixtures to prevent false positives on mock tokens)
  const candidateFiles = filePaths
    .filter((p) => /\.(js|mjs|cjs|jsx|ts|tsx|json|env|yaml|yml|py)$/i.test(p))
    .filter((p) => !p.includes("node_modules") && !p.includes("dist") && !p.includes("package-lock.json"))
    .filter((p) => !/(^|\/)(\.test\.|\.spec\.|tests?\/|__tests__\/|fixtures\/|mocks?\/)/i.test(p))
    .slice(0, 50);

  for (const filePath of candidateFiles) {
    let content;
    try {
      content = await getFileContent(owner, repo, filePath, defaultBranch);
    } catch {
      continue;
    }

    const fileSecurityFindings = [];

    for (const check of SECURITY_CHECKS) {
      const match = content.match(check.pattern);
      if (match) {
        const lineNumber = content.slice(0, match.index).split("\n").length;
        fileSecurityFindings.push({
          ...check,
          lineNumber,
          matchedText: match[0].slice(0, 40),
        });
      }
    }

    // Emit consolidated or distinct security issues for the file
    for (const finding of fileSecurityFindings) {
      issues.push({
        repositoryId,
        category: "SECURITY",
        severity: finding.severity,
        title: `Security: Potential ${finding.name} in ${filePath.split("/").pop()}`,
        description: `A security vulnerability or credential pattern matching "${finding.name}" was detected on line ${finding.lineNumber}.`,
        filePath,
        lineNumber: finding.lineNumber,
        evidence: `Pattern matched on line ${finding.lineNumber}: ${finding.matchedText}...`,
        recommendation: finding.recommendation,
        confidence: finding.confidence,
      });
    }
  }

  return issues;
}

module.exports = { analyzeSecurity };
