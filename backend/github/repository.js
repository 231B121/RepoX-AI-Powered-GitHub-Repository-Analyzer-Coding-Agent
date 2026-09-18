const octokit = require("./client");

async function getRepositoryMetadata(owner, repo) {
  const { data } = await octokit.repos.get({
    owner,
    repo,
  });

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    defaultBranch: data.default_branch,
    language: data.language,
    stars: data.stargazers_count,
    isPrivate: data.private,
  };
}

async function getFileTree(owner, repo, branch) {
  // Step 1: Resolve branch name to a commit SHA
  const { data: branchData } = await octokit.repos.getBranch({
    owner,
    repo,
    branch,
  });

  const treeSha = branchData.commit.sha;

  // Step 2: Fetch the full recursive tree
  const { data } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true",
  });

  if (data.truncated) {
    console.warn(
      `File tree for ${owner}/${repo} was truncated by GitHub`
    );
  }

  return data.tree
    .filter((item) => item.type === "blob")
    .map((item) => ({
      path: item.path,
      size: item.size,
    }));
}

async function getFileContent(owner, repo, path, ref) {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`${path} is not a file`);
  }

  // GitHub returns file content as base64-encoded
  return Buffer.from(data.content, "base64").toString("utf-8");
}

module.exports = {
  getRepositoryMetadata,
  getFileTree,
  getFileContent,
};