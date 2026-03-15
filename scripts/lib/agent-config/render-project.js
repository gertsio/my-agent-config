const fs = require('fs');
const path = require('path');

const { copyPath, ensureDir, removeDirContents, writeFile } = require('./filesystem');
const { generateClaudeRootAgentsMd, generateCodexSupplement } = require('./generate-agents-md');

function generateClaudeProjectOverlay(selection, detection) {
  const lines = [
    '# Generated Claude Project Overlay',
    '',
    '<!-- GENERATED FILE. DO NOT EDIT. -->',
    '',
    `Project stacks: ${selection.stacks.join(', ') || 'none'}`,
    '',
    'This project expects the shared Claude home-level base plus the following stack-specific guidance:',
    ''
  ];

  for (const rule of selection.shared.rules) {
    lines.push(`- Prefer ${rule} rules`);
  }

  if (detection) {
    lines.push('');
    lines.push('## Auto-Detection Results');
    lines.push('');
    if (detection.languages.length > 0) {
      lines.push(`- Languages: ${detection.languages.join(', ')}`);
    }
    if (detection.frameworks.length > 0) {
      lines.push(`- Frameworks: ${detection.frameworks.join(', ')}`);
    }
    if (detection.infrastructure.length > 0) {
      lines.push(`- Infrastructure: ${detection.infrastructure.join(', ')}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function copySelectedCommands(rootDir, targetDir, commands) {
  const sourceDir = path.join(rootDir, 'commands');
  const destinationDir = path.join(targetDir, '.claude', 'commands');
  ensureDir(destinationDir);

  for (const commandName of commands) {
    copyPath(path.join(sourceDir, `${commandName}.md`), path.join(destinationDir, `${commandName}.md`));
  }
}

function copySelectedAgents(rootDir, targetDir, agents) {
  const sourceDir = path.join(rootDir, 'agents');
  const destinationDir = path.join(targetDir, '.claude', 'agents');
  ensureDir(destinationDir);

  for (const agentName of agents) {
    copyPath(path.join(sourceDir, `${agentName}.md`), path.join(destinationDir, `${agentName}.md`));
  }
}

function copySelectedSkills(rootDir, targetDir, skills) {
  const upstreamSkillsDir = path.join(rootDir, 'skills');
  const customSkillsDir = path.join(rootDir, 'overlay', 'custom', 'skills');
  const destinationDir = path.join(targetDir, '.claude', 'skills');
  ensureDir(destinationDir);

  for (const skill of skills) {
    const customPath = path.join(customSkillsDir, skill);
    if (fs.existsSync(customPath)) {
      copyPath(customPath, path.join(destinationDir, skill));
      continue;
    }

    copyPath(path.join(upstreamSkillsDir, skill), path.join(destinationDir, skill));
  }
}

function renderProject(rootDir, projectDir, selection, detection) {
  writeFile(path.join(projectDir, 'AGENTS.md'), generateClaudeRootAgentsMd(selection));

  if (selection.tool === 'claude') {
    for (const relativeDir of ['.claude/agents', '.claude/commands', '.claude/skills']) {
      removeDirContents(path.join(projectDir, relativeDir));
    }

    copySelectedAgents(rootDir, projectDir, selection.shared.agents);
    copySelectedCommands(rootDir, projectDir, selection.shared.commands);
    copySelectedSkills(rootDir, projectDir, selection.shared.skills);
    writeFile(path.join(projectDir, '.claude', 'STACK-OVERLAY.md'), generateClaudeProjectOverlay(selection, detection));
  } else {
    writeFile(path.join(projectDir, '.codex', 'AGENTS.md'), generateCodexSupplement(selection));
  }

  return {
    generatedFiles: [path.join(projectDir, 'AGENTS.md')]
  };
}

module.exports = {
  renderProject
};
