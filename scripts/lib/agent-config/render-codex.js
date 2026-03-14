const fs = require('fs');
const path = require('path');

const { copyPath, ensureDir, removeDirContents, writeFile } = require('./filesystem');
const {
  generateCodexManagedConfig,
  generateCodexRootAgentsMd,
  generateCodexSupplement,
} = require('./generate-agents-md');

function copySkills(rootDir, targetDir, skills) {
  const upstreamSkillsDir = path.join(rootDir, 'skills');
  const customSkillsDir = path.join(rootDir, 'overlay', 'custom', 'skills');
  const eccDestinationDir = path.join(targetDir, '.agents', 'skills', 'ecc');
  const customDestinationDir = path.join(targetDir, '.agents', 'skills', 'custom');

  ensureDir(eccDestinationDir);
  ensureDir(customDestinationDir);

  for (const skill of skills) {
    const customPath = path.join(customSkillsDir, skill);
    if (fs.existsSync(customPath)) {
      copyPath(customPath, path.join(customDestinationDir, skill));
      continue;
    }

    copyPath(path.join(upstreamSkillsDir, skill), path.join(eccDestinationDir, skill));
  }
}

function copyConfiguredPaths(rootDir, targetDir, selection) {
  for (const relativeDir of selection.tooling.copyDirs) {
    copyPath(path.join(rootDir, relativeDir), path.join(targetDir, relativeDir.replace(/^\.codex\//, '')));
  }

  for (const relativeFile of selection.tooling.copyFiles) {
    copyPath(path.join(rootDir, relativeFile), path.join(targetDir, relativeFile));
  }
}

function copyPrivateProfiles(targetDir, selection) {
  if (!selection.custom || !selection.custom.privateProfiles) {
    return;
  }

  for (const profile of selection.custom.privateProfiles) {
    if (!fs.existsSync(profile.sourcePath)) {
      continue;
    }

    copyPath(profile.sourcePath, path.join(targetDir, profile.targetPath));
  }
}

function renderCodex(rootDir, targetDir, selection) {
  ensureDir(targetDir);

  const protectedPaths = new Set(selection.tooling.protectedPaths);
  for (const dirName of ['agents', '.agents', '.codex']) {
    if (protectedPaths.has(dirName)) {
      continue;
    }

    removeDirContents(path.join(targetDir, dirName));
  }

  copySkills(rootDir, targetDir, selection.shared.skills);
  copyConfiguredPaths(rootDir, targetDir, selection);
  copyPrivateProfiles(targetDir, selection);

  writeFile(path.join(targetDir, 'AGENTS.md'), generateCodexRootAgentsMd(selection));
  writeFile(path.join(targetDir, '.codex', 'AGENTS.md'), generateCodexSupplement(selection));
  writeFile(path.join(targetDir, '.codex', 'config.ecc.toml'), generateCodexManagedConfig(selection));

  return {
    generatedFiles: [
      path.join(targetDir, 'AGENTS.md'),
      path.join(targetDir, '.codex', 'AGENTS.md'),
      path.join(targetDir, '.codex', 'config.ecc.toml')
    ]
  };
}

module.exports = {
  renderCodex
};
