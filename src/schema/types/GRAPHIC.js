// ICD §6.7 GRAPHIC
// GRAPHIC;<HDR>;<GraphicID>(M);<DeleteFlag>;
// <GraphicType>(M);<LineWidth>;<LineColor>;<FillColor>;<TextColor>;<Encoding>;<Annotation>;<GraphicType-dependent params>*
//
// The type-dependent parameters are positional in the ICD and carry no field names apart from the
// placeholders in the table. The labels used here are those placeholders; unnamed list parameters are
// labelled "Coordinates" (list) and "Position" (single Lat,Lon,Alt element) for display only.
const R = '6.7';
const F = 'Numeric values are floating point unless defined otherwise.';
const LIST = 'In list fields (#, e.g. Path), the coordinates within one list element are separated by , — not ;.';
const f = (name, check, unit, icdHint = F) => ({ name, unit, mandatory: false, check, icdRef: R, icdHint });

export default {
  name: 'GRAPHIC',
  icdRef: R,
  description: 'Graphical plans: polygons, squares, routes; also camera field of view, sensor/weapon direction, weapon range area.',
  fields: [
    { name: 'GraphicID',   mandatory: true,  check: 'text',        icdRef: R, icdHint: 'ASCII, unique id (enables updates of an existing graphic).' },
    { name: 'DeleteFlag',  mandatory: false, check: 'bool',        icdRef: R, icdHint: 'TRUE=remove, FALSE=current.' },
    { name: 'GraphicType', mandatory: true,  check: 'graphicType', icdRef: R, icdHint: '00=Point, 01=Path, 02=Polygon, 03=Rectangle, 04=Square, 05=Circle, 06=Ellipse, 07=Block, 08=Sphere, 09=Ellipsoid, 0A=SensorFieldOfView, 0B=WeaponFieldOfFire' },
    { name: 'LineWidth',   mandatory: false, check: 'lineWidth',   icdRef: R, icdHint: '≥1, width of line or point.' },
    { name: 'LineColor',   mandatory: false, check: 'rgba',        icdRef: R, icdHint: 'RGBA web notation (e.g. 800000FF darker red).' },
    { name: 'FillColor',   mandatory: false, check: 'rgba',        icdRef: R, icdHint: 'RGBA (e.g. 00FF0080 translucent green).' },
    { name: 'TextColor',   mandatory: false, check: 'rgba',        icdRef: R, icdHint: 'RGBA (e.g. 32CD32FF lime).' },
    { name: 'Encoding',    mandatory: false, check: 'encoding',    icdRef: R, icdHint: 'BASE64 / NONE (for Annotation).' },
    { name: 'Annotation',  mandatory: false, check: 'text32',      icdRef: R, icdHint: 'ASCII, max 32 bytes.' },
  ],
  variants: {
    discriminator: 'GraphicType',
    icdRef: R,
    options: {
      '00': { label: 'Point',     fields: [f('Lat', 'lat', '°'), f('Lon', 'lon', '°'), f('Alt', 'float', 'm')] },
      '01': { label: 'Path',      fields: [{ name: 'Coordinates', list: true, mandatory: false, check: 'coordList', icdRef: R, icdHint: '<Lat>[°],<Lon>[°],<Alt>[m]# … ' + LIST }] },
      '02': { label: 'Polygon',   fields: [{ name: 'Coordinates', list: true, mandatory: false, check: 'coordList', icdRef: R, icdHint: '<Lat>[°],<Lon>[°],<Alt>[m]# … ' + LIST }] },
      '03': { label: 'Rectangle', fields: [
        { name: 'Position', mandatory: false, check: 'coord', icdRef: R, icdHint: '<Lat>[°],<Lon>[°],<Alt>[m];<Width>[m];<Length>[m];<Rotation>[°] — the first parameter is one Lat,Lon,Alt element separated by ,' },
        f('Width', 'float', 'm'), f('Length', 'float', 'm'), f('Rotation', 'float', '°'),
      ] },
      '04': { label: 'Square',    fields: [f('Lat', 'lat', '°'), f('Lon', 'lon', '°'), f('Alt', 'float', 'm'), f('Width', 'float', 'm'), f('Rotation', 'float', '°')] },
      '05': { label: 'Circle',    fields: [f('CenterLat', 'lat', '°'), f('CenterLon', 'lon', '°'), f('CenterAlt', 'float', 'm'), f('Radius', 'float', 'm'), f('StartAngle', 'float', '°'), f('EndAngle', 'float', '°')] },
      '06': { label: 'Ellipse',   fields: [f('CenterLat', 'lat', '°'), f('CenterLon', 'lon', '°'), f('CenterAlt', 'float', 'm'), f('RadiusX', 'float', 'm'), f('RadiusY', 'float', 'm'), f('Rotation', 'float', '°')] },
      '07': { label: 'Block',     fields: [f('Lat', 'lat', '°'), f('Lon', 'lon', '°'), f('Alt', 'float', 'm'), f('Width', 'float', 'm'), f('Length', 'float', 'm'), f('Height', 'float', 'm'), f('RotX', 'float', '°'), f('RotY', 'float', '°'), f('RotZ', 'float', '°')] },
      '08': { label: 'Sphere',    fields: [f('Lat', 'lat', '°'), f('Lon', 'lon', '°'), f('Alt', 'float', 'm'), f('Radius', 'float', 'm')] },
      '09': { label: 'Ellipsoid', fields: [f('CenterLat', 'lat', '°'), f('CenterLon', 'lon', '°'), f('CenterAlt', 'float', 'm'), f('RadiusX', 'float', 'm'), f('RadiusY', 'float', 'm'), f('RadiusZ', 'float', 'm'), f('RotX', 'float', '°'), f('RotY', 'float', '°'), f('RotZ', 'float', '°')] },
      '0A': { label: 'SensorFieldOfView', fields: [f('Azimuth', 'angle', '°', 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.'), f('Elevation', 'float', '°'), { name: 'Coordinates', list: true, mandatory: false, check: 'coordList', icdRef: R, icdHint: '<Lat>[°],<Lon>[°],<Alt>[m]# … ' + LIST }] },
      '0B': { label: 'WeaponFieldOfFire', fields: [f('Azimuth', 'angle', '°', 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.'), f('Elevation', 'float', '°'), { name: 'Coordinates', list: true, mandatory: false, check: 'coordList', icdRef: R, icdHint: '<Lat>[°],<Lon>[°],<Alt>[m]# … ' + LIST }] },
    },
  },
  rules: [
    {
      kind: 'checkIf', field: 'Annotation', when: { field: 'Encoding', values: ['BASE64'] }, check: 'base64',
      icdRef: R, icdHint: 'Encoding: BASE64 / NONE (for Annotation).',
    },
  ],
  samples: [
    'GRAPHIC;79;0195238E35AD;910E;U;;;FFDA;;08;1;FF800000;;;BASE64;QXJlYSBBbHBoYQ==;53.43;9.45;0;1000',
    'GRAPHIC;78;0195238E45AD;910E;U;;;A327;;01;1;80808000;;FFFF0000;;Transit;54.23,12.86#54.30,12.9#54.55,13.30',
    'GRAPHIC;79;0191C643A8AF;910E;U;;;AreaA;;08;1;FF8000FF;;;;Area A;53.43;9.45;0;10000',
  ],
};
