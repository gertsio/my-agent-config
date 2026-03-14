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

function generateClaudeRootAgentsMd(selection) {
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

  if (selection.shared.commands && selection.shared.commands.length > 0) {
    lines.push('', '## Active Commands', '');
    for (const command of selection.shared.commands) {
      lines.push(`- ${command}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function generateCodexRootAgentsMd(selection) {
  const lines = [
    '# Minimal Codex Baseline',
    '',
    '<!-- GENERATED FILE. DO NOT EDIT. -->',
    '',
    'This is a low-overhead global Codex baseline.',
    'Prefer project overlays for stack-specific guidance.',
    '',
    `Active stacks: ${selection.stacks.join(', ') || 'none'}`,
    '',
    'Global skills:',
    ...selection.shared.skills.map(skill => `- ${skill}`)
  ];

  return `${lines.join('\n')}\n`;
}

function generateCodexSupplement(selection) {
  const lines = [
    '# Codex Project Guidance',
    '',
    '<!-- GENERATED FILE. DO NOT EDIT. -->',
    '',
    `Active stacks: ${selection.stacks.join(', ') || 'none'}`,
    '',
    'Use only the explicitly listed skills below.',
    ''
  ];

  for (const skill of selection.shared.skills) {
    lines.push(`- ${skill}`);
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
    'approval_policy = "on-request"',
    'sandbox_mode = "workspace-write"',
    'web_search = "live"',
    '',
    '[mcp_servers.context7]',
    'command = "npx"',
    'args = ["-y", "@upstash/context7-mcp@latest"]',
    '',
    '[mcp_servers.github]',
    'command = "npx"',
    'args = ["-y", "@modelcontextprotocol/server-github"]'
  ];

  return `${lines.join('\n')}\n`;
}

module.exports = {
  generateClaudeAgentsMd,
  generateClaudeRootAgentsMd,
  generateCodexManagedConfig,
  generateCodexRootAgentsMd,
  generateCodexSupplement
};
