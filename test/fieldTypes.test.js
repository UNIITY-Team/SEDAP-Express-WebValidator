// Negative cases: at least one deliberately broken value per check, plus one good value.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fieldTypes } from '../src/schema/fieldTypes.js';

const cases = {
  hexNumber:    { ok: ['00', '7F', '5E'], bad: ['80', '5', '123', 'ZZ'], warn: ['5e'] },
  hexTime:      { ok: ['0191C643A8AF', 'F'], bad: ['0x0191', '019 1', '01234567890123456', '-1'] },
  mac:          { ok: ['4389F10D', 'A'.repeat(32), 'b'.repeat(64)], bad: ['4389F1', 'GGGGGGGG', 'A'.repeat(16)] },
  classification: { ok: ['P', 'U', 'R', 'C', 'S', 'T'], bad: ['X', 'p', 'PU'] },
  bool:         { ok: ['TRUE', 'FALSE'], bad: ['true', '1', 'yes'] },
  text:         { ok: ['OKRA', 'FGS Bayern'], bad: ['a'.repeat(257), 'Ünïcode→'] },
  text32:       { ok: ['Area Alpha'], bad: ['a'.repeat(33)] },
  text64:       { ok: ['a'.repeat(64)], bad: ['a'.repeat(65)] },
  text8192:     { ok: ['{"x":1}'], bad: ['a'.repeat(8193)] },
  text65000:    { ok: ['"This is an alert!"'], bad: ['a'.repeat(65001), '→'] },
  messageName:  { ok: ['CONTACT', 'KEYEXCHANGE'], bad: ['contact'], warn: ['FOO'] },
  base64:       { ok: ['VXNlIENIMjI=', 'cGxzIGhlYXI='], bad: ['SA-8', 'abc', 'a b c d'] },
  base64_64:    { ok: ['MTAuMC4wLjEzMg=='], bad: ['A'.repeat(68)] },
  base64_8192:  { ok: ['QQ=='], bad: ['A'.repeat(8196)] },
  base64_65000: { ok: ['QQ=='], bad: ['A'.repeat(65004)] },
  base64_65000_soft: { ok: ['QQ=='], bad: ['A-'], warn: ['A'.repeat(65004)] },
  base64List4096: { ok: ['QQ==#QUE='], bad: ['QQ==#A-', 'A'.repeat(4100)] },
  float:        { ok: ['0', '-2.2', '5577.0', '1e3', '.5'], bad: ['abc', '1,5', '--1', ''] },
  lat:          { ok: ['53.32', '-90', '90'], bad: ['90.1', '-91', 'N53'] },
  lon:          { ok: ['8.11', '-180', '180'], bad: ['180.5', 'E8'] },
  angle:        { ok: ['0', '359.999', '21'], bad: ['360', '-1', 'x'] },
  percent:      { ok: ['0', '50', '100'], bad: ['101', '-1'] },
  lineWidth:    { ok: ['1', '2.5'], bad: ['0', '0.5', 'x'] },
  floatList:    { ok: ['8725000.0#8735000.0', '1'], bad: ['1#x', '#'] },
  hex16:        { ok: ['1111', '0000', 'ed32'], bad: ['111', '11111', 'GGGG'] },
  rgba:         { ok: ['800000FF', '00FF0080'], bad: ['FFF', '800000FFA', 'GG0000FF'] },
  sidc:         { ok: ['SFSPCLFF-------', 'sngpesr--------'], bad: ['SFSP', 'SFSPCLFF--------'] },
  sidcS:        { ok: ['SFSPCLFF-------', 'sfspclff-------'], bad: ['GFSPCLFF-------', 'S'] },
  sidcG:        { ok: ['gfopep---------'], bad: ['sfopep---------', 'gfo'] },
  sourceChars:  { ok: ['AR', 'O', 'RAISEOYM'], bad: ['X', 'ar', 'A,R'] },
  mmsi:         { ok: ['221333201'], bad: ['22133320', '2213332011', 'ABCDEFGHI'] },
  icao24:       { ok: ['3C4B1A', 'abcdef'], bad: ['3C4B', 'EDDH', 'GGGGGG'] },
  coordList:    { ok: ['54.23,12.86#54.30,12.9', '53.1,8.2,0'], bad: ['54.23;12.86', '91,0', '1,2,3,4', 'a,b'] },
  coord:        { ok: ['53.43,9.45,0', '53.43,9.45'], bad: ['53.43', '53.43,181'] },
  levelList:    { ok: ['MLG#20', 'A#1#B#100'], bad: ['MLG', 'MLG#x', 'MLG#101', 'MLG#20#B'] },
  encoding:     { ok: ['BASE64', 'NONE'], bad: ['base64', 'UTF8'] },
  onOff:        { ok: ['ON', 'OFF'], bad: ['on', '1'] },
  cameraMode:   { ok: ['DayLight', 'InfraRed', 'LightIntensifier'], bad: ['daylight', 'IR'] },
  contentType:  { ok: ['SEDAP', 'JSON', 'NMEA'], bad: ['json', 'CSV'] },
  textType:     { ok: ['00', '04'], bad: ['1', '05', '4', 'a'] },
  freqAgility:  { ok: ['00', '05'], bad: ['0', '06'] },
  prfAgility:   { ok: ['07'], bad: ['7', '08'] },
  emissionFunction: { ok: ['00', '0A', '1E'], bad: ['0a', '1F', '6'] },
  graphicType:  { ok: ['00', '0B'], bad: ['0C', '1', 'b'] },
  cmdFlag:      { ok: ['00', '03'], bad: ['04', '1'] },
  cmdType:      { ok: ['24', 'FF', 'EE', '0A'], bad: ['0B', '17', 'ff', '4'] },
  tecStatus:    { ok: ['0', '4'], bad: ['5', '00'] },
  opsStatus:    { ok: ['0', '4'], bad: ['5', '04'] },
  cmdState:     { ok: ['00', '05'], bad: ['1', '06'] },
};

test('every check in fieldTypes has a negative case', () => {
  for (const key of Object.keys(fieldTypes)) assert.ok(cases[key]?.bad?.length, `no negative case for "${key}"`);
});

for (const [key, c] of Object.entries(cases)) {
  test(`fieldTypes.${key}`, () => {
    const ft = fieldTypes[key];
    assert.ok(ft, `unknown check ${key}`);
    assert.ok(ft.expected, 'expected text missing');
    for (const v of c.ok)   assert.equal(ft.test(v), null, `"${v}" should be ok`);
    for (const v of c.bad)  assert.equal(ft.test(v)?.level, 'error', `"${v}" should be an error`);
    for (const v of c.warn || []) assert.equal(ft.test(v)?.level, 'warn', `"${v}" should be a warning`);
  });
}
