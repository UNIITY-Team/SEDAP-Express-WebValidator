// ICD §6.2 CONTACT
// CONTACT;<HDR>;
// <ContactID>(M);<DeleteFlag>;<Latitude>[°](M);<Longitude>[°](M);<Altitude>[m];
// <relX-Distance>[m](M);<relY-Distance>[m](M);<relZ-Distance>[m](M);
// <SpeedOverGround>[m/s];<CourseOverGround>[°];
// <Heading>[°];<Roll>[°];<Pitch>[°];
// <Width>[m];<Length>[m];<Height>[m];
// <Name>;<Source>;<SIDC>;<MMSI>;<ICAO>;<MediaData>;<Comment>
const R = '6.2';
const POS = 'Either Lat/Lon/Alt OR relative X/Y/Z distance is mandatory (one of the two). Relative distance requires an own OWNUNIT message — otherwise receiver position is used as reference.';
export default {
  name: 'CONTACT',
  icdRef: R,
  description: 'Position/kinematics/identification of a contact (e.g. sensor reports a recognized contact; also used to receive the tactical picture from UNIITY).',
  fields: [
    { name: 'ContactID',                      mandatory: true,          check: 'text',        icdRef: R, icdHint: 'Unique number or free-text id, chosen by sender; unique at least for the whole period (e.g. of the exercise).' },
    { name: 'DeleteFlag',                     mandatory: false,         check: 'bool',        icdRef: R, icdHint: 'TRUE=remove contact; FALSE=contact is current.' },
    { name: 'Latitude',         unit: '°',    mandatory: 'conditional', condition: 'position', check: 'lat',   icdRef: R, icdHint: POS },
    { name: 'Longitude',        unit: '°',    mandatory: 'conditional', condition: 'position', check: 'lon',   icdRef: R, icdHint: POS },
    { name: 'Altitude',         unit: 'm',    mandatory: false,         check: 'float',       icdRef: R, icdHint: 'Altitude = above sea level; 0 = exactly on ground (on land).' },
    { name: 'relX-Distance',    unit: 'm',    mandatory: 'conditional', condition: 'position', check: 'float', icdRef: R, icdHint: 'Relative position: x-axis → east, y-axis → north, z-axis = height above the unit. ' + POS },
    { name: 'relY-Distance',    unit: 'm',    mandatory: 'conditional', condition: 'position', check: 'float', icdRef: R, icdHint: 'Relative position: x-axis → east, y-axis → north, z-axis = height above the unit. ' + POS },
    { name: 'relZ-Distance',    unit: 'm',    mandatory: 'conditional', condition: 'position', check: 'float', icdRef: R, icdHint: 'Relative position: x-axis → east, y-axis → north, z-axis = height above the unit. ' + POS },
    { name: 'SpeedOverGround',  unit: 'm/s',  mandatory: false, check: 'float', icdRef: R, icdHint: 'Speed/course relative to ground.' },
    { name: 'CourseOverGround', unit: '°',    mandatory: false, check: 'angle', icdRef: R, icdHint: 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.' },
    { name: 'Heading',          unit: '°',    mandatory: false, check: 'angle', icdRef: R, icdHint: 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.' },
    { name: 'Roll',             unit: '°',    mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'Pitch',            unit: '°',    mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'Width',            unit: 'm',    mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'Length',           unit: 'm',    mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'Height',           unit: 'm',    mandatory: false, check: 'float', icdRef: R, icdHint: 'Numeric values are floating point unless defined otherwise.' },
    { name: 'Name',                           mandatory: false, check: 'text64',      icdRef: R, icdHint: 'Contact name, max 64 bytes.' },
    { name: 'Source',                         mandatory: false, check: 'sourceChars', icdRef: R, icdHint: 'chars, multiple allowed: R=Radar, A=AIS, I=IFF/ADS-B, S=Sonar, E=EW, O=Optical, Y=Synthetic, M=Manual' },
    { name: 'SIDC',                           mandatory: false, check: 'sidcS',       icdRef: R, icdHint: 'Identification code, lower or upper case (starts with "s").' },
    { name: 'MMSI',                           mandatory: false, check: 'mmsi',        icdRef: R, icdHint: 'Maritime Mobile Service Identity.' },
    { name: 'ICAO',                           mandatory: false, check: 'icao24',      icdRef: R, icdHint: 'International Civil Aviation Organization.' },
    { name: 'MediaData',                      mandatory: false, check: 'base64_65000_soft', icdRef: R, icdHint: 'Image/video/sound URL or data (JPG, PNG, TIF, MP4, TS, WAV, …); preferred length ≤65000 bytes when using UDP.' },
    { name: 'Comment',                        mandatory: false, check: 'base64_8192', icdRef: R, icdHint: 'Free text, max 8192 bytes.' },
  ],
  rules: [
    {
      kind: 'oneOf', name: 'position', icdRef: R, icdHint: POS,
      groups: [
        { label: 'Lat/Lon', fields: ['Latitude', 'Longitude'] },
        { label: 'relative X/Y/Z', fields: ['relX-Distance', 'relY-Distance', 'relZ-Distance'] },
      ],
    },
  ],
  samples: [
    'CONTACT;5E;0191C643A8AF;83C5;R;;;100;FALSE;53.32;8.11;0;;;;120;275;;;;;;;FGS Bayern;AR;SFSPCLFF-------;;;;VXNlIENIMjI=',
    'CONTACT;5F;0191C643A8AF;83C5;U;;;101;;36.32;12.11;2000;;;;44;;;;;;;;Unknown;O;;221333201;;;UG9zcyBOZXRoZXJsYW5kcw==',
    'CONTACT;;0191C643A8AF;4371;S;;;102;;53.32;8.11;;;;;;;;;;;;;PossTank;;;;;XFxzcnZcc25kXDU0aDJoLndhdg==;cGxzIGhlYXI=',
    'CONTACT;60;0191C643A8AF;66A3;S;TRUE;;102;TRUE;53.32;8.11',
  ],
};
