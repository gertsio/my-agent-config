const { execFileSync } = require('child_process');

function collectAssetIndex(manifest) {
  const byPathToken = new Map();

  const always = manifest.always || {};
  for (const [toolName, section] of Object.entries(always)) {
    if (toolName === 'shared') {
      continue;
    }

    for (const relativeDir of section.copyDirs || []) {
      byPathToken.set(relativeDir, { scope: 'runtime', tool: toolName });
    }
  }

  for (const [stackName, stack] of Object.entries(manifest.stacks || {})) {
    for (const ruleName of (stack.shared && stack.shared.rules) || []) {
      if (ruleName) {
        byPathToken.set(`rules/${ruleName}/`, { scope: 'stack', stack: stackName, type: 'rule' });
      }
    }

    for (const skillName of (stack.shared && stack.shared.skills) || []) {
      byPathToken.set(`skills/${skillName}/`, { scope: 'stack', stack: stackName, type: 'skill' });
    }

    for (const agentName of (stack.claude && stack.claude.agents) || []) {
      byPathToken.set(`agents/${agentName}.md`, { scope: 'stack', stack: stackName, type: 'agent' });
    }
  }

  for (const agentName of ((always.shared && always.shared.agents) || [])) {
    byPathToken.set(`agents/${agentName}.md`, { scope: 'always', type: 'agent' });
  }

  for (const skillName of ((always.shared && always.shared.skills) || [])) {
    byPathToken.set(`skills/${skillName}/`, { scope: 'always', type: 'skill' });
  }

  byPathToken.set('rules/common/', { scope: 'always', type: 'rule' });
  return byPathToken;
}

function summarizeChangedFiles(manifest, selectedStacks, changedFiles) {
  const selectedSet = new Set(selectedStacks || []);
  const index = collectAssetIndex(manifest);
  const summary = {
    relevant: [],
    irrelevant: [],
    impactedStacks: []
  };

  const impactedStacks = new Set();

  for (const changedFile of changedFiles) {
    const normalized = changedFile.replace(/\\/g, '/');
    let matched = false;

    for (const [token, metadata] of index.entries()) {
      if (!normalized.includes(token)) {
        continue;
      }

      matched = true;

      if (metadata.scope === 'stack' && !selectedSet.has(metadata.stack)) {
        summary.irrelevant.push({ file: normalized, reason: `${metadata.stack} not selected` });
        break;
      }

      if (metadata.stack) {
        impactedStacks.add(metadata.stack);
      }

      summary.relevant.push({ file: normalized, ...metadata });
      break;
    }

    if (!matched) {
      summary.irrelevant.push({ file: normalized, reason: 'not managed by stack selector' });
    }
  }

  summary.impactedStacks = Array.from(impactedStacks).sort();
  return summary;
}

function getChangedFiles(repoRoot, baseRef = 'main', compareRef = 'upstream/main') {
  const output = execFileSync('git', ['diff', '--name-only', `${baseRef}..${compareRef}`], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  return output.split('\n').map(line => line.trim()).filter(Boolean);
}

function formatSummary(summary) {
  const lines = [
    '# Upstream Impact Summary',
    '',
    `Relevant changes: ${summary.relevant.length}`,
    `Irrelevant changes: ${summary.irrelevant.length}`,
    `Impacted stacks: ${summary.impactedStacks.join(', ') || 'none'}`,
    ''
  ];

  if (summary.relevant.length > 0) {
    lines.push('## Relevant');
    lines.push('');
    for (const item of summary.relevant) {
      lines.push(`- ${item.file} (${item.scope}${item.stack ? `:${item.stack}` : ''})`);
    }
    lines.push('');
  }

  if (summary.irrelevant.length > 0) {
    lines.push('## Ignored');
    lines.push('');
    for (const item of summary.irrelevant) {
      lines.push(`- ${item.file} (${item.reason})`);
    }
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  formatSummary,
  getChangedFiles,
  summarizeChangedFiles
};
