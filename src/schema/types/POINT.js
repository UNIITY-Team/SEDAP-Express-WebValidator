// ICD §6.3 POINT
// POINT;<HDR>;
// <PointID>(M);<DeleteFlag>;<Latitude>[°](M);<Longitude>[°](M);<Altitude>[m];
// <relX-Distance>[m](M);<relY-Distance>[m](M);<relZ-Distance>[m](M);
// <SpeedOverGround>[m/s];<CourseOverGround>[°];
// <Heading>[°];<Roll>[°];<Pitch>[°];
// <Width>[m];<Length>[m];<Height>[m];
// <Name>;<SIDC>;<MediaData>;<Comment>
const R = '6.3';
const POS = 'Same Lat/Lon/Alt-OR-relative rule as CONTACT (relative requires own OWNUNIT, else receiver position is reference).';
export default {
  name: 'POINT',
  icdRef: R,
  description: 'Position/kinematics/identification of a (geographical) point (person overboard, bridge, hill, meeting point, …).',
  fields: [
    { name: 'PointID',                        mandatory: true,          check: 'text',  icdRef: R, icdHint: 'Unique number or free-text id, chosen by sender.' },
    { name: 'DeleteFlag',                     mandatory: false,         check: 'bool',  icdRef: R, icdHint: 'TRUE=remove point; FALSE=point is current.' },
    { name: 'Latitude',         unit: '°',    mandatory: 'conditional', condition: 'position', check: 'lat',   icdRef: R, icdHint: POS },
    { name: 'Longitude',        unit: '°',    mandatory: 'conditional', condition: 'position', check: 'lon',   icdRef: R, icdHint: POS },
    { name: 'Altitude',         unit: 'm',    mandatory: false,         check: 'float', icdRef: R, icdHint: 'Altitude = above sea level; 0 = exactly on ground (on land).' },
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
    { name: 'Name',                           mandatory: false, check: 'text64',      icdRef: R, icdHint: 'Point name, max 64 bytes.' },
    { name: 'SIDC',                           mandatory: false, check: 'sidcG',       icdRef: R, icdHint: 'Identification code, lower or upper case (starts with "g").' },
    { name: 'MediaData',                      mandatory: false, check: 'base64_65000_soft', icdRef: R, icdHint: 'Image/video/sound URL or data; preferred length ≤65000 bytes with UDP.' },
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
    'POINT;6A;0013E45956BE;59CE;U;;FFAA327B;1000;FALSE;;;;100;130;0;2;30;;;;;;;Person in water;gfopep---------',
    'POINT;5E;0000661D4410;66A3;R;;;100;FALSE;53.32;8.11;0;;;;120;275;;;;;;;Target Alpha;gffppt---------;;VGFyZ2V0IHBvaW50',
  ],
};
