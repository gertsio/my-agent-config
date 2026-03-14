const fs = require('fs');
const path = require('path');

const { copyPath, ensureDir, removeDirContents, writeFile } = require('./filesystem');
const {
  generateCodexManagedConfig,
  generateCodexSupplement,
  generateRootAgentsMd
} = require('./generate-agents-md');

function copyCodexAgents(rootDir, targetDir) {
  const sourceDir = path.join(rootDir, '.codex', 'agents');
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  copyPath(sourceDir, path.join(targetDir, 'agents'));
}

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

function renderCodex(rootDir, targetDir, selection) {
  ensureDir(targetDir);

  const protectedPaths = new Set(selection.tooling.protectedPaths);
  for (const dirName of ['agents', '.agents']) {
    if (protectedPaths.has(dirName)) {
      continue;
    }

    removeDirContents(path.join(targetDir, dirName));
  }

  copyCodexAgents(rootDir, targetDir);
  copySkills(rootDir, targetDir, selection.shared.skills);

  writeFile(path.join(targetDir, 'AGENTS.md'), generateRootAgentsMd(selection));
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
