// ICD §6.4 EMISSION
// EMISSION;<HDR>;
// <EmissionID>(M);<DeleteFlag>;
// <SensorLatitude>[°](M);<SensorLongitude>[°](M);<SensorAltitude>[m];
// <EmitterLatitude>[°];<EmitterLongitude>[°];<EmitterAltitude>[m];
// <Bearing>[°](M);<Frequencies>[Hz]*;<Bandwidth>[Hz];<Power>[db(A)];<FreqAgility>;<PRFAgility>;
// <Function>;<SpotNumber>;<SIDC>;<Comment>
const R = '6.4';
export default {
  name: 'EMISSION',
  icdRef: R,
  description: 'Positional data, emission attributes, identification info of an electromagnetic, optical or acoustic emission, or the bearing of visually recognizable objects.',
  fields: [
    { name: 'EmissionID',                      mandatory: true,  check: 'text',  icdRef: R, icdHint: 'ASCII: unique number/free-text id chosen by sender; must also be unique w.r.t. contact numbers and similar IDs.' },
    { name: 'DeleteFlag',                      mandatory: false, check: 'bool',  icdRef: R, icdHint: 'TRUE=remove, FALSE=current.' },
    { name: 'SensorLatitude',   unit: '°',     mandatory: true,  check: 'lat',   icdRef: R, icdHint: 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.' },
    { name: 'SensorLongitude',  unit: '°',     mandatory: true,  check: 'lon',   icdRef: R, icdHint: 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.' },
    { name: 'SensorAltitude',   unit: 'm',     mandatory: false, check: 'float', icdRef: R, icdHint: 'Altitude = above sea level; 0 = exactly on ground (on land).' },
    { name: 'EmitterLatitude',  unit: '°',     mandatory: false, check: 'lat',   icdRef: R, icdHint: 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.' },
    { name: 'EmitterLongitude', unit: '°',     mandatory: false, check: 'lon',   icdRef: R, icdHint: 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.' },
    { name: 'EmitterAltitude',  unit: 'm',     mandatory: false, check: 'float', icdRef: R, icdHint: 'Altitude = above sea level; 0 = exactly on ground (on land).' },
    { name: 'Bearing',          unit: '°',     mandatory: true,  check: 'angle', icdRef: R, icdHint: 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.' },
    { name: 'Frequencies',      unit: 'Hz', list: true, mandatory: false, check: 'floatList', icdRef: R, icdHint: 'List values: elements separated by # (0x23); list fields are marked * in the spec.' },
    { name: 'Bandwidth',        unit: 'Hz',    mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'Power',            unit: 'db(A)', mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'FreqAgility',                     mandatory: false, check: 'freqAgility',      icdRef: R, icdHint: '00=Stable Fixed, 01=Agile, 02=Periodic, 03=Hopper, 04=Batch Hopper, 05=Unknown' },
    { name: 'PRFAgility',                      mandatory: false, check: 'prfAgility',       icdRef: R, icdHint: '00=Fixed periodic, 01=Staggered, 02=Jittered, 03=Wobbulated, 04=Sliding, 05=Dwell switch, 06=Unknown PRF, 07=CW' },
    { name: 'Function',                        mandatory: false, check: 'emissionFunction', icdRef: R, icdHint: '00=Unknown, 01=ESM Beacon/Transponder, 02=ESM Navigation, … 1E=VISUAL Object (see table in §6.4).' },
    { name: 'SpotNumber',                      mandatory: false, check: 'text',  icdRef: R, icdHint: 'Max length of untyped/text fields: 256 bytes.' },
    { name: 'SIDC',                            mandatory: false, check: 'sidc',  icdRef: R, icdHint: 'Identification code.' },
    { name: 'Comment',                         mandatory: false, check: 'base64_65000', icdRef: R, icdHint: 'BASE64, max 65000 bytes.' },
  ],
  rules: [],
  samples: [
    'EMISSION;5E;0195238E15AD;66A3;R;;;100;;53.32;8.11;0;;;;20;8725000.0#8735000.0;20000;3;0;2;6;10233;;SA-8',
    'EMISSION;5F;0195238E25AD;66A3;R;;;101;;54.86;9.32;0;52.12;9.8;50;233;25725.0;4000;1;5;2;0;;sngpesr--------',
  ],
};
