const path = require('path');

const { writeFile } = require('./filesystem');
const { generateCodexSupplement, generateRootAgentsMd } = require('./generate-agents-md');

function generateClaudeProjectOverlay(selection) {
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

  return `${lines.join('\n')}\n`;
}

function renderProject(rootDir, projectDir, selection) {
  writeFile(path.join(projectDir, 'AGENTS.md'), generateRootAgentsMd(selection));

  if (selection.tool === 'claude') {
    writeFile(path.join(projectDir, '.claude', 'STACK-OVERLAY.md'), generateClaudeProjectOverlay(selection));
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
