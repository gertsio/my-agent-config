const fs = require('fs');
const path = require('path');

const VALID_STATUS = new Set(['active', 'optional', 'runtime_only']);
const REQUIRED_FIELDS = [
  'origin',
  'status',
  'uses_private_profile',
  'private_profile_required',
  'private_profile_path',
  'claude_default',
  'codex_default',
  'claude_command_aliases',
  'notes'
];

function normalizeList(items) {
  return Array.from(new Set(items)).sort();
}

function loadCustomSkillCatalog(catalogPath) {
  const resolvedPath = path.resolve(catalogPath);
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function validateCustomSkillCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object' || !catalog.skills || typeof catalog.skills !== 'object') {
    throw new Error('Custom skill catalog must include a top-level skills object');
  }

  for (const [skillName, record] of Object.entries(catalog.skills)) {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in record)) {
        throw new Error(`Custom skill "${skillName}" is missing "${field}"`);
      }
    }

    if (!VALID_STATUS.has(record.status)) {
      throw new Error(`Custom skill "${skillName}" has invalid status "${record.status}"`);
    }

    if (typeof record.uses_private_profile !== 'boolean' || typeof record.private_profile_required !== 'boolean') {
      throw new Error(`Custom skill "${skillName}" must use boolean private-profile flags`);
    }

    if (record.uses_private_profile && typeof record.private_profile_path !== 'string') {
      throw new Error(`Custom skill "${skillName}" must define a private_profile_path`);
    }

    if (!record.uses_private_profile && record.private_profile_required) {
      throw new Error(`Custom skill "${skillName}" cannot require a private profile when uses_private_profile is false`);
    }

    if (!Array.isArray(record.claude_command_aliases)) {
      throw new Error(`Custom skill "${skillName}" must define claude_command_aliases as an array`);
    }
  }

  return true;
}

function resolveCustomAssets(rootDir, catalog, tool) {
  const skills = [];
  const commands = [];
  const privateProfiles = [];

  for (const [skillName, record] of Object.entries(catalog.skills)) {
    if (record.status === 'runtime_only') {
      continue;
    }

    const enabledByDefault = tool === 'claude' ? record.claude_default : record.codex_default;
    if (!enabledByDefault) {
      continue;
    }

    skills.push(skillName);

    if (tool === 'claude') {
      commands.push(...record.claude_command_aliases);
    }

    if (record.uses_private_profile && record.private_profile_path) {
      privateProfiles.push({
        skill: skillName,
        sourcePath: path.join(rootDir, record.private_profile_path),
        targetPath: path.join('private', 'skills', skillName, 'profile.md'),
        required: record.private_profile_required
      });
    }
  }

  return {
    skills: normalizeList(skills),
    commands: normalizeList(commands),
    privateProfiles: privateProfiles.sort((left, right) => left.skill.localeCompare(right.skill))
  };
}

function applyCustomAssets(selection, assets) {
  return {
    ...selection,
    shared: {
      ...selection.shared,
      skills: normalizeList([...selection.shared.skills, ...assets.skills])
    },
    custom: {
      skills: assets.skills,
      commands: assets.commands,
      privateProfiles: assets.privateProfiles
    }
  };
}

module.exports = {
  applyCustomAssets,
  loadCustomSkillCatalog,
  resolveCustomAssets,
  validateCustomSkillCatalog
};
