const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

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
  fs.mkdirSync(path.join(rootDir, 'overlay', 'custom', 'skills', 'personal-standby'), { recursive: true });

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
  fs.writeFileSync(path.join(rootDir, 'overlay', 'custom', 'skills', 'personal-standby', 'SKILL.md'), '# custom');

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
      skills: ['security-review', 'personal-standby'],
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
  const selection = resolveStacks(manifest, ['python'], 'claude', reviewCatalog);

  fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), 'keep me');
  renderClaude(rootDir, targetDir, selection);

  assert.ok(fs.existsSync(path.join(targetDir, 'agents', 'planner.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'agents', 'python-reviewer.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'python-patterns', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'personal-standby', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'commands', 'plan.md')));
  assert.strictEqual(fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf8'), 'keep me');
  assert.match(fs.readFileSync(path.join(targetDir, 'rules', 'common', 'agents.md'), 'utf8'), /python-reviewer/);
})) passed += 1; else failed += 1;

if (test('renderCodex creates a clean split between ECC skills and custom skills', () => {
  const rootDir = makeRepoFixture();
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-config-codex-'));
  const selection = resolveStacks(manifest, ['python'], 'codex', reviewCatalog);

  renderCodex(rootDir, targetDir, selection);

  assert.ok(fs.existsSync(path.join(targetDir, '.agents', 'skills', 'ecc', 'security-review', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, '.agents', 'skills', 'ecc', 'python-patterns', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '.codex', 'config.ecc.toml')));
  assert.match(fs.readFileSync(path.join(targetDir, 'AGENTS.md'), 'utf8'), /Minimal Codex Baseline/);
  assert.ok(!fs.existsSync(path.join(targetDir, 'agents', 'explorer.toml')));
  assert.doesNotMatch(fs.readFileSync(path.join(targetDir, '.codex', 'AGENTS.md'), 'utf8'), /Managed Agents/);
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
