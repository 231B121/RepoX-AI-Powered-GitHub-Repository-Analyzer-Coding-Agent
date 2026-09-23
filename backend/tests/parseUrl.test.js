const { parseGitHubUrl } = require("../github/parseUrl");

describe("parseGitHubUrl", () => {
  test("parses standard GitHub URL correctly", () => {
    const result = parseGitHubUrl("https://github.com/facebook/react");
    expect(result).toEqual({ owner: "facebook", repo: "react" });
  });

  test("strips .git extension from repository name", () => {
    const result = parseGitHubUrl("https://github.com/facebook/react.git");
    expect(result).toEqual({ owner: "facebook", repo: "react" });
  });

  test("rejects non-GitHub URLs", () => {
    expect(() => parseGitHubUrl("https://gitlab.com/a/b")).toThrow();
  });

  test("rejects malformed URLs", () => {
    expect(() => parseGitHubUrl("not a url")).toThrow();
  });

  test("rejects incomplete URLs without owner or repo", () => {
    expect(() => parseGitHubUrl("https://github.com/facebook")).toThrow();
  });
});
