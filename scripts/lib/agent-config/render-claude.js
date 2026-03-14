const fs = require('fs');
const path = require('path');

const { copyPath, ensureDir, removeDirContents, writeFile } = require('./filesystem');
const { generateClaudeAgentsMd, generateClaudeRootAgentsMd } = require('./generate-agents-md');

function copySelectedAgents(rootDir, targetDir, agents) {
  const sourceDir = path.join(rootDir, 'agents');
  const destinationDir = path.join(targetDir, 'agents');
  ensureDir(destinationDir);

  for (const agent of agents) {
    copyPath(path.join(sourceDir, `${agent}.md`), path.join(destinationDir, `${agent}.md`));
  }
}

function copySelectedCommands(rootDir, targetDir, commands) {
  const sourceDir = path.join(rootDir, 'commands');
  const destinationDir = path.join(targetDir, 'commands');
  ensureDir(destinationDir);

  for (const commandName of commands) {
    copyPath(path.join(sourceDir, `${commandName}.md`), path.join(destinationDir, `${commandName}.md`));
  }
}

function copySelectedRules(rootDir, targetDir, rules) {
  for (const rule of rules) {
    copyPath(path.join(rootDir, 'rules', rule), path.join(targetDir, 'rules', rule));
  }
}

function copySelectedSkills(rootDir, targetDir, skills) {
  const upstreamSkillsDir = path.join(rootDir, 'skills');
  const customSkillsDir = path.join(rootDir, 'overlay', 'custom', 'skills');
  const destinationDir = path.join(targetDir, 'skills');
  ensureDir(destinationDir);

  for (const skill of skills) {
    const upstreamPath = path.join(upstreamSkillsDir, skill);
    const customPath = path.join(customSkillsDir, skill);
    if (fs.existsSync(customPath)) {
      copyPath(customPath, path.join(destinationDir, skill));
      continue;
    }

    copyPath(upstreamPath, path.join(destinationDir, skill));
  }
}

function copySharedInfrastructure(rootDir, targetDir, selection) {
  for (const relativeDir of selection.tooling.copyDirs) {
    copyPath(path.join(rootDir, relativeDir), path.join(targetDir, relativeDir));
  }

  for (const relativeFile of selection.tooling.copyFiles) {
    copyPath(path.join(rootDir, relativeFile), path.join(targetDir, relativeFile));
  }
}

function copyCustomCommands(rootDir, targetDir, selection) {
  if (!selection.custom || !selection.custom.commands || selection.custom.commands.length === 0) {
    return;
  }

  const sourceDir = path.join(rootDir, 'overlay', 'custom', 'commands');
  const destinationDir = path.join(targetDir, 'commands');
  ensureDir(destinationDir);

  for (const commandName of selection.custom.commands) {
    copyPath(path.join(sourceDir, `${commandName}.md`), path.join(destinationDir, `${commandName}.md`));
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

function renderClaude(rootDir, targetDir, selection) {
  ensureDir(targetDir);

  const protectedPaths = new Set(selection.tooling.protectedPaths);
  for (const dirName of ['agents', 'rules', 'skills', 'commands', 'contexts', 'hooks', 'mcp-configs', 'scripts', '.claude']) {
    if (protectedPaths.has(dirName)) {
      continue;
    }

    removeDirContents(path.join(targetDir, dirName));
  }

  copySelectedAgents(rootDir, targetDir, selection.shared.agents);
  copySelectedCommands(rootDir, targetDir, selection.shared.commands);
  copySelectedRules(rootDir, targetDir, selection.shared.rules);
  copySelectedSkills(rootDir, targetDir, selection.shared.skills);
  copySharedInfrastructure(rootDir, targetDir, selection);
  copyCustomCommands(rootDir, targetDir, selection);
  copyPrivateProfiles(targetDir, selection);

  writeFile(path.join(targetDir, 'rules', 'common', 'agents.md'), generateClaudeAgentsMd(selection));
  writeFile(path.join(targetDir, 'AGENTS.md'), generateClaudeRootAgentsMd(selection));

  return {
    generatedFiles: [
      path.join(targetDir, 'rules', 'common', 'agents.md'),
      path.join(targetDir, 'AGENTS.md')
    ]
  };
}

module.exports = {
  renderClaude
};
