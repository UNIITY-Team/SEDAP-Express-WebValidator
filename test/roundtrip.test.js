// For every registered type: parse each ICD sample, rebuild it from the parsed values,
// and check that build() reproduces the sample. Then validate the rebuilt message.
// Samples that violate the ICD (documented in fixtures.test.js) are allowed to fail validation,
// but must still survive the parse -> build roundtrip unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registry, typeNames } from '../src/schema/index.js';
import { parse } from '../src/core/parse.js';
import { build } from '../src/core/build.js';
import { validate } from '../src/core/validate.js';
import { KNOWN_ICD_SAMPLE_ISSUES } from './fixtures/icdSampleIssues.js';

const trimTrailing = s => s.replace(/;+$/, '');

for (const name of typeNames) {
  const schema = registry[name];
  test(`${name}: schema is well-formed`, () => {
    assert.ok(schema.samples.length > 0, 'needs at least one ICD sample');
    const names = new Set();
    for (const f of schema.fields) {
      assert.ok(!names.has(f.name), `duplicate field ${f.name}`); names.add(f.name);
      assert.ok(f.icdRef && f.icdHint, `${f.name} needs icdRef and icdHint`);
      assert.ok([true, false, 'conditional'].includes(f.mandatory), `${f.name} mandatory`);
      if (f.mandatory === 'conditional') assert.ok(schema.rules.some(r => r.name === f.condition), `${f.name}: no rule "${f.condition}"`);
    }
  });

  schema.samples.forEach((sample, i) => {
    test(`${name}: roundtrip sample ${i + 1}`, () => {
      const p = parse(sample);
      assert.equal(p.schema?.name, name);
      const values = Object.fromEntries(p.fields.filter(f => f.section !== 'name').map(f => [f.def.name, f.value]));
      const rebuilt = build(name, values);
      assert.equal(rebuilt, trimTrailing(sample));
      const v = validate(rebuilt);
      const known = KNOWN_ICD_SAMPLE_ISSUES[sample];
      if (!known) assert.ok(v.ok, `expected ok, got: ${v.findings.map(f => f.message).join(' | ')}`);
    });
  });
}

test('generator roundtrip: minimal mandatory-only message per type validates', () => {
  const minimal = {
    OWNUNIT: { Sender: 'X', Latitude: '1', Longitude: '2' },
    CONTACT: { ContactID: '1', Latitude: '1', Longitude: '2' },
    POINT: { PointID: '1', 'relX-Distance': '1', 'relY-Distance': '2', 'relZ-Distance': '0' },
    EMISSION: { EmissionID: '1', SensorLatitude: '1', SensorLongitude: '2', Bearing: '0' },
    METEO: {},
    TEXT: { Text: 'hi' },
    GRAPHIC: { GraphicID: 'g', GraphicType: '00' },
    COMMAND: { Recipient: 'r', CmdFlag: '00', CmdType: '01' },
    STATUS: {},
    ACKNOWLEDGE: { Recipient: 'r', TypeOfMessage: 'TEXT', NumberOfMessage: '01' },
    RESEND: { Recipient: 'r', NameOfMissingMessage: 'TEXT', NumberOfMissingMessage: '01' },
    GENERIC: {},
    HEARTBEAT: {},
    TIMESYNC: {},
  };
  for (const name of typeNames) {
    assert.ok(name in minimal, `no minimal fixture for ${name}`);
    const msg = build(name, minimal[name]);
    const v = validate(msg);
    assert.ok(v.ok, `${name}: ${msg} -> ${v.findings.map(f => f.message).join(' | ')}`);
  }
});
