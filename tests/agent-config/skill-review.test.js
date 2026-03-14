const assert = require('assert');
const path = require('path');

const {
  getClaudeDefaultSkills,
  loadSkillReviewCatalog,
  validateSkillReviewCatalog
} = require('../../scripts/lib/agent-config/skill-review');

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

const catalogPath = path.join(__dirname, '..', '..', 'config', 'skill-review.json');
const catalog = loadSkillReviewCatalog(catalogPath);

const coreSkills = [
  'security-review',
  'tdd-workflow',
  'verification-loop',
  'deployment-patterns',
  'docker-patterns',
  'database-migrations',
  'postgres-patterns',
  'coding-standards',
  'frontend-patterns',
  'backend-patterns',
  'e2e-testing',
  'api-design',
  'python-patterns',
  'python-testing',
  'search-first',
  'strategic-compact',
  'eval-harness',
  'iterative-retrieval'
];

let passed = 0;
let failed = 0;

if (test('skill review catalog validates cleanly', () => {
  assert.strictEqual(validateSkillReviewCatalog(catalog), true);
})) passed += 1; else failed += 1;

if (test('every planned core skill has exactly one review row', () => {
  assert.deepStrictEqual(Object.keys(catalog.skills).sort(), coreSkills.slice().sort());
})) passed += 1; else failed += 1;

if (test('all Codex-allowed skills are explicitly reviewed', () => {
  const allowed = Object.entries(catalog.skills).filter(([, record]) => record.codex_allowed);
  assert.ok(allowed.length > 0, 'Expected at least one Codex-approved skill');
  for (const [, record] of allowed) {
    assert.strictEqual(record.status, 'reviewed');
  }
})) passed += 1; else failed += 1;

if (test('Claude default skills resolve to the reviewed default set', () => {
  assert.deepStrictEqual(getClaudeDefaultSkills(catalog), [
    'coding-standards',
    'search-first',
    'security-review',
    'strategic-compact',
    'tdd-workflow',
    'verification-loop'
  ]);
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
