const { getFileContent } = require("../github/repository");
const Repository = require("../models/Repository");

async function readFile(repositoryId, path, allowedFiles) {
  if (!allowedFiles.includes(path)) {
    throw new Error(`Access denied: ${path} is not in the allowed file list`);
  }

  const repository = await Repository.findById(repositoryId);
  return getFileContent(repository.owner, repository.repo, path, repository.defaultBranch);
}

module.exports = { readFile };