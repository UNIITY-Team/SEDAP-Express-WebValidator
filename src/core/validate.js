// Fields -> findings. Central evaluation of checks and named rules; no type-specific code here.
import { getCheck } from '../schema/fieldTypes.js';
import { HEADER_RULES } from '../schema/index.js';
import { parse } from './parse.js';

const LEVEL_RANK = { ok: 0, empty: 0, warn: 1, error: 2 };

function pos(index) { return index + 1; }

function describeMandatory(def) {
  if (def.mandatory === true) return 'M';
  if (def.mandatory === 'conditional') return 'M*';
  return '';
}

/**
 * Validate a parsed message (or a raw string – it will be parsed first).
 * Returns { ok, errors, warnings, findings, fields, parsed }.
 */
export function validate(input) {
  const parsed = typeof input === 'string' || !input?.fields ? parse(input) : input;
  const findings = [];
  const fieldResults = parsed.fields.map(f => ({
    index: f.index,
    position: pos(f.index),
    name: f.def.name,
    unit: f.def.unit,
    section: f.section,
    variantLabel: f.variantLabel,
    value: f.value,
    status: 'empty',
    mandatory: describeMandatory(f.def),
    expected: f.def.check ? getCheck(f.def.check).expected : '',
    icdRef: f.def.icdRef,
    icdHint: f.def.icdHint,
    message: '',
    def: f.def,
  }));
  const byName = new Map(fieldResults.map(r => [r.name, r]));

  function report(level, field, message, ref) {
    const finding = {
      level,
      field: field ? field.name : '',
      position: field ? field.position : null,
      message,
      expected: field ? field.expected : '',
      icdRef: ref?.icdRef ?? field?.icdRef ?? '',
      icdHint: ref?.icdHint ?? field?.icdHint ?? '',
    };
    findings.push(finding);
    if (field && LEVEL_RANK[level] > LEVEL_RANK[field.status]) {
      field.status = level;
      field.message = message;
    } else if (field && !field.message) {
      field.message = message;
    }
  }

  if (parsed.problem) {
    findings.push({ level: 'error', field: 'Name', position: 1, message: parsed.problem.message,
      icdRef: parsed.problem.icdRef ?? '', icdHint: parsed.problem.icdHint ?? '', expected: '' });
    if (fieldResults[0]) { fieldResults[0].status = 'error'; fieldResults[0].message = parsed.problem.message; }
    return finish();
  }

  // 1. per-field checks
  for (const r of fieldResults) {
    if (r.value === '') {
      if (r.def.mandatory === true) report('error', r, `${r.name} is mandatory but empty`);
      continue; // 'conditional' is decided by rules below; optional stays 'empty'
    }
    r.status = 'ok';
    if (!r.def.check) continue;
    const res = getCheck(r.def.check).test(r.value);
    if (res) report(res.level, r, res.message);
  }

  // 2. named rules (header rules + type rules)
  const rules = [...HEADER_RULES, ...(parsed.schema.rules || [])];
  for (const rule of rules) applyRule(rule);

  // 3. fields beyond the schema
  for (const e of parsed.extra) {
    if (e.value === '') continue; // excess trailing semicolons may be truncated (ICD §2)
    const inVariantGap = parsed.schema.variants && !parsed.variantLabel;
    const msg = inVariantGap
      ? `Field ${pos(e.index)} = "${e.value}" cannot be assigned: ${parsed.schema.variants.discriminator} is empty or unknown, so the type-dependent parameters are undefined`
      : `Field ${pos(e.index)} = "${e.value}" is beyond the last field defined for ${parsed.typeName}`;
    findings.push({ level: 'error', field: `Field ${pos(e.index)}`, position: pos(e.index), message: msg,
      expected: '', icdRef: parsed.schema.icdRef, icdHint: 'Fields are never added, renamed or reordered; the position of a field follows exclusively from the ICD section of the message type.' });
  }

  return finish();

  function applyRule(rule) {
    const ref = { icdRef: rule.icdRef, icdHint: rule.icdHint };
    switch (rule.kind) {
      case 'oneOf': {
        const groups = rule.groups.map(g => {
          const fs = g.fields.map(n => byName.get(n)).filter(Boolean);
          const filled = fs.filter(f => f.value !== '');
          return { ...g, fs, filled, started: filled.length > 0, complete: filled.length === fs.length };
        });
        const complete = groups.filter(g => g.complete);
        const started = groups.filter(g => g.started);
        if (started.length === 0) {
          const labels = groups.map(g => `${g.label} (${g.fields.join(', ')})`).join(' or ');
          findings.push({ level: 'error', field: rule.name, position: null,
            message: `One of the groups must be filled: ${labels}`, expected: '', ...ref });
          groups.forEach(g => g.fs.forEach(f => { f.status = 'error'; f.message = `one of ${labels} required`; }));
          return;
        }
        for (const g of started) {
          if (g.complete) continue;
          g.fs.filter(f => f.value === '').forEach(f =>
            report('error', f, `${f.name} is required when ${g.label} is used (${g.fields.join(', ')} belong together)`, ref));
        }
        if (complete.length > 1) {
          findings.push({ level: 'warn', field: rule.name, position: null,
            message: `Both ${groups.map(g => g.label).join(' and ')} are filled – exactly one variant is expected, the other stays empty`, expected: '', ...ref });
          groups.forEach(g => g.fs.forEach(f => { if (f.status === 'ok') { f.status = 'warn'; f.message = 'both position variants filled'; } }));
        }
        return;
      }
      case 'mandatoryUnless': {
        const f = byName.get(rule.field);
        const other = byName.get(rule.unless.field);
        if (!f || f.value !== '') return;
        if (other && rule.unless.values.includes(other.value)) return;
        report('error', f, `${f.name} is mandatory unless ${rule.unless.field} is ${rule.unless.values.join('/')}`, ref);
        return;
      }
      case 'recommended': {
        const f = byName.get(rule.field);
        if (f && f.value === '') report('warn', f, `${f.name} is empty – recommended for this message type`, ref);
        return;
      }
      case 'forbidden': {
        const f = byName.get(rule.field);
        if (f && rule.values.includes(f.value)) report('error', f, `${f.name} must not be ${f.value} for ${parsed.typeName}`, ref);
        return;
      }
      case 'requires': {
        const f = byName.get(rule.field);
        const req = byName.get(rule.requires);
        if (f && req && rule.whenValues.includes(f.value) && req.value === '')
          report('error', req, `${rule.requires} must be set when ${rule.field} is ${f.value}`, ref);
        return;
      }
      case 'checkIf': {
        const f = byName.get(rule.field);
        const cond = byName.get(rule.when.field);
        if (!f || !cond || f.value === '' || !rule.when.values.includes(cond.value)) return;
        const res = getCheck(rule.check).test(f.value);
        if (res) report(res.level, f, `${f.name} with ${rule.when.field}=${cond.value}: ${res.message}`, ref);
        return;
      }
      default:
        throw new Error(`Unknown rule kind "${rule.kind}"`);
    }
  }

  function finish() {
    const errors = findings.filter(f => f.level === 'error').length;
    const warnings = findings.filter(f => f.level === 'warn').length;
    return { ok: errors === 0, errors, warnings, findings, fields: fieldResults, parsed };
  }
}
