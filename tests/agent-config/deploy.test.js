const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  deployClaudeHome,
  mergeHooksWithPreservedExtras,
  stripHooksFromSettings
} = require('../../scripts/lib/agent-config/deploy-claude-home');

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

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeRenderFixture() {
  const renderDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-config-render-'));

  fs.mkdirSync(path.join(renderDir, 'agents'), { recursive: true });
  fs.mkdirSync(path.join(renderDir, 'commands'), { recursive: true });
  fs.mkdirSync(path.join(renderDir, 'contexts'), { recursive: true });
  fs.mkdirSync(path.join(renderDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(renderDir, 'mcp-configs'), { recursive: true });
  fs.mkdirSync(path.join(renderDir, 'rules'), { recursive: true });
  fs.mkdirSync(path.join(renderDir, 'scripts', 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(renderDir, 'skills'), { recursive: true });
  fs.mkdirSync(path.join(renderDir, '.claude'), { recursive: true });

  fs.writeFileSync(path.join(renderDir, 'agents', 'planner.md'), '# planner');
  fs.writeFileSync(path.join(renderDir, 'commands', 'plan.md'), '# plan');
  fs.writeFileSync(path.join(renderDir, 'contexts', 'readme.md'), '# contexts');
  fs.writeFileSync(path.join(renderDir, 'mcp-configs', 'exa.json'), '{}');
  fs.writeFileSync(path.join(renderDir, 'rules', 'common.md'), '# common');
  fs.writeFileSync(path.join(renderDir, 'scripts', 'hooks', 'pre-bash-block-push-main.js'), 'console.log("guardrail");');
  fs.writeFileSync(path.join(renderDir, 'skills', 'verification-loop.md'), '# verify');
  fs.writeFileSync(path.join(renderDir, '.claude', 'package-manager.json'), '{"manager":"pnpm"}');
  writeJson(path.join(renderDir, 'hooks', 'hooks.json'), {
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/hooks/run-with-flags.js" "pre:bash:block-push-main" "scripts/hooks/pre-bash-block-push-main.js" "strict"'
            }
          ],
          description: 'managed guardrail'
        }
      ]
    }
  });

  return renderDir;
}

let passed = 0;
let failed = 0;

if (test('mergeHooksWithPreservedExtras keeps local theme sync while avoiding duplicate managed hooks', () => {
  const managedHooks = {
    hooks: {
      SessionStart: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/hooks/run-with-flags.js" "session:start" "scripts/hooks/session-start.js" "minimal,standard,strict"'
            }
          ],
          description: 'managed session start'
        }
      ]
    }
  };
  const existingHooks = {
    hooks: {
      SessionStart: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: 'bash ~/.local/bin/claude-theme-sync.sh'
            }
          ],
          description: 'local theme sync'
        }
      ],
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            {
              type: 'command',
              command: 'node "$HOME/.claude/scripts/hooks/pre-bash-block-push-main.js"'
            }
          ],
          description: 'old managed copy'
        }
      ]
    }
  };

  const merged = mergeHooksWithPreservedExtras(managedHooks, existingHooks);

  assert.strictEqual(merged.hooks.SessionStart.length, 2);
  assert.ok(!merged.hooks.PreToolUse);
  assert.ok(
    merged.hooks.SessionStart.some(entry => entry.hooks[0].command === 'bash ~/.local/bin/claude-theme-sync.sh'),
    'Expected preserved theme sync hook'
  );
})) passed += 1; else failed += 1;

if (test('stripHooksFromSettings removes hook definitions while preserving other settings', () => {
  const result = stripHooksFromSettings({
    permissions: { allow: ['Bash'] },
    hooks: { SessionStart: [] }
  });

  assert.deepStrictEqual(result, {
    permissions: { allow: ['Bash'] }
  });
})) passed += 1; else failed += 1;

if (test('deployClaudeHome syncs managed assets, writes hooks.json, and preserves runtime files', () => {
  const renderDir = makeRenderFixture();
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-config-target-'));

  fs.mkdirSync(path.join(targetDir, 'commands'), { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'commands', 'python-review.md'), '# stale');
  fs.writeFileSync(path.join(targetDir, 'settings.local.json'), '{"keep":true}\n');
  writeJson(path.join(targetDir, 'hooks.json'), {
    hooks: {
      SessionStart: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: 'bash ~/.local/bin/claude-theme-sync.sh'
            }
          ],
          description: 'local theme sync'
        }
      ]
    }
  });
  writeJson(path.join(targetDir, 'settings.json'), {
    model: 'opus',
    hooks: {
      Stop: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: 'bash ~/.local/bin/claude-theme-sync.sh --stop'
            }
          ],
          description: 'local stop hook'
        }
      ]
    }
  });

  deployClaudeHome({ renderDir, targetDir });

  assert.ok(fs.existsSync(path.join(targetDir, 'commands', 'plan.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, 'commands', 'python-review.md')));
  assert.ok(fs.existsSync(path.join(targetDir, 'package-manager.json')));
  assert.ok(fs.existsSync(path.join(targetDir, 'settings.local.json')));

  const hooksJson = readJson(path.join(targetDir, 'hooks.json'));
  assert.ok(hooksJson.hooks.PreToolUse.some(entry => entry.description === 'managed guardrail'));
  assert.ok(hooksJson.hooks.SessionStart.some(entry => entry.description === 'local theme sync'));
  assert.ok(hooksJson.hooks.Stop.some(entry => entry.description === 'local stop hook'));

  const settingsJson = readJson(path.join(targetDir, 'settings.json'));
  assert.strictEqual(settingsJson.model, 'opus');
  assert.ok(!('hooks' in settingsJson));
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
