const { analyzeSecurity } = require("../analyzer/security");
const { getFileContent } = require("../github/repository");

// Mock getFileContent to simulate file reading without GitHub API
jest.mock("../github/repository", () => ({
  getFileContent: jest.fn(),
}));

describe("security analyzer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("detects a known AWS-key-shaped string with expected confidence of 0.8", async () => {
    const mockContent = `
const config = {
  region: "us-east-1",
  accessKeyId: "AKIAIOSFODNN7EXAMPLE"
};
`;
    getFileContent.mockResolvedValue(mockContent);

    const issues = await analyzeSecurity(
      "testowner",
      "testrepo",
      "main",
      ["src/awsConfig.js"],
      "repo-123"
    );

    expect(getFileContent).toHaveBeenCalledWith("testowner", "testrepo", "src/awsConfig.js", "main");
    expect(issues).toHaveLength(1);

    const awsIssue = issues[0];
    expect(awsIssue.repositoryId).toBe("repo-123");
    expect(awsIssue.category).toBe("SECURITY");
    expect(awsIssue.severity).toBe("HIGH");
    expect(awsIssue.title).toBe("Potential AWS Access Key detected");
    expect(awsIssue.confidence).toBe(0.8);
    expect(awsIssue.filePath).toBe("src/awsConfig.js");
    expect(awsIssue.lineNumber).toBe(4);
    expect(awsIssue.evidence).toContain("AKIA[0-9A-Z]{16}");
  });

  test("detects generic API key pattern with 0.4 confidence", async () => {
    const mockContent = `const api_key = "abcde12345fghij67890";`;
    getFileContent.mockResolvedValue(mockContent);

    const issues = await analyzeSecurity(
      "testowner",
      "testrepo",
      "main",
      ["config.json"],
      "repo-123"
    );

    const genericIssue = issues.find((i) => i.title.includes("Generic API Key"));
    expect(genericIssue).toBeDefined();
    expect(genericIssue.confidence).toBe(0.4);
    expect(genericIssue.severity).toBe("HIGH");
  });

  test("detects private key header with 0.9 confidence", async () => {
    const mockContent = `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...`;
    getFileContent.mockResolvedValue(mockContent);

    const issues = await analyzeSecurity(
      "testowner",
      "testrepo",
      "main",
      ["server.key.js"],
      "repo-123"
    );

    const rsaIssue = issues.find((i) => i.title.includes("Private Key Header"));
    expect(rsaIssue).toBeDefined();
    expect(rsaIssue.confidence).toBe(0.9);
  });

  test("returns empty issues array when no secrets are present", async () => {
    const mockContent = `console.log("Hello, world!");`;
    getFileContent.mockResolvedValue(mockContent);

    const issues = await analyzeSecurity(
      "testowner",
      "testrepo",
      "main",
      ["index.js"],
      "repo-123"
    );

    expect(issues).toEqual([]);
  });

  test("filters out non-candidate files (e.g. .md, .png, or node_modules)", async () => {
    const issues = await analyzeSecurity(
      "testowner",
      "testrepo",
      "main",
      ["README.md", "node_modules/express/index.js", "logo.png"],
      "repo-123"
    );

    expect(getFileContent).not.toHaveBeenCalled();
    expect(issues).toEqual([]);
  });

  test("gracefully skips unreadable files if getFileContent throws", async () => {
    getFileContent.mockRejectedValue(new Error("File not readable"));

    const issues = await analyzeSecurity(
      "testowner",
      "testrepo",
      "main",
      ["unreadable.js"],
      "repo-123"
    );

    expect(issues).toEqual([]);
  });
});
