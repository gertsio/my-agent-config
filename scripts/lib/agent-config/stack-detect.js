/**
 * Bridge between project detection and stack selection.
 *
 * Maps detection results (languages, frameworks, infrastructure) to
 * stack names defined in stacks.json, enabling --auto-detect.
 */

/**
 * Map detection results to stack names using the manifest detection map.
 * @param {object} manifest - Loaded stacks.json manifest
 * @param {{ languages?: string[], frameworks?: string[], infrastructure?: string[] }} detection - Detection result
 * @returns {string[]} Sorted, deduplicated stack names
 */
function mapDetectionToStacks(manifest, detection) {
  if (!manifest.detection) {
    return [];
  }

  const stacks = new Set();

  for (const [stackName, triggers] of Object.entries(manifest.detection)) {
    if (!manifest.stacks[stackName]) {
      continue;
    }

    const matchesLanguage = (triggers.languages || []).some(
      lang => (detection.languages || []).includes(lang)
    );
    const matchesFramework = (triggers.frameworks || []).some(
      fw => (detection.frameworks || []).includes(fw)
    );
    const matchesInfra = (triggers.infrastructure || []).some(
      infra => (detection.infrastructure || []).includes(infra)
    );

    if (matchesLanguage || matchesFramework || matchesInfra) {
      stacks.add(stackName);
    }
  }

  return Array.from(stacks).sort();
}

/**
 * Merge explicit and detected stacks into a single deduplicated sorted list.
 * @param {string[]} explicit - User-specified stacks
 * @param {string[]} detected - Auto-detected stacks
 * @returns {string[]} Union, deduplicated and sorted
 */
function mergeStacks(explicit, detected) {
  return Array.from(new Set([...explicit, ...detected])).sort();
}

module.exports = {
  mapDetectionToStacks,
  mergeStacks
};
