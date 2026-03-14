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

    if (!/\b(mongosh?|mongodump|mongorestore|mongoimport)\b/.test(cmd)) {
      process.stdout.write(raw);
      return;
    }

    const dataWrites = [
      'insertOne', 'insertMany', 'insert',
      'updateOne', 'updateMany', 'update',
      'deleteOne', 'deleteMany', 'delete',
      'remove',
      'replaceOne',
      'findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete',
      'bulkWrite',
      'save',
    ];
    const schemaOps = [
      'drop', 'dropDatabase', 'dropCollection',
      'createCollection', 'createIndex', 'dropIndex', 'dropIndexes',
      'renameCollection',
    ];
    const adminOps = [
      'createUser', 'dropUser', 'updateUser',
      'grantRolesToUser', 'revokeRolesFromUser',
      'createRole', 'dropRole',
      'shutdownServer',
    ];
    const aggregateWriteStages = ['\\$merge', '\\$out'];
    const destructiveTools = ['mongorestore', 'mongoimport'];

    const blockPattern = new RegExp([
      ...dataWrites.map(op => `\\.${op}\\s*\\(`),
      ...schemaOps.map(op => `\\.${op}\\s*\\(`),
      ...adminOps.map(op => `\\.${op}\\s*\\(`),
      ...aggregateWriteStages,
      ...destructiveTools.map(tool => `\\b${tool}\\b`),
    ].join('|'), 'i');

    if (blockPattern.test(cmd)) {
      const matched = cmd.match(blockPattern);
      const operation = matched ? matched[0].replace(/^\./, '').replace(/\s*\($/, '') : 'write operation';

      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: `MongoDB write operation blocked: "${operation}". Claude Code is restricted to read-only MongoDB access. Allowed: find, aggregate (no $merge/$out), countDocuments, distinct, getIndexes, stats, explain, show dbs/collections.`,
      }));
      return;
    }
  } catch {
    // Pass through malformed payloads.
  }

  process.stdout.write(raw);
});
