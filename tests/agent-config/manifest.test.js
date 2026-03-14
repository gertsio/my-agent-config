const assert = require('assert');

const { resolveStacks } = require('../../scripts/lib/agent-config/manifest');

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
    stacks: ['typescript']
  },
  always: {
    shared: {
      agents: ['planner'],
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
        skills: ['coding-standards'],
        rules: ['typescript']
      }
    },
    python: {
      extends: ['typescript'],
      shared: {
        skills: ['python-patterns'],
        rules: ['python']
      },
      claude: {
        agents: ['python-reviewer']
      },
      exclude: {
        shared: {
          skills: ['coding-standards']
        }
      }
    }
  }
};

let passed = 0;
let failed = 0;

if (test('resolveStacks uses defaults when no stack list is supplied', () => {
  const selection = resolveStacks(manifest, [], 'claude');
  assert.deepStrictEqual(selection.stacks, ['typescript']);
  assert.deepStrictEqual(selection.shared.rules, ['common', 'typescript']);
})) passed += 1; else failed += 1;

if (test('resolveStacks merges extends and excludes cleanly', () => {
  const selection = resolveStacks(manifest, ['python'], 'claude');
  assert.deepStrictEqual(selection.shared.agents, ['planner', 'python-reviewer']);
  assert.deepStrictEqual(selection.shared.rules, ['common', 'python', 'typescript']);
  assert.deepStrictEqual(selection.shared.skills, ['python-patterns', 'security-review']);
})) passed += 1; else failed += 1;

if (test('resolveStacks throws on unknown stacks', () => {
  assert.throws(() => resolveStacks(manifest, ['ruby'], 'claude'), /Unknown stack/);
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
