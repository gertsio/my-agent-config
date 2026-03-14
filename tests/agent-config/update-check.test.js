const assert = require('assert');

const { summarizeChangedFiles } = require('../../scripts/lib/agent-config/update-check');

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
  always: {
    shared: {
      agents: ['planner'],
      skills: ['security-review']
    },
    claude: {
      copyDirs: ['commands', 'scripts']
    }
  },
  stacks: {
    python: {
      shared: {
        skills: ['python-patterns'],
        rules: ['python']
      }
    },
    golang: {
      shared: {
        skills: ['golang-patterns'],
        rules: ['golang']
      },
      claude: {
        agents: ['go-reviewer']
      }
    }
  }
};

let passed = 0;
let failed = 0;

if (test('summarizeChangedFiles filters changes to selected stacks and runtime assets', () => {
  const summary = summarizeChangedFiles(manifest, ['python'], [
    'skills/golang-patterns/SKILL.md',
    'rules/python/testing.md',
    'scripts/hooks/run-with-flags.js',
    'README.md'
  ]);

  assert.strictEqual(summary.relevant.length, 2);
  assert.deepStrictEqual(summary.impactedStacks, ['python']);
  assert.ok(summary.irrelevant.some(item => item.file === 'skills/golang-patterns/SKILL.md'));
  assert.ok(summary.irrelevant.some(item => item.file === 'README.md'));
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
