function generateClaudeAgentsMd(selection) {
  const lines = [
    '# Generated Agent Index',
    '',
    '> GENERATED FILE. DO NOT EDIT.',
    `> Tool: ${selection.tool}`,
    `> Stacks: ${selection.stacks.join(', ') || 'none'}`,
    '',
    '| Agent | Status |',
    '|-------|--------|'
  ];

  for (const agent of selection.shared.agents) {
    lines.push(`| ${agent} | deployed |`);
  }

  return `${lines.join('\n')}\n`;
}

function generateRootAgentsMd(selection) {
  const lines = [
    '# Generated Agent Stack Overlay',
    '',
    '<!-- GENERATED FILE. DO NOT EDIT. -->',
    '',
    `Active tool: ${selection.tool}`,
    `Active stacks: ${selection.stacks.join(', ') || 'none'}`,
    '',
    'Use the shared home-level install as the baseline and prefer the deployed stacks below for language-specific guidance.',
    '',
    '## Active Agents',
    ''
  ];

  for (const agent of selection.shared.agents) {
    lines.push(`- ${agent}`);
  }

  lines.push('', '## Active Skills', '');

  for (const skill of selection.shared.skills) {
    lines.push(`- ${skill}`);
  }

  return `${lines.join('\n')}\n`;
}

function generateCodexSupplement(selection) {
  const lines = [
    '# Generated Codex Supplement',
    '',
    '<!-- GENERATED FILE. DO NOT EDIT. -->',
    '',
    `Active stacks: ${selection.stacks.join(', ') || 'none'}`,
    '',
    '## Managed Skills',
    ''
  ];

  for (const skill of selection.shared.skills) {
    lines.push(`- ${skill}`);
  }

  lines.push('', '## Managed Agents', '');

  for (const agent of selection.shared.agents) {
    lines.push(`- ${agent}`);
  }

  return `${lines.join('\n')}\n`;
}

function generateCodexManagedConfig(selection) {
  const lines = [
    '# GENERATED FILE. DO NOT EDIT.',
    '# Managed by scripts/agent-config.js',
    '',
    '# Active stacks:',
    `# ${selection.stacks.join(', ') || 'none'}`,
    '',
    'features.multi_agent = true',
    'agents.max_threads = 6',
    'agents.max_depth = 1'
  ];

  return `${lines.join('\n')}\n`;
}

module.exports = {
  generateClaudeAgentsMd,
  generateCodexManagedConfig,
  generateCodexSupplement,
  generateRootAgentsMd
};
