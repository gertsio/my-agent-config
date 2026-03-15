const assert = require('assert');

const { resolveStacks } = require('../../scripts/lib/agent-config/manifest');

const reviewCatalog = {
  skills: {
    'security-review': {
      status: 'reviewed',
      decision: 'keep_as_is',
      claude_default: true,
      codex_allowed: true,
      notes: 'ok'
    },
    'coding-standards': {
      status: 'reviewed',
      decision: 'trim',
      claude_default: true,
      codex_allowed: false,
      notes: 'claude only in this fixture'
    },
    'python-patterns': {
      status: 'reviewed',
      decision: 'rewrite',
      claude_default: false,
      codex_allowed: false,
      notes: 'blocked'
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

const manifest = {
  defaults: {
    byTool: {
      claude: [],
      codex: []
    }
  },
  always: {
    shared: {
      agents: ['planner'],
      commands: ['plan'],
      skills: ['security-review'],
      rules: ['common']
    },
    claude: {
      copyDirs: ['commands']
    },
    codex: {
      copyDirs: ['.codex/agents']
    }
  },
  stacks: {
    typescript: {
      shared: {
        commands: ['e2e'],
        skills: ['coding-standards'],
        rules: ['typescript']
      }
    },
    python: {
      extends: ['typescript'],
      shared: {
        commands: ['python-review'],
        skills: ['python-patterns'],
        rules: ['python']
      },
      claude: {
        agents: ['python-reviewer']
      },
      exclude: {
        shared: {
          commands: ['e2e'],
          skills: ['coding-standards']
        }
      }
    },
    docker: {
      shared: {
        skills: ['docker-patterns']
      }
    },
    postgres: {
      shared: {
        agents: ['database-reviewer'],
        skills: ['postgres-patterns']
      }
    },
    deployment: {
      shared: {
        skills: ['deployment-patterns']
      }
    },
    django: {
      extends: ['python'],
      shared: {
        skills: ['django-patterns']
      }
    }
  }
};

let passed = 0;
let failed = 0;

if (test('resolveStacks uses defaults when no stack list is supplied', () => {
  const selection = resolveStacks(manifest, [], 'claude', reviewCatalog);
  assert.deepStrictEqual(selection.stacks, []);
  assert.deepStrictEqual(selection.shared.commands, ['plan']);
  assert.deepStrictEqual(selection.shared.rules, ['common']);
})) passed += 1; else failed += 1;

if (test('resolveStacks merges extends and excludes cleanly', () => {
  const selection = resolveStacks(manifest, ['python'], 'claude', reviewCatalog);
  assert.deepStrictEqual(selection.shared.agents, ['planner', 'python-reviewer']);
  assert.deepStrictEqual(selection.shared.commands, ['plan', 'python-review']);
  assert.deepStrictEqual(selection.shared.rules, ['common', 'python', 'typescript']);
  assert.deepStrictEqual(selection.shared.skills, ['python-patterns', 'security-review']);
})) passed += 1; else failed += 1;

if (test('resolveStacks filters Codex skills to reviewed compatible items only', () => {
  const selection = resolveStacks(manifest, ['python'], 'codex', reviewCatalog);
  assert.deepStrictEqual(selection.shared.skills, ['security-review']);
})) passed += 1; else failed += 1;

if (test('resolveStacks throws on unknown stacks', () => {
  assert.throws(() => resolveStacks(manifest, ['ruby'], 'claude', reviewCatalog), /Unknown stack/);
})) passed += 1; else failed += 1;

if (test('django extends python and inherits its assets', () => {
  const selection = resolveStacks(manifest, ['django'], 'claude', reviewCatalog);
  assert.ok(selection.shared.skills.includes('django-patterns'), 'should include django-patterns');
  assert.ok(selection.shared.skills.includes('python-patterns'), 'should include python-patterns from parent');
  assert.ok(selection.shared.agents.includes('python-reviewer'), 'should include python-reviewer from python');
  assert.ok(selection.shared.rules.includes('python'), 'should include python rules');
})) passed += 1; else failed += 1;

if (test('docker stack resolves correctly', () => {
  const selection = resolveStacks(manifest, ['docker'], 'claude', reviewCatalog);
  assert.ok(selection.shared.skills.includes('docker-patterns'));
})) passed += 1; else failed += 1;

if (test('postgres stack resolves correctly', () => {
  const selection = resolveStacks(manifest, ['postgres'], 'claude', reviewCatalog);
  assert.ok(selection.shared.skills.includes('postgres-patterns'));
  assert.ok(selection.shared.agents.includes('database-reviewer'));
})) passed += 1; else failed += 1;

if (test('deployment stack resolves correctly', () => {
  const selection = resolveStacks(manifest, ['deployment'], 'claude', reviewCatalog);
  assert.ok(selection.shared.skills.includes('deployment-patterns'));
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
