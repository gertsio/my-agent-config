const fs = require('fs');
const path = require('path');

const { filterSkillsForTool } = require('./skill-review');

function loadManifest(manifestPath) {
  const resolvedPath = path.resolve(manifestPath);
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function normalizeList(value) {
  if (!value) {
    return [];
  }

  return Array.from(new Set(value)).sort();
}

function mergeSection(target, source) {
  return {
    agents: normalizeList([...target.agents, ...(source.agents || [])]),
    rules: normalizeList([...target.rules, ...(source.rules || [])]),
    skills: normalizeList([...target.skills, ...(source.skills || [])]),
    copyDirs: normalizeList([...target.copyDirs, ...(source.copyDirs || [])]),
    copyFiles: normalizeList([...target.copyFiles, ...(source.copyFiles || [])]),
    protectedPaths: normalizeList([...target.protectedPaths, ...(source.protectedPaths || [])])
  };
}

function subtractSection(target, source) {
  return {
    agents: target.agents.filter(item => !(source.agents || []).includes(item)),
    rules: target.rules.filter(item => !(source.rules || []).includes(item)),
    skills: target.skills.filter(item => !(source.skills || []).includes(item)),
    copyDirs: target.copyDirs.filter(item => !(source.copyDirs || []).includes(item)),
    copyFiles: target.copyFiles.filter(item => !(source.copyFiles || []).includes(item)),
    protectedPaths: target.protectedPaths.filter(item => !(source.protectedPaths || []).includes(item))
  };
}

function createEmptySection() {
  return {
    agents: [],
    rules: [],
    skills: [],
    copyDirs: [],
    copyFiles: [],
    protectedPaths: []
  };
}

function getRequestedStacks(manifest, requestedStacks, tool) {
  if (Array.isArray(requestedStacks) && requestedStacks.length > 0) {
    return requestedStacks;
  }

  if (manifest.defaults && manifest.defaults.byTool && Array.isArray(manifest.defaults.byTool[tool])) {
    return manifest.defaults.byTool[tool];
  }

  if (manifest.defaults && Array.isArray(manifest.defaults.stacks) && manifest.defaults.stacks.length > 0) {
    return manifest.defaults.stacks;
  }

  return [];
}

function resolveStackSection(manifest, stackName, tool, visiting = new Set(), resolved = new Map()) {
  if (resolved.has(`${tool}:${stackName}`)) {
    return resolved.get(`${tool}:${stackName}`);
  }

  const stack = manifest.stacks[stackName];
  if (!stack) {
    throw new Error(`Unknown stack "${stackName}"`);
  }

  if (visiting.has(stackName)) {
    throw new Error(`Cyclic stack extends detected at "${stackName}"`);
  }

  visiting.add(stackName);

  let combined = createEmptySection();
  for (const parentName of stack.extends || []) {
    combined = mergeSection(combined, resolveStackSection(manifest, parentName, tool, visiting, resolved));
  }

  combined = mergeSection(combined, stack.shared || {});
  combined = mergeSection(combined, stack[tool] || {});

  if (stack.exclude) {
    combined = subtractSection(combined, stack.exclude.shared || {});
    combined = subtractSection(combined, stack.exclude[tool] || {});
  }

  visiting.delete(stackName);
  resolved.set(`${tool}:${stackName}`, combined);
  return combined;
}

function resolveStacks(manifest, requestedStacks, tool, reviewCatalog = null) {
  if (!['claude', 'codex'].includes(tool)) {
    throw new Error(`Unsupported tool "${tool}"`);
  }

  const stacks = getRequestedStacks(manifest, requestedStacks, tool);
  const selection = {
    tool,
    stacks: normalizeList(stacks),
    shared: createEmptySection(),
    tooling: createEmptySection()
  };

  selection.shared = mergeSection(selection.shared, (manifest.always && manifest.always.shared) || {});
  selection.tooling = mergeSection(selection.tooling, (manifest.always && manifest.always[tool]) || {});

  for (const stackName of selection.stacks) {
    selection.shared = mergeSection(selection.shared, resolveStackSection(manifest, stackName, tool));
  }

  selection.shared.skills = filterSkillsForTool(selection.shared.skills, reviewCatalog, tool);

  return selection;
}

function summarizeSelection(selection) {
  return {
    tool: selection.tool,
    stacks: selection.stacks,
    agents: selection.shared.agents,
    rules: selection.shared.rules,
    skills: selection.shared.skills,
    copyDirs: selection.tooling.copyDirs,
    copyFiles: selection.tooling.copyFiles,
    protectedPaths: selection.tooling.protectedPaths
  };
}

module.exports = {
  loadManifest,
  resolveStacks,
  summarizeSelection
};
