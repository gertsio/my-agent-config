#!/usr/bin/env node
'use strict';

const MAX_STDIN = 1024 * 1024;
let raw = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (raw.length < MAX_STDIN) {
    const remaining = MAX_STDIN - raw.length;
    raw += chunk.substring(0, remaining);
  }
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const cmd = String(input.tool_input?.command || '');

    const isPush = /\bgit\s+push\b/.test(cmd);
    const targetsMain = /\b(main|master)\b/.test(cmd);
    const isBarePush = /^\s*git\s+push\s*$/.test(cmd.trim());

    if (isPush && (targetsMain || isBarePush)) {
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: 'Pushing to main/master is blocked. Create a feature branch and open a PR instead.',
      }));
      return;
    }
  } catch {
    // Pass through malformed payloads.
  }

  process.stdout.write(raw);
});
