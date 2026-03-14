const fs = require('fs');
const os = require('os');
const path = require('path');

const { copyPath, ensureDir, removeDirContents, writeFile } = require('./filesystem');

const MANAGED_DIRECTORIES = ['agents', 'commands', 'contexts', 'mcp-configs', 'rules', 'scripts', 'skills'];
const MANAGED_ROOT_FILES = ['AGENTS.md'];
const PRESERVED_HOOK_COMMAND_PATTERNS = [
  /\$HOME\/\.claude\/scripts\/hooks\//,
  /\/\.claude\/scripts\/hooks\//,
  /\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/hooks\//,
  /scripts\/hooks\/run-with-flags\.js/,
  /scripts\/hooks\/run-with-flags-shell\.sh/,
  /ECC_ROOT="\$HOME\/\.claude"/,
];

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeHooksDocument(document) {
  if (!document || typeof document !== 'object') {
    return { hooks: {} };
  }

  if (document.hooks && typeof document.hooks === 'object') {
    return { hooks: deepClone(document.hooks) };
  }

  return { hooks: deepClone(document) };
}

function isManagedHookCommand(command) {
  if (typeof command !== 'string') {
    return false;
  }

  return PRESERVED_HOOK_COMMAND_PATTERNS.some(pattern => pattern.test(command));
}

function collectPreservedHookEntries(...documents) {
  const preserved = [];
  const seen = new Set();

  for (const document of documents) {
    const normalized = normalizeHooksDocument(document);
    for (const [eventName, matchers] of Object.entries(normalized.hooks || {})) {
      if (!Array.isArray(matchers)) {
        continue;
      }

      for (const matcherEntry of matchers) {
        if (!matcherEntry || !Array.isArray(matcherEntry.hooks)) {
          continue;
        }

        if (matcherEntry.hooks.some(hook => isManagedHookCommand(hook.command))) {
          continue;
        }

        const key = `${eventName}:${JSON.stringify(matcherEntry)}`;
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        preserved.push({ eventName, matcherEntry: deepClone(matcherEntry) });
      }
    }
  }

  return preserved;
}

function mergeHooksWithPreservedExtras(managedHooks, ...existingDocuments) {
  const merged = normalizeHooksDocument(managedHooks);
  const preservedEntries = collectPreservedHookEntries(...existingDocuments);

  for (const { eventName, matcherEntry } of preservedEntries) {
    if (!merged.hooks[eventName]) {
      merged.hooks[eventName] = [];
    }

    merged.hooks[eventName].push(matcherEntry);
  }

  return merged;
}

function stripHooksFromSettings(settings) {
  if (!settings || typeof settings !== 'object' || !settings.hooks) {
    return settings;
  }

  const next = { ...settings };
  delete next.hooks;
  return next;
}

function syncManagedDirectories(renderDir, targetDir) {
  for (const directory of MANAGED_DIRECTORIES) {
    removeDirContents(path.join(targetDir, directory));
    const sourcePath = path.join(renderDir, directory);
    if (fs.existsSync(sourcePath)) {
      copyPath(sourcePath, path.join(targetDir, directory));
    }
  }
}

function syncManagedRootFiles(renderDir, targetDir) {
  for (const fileName of MANAGED_ROOT_FILES) {
    const sourcePath = path.join(renderDir, fileName);
    if (fs.existsSync(sourcePath)) {
      copyPath(sourcePath, path.join(targetDir, fileName));
    }
  }
}

function syncPackageManagerConfig(renderDir, targetDir) {
  const sourcePath = path.join(renderDir, '.claude', 'package-manager.json');
  if (fs.existsSync(sourcePath)) {
    copyPath(sourcePath, path.join(targetDir, 'package-manager.json'));
  }
}

function syncHooksJson(renderDir, targetDir) {
  const managedHooksPath = path.join(renderDir, 'hooks', 'hooks.json');
  const managedHooks = readJsonIfExists(managedHooksPath) || { hooks: {} };
  const existingHooks = readJsonIfExists(path.join(targetDir, 'hooks.json'));
  const settingsPath = path.join(targetDir, 'settings.json');
  const existingSettings = readJsonIfExists(settingsPath);

  const mergedHooks = mergeHooksWithPreservedExtras(managedHooks, existingHooks, existingSettings && existingSettings.hooks);
  writeFile(path.join(targetDir, 'hooks.json'), `${JSON.stringify(mergedHooks, null, 2)}\n`);

  if (existingSettings && existingSettings.hooks) {
    writeFile(settingsPath, `${JSON.stringify(stripHooksFromSettings(existingSettings), null, 2)}\n`);
  }
}

function createTempRenderDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agent-config-claude-home-'));
}

function deployClaudeHome({ renderDir, targetDir }) {
  ensureDir(targetDir);
  syncManagedDirectories(renderDir, targetDir);
  syncManagedRootFiles(renderDir, targetDir);
  syncPackageManagerConfig(renderDir, targetDir);
  syncHooksJson(renderDir, targetDir);

  return {
    managedDirectories: [...MANAGED_DIRECTORIES],
    targetDir,
  };
}

module.exports = {
  MANAGED_DIRECTORIES,
  createTempRenderDir,
  deployClaudeHome,
  isManagedHookCommand,
  mergeHooksWithPreservedExtras,
  stripHooksFromSettings,
};
