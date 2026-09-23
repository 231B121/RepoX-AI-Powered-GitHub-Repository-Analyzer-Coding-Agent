const { analyzeDependencies, fetchLatestVersion } = require("../analyzer/dependencies");
const { getFileContent } = require("../github/repository");

// Mock getFileContent to avoid real GitHub API calls
jest.mock("../github/repository", () => ({
  getFileContent: jest.fn(),
}));

describe("dependencies analyzer", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("fetchLatestVersion", () => {
    test("returns the latest version when registry returns 200 OK", () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ "dist-tags": { latest: "5.0.0" } }),
      });

      return expect(fetchLatestVersion("express")).resolves.toBe("5.0.0");
    });

    test("returns null when registry response is not ok", () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });

      return expect(fetchLatestVersion("non-existent-package-xyz")).resolves.toBeNull();
    });
  });

  describe("analyzeDependencies", () => {
    test("detects major and minor outdated dependencies and marks correct severity", async () => {
      const mockPackageJson = JSON.stringify({
        dependencies: {
          express: "^4.18.2", // latest 5.0.0 -> major behind (MEDIUM)
          cors: "^2.8.5",     // latest 2.8.5 -> up-to-date (no issue)
        },
        devDependencies: {
          nodemon: "^3.0.0",  // latest 3.1.4 -> minor/patch behind (LOW)
        },
      });

      getFileContent.mockResolvedValue(mockPackageJson);

      global.fetch = jest.fn((url) => {
        if (url.includes("express")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ "dist-tags": { latest: "5.0.0" } }),
          });
        }
        if (url.includes("cors")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ "dist-tags": { latest: "2.8.5" } }),
          });
        }
        if (url.includes("nodemon")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ "dist-tags": { latest: "3.1.4" } }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      const repositoryId = "repo-123";
      const issues = await analyzeDependencies("testowner", "testrepo", "main", repositoryId);

      expect(getFileContent).toHaveBeenCalledWith("testowner", "testrepo", "package.json", "main");
      expect(issues).toHaveLength(2);

      const expressIssue = issues.find((i) => i.title.includes("express"));
      expect(expressIssue).toBeDefined();
      expect(expressIssue.severity).toBe("MEDIUM");
      expect(expressIssue.category).toBe("DEPENDENCY");
      expect(expressIssue.description).toContain("resolves to 4.18.2, latest published is 5.0.0");
      expect(expressIssue.repositoryId).toBe("repo-123");

      const nodemonIssue = issues.find((i) => i.title.includes("nodemon"));
      expect(nodemonIssue).toBeDefined();
      expect(nodemonIssue.severity).toBe("LOW");
      expect(nodemonIssue.description).toContain("resolves to 3.0.0, latest published is 3.1.4");
    });

    test("returns empty array when all dependencies are up-to-date", async () => {
      const mockPackageJson = JSON.stringify({
        dependencies: {
          cors: "^2.8.5",
        },
      });

      getFileContent.mockResolvedValue(mockPackageJson);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ "dist-tags": { latest: "2.8.5" } }),
      });

      const issues = await analyzeDependencies("testowner", "testrepo", "main", "repo-123");
      expect(issues).toEqual([]);
    });

    test("skips dependencies where registry fetch fails", async () => {
      const mockPackageJson = JSON.stringify({
        dependencies: {
          unknownpkg: "^1.0.0",
        },
      });

      getFileContent.mockResolvedValue(mockPackageJson);
      global.fetch = jest.fn().mockResolvedValue({ ok: false });

      const issues = await analyzeDependencies("testowner", "testrepo", "main", "repo-123");
      expect(issues).toEqual([]);
    });
  });
});
