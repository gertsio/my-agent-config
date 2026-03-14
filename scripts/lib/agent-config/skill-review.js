const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = ['status', 'decision', 'claude_default', 'codex_allowed', 'notes'];
const VALID_DECISIONS = new Set(['keep_as_is', 'trim', 'rewrite', 'drop']);

function loadSkillReviewCatalog(catalogPath) {
  const resolvedPath = path.resolve(catalogPath);
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function validateSkillReviewCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object' || !catalog.skills || typeof catalog.skills !== 'object') {
    throw new Error('Skill review catalog must include a top-level skills object');
  }

  for (const [skillName, record] of Object.entries(catalog.skills)) {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in record)) {
        throw new Error(`Skill review for "${skillName}" is missing "${field}"`);
      }
    }

    if (!VALID_DECISIONS.has(record.decision)) {
      throw new Error(`Skill review for "${skillName}" has invalid decision "${record.decision}"`);
    }

    if (typeof record.claude_default !== 'boolean' || typeof record.codex_allowed !== 'boolean') {
      throw new Error(`Skill review for "${skillName}" must use boolean claude_default/codex_allowed`);
    }
  }

  return true;
}

function filterSkillsForTool(skills, catalog, tool) {
  const filtered = [];

  for (const skill of skills) {
    const review = catalog && catalog.skills ? catalog.skills[skill] : null;
    if (!review) {
      if (tool === 'claude') {
        filtered.push(skill);
      }
      continue;
    }

    if (review.decision === 'drop') {
      continue;
    }

    if (tool === 'codex' && !review.codex_allowed) {
      continue;
    }

    filtered.push(skill);
  }

  return Array.from(new Set(filtered)).sort();
}

function getClaudeDefaultSkills(catalog) {
  return Object.entries(catalog.skills)
    .filter(([, record]) => record.claude_default && record.decision !== 'drop')
    .map(([skillName]) => skillName)
    .sort();
}

module.exports = {
  getClaudeDefaultSkills,
  loadSkillReviewCatalog,
  filterSkillsForTool,
  validateSkillReviewCatalog
};
