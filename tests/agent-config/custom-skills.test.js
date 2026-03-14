const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  applyCustomAssets,
  loadCustomSkillCatalog,
  resolveCustomAssets,
  validateCustomSkillCatalog
} = require('../../scripts/lib/agent-config/custom-skills');

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

const rootDir = path.join(__dirname, '..', '..');
const catalogPath = path.join(rootDir, 'config', 'custom-skills.json');
const catalog = loadCustomSkillCatalog(catalogPath);

let passed = 0;
let failed = 0;

if (test('custom skill catalog validates cleanly', () => {
  assert.strictEqual(validateCustomSkillCatalog(catalog), true);
})) passed += 1; else failed += 1;

if (test('Claude custom defaults include aliases and private profile metadata', () => {
  const assets = resolveCustomAssets(rootDir, catalog, 'claude');
  assert.deepStrictEqual(assets.skills, ['notebooklm', 'upwork-proposal', 'writing']);
  assert.deepStrictEqual(assets.commands, ['upwork-proposal', 'writing']);
  assert.deepStrictEqual(assets.privateProfiles.map(item => item.skill), ['upwork-proposal', 'writing']);
})) passed += 1; else failed += 1;

if (test('Codex custom defaults exclude command aliases but keep shared skills', () => {
  const assets = resolveCustomAssets(rootDir, catalog, 'codex');
  assert.deepStrictEqual(assets.skills, ['notebooklm', 'upwork-proposal', 'writing']);
  assert.deepStrictEqual(assets.commands, []);
  assert.deepStrictEqual(assets.privateProfiles.map(item => item.skill), ['upwork-proposal', 'writing']);
})) passed += 1; else failed += 1;

if (test('applyCustomAssets merges shared skills into the selection', () => {
  const selection = applyCustomAssets({
    shared: {
      skills: ['security-review']
    }
  }, {
    skills: ['writing', 'notebooklm'],
    commands: ['writing'],
    privateProfiles: []
  });

  assert.deepStrictEqual(selection.shared.skills, ['notebooklm', 'security-review', 'writing']);
  assert.deepStrictEqual(selection.custom.commands, ['writing']);
})) passed += 1; else failed += 1;

if (test('Claude command aliases stay thin and reference local private profiles', () => {
  for (const commandName of ['writing', 'upwork-proposal']) {
    const commandPath = path.join(rootDir, 'overlay', 'custom', 'commands', `${commandName}.md`);
    const content = fs.readFileSync(commandPath, 'utf8');
    assert.ok(content.split('\n').length <= 20, `${commandName} alias should stay thin`);
    assert.match(content, /\.\.\/skills\/.*private\/skills\//);
    assert.doesNotMatch(content, /My Background/i);
  }
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
