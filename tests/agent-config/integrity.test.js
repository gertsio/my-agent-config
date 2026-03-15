const assert = require('assert');
const path = require('path');

const {
  applyCustomAssets,
  loadCustomSkillCatalog,
  resolveCustomAssets,
  validateCustomSkillCatalog
} = require('../../scripts/lib/agent-config/custom-skills');
const { loadManifest, resolveStacks } = require('../../scripts/lib/agent-config/manifest');
const { loadSkillReviewCatalog } = require('../../scripts/lib/agent-config/skill-review');

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

const repoRoot = path.join(__dirname, '..', '..');
const manifest = loadManifest(path.join(repoRoot, 'config', 'stacks.json'));
const reviewCatalog = loadSkillReviewCatalog(path.join(repoRoot, 'config', 'skill-review.json'));
const customCatalog = loadCustomSkillCatalog(path.join(repoRoot, 'config', 'custom-skills.json'));

validateCustomSkillCatalog(customCatalog);

const COMMAND_DEPENDENCIES = {
  'build-fix': { agents: ['build-error-resolver'] },
  checkpoint: { skills: ['verification-loop'] },
  claw: { skills: ['nanoclaw-repl'] },
  'code-review': { agents: ['code-reviewer'] },
  e2e: { agents: ['e2e-runner'], skills: ['e2e-testing'] },
  eval: { skills: ['eval-harness'] },
  evolve: { skills: ['continuous-learning-v2'] },
  'go-build': { agents: ['go-build-resolver'] },
  'go-review': { agents: ['go-reviewer'] },
  'go-test': { skills: ['golang-testing'] },
  'instinct-export': { skills: ['continuous-learning-v2'] },
  'instinct-import': { skills: ['continuous-learning-v2'] },
  'instinct-status': { skills: ['continuous-learning-v2'] },
  'kotlin-build': { agents: ['kotlin-build-resolver'] },
  'kotlin-review': { agents: ['kotlin-reviewer'] },
  'kotlin-test': { skills: ['kotlin-testing', 'tdd-workflow'] },
  learn: { skills: ['continuous-learning'] },
  'learn-eval': { skills: ['continuous-learning-v2'] },
  'loop-start': { agents: ['loop-operator'] },
  'loop-status': { agents: ['loop-operator'] },
  'multi-backend': { agents: ['architect'] },
  'multi-execute': { agents: ['architect'] },
  'multi-frontend': { agents: ['architect'] },
  'multi-plan': { agents: ['architect'] },
  'multi-workflow': { agents: ['architect'] },
  orchestrate: { agents: ['architect', 'code-reviewer', 'planner', 'security-reviewer', 'tdd-guide'] },
  plan: { agents: ['planner'] },
  projects: { skills: ['continuous-learning-v2'] },
  promote: { skills: ['continuous-learning-v2'] },
  'prompt-optimize': { skills: ['prompt-optimizer'] },
  'python-review': { agents: ['python-reviewer'] },
  'refactor-clean': { agents: ['refactor-cleaner'] },
  'security-scan': { skills: ['security-scan'] },
  tdd: { agents: ['tdd-guide'], skills: ['tdd-workflow'] },
  'update-codemaps': { agents: ['doc-updater'] },
  'update-docs': { agents: ['doc-updater'] },
  verify: { skills: ['verification-loop'] },
  writing: { customSkills: ['writing'] },
  'upwork-proposal': { customSkills: ['upwork-proposal'] }
};

function buildClaudeSelection(stacks) {
  return applyCustomAssets(
    resolveStacks(manifest, stacks, 'claude', reviewCatalog),
    resolveCustomAssets(repoRoot, customCatalog, 'claude')
  );
}

function assertCommandDependencies(selection, commandsToCheck) {
  const selectedAgents = new Set(selection.shared.agents);
  const selectedSkills = new Set(selection.shared.skills);
  const selectedCustomSkills = new Set((selection.custom && selection.custom.skills) || []);

  for (const commandName of commandsToCheck) {
    const deps = COMMAND_DEPENDENCIES[commandName];
    if (!deps) {
      continue;
    }

    for (const agentName of deps.agents || []) {
      assert.ok(selectedAgents.has(agentName), `Expected command "${commandName}" to have agent "${agentName}" available`);
    }

    for (const skillName of deps.skills || []) {
      assert.ok(selectedSkills.has(skillName), `Expected command "${commandName}" to have skill "${skillName}" available`);
    }

    for (const skillName of deps.customSkills || []) {
      assert.ok(selectedCustomSkills.has(skillName), `Expected command "${commandName}" to have custom skill "${skillName}" available`);
    }
  }
}

let passed = 0;
let failed = 0;

if (test('global Claude selection keeps workflow and harness command dependencies intact', () => {
  const selection = buildClaudeSelection([]);
  assertCommandDependencies(selection, selection.shared.commands.concat(selection.custom.commands));
})) passed += 1; else failed += 1;

if (test('project-scoped stack selections keep stack-specific command dependencies intact', () => {
  for (const stacks of [['typescript'], ['python'], ['golang'], ['kotlin']]) {
    const selection = buildClaudeSelection(stacks);
    assertCommandDependencies(selection, selection.shared.commands);
  }
})) passed += 1; else failed += 1;

if (test('concern stacks resolve without errors', () => {
  for (const stacks of [['docker'], ['postgres'], ['deployment'], ['django']]) {
    const selection = buildClaudeSelection(stacks);
    assertCommandDependencies(selection, selection.shared.commands);
  }
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
