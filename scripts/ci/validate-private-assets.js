#!/usr/bin/env node
/**
 * Prevent accidentally tracking local-only private profile data in the public repo.
 */

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const BLOCKED_PREFIXES = ['private/', 'personal/'];

function getTrackedFiles(prefix) {
  const output = execFileSync('git', ['ls-files', prefix], {
    cwd: ROOT,
    encoding: 'utf8'
  }).trim();

  if (!output) {
    return [];
  }

  return output.split('\n').map(line => line.trim()).filter(Boolean);
}

const failures = [];
for (const prefix of BLOCKED_PREFIXES) {
  for (const file of getTrackedFiles(prefix)) {
    failures.push(file);
  }
}

if (failures.length > 0) {
  for (const file of failures) {
    console.error(`ERROR: local-only asset is tracked in git: ${file}`);
  }
  process.exit(1);
}

console.log('Validated: local-only private paths are not tracked');
