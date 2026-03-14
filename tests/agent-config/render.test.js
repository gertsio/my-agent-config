const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { applyCustomAssets, resolveCustomAssets } = require('../../scripts/lib/agent-config/custom-skills');
const { resolveStacks } = require('../../scripts/lib/agent-config/manifest');
const { renderClaude } = require('../../scripts/lib/agent-config/render-claude');
const { renderCodex } = require('../../scripts/lib/agent-config/render-codex');

const reviewCatalog = {
  skills: {
    'security-review': {
      status: 'reviewed',
      decision: 'trim',
      claude_default: true,
      codex_allowed: true,
      notes: 'ok'
    },
    'personal-standby': {
      status: 'reviewed',
      decision: 'keep_as_is',
      claude_default: false,
      codex_allowed: false,
      notes: 'custom only'
    },
    'python-patterns': {
      status: 'reviewed',
      decision: 'rewrite',
      claude_default: false,
      codex_allowed: false,
      notes: 'blocked in codex'
    }
  }
};

const customCatalog = {
  skills: {
    'notebooklm': {
      origin: 'imported',
      status: 'active',
      uses_private_profile: false,
      private_profile_required: false,
      private_profile_path: null,
      claude_default: true,
      codex_default: true,
      claude_command_aliases: [],
      notes: 'shared'
    },
    'upwork-proposal': {
      origin: 'fork',
      status: 'active',
      uses_private_profile: true,
      private_profile_required: true,
      private_profile_path: 'private/skills/upwork-proposal/profile.md',
      claude_default: true,
      codex_default: true,
      claude_command_aliases: ['upwork-proposal'],
      notes: 'shared'
    },
    'writing': {
      origin: 'fork',
      status: 'active',
      uses_private_profile: true,
      private_profile_required: false,
      private_profile_path: 'private/skills/writing/profile.md',
      claude_default: true,
      codex_default: true,
      claude_command_aliases: ['writing'],
      notes: 'shared'
    }
  }
};

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function makeRepoFixture() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-config-repo-'));

  fs.mkdirSync(path.join(rootDir, 'agents'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'rules', 'common'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'rules', 'python'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'skills', 'security-review'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'skills', 'python-patterns'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'commands'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'contexts'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'mcp-configs'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, '.codex', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'overlay', 'custom', 'commands'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'overlay', 'custom', 'skills', 'notebooklm'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'overlay', 'custom', 'skills', 'upwork-proposal'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'overlay', 'custom', 'skills', 'writing'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'private', 'skills', 'writing'), { recursive: true });

  fs.writeFileSync(path.join(rootDir, 'agents', 'planner.md'), '# planner');
  fs.writeFileSync(path.join(rootDir, 'agents', 'python-reviewer.md'), '# python-reviewer');
  fs.writeFileSync(path.join(rootDir, 'rules', 'common', 'testing.md'), '# common');
  fs.writeFileSync(path.join(rootDir, 'rules', 'python', 'testing.md'), '# python');
  fs.writeFileSync(path.join(rootDir, 'skills', 'security-review', 'SKILL.md'), '# security-review');
  fs.writeFileSync(path.join(rootDir, 'skills', 'python-patterns', 'SKILL.md'), '# python-patterns');
  fs.writeFileSync(path.join(rootDir, 'commands', 'plan.md'), '# plan');
  fs.writeFileSync(path.join(rootDir, 'contexts', 'readme.md'), '# contexts');
  fs.writeFileSync(path.join(rootDir, 'hooks', 'hooks.json'), '{}');
  fs.writeFileSync(path.join(rootDir, 'mcp-configs', 'exa.json'), '{}');
  fs.writeFileSync(path.join(rootDir, 'scripts', 'tool.js'), 'console.log("ok");');
  fs.writeFileSync(path.join(rootDir, '.claude', 'package-manager.json'), '{}');
  fs.writeFileSync(path.join(rootDir, '.codex', 'agents', 'explorer.toml'), 'model = "gpt-5.4"\n');
  fs.writeFileSync(path.join(rootDir, 'overlay', 'custom', 'commands', 'upwork-proposal.md'), 'load private/skills/upwork-proposal/profile.md');
  fs.writeFileSync(path.join(rootDir, 'overlay', 'custom', 'commands', 'writing.md'), 'load private/skills/writing/profile.md');
  fs.writeFileSync(path.join(rootDir, 'overlay', 'custom', 'skills', 'notebooklm', 'SKILL.md'), '# notebooklm');
  fs.writeFileSync(path.join(rootDir, 'overlay', 'custom', 'skills', 'upwork-proposal', 'SKILL.md'), '# upwork');
  fs.writeFileSync(path.join(rootDir, 'overlay', 'custom', 'skills', 'writing', 'SKILL.md'), '# writing');
  fs.writeFileSync(path.join(rootDir, 'private', 'skills', 'writing', 'profile.md'), '# local profile');

  return rootDir;
}

const manifest = {
  defaults: {
    byTool: {
      claude: ['python'],
      codex: []
    }
  },
  always: {
    shared: {
      agents: ['planner'],
      skills: ['security-review'],
      rules: ['common']
    },
    claude: {
      copyDirs: ['commands', 'contexts', 'hooks', 'mcp-configs', 'scripts'],
      copyFiles: ['.claude/package-manager.json'],
      protectedPaths: ['CLAUDE.md']
    },
    codex: {
      protectedPaths: ['config.toml']
    }
  },
  stacks: {
    python: {
      shared: {
        skills: ['python-patterns'],
        rules: ['python']
      },
      claude: {
        agents: ['python-reviewer']
      }
    }
  }
};

let passed = 0;
let failed = 0;

if (test('renderClaude copies only selected assets and preserves protected files', () => {
  const rootDir = makeRepoFixture();
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-config-claude-'));
  const selection = applyCustomAssets(
    resolveStacks(manifest, ['python'], 'claude', reviewCatalog),
    resolveCustomAssets(rootDir, customCatalog, 'claude')
  );

  fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), 'keep me');
  renderClaude(rootDir, targetDir, selection);

  assert.ok(fs.existsSync(path.join(targetDir, 'agents', 'planner.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'agents', 'python-reviewer.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'python-patterns', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'writing', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'upwork-proposal', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'notebooklm', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'commands', 'plan.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'commands', 'writing.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'commands', 'upwork-proposal.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'private', 'skills', 'writing', 'profile.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, 'private', 'skills', 'upwork-proposal', 'profile.md')));
  assert.strictEqual(fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf8'), 'keep me');
  assert.match(fs.readFileSync(path.join(targetDir, 'rules', 'common', 'agents.md'), 'utf8'), /python-reviewer/);
})) passed += 1; else failed += 1;

if (test('renderCodex creates a clean split between ECC skills and custom skills', () => {
  const rootDir = makeRepoFixture();
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-config-codex-'));
  const selection = applyCustomAssets(
    resolveStacks(manifest, ['python'], 'codex', reviewCatalog),
    resolveCustomAssets(rootDir, customCatalog, 'codex')
  );

  renderCodex(rootDir, targetDir, selection);

  assert.ok(fs.existsSync(path.join(targetDir, '.agents', 'skills', 'ecc', 'security-review', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, '.agents', 'skills', 'ecc', 'python-patterns', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '.agents', 'skills', 'custom', 'writing', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '.agents', 'skills', 'custom', 'upwork-proposal', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '.agents', 'skills', 'custom', 'notebooklm', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'private', 'skills', 'writing', 'profile.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, 'commands', 'writing.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '.codex', 'config.ecc.toml')));
  assert.match(fs.readFileSync(path.join(targetDir, 'AGENTS.md'), 'utf8'), /Minimal Codex Baseline/);
  assert.ok(!fs.existsSync(path.join(targetDir, 'agents', 'explorer.toml')));
  assert.doesNotMatch(fs.readFileSync(path.join(targetDir, '.codex', 'AGENTS.md'), 'utf8'), /Managed Agents/);
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
