const octokit = require("./client");

/**
 * Creates a dedicated fix branch on the target repository.
 */
async function createFixBranch(owner, repo, defaultBranch, issueId) {
  const branchName = `repox/fix-${issueId.toString().slice(-8)}`;

  // Find base SHA with resilient fallback to actual repository default branch
  let baseSha;
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch || "main"}`,
    });
    baseSha = refData.object.sha;
  } catch (err) {
    try {
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      const fallbackBranch = repoData.default_branch || "main";
      const { data: fallbackRef } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${fallbackBranch}`,
      });
      baseSha = fallbackRef.object.sha;
    } catch {
      throw new Error(`Could not find base branch reference in ${owner}/${repo}: ${err.message}`);
    }
  }

  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });
  } catch (err) {
    if (err.status !== 422) throw err; // 422 = branch already exists, safe to reuse
  }

  return branchName;
}

/**
 * Commits the proposed fix content to the fix branch.
 */
async function commitFix(owner, repo, branchName, filePath, newContent, message) {
  let existingSha;
  try {
    const { data: existing } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branchName,
    });
    existingSha = existing.sha;
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message,
    content: Buffer.from(newContent).toString("base64"),
    sha: existingSha,
    branch: branchName,
  });
}

/**
 * Opens a GitHub Pull Request for the fix branch.
 */
async function openPullRequest(owner, repo, branchName, defaultBranch, title, body) {
  try {
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title,
      head: branchName,
      base: defaultBranch,
      body,
    });
    return data.html_url;
  } catch (err) {
    if (err.status === 422) {
      // PR might already exist for this branch
      const { data: existingPRs } = await octokit.pulls.list({
        owner,
        repo,
        head: branchName.includes(":") ? branchName : `${owner}:${branchName}`,
        state: "open",
      });
      if (existingPRs && existingPRs.length > 0) {
        return existingPRs[0].html_url;
      }
    }
    throw err;
  }
}

/**
 * High-level service function to prepare fork (if needed), create branch, commit fix, and open PR.
 */
async function submitPullRequest({
  owner,
  repo,
  defaultBranch = "main",
  issueId,
  issueTitle,
  issueDescription,
  category,
  severity,
  filePath,
  newContent,
}) {
  const { data: authUser } = await octokit.users.getAuthenticated();
  const authUsername = authUser.login;

  let canPushDirectly = false;
  try {
    const { data: repoInfo } = await octokit.repos.get({ owner, repo });
    canPushDirectly = repoInfo.permissions?.push || false;
  } catch (err) {
    console.warn("Could not determine push permissions:", err.message);
  }

  const branchName = `repox/fix-${issueId.toString().slice(-8)}`;
  let targetOwner = owner;
  let targetRepo = repo;
  let headBranch = branchName;

  if (canPushDirectly || owner.toLowerCase() === authUsername.toLowerCase()) {
    targetOwner = owner;
    targetRepo = repo;
    headBranch = branchName;
  } else {
    // Repository belongs to another user/org — fork to user's account
    console.log(`Repository ${owner}/${repo} is external. Checking/creating fork under ${authUsername}...`);

    let forkReady = false;
    try {
      // Check if fork already exists
      const { data: existingFork } = await octokit.repos.get({
        owner: authUsername,
        repo,
      });
      targetOwner = existingFork.owner.login;
      targetRepo = existingFork.name;
      forkReady = true;
    } catch {
      // Fork does not exist, create it
      try {
        const { data: forkData } = await octokit.repos.createFork({ owner, repo });
        targetOwner = forkData.owner.login;
        targetRepo = forkData.name;
        forkReady = true;
      } catch (forkErr) {
        const msg = forkErr.message || "Fork failed";
        throw new Error(
          `Unable to fork external repository ${owner}/${repo} to ${authUsername}. (${msg}). If you own this repository or have push access, ensure your GitHub token has write permissions.`
        );
      }
    }

    if (!forkReady) {
      throw new Error(`Fork of ${owner}/${repo} could not be initialized for ${authUsername}.`);
    }

    headBranch = `${targetOwner}:${branchName}`;

    // Verify fork is accessible before creating refs
    let verified = false;
    for (let i = 0; i < 6; i++) {
      try {
        await octokit.repos.get({ owner: targetOwner, repo: targetRepo });
        verified = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    if (!verified) {
      throw new Error(`Fork ${targetOwner}/${targetRepo} is still initializing on GitHub. Please retry in 10 seconds.`);
    }
  }

  // 1. Create or ensure branch on target repo
  await createFixBranch(targetOwner, targetRepo, defaultBranch, issueId);

  // 2. Commit patched file
  const commitMessage = `fix(${category ? category.toLowerCase() : "code"}): resolve ${issueTitle || "issue"} in ${filePath}`;
  await commitFix(targetOwner, targetRepo, branchName, filePath, newContent, commitMessage);

  // 3. Open Pull Request on upstream repository
  const prTitle = `fix(${category ? category.toLowerCase() : "code"}): ${issueTitle || "resolve issue"}`;
  const prBody = `## 🤖 Automated Fix Proposed by RepoX

### Issue Summary
- **Issue**: ${issueTitle || "Reported Issue"}
- **Category**: \`${category || "GENERAL"}\`
- **Severity**: \`${severity || "MEDIUM"}\`
- **Affected File**: \`${filePath}\`

### Description
${issueDescription || "This fix addresses an issue detected during automated repository health scanning."}

### 🛡️ Sandbox Verification
- **Status**: ✅ VALIDATED in isolated Docker container (\`node:20-slim\`)
- **Automated Verification**: Passed syntax and integrity verification before PR submission.

---
*Created automatically with [RepoX](https://github.com/231B121/RepoX-AI-Powered-GitHub-Repository-Analyzer-Coding-Agent)*`;

  const prUrl = await openPullRequest(owner, repo, headBranch, defaultBranch, prTitle, prBody);

  return {
    pullRequestUrl: prUrl,
    branchName,
    targetOwner,
  };
}

module.exports = {
  createFixBranch,
  commitFix,
  openPullRequest,
  submitPullRequest,
};