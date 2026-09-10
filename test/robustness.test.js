// Short messages, odd input, unknown types, conditional groups, variants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, normalizeInput } from '../src/core/parse.js';
import { validate } from '../src/core/validate.js';
import { build } from '../src/core/build.js';

const errorsOf = v => v.findings.filter(f => f.level === 'error').map(f => f.field);
const statusOf = (v, name) => v.fields.find(f => f.name === name)?.status;

test('truncated optional fields at the end are "empty", not errors', () => {
  const v = validate('OWNUNIT;5E;0191C643A8AF;DRONEONE;R;;;53.32;8.11');
  assert.ok(v.ok, JSON.stringify(v.findings));
  assert.equal(statusOf(v, 'SIDC'), 'empty');
  assert.equal(v.fields.length, 1 + 6 + 10);
});

test('missing mandatory field at the end is an error', () => {
  const v = validate('OWNUNIT;5E;0191C643A8AF;DRONEONE;R;;;53.32');
  assert.deepEqual(errorsOf(v), ['Longitude']);
});

test('CRLF, whitespace and Buffer input are normalized', () => {
  assert.equal(normalizeInput('  HEARTBEAT;42\r\n'), 'HEARTBEAT;42');
  assert.equal(normalizeInput(Buffer.from('HEARTBEAT;42\n', 'latin1')), 'HEARTBEAT;42');
  assert.equal(normalizeInput(new Uint8Array([72, 69, 65, 82, 84, 66, 69, 65, 84, 10])), 'HEARTBEAT');
  assert.ok(validate(Buffer.from('HEARTBEAT;42;0195238E25AD;89AD;U;;;ORKA\r\n')).ok);
});

test('unknown type is a clean error, no fallback', () => {
  for (const raw of ['FOO;1;2', 'ownunit;5E', '', 'UdlsDIB4oeKiuU4PXtV9qCPrrk10yPFg38Bakm7oGVOOC3siuczsyg37+Q9eiDE1Z0qyaXQl4puRGdB0mpb1Vf6cfhj7n7270Gv/VjW5Ol8IAFJh']) {
    const p = parse(raw);
    assert.equal(p.schema, null);
    const v = validate(raw);
    assert.equal(v.ok, false);
    assert.equal(v.findings[0].level, 'error');
  }
  assert.match(validate('ownunit;5E').findings[0].message, /uppercase/);
  assert.match(validate('KEYEXCHANGE;00').findings[0].message, /not supported/);
});

test('extra non-empty fields are errors, trailing empty ones are not', () => {
  assert.ok(validate('HEARTBEAT;43;;;;;;;;;').ok);
  const v = validate('HEARTBEAT;42;0195238E25AD;89AD;U;;;ORKA;EXTRA');
  assert.deepEqual(errorsOf(v), ['Field 9']);
});

test('CONTACT position: exactly one of Lat/Lon or relX/Y/Z', () => {
  assert.deepEqual(errorsOf(validate('CONTACT;;;;;;;100')), ['position']);
  assert.ok(validate('CONTACT;;;;;;;100;;53.32;8.11').ok);
  assert.ok(validate('CONTACT;;;;;;;100;;;;;100;130;0').ok);
  // incomplete rel group
  assert.deepEqual(errorsOf(validate('CONTACT;;;;;;;100;;;;;100;130')), ['relZ-Distance']);
  // incomplete geo group
  assert.deepEqual(errorsOf(validate('CONTACT;;;;;;;100;;53.32')), ['Longitude']);
  // both groups filled -> warning only
  const both = validate('CONTACT;;;;;;;100;;53.32;8.11;;1;2;3');
  assert.ok(both.ok);
  assert.equal(both.warnings, 1);
});

test('Acknowledgement TRUE requires Number; forbidden for HEARTBEAT/ACKNOWLEDGE', () => {
  assert.deepEqual(errorsOf(validate('TEXT;;0195238E25AD;X;U;TRUE;;;;;hi')), ['Number']);
  assert.deepEqual(errorsOf(validate('HEARTBEAT;42;;;;TRUE')), ['Acknowledgement']);
  assert.deepEqual(errorsOf(validate('ACKNOWLEDGE;18;;129E;R;TRUE;;LASSY;COMMAND;2B')), ['Acknowledgement']);
});

test('TEXT with Encoding=BASE64 must carry BASE64 text', () => {
  assert.deepEqual(errorsOf(validate('TEXT;7B;;324E;U;;;ORKA;04;BASE64;not base64!')), ['Text']);
  assert.ok(validate('TEXT;7B;;324E;U;;;ORKA;04;NONE;not base64!').ok);
});

test('GRAPHIC variants resolve by GraphicType', () => {
  const p = parse('GRAPHIC;79;0195238E35AD;910E;U;;;FFDA;;08;1;FF800000;;;BASE64;QXJlYSBBbHBoYQ==;53.43;9.45;0;1000');
  assert.equal(p.variantLabel, 'Sphere');
  assert.deepEqual(p.fields.filter(f => f.section === 'variant').map(f => f.def.name), ['Lat', 'Lon', 'Alt', 'Radius']);
  // unknown type -> params cannot be assigned
  const v = validate('GRAPHIC;79;;910E;U;;;FFDA;;ZZ;1;;;;;;53.43');
  assert.deepEqual(errorsOf(v).sort(), ['Field 17', 'GraphicType']);
  // Rectangle: first param is a comma triple
  assert.ok(validate('GRAPHIC;;;;;;;R1;;03;;;;;;;53.4,9.4,0;100;200;45').ok);
  assert.deepEqual(errorsOf(validate('GRAPHIC;;;;;;;R1;;03;;;;;;;53.4;9.4;0;100')), ['Position']);
});

test('COMMAND: CmdType mandatory unless CmdFlag 03; engagement target mandatory', () => {
  assert.ok(validate('COMMAND;29;;E4B3;C;;;Drone2;0000;03').ok);
  assert.deepEqual(errorsOf(validate('COMMAND;29;;E4B3;C;;;Drone2;0000;02')), ['CmdType']);
  assert.deepEqual(errorsOf(validate('COMMAND;29;;E4B3;C;;;Drone2;0000;00')), ['CmdType']);
  assert.deepEqual(errorsOf(validate('COMMAND;29;;E4B3;C;;;Drone2;;00;;54;W1')), ['TargetID']);
  assert.ok(validate('COMMAND;29;;E4B3;C;;;Drone2;;00;;54;W1;100').ok);
  assert.deepEqual(errorsOf(validate('COMMAND;29;;E4B3;C;;;Drone2;;00;;24;91;8')), ['Lat']);
});

test('build drops trailing empty fields and keeps ICD order', () => {
  assert.equal(build('HEARTBEAT', {}), 'HEARTBEAT');
  assert.equal(build('HEARTBEAT', { Number: '43' }), 'HEARTBEAT;43');
  assert.equal(build('OWNUNIT', { Latitude: '1', Longitude: '2', SIDC: 'SFSPCLFF-------' }), 'OWNUNIT;;;;;;;1;2;;;;;;;;SFSPCLFF-------');
  assert.equal(build('GRAPHIC', { GraphicID: 'g', GraphicType: '08', Radius: '5' }), 'GRAPHIC;;;;;;;g;;08;;;;;;;;;;5');
  assert.throws(() => build('KEYEXCHANGE', {}));
});

test('field results carry position, expected text and ICD reference', () => {
  const v = validate('OWNUNIT;5E;0191C643A8AF;DRONEONE;R;;;95;8.11');
  const lat = v.fields.find(f => f.name === 'Latitude');
  assert.equal(lat.position, 8);
  assert.equal(lat.status, 'error');
  assert.equal(lat.icdRef, '6.1');
  assert.ok(lat.expected.includes('-90'));
  assert.ok(lat.icdHint.length > 10);
});
