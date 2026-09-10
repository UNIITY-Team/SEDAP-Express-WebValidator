// ICD §6.1 OWNUNIT
// OWNUNIT;<HDR with Sender(M?)>;
// <Latitude>[°](M);<Longitude>[°](M);<Altitude>[m];
// <SpeedOverGround>[m/s];<CourseOverGround>[°];
// <Heading>[°];<Roll>[°];<Pitch>[°];
// <Name>;<SIDC>
const R = '6.1';
export default {
  name: 'OWNUNIT',
  icdRef: R,
  description: 'Position, movement, identification data of the own unit (base station, C2 center, drone, vehicle, person, or host device).',
  fields: [
    { name: 'Latitude',          unit: '°',   mandatory: true,  check: 'lat',   icdRef: R, icdHint: 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.' },
    { name: 'Longitude',         unit: '°',   mandatory: true,  check: 'lon',   icdRef: R, icdHint: 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.' },
    { name: 'Altitude',          unit: 'm',   mandatory: false, check: 'float', icdRef: R, icdHint: 'Altitude = above sea level; 0 = exactly on ground (on land).' },
    { name: 'SpeedOverGround',   unit: 'm/s', mandatory: false, check: 'float', icdRef: R, icdHint: 'Speed/course relative to ground.' },
    { name: 'CourseOverGround',  unit: '°',   mandatory: false, check: 'angle', icdRef: R, icdHint: 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.' },
    { name: 'Heading',           unit: '°',   mandatory: false, check: 'angle', icdRef: R, icdHint: 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.' },
    { name: 'Roll',              unit: '°',   mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'Pitch',             unit: '°',   mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'Name',                           mandatory: false, check: 'text',  icdRef: R, icdHint: 'Max length of untyped/text fields: 256 bytes.' },
    { name: 'SIDC',                           mandatory: false, check: 'sidc',  icdRef: R, icdHint: 'SIDC = Symbol identification code (APP-6A/B / MIL-STD-2525B/C / STANAG 2019).' },
  ],
  rules: [
    {
      kind: 'recommended', field: 'Sender', icdRef: R,
      icdHint: 'Multiple own units: Sender field mandatory to distinguish them (exceptionally different Names; that option must be explicitly configured in the SEC).',
    },
  ],
  samples: [
    'OWNUNIT;5E;0191C643A8AF;DRONEONE;R;;;53.32;8.11;0;5.5;21;22;;;FGS Bayern;SFSPCLFF-------',
    'OWNUNIT;11;0191C643A8AF;22AA;U;FALSE;4389F10D;77.88;-10.12;5577.0;33.44;55.66;1.1;-2.2;3.3;Ownunit;SFGPIB----H----',
    'OWNUNIT;5E;0195236D151A;66A3;R;;089A01E7;53.32;8.11;0;5.5;21;22;;;FGS Bayern',
    'OWNUNIT;5E;01952384BD8D;66A3;R;;;53.32;8.11;0;5.5;21;22;;;FGS Bayern;sfspclff-------',
  ],
};
