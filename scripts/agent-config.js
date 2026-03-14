#!/usr/bin/env node

const path = require('path');

const { ensureDir, writeFile } = require('./lib/agent-config/filesystem');
const { loadManifest, resolveStacks, summarizeSelection } = require('./lib/agent-config/manifest');
const { renderClaude } = require('./lib/agent-config/render-claude');
const { renderCodex } = require('./lib/agent-config/render-codex');
const { renderProject } = require('./lib/agent-config/render-project');
const { formatSummary, getChangedFiles, summarizeChangedFiles } = require('./lib/agent-config/update-check');

function parseArgs(argv) {
  const args = {
    command: argv[2],
    tool: null,
    stacks: [],
    output: null,
    projectDir: null,
    manifest: null,
    baseRef: 'main',
    compareRef: 'upstream/main'
  };

  for (let index = 3; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--tool') {
      args.tool = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--stacks') {
      args.stacks = argv[index + 1].split(',').map(item => item.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    if (token === '--output') {
      args.output = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--project-dir') {
      args.projectDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--manifest') {
      args.manifest = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--base-ref') {
      args.baseRef = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--compare-ref') {
      args.compareRef = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function getRepoRoot() {
  return path.join(__dirname, '..');
}

function getManifestPath(args) {
  return args.manifest || path.join(getRepoRoot(), 'config', 'stacks.json');
}

function getSelection(args) {
  const manifest = loadManifest(getManifestPath(args));
  return {
    manifest,
    selection: resolveStacks(manifest, args.stacks, args.tool)
  };
}

function runRender(args) {
  const { manifest, selection } = getSelection(args);
  const rootDir = getRepoRoot();
  const outputDir = path.resolve(args.output || path.join(rootDir, 'build', `${args.tool}-home`));

  ensureDir(outputDir);

  let result;
  if (args.tool === 'claude') {
    result = renderClaude(rootDir, outputDir, selection, manifest);
  } else if (args.tool === 'codex') {
    result = renderCodex(rootDir, outputDir, selection, manifest);
  } else {
    throw new Error(`Unsupported render tool "${args.tool}"`);
  }

  writeFile(path.join(outputDir, 'manifest.lock.json'), `${JSON.stringify(summarizeSelection(selection), null, 2)}\n`);
  return { outputDir, ...result };
}

function runProjectRender(args) {
  const { selection } = getSelection(args);
  const rootDir = getRepoRoot();
  const projectDir = path.resolve(args.projectDir || args.output || path.join(rootDir, 'build', 'project-overlay', args.tool));
  ensureDir(projectDir);
  return renderProject(rootDir, projectDir, selection);
}

function runUpdateCheck(args) {
  const manifest = loadManifest(getManifestPath(args));
  const selectedStacks = args.stacks.length > 0 ? args.stacks : manifest.defaults.stacks;
  const changedFiles = getChangedFiles(getRepoRoot(), args.baseRef, args.compareRef);
  const summary = summarizeChangedFiles(manifest, selectedStacks, changedFiles);
  process.stdout.write(formatSummary(summary));
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.command) {
    throw new Error('Usage: node scripts/agent-config.js <render|render-project|check-upstream> --tool <claude|codex> [--stacks a,b]');
  }

  if (args.command === 'render') {
    const result = runRender(args);
    process.stdout.write(`Rendered ${args.tool} configuration to ${result.outputDir}\n`);
    return;
  }

  if (args.command === 'render-project') {
    runProjectRender(args);
    process.stdout.write(`Rendered ${args.tool} project overlay\n`);
    return;
  }

  if (args.command === 'check-upstream') {
    runUpdateCheck(args);
    return;
  }

  throw new Error(`Unknown command "${args.command}"`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
