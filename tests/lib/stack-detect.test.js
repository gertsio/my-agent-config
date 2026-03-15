/**
 * Tests for scripts/lib/agent-config/stack-detect.js
 *
 * Run with: node tests/lib/stack-detect.test.js
 */

const assert = require('assert');

const { mapDetectionToStacks, mergeStacks } = require('../../scripts/lib/agent-config/stack-detect');

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (err) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing stack-detect.js ===\n');

  let passed = 0;
  let failed = 0;

  const manifest = {
    stacks: {
      python: { shared: { skills: ['python-patterns'] } },
      typescript: { shared: { skills: ['frontend-patterns'] } },
      django: { extends: ['python'], shared: { skills: ['django-patterns'] } },
      docker: { shared: { skills: ['docker-patterns'] } },
      postgres: { shared: { skills: ['postgres-patterns'] } },
      deployment: { shared: { skills: ['deployment-patterns'] } }
    },
    detection: {
      python: { languages: ['python'] },
      typescript: { languages: ['typescript'] },
      django: { frameworks: ['django'] },
      docker: { infrastructure: ['docker'] },
      postgres: { infrastructure: ['postgres'] },
      deployment: { infrastructure: ['github-actions'] }
    }
  };

  // mapDetectionToStacks tests
  console.log('mapDetectionToStacks:');

  if (test('maps language detection to stacks', () => {
    const result = mapDetectionToStacks(manifest, { languages: ['python'], frameworks: [], infrastructure: [] });
    assert.deepStrictEqual(result, ['python']);
  })) passed++; else failed++;

  if (test('maps framework detection to stacks', () => {
    const result = mapDetectionToStacks(manifest, { languages: ['python'], frameworks: ['django'], infrastructure: [] });
    assert.deepStrictEqual(result, ['django', 'python']);
  })) passed++; else failed++;

  if (test('maps infrastructure detection to stacks', () => {
    const result = mapDetectionToStacks(manifest, { languages: [], frameworks: [], infrastructure: ['docker'] });
    assert.deepStrictEqual(result, ['docker']);
  })) passed++; else failed++;

  if (test('maps mixed detection (lang + fw + infra) to stacks', () => {
    const result = mapDetectionToStacks(manifest, {
      languages: ['python'],
      frameworks: ['django'],
      infrastructure: ['docker', 'postgres', 'github-actions']
    });
    assert.deepStrictEqual(result, ['deployment', 'django', 'docker', 'postgres', 'python']);
  })) passed++; else failed++;

  if (test('returns empty when no detection key in manifest', () => {
    const noDetection = { stacks: { python: {} } };
    const result = mapDetectionToStacks(noDetection, { languages: ['python'], frameworks: [], infrastructure: [] });
    assert.deepStrictEqual(result, []);
  })) passed++; else failed++;

  if (test('skips stacks not defined in manifest.stacks', () => {
    const partial = {
      stacks: { python: { shared: {} } },
      detection: {
        python: { languages: ['python'] },
        ruby: { languages: ['ruby'] }
      }
    };
    const result = mapDetectionToStacks(partial, { languages: ['python', 'ruby'], frameworks: [], infrastructure: [] });
    assert.deepStrictEqual(result, ['python']);
  })) passed++; else failed++;

  if (test('returns empty for empty detection result', () => {
    const result = mapDetectionToStacks(manifest, { languages: [], frameworks: [], infrastructure: [] });
    assert.deepStrictEqual(result, []);
  })) passed++; else failed++;

  // mergeStacks tests
  console.log('\nmergeStacks:');

  if (test('merges explicit and detected stacks with dedup + sort', () => {
    const result = mergeStacks(['python', 'docker'], ['docker', 'postgres']);
    assert.deepStrictEqual(result, ['docker', 'postgres', 'python']);
  })) passed++; else failed++;

  if (test('handles empty explicit stacks', () => {
    const result = mergeStacks([], ['docker', 'python']);
    assert.deepStrictEqual(result, ['docker', 'python']);
  })) passed++; else failed++;

  if (test('handles empty detected stacks', () => {
    const result = mergeStacks(['python'], []);
    assert.deepStrictEqual(result, ['python']);
  })) passed++; else failed++;

  if (test('handles both empty', () => {
    const result = mergeStacks([], []);
    assert.deepStrictEqual(result, []);
  })) passed++; else failed++;

  // Summary
  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
