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

function isReadOnlyExec(command) {
  const execMatch = command.match(/\bkubectl\s+exec\b.*?\s--\s+(.+)/i);
  if (!execMatch) return false;

  const safeExecCommands = new Set([
    'cat', 'ls', 'head', 'tail', 'find', 'wc', 'du', 'df',
    'stat', 'file', 'whoami', 'id', 'hostname', 'uname',
    'env', 'printenv', 'pwd', 'date', 'ps', 'grep', 'egrep',
    'which', 'type', 'command', 'readlink', 'realpath',
    'sha256sum', 'md5sum', 'tree', 'sort', 'uniq', 'diff',
    'strings', 'hexdump', 'test', 'true', 'echo',
    'node', 'python3', 'python',
  ]);

  const afterSeparator = execMatch[1].trim();
  const firstToken = afterSeparator.split(/\s+/)[0];
  const binary = firstToken.split('/').pop();

  if (binary === 'sh' || binary === 'bash') {
    const shellMatch = afterSeparator.match(/\b(?:sh|bash)\s+-c\s+['"]?\s*(\S+)/i);
    if (!shellMatch) return false;
    return safeExecCommands.has(shellMatch[1].split('/').pop());
  }

  return safeExecCommands.has(binary);
}

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const cmd = String(input.tool_input?.command || '');

    if (!/\b(kubectl|helm)\b/.test(cmd)) {
      process.stdout.write(raw);
      return;
    }

    const destructiveKubectl = [
      'delete', 'apply', 'create', 'exec', 'scale', 'edit', 'patch',
      'rollout', 'drain', 'cordon', 'uncordon', 'taint', 'replace',
      'set', 'run', 'expose', 'label', 'annotate', 'autoscale',
      'cp', 'attach', 'port-forward',
    ];
    const destructiveHelm = ['install', 'upgrade', 'delete', 'uninstall', 'rollback'];

    const blockPattern = new RegExp([
      ...destructiveKubectl.map(sub => `\\bkubectl\\s+${sub}\\b`),
      ...destructiveHelm.map(sub => `\\bhelm\\s+${sub}\\b`),
    ].join('|'), 'i');

    if (blockPattern.test(cmd)) {
      if (/\bkubectl\s+exec\b/i.test(cmd) && isReadOnlyExec(cmd)) {
        process.stdout.write(raw);
        return;
      }

      const matched = cmd.match(blockPattern);
      const operation = matched ? matched[0].trim() : 'destructive operation';
      const allowed = [
        'kubectl get', 'kubectl describe', 'kubectl logs',
        'kubectl top', 'kubectl config', 'kubectl cluster-info',
        'kubectl api-resources', 'kubectl explain', 'kubectl version',
        'kubectl exec ... -- <read-only command>',
        'helm list', 'helm status', 'helm get', 'helm show',
      ].join(', ');

      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: `Kubernetes write operation blocked: "${operation}". Claude Code is restricted to read-only Kubernetes access. Allowed: ${allowed}.`,
      }));
      return;
    }
  } catch {
    // Pass through malformed payloads.
  }

  process.stdout.write(raw);
});
