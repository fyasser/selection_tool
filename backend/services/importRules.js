const fs = require('fs');
const path = require('path');

const rulesPath = path.join(__dirname, '..', 'config', 'importRules.json');

function readRules() {
  return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
}

function validateRulesDocument(document) {
  if (!document || !Array.isArray(document.rules)) {
    throw new Error('Rules document must contain a rules array');
  }
  const ids = new Set();
  document.rules.forEach((rule) => {
    if (!rule.id || !rule.label || !rule.section || ids.has(rule.id)) {
      throw new Error('Each rule needs a unique id, label, and section');
    }
    if (!['hardware', 'io', 'switches', 'hmi', 'licences'].includes(rule.section)) {
      throw new Error(`Unsupported rule section: ${rule.section}`);
    }
    ids.add(rule.id);
  });
}

function saveRules(document) {
  validateRulesDocument(document);
  const temporaryPath = `${rulesPath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, rulesPath);
  return readRules();
}

function classifyItem(item, rulesDocument = readRules()) {
  const reference = String(item.reference || '').trim().toUpperCase();
  const description = String(item.description || '').trim().toLowerCase();
  const rules = [...rulesDocument.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const rule = rules.find((candidate) => (
    (candidate.referencePrefixes || []).some((prefix) => reference.startsWith(String(prefix).toUpperCase()))
    || (candidate.descriptionIncludes || []).some((text) => description.includes(String(text).toLowerCase()))
  ));

  if (!rule) {
    return { ...item, classification: { section: 'unclassified', ruleId: null, label: 'Needs review' } };
  }

  const pointsPerUnit = Number(rule.runtimeIoPointsPerUnit) || 0;
  return {
    ...item,
    classification: { section: rule.section, ruleId: rule.id, label: rule.label },
    runtimeIoPoints: pointsPerUnit > 0 ? (Number(item.quantity) || 0) * pointsPerUnit : 0,
  };
}

function classifySheet(sheet, rulesDocument = readRules()) {
  const classifiedItems = (sheet.items || []).map((item) => classifyItem(item, rulesDocument));
  const sections = {
    hardware: [],
    io: [],
    switches: [],
    hmi: [],
    licences: [],
    unclassified: [],
  };
  let runtimeIoPoints = 0;
  classifiedItems.forEach((item) => {
    const section = item.classification.section;
    sections[section].push(item);
    runtimeIoPoints += Number(item.runtimeIoPoints) || 0;
  });
  return { ...sheet, items: classifiedItems, sections, runtimeIoPoints };
}

module.exports = { readRules, saveRules, classifySheet, validateRulesDocument };
