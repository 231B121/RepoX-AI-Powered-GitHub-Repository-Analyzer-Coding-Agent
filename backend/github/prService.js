const octokit = require("./client");

async function createFixBranch(owner, repo, defaultBranch, issueId) {
  const branchName = `repo-doctor/fix-${issueId}`;

  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  });
  const baseSha = refData.object.sha;

  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });
  } catch (err) {
    if (err.status !== 422) throw err; // 422 = ref already exists, safe to reuse
  }

  return branchName;
}

async function commitFix(owner, repo, branchName, filePath, newContent, message) {
  // Need the file's current sha on this branch to update it correctly
  const { data: existing } = await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref: branchName,
  });

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message,
    content: Buffer.from(newContent).toString("base64"),
    sha: existing.sha,
    branch: branchName,
  });
}

async function openPullRequest(owner, repo, branchName, defaultBranch, title, body) {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    head: branchName,
    base: defaultBranch,
    body,
  });
  return data.html_url;
}

module.exports = { createFixBranch, commitFix, openPullRequest };