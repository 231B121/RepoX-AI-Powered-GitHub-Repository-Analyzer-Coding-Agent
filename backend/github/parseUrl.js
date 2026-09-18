function parseGitHubUrl(rawUrl) {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error("Not a valid URL");
    }
  
    if (url.hostname !== "github.com") {
      throw new Error("URL must be a github.com link");
    }
  
    const parts = url.pathname.split("/").filter(Boolean); // removes empty strings
    if (parts.length < 2) {
      throw new Error("URL must include an owner and repository name");
    }
  
    const [owner, repo] = parts;
    return { owner, repo: repo.replace(/\.git$/, "") };
  }
  
  module.exports = { parseGitHubUrl };