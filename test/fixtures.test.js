// ICD sample messages, unchanged. Each must validate ok, or fail exactly on the documented fields.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, typeNames } from '../src/schema/index.js';
import { validate } from '../src/core/validate.js';
import { KNOWN_ICD_SAMPLE_ISSUES } from './fixtures/icdSampleIssues.js';

for (const name of typeNames) {
  registry[name].samples.forEach((sample, i) => {
    test(`ICD sample ${name} #${i + 1}`, () => {
      const v = validate(sample);
      const errorFields = [...new Set(v.findings.filter(f => f.level === 'error').map(f => f.field))].sort();
      const expected = (KNOWN_ICD_SAMPLE_ISSUES[sample] || []).slice().sort();
      assert.deepEqual(errorFields, expected, v.findings.map(f => `${f.level} ${f.field}: ${f.message}`).join('\n'));
    });
  });
}

test('every documented ICD sample issue refers to a registered sample', () => {
  const all = new Set(typeNames.flatMap(n => registry[n].samples));
  for (const s of Object.keys(KNOWN_ICD_SAMPLE_ISSUES)) assert.ok(all.has(s), `not a sample: ${s}`);
});
