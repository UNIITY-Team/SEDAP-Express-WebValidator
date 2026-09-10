// ICD §6.8 COMMAND
// COMMAND;<HDR>;
// <Recipient>(M);<CmdID>;<CmdFlag>(M);<CmdExTime>;<CmdType>(M);<CmdType-dependent params>*
//
// Parameter labels are the placeholders from the CmdType table. Unnamed placeholders are labelled
// for display only: "<ON|OFF>" → OnOff, "<ContactID|PointID|EmissionID|GraphicID>" → TargetID,
// "<IP/Hostname of NTP server>" → NTPServer.
const R = '6.8';
const F = 'Numeric values are floating point unless defined otherwise.';
const TS = 'Timestamps optional, in ms; no timestamp = execute instantly; Unix timestamps written as hex string.';
const f = (name, check, unit, icdHint = F) => ({ name, unit, mandatory: false, check, icdRef: R, icdHint });
const lat = () => f('Lat', 'lat', '°', 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.');
const lon = () => f('Lon', 'lon', '°', 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.');
const alt = () => f('Alt', 'float', 'm', 'Altitude = above sea level; 0 = exactly on ground (on land).');
const dir = () => f('Direction', 'angle', '°', 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.');
const az  = () => f('Azimuth', 'angle', '°', 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.');
const el  = () => f('Elevation', 'float', '°');
const id  = (name, hint) => f(name, 'text', undefined, hint || 'Camera numbering/modes and Generic Action semantics are application/platform-specific.');
const target = () => ({ name: 'TargetID', mandatory: true, check: 'text', icdRef: R, icdHint: '<ContactID|PointID|EmissionID|GraphicID>(M). For "follow"/"engage" of e.g. a contact, the contact\'s position must be transmitted frequently via CONTACT.' });
const v = (label, fields = []) => ({ label, fields });

export default {
  name: 'COMMAND',
  icdRef: R,
  description: 'Command for one specific or all possible recipients.',
  fields: [
    { name: 'Recipient', mandatory: true,          check: 'text',    icdRef: R, icdHint: 'ASCII, free textual identifier (§5).' },
    { name: 'CmdID',     mandatory: false,         check: 'hex16',   icdRef: R, icdHint: 'HexString, 16-bit command id (0000 = all last commands).' },
    { name: 'CmdFlag',   mandatory: true,          check: 'cmdFlag', icdRef: R, icdHint: '00=Add, 01=Replace (last), 02=Cancel (last), 03=Cancel all (same as 02 if not a command sequence)' },
    { name: 'CmdExTime', mandatory: false,         check: 'hexTime', icdRef: R, icdHint: 'Long, Unix timestamp when command shall be executed. ' + TS },
    { name: 'CmdType',   mandatory: 'conditional', condition: 'cmdType', check: 'cmdType', icdRef: R, icdHint: 'CmdType code from the table in §6.8 (00=Power off … FF=Generic Action). Mandatory unless all commands are cancelled (CmdFlag 03).' },
  ],
  variants: {
    discriminator: 'CmdType',
    icdRef: R,
    options: {
      '00': v('Power off', [f('PowerOnUnixTimestamp', 'hexTime', undefined, '<PowerOnUnixTimestamp> (optional). ' + TS)]),
      '01': v('Restart'),
      '02': v('Standby', [f('WakeupUnixTimestamp', 'hexTime', undefined, '<WakeupUnixTimestamp> (optional). ' + TS)]),
      '03': v('Sync time', [f('NTPServer', 'text', undefined, '<IP/Hostname of NTP server>')]),
      '04': v('Calibrate gyro'),
      '05': v('Calibrate compass'),
      '06': v('Send status'),
      '07': v('Set manual mode'),
      '08': v('Set semi-autonomous mode'),
      '09': v('Set autonomous mode'),
      '0A': v('Set failsafe mode'),
      '10': v('Start engine'),
      '11': v('Test engine'),
      '12': v('Set engine power', [f('PowerLevel', 'percent', '0-100%')]),
      '13': v('Stop engine'),
      '14': v('Stop movement'),
      '15': v('Toggle lights', [f('Status', 'onOff', 'ON|OFF'), f('BrightnessLevel', 'percent', '0-100%'), f('StrobePeriod', 'float', 's')]),
      '16': v('Deploy parachute'),
      '20': v('Set heading', [f('HeadingAngle', 'angle', '°', 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.')]),
      '21': v('Set altitude', [f('Altitude', 'float', 'm', 'Altitude = above sea level; 0 = exactly on ground (on land).')]),
      '22': v('Set speed', [f('Speed', 'float', 'm/s')]),
      '23': v('Rotate', [f('HeadingAngle', 'angle', '°', 'Course/heading: 0–359.999°, 0° = geographic north, clockwise.'), f('RollAngle', 'float', '°'), f('PitchAngle', 'float', '°')]),
      '24': v('Move to', [lat(), lon(), alt(), f('Tolerance', 'float', 'm'), f('UnixTimestamp', 'hexTime', undefined, TS)]),
      '25': v('Follow contact', [f('ContactID', 'text', undefined, 'For "follow"/"engage" of e.g. a contact, the contact\'s position must be transmitted frequently via CONTACT.')]),
      '26': v('Return home', [f('Tolerance', 'float', 'm'), f('UnixTimestamp', 'hexTime', undefined, TS)]),
      '27': v('Set home location', [lat(), lon(), alt(), f('Tolerance', 'float', 'm')]),
      '28': v('Take off', [lat(), lon(), dir()]),
      '29': v('Land', [lat(), lon(), dir()]),
      '2A': v('Submerge', [f('Depth', 'float', 'm', 'For submersibles, Depth ≡ Altitude and is always positive.')]),
      '2B': v('Surface'),
      '2C': v('Dock', [lat(), lon(), dir()]),
      '30': v('Loiter/Orbiting', [f('CenterLat', 'lat', '°', 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.'), f('CenterLon', 'lon', '°', 'Lat/Lon in decimal degrees; positive = N/E, negative = S/W.'), alt(), f('Radius', 'float', 'm')]),
      '31': v('Scan', [lat(), lon(), alt()]),
      '32': v('Scan area', [f('Lat1', 'lat', '°'), f('Lon1', 'lon', '°'), f('Lat2', 'lat', '°'), f('Lon2', 'lon', '°'), alt(), f('RotationAngle', 'float', '°')]),
      '33': v('Take photo', [id('CameraID')]),
      '34': v('Record video', [id('CameraID'), f('OnOff', 'onOff', 'ON|OFF'), f('Duration', 'float')]),
      '35': v('Stream video', [id('CameraID'), f('OnOff', 'onOff', 'ON|OFF')]),
      '36': v('Set camera parameters', [id('CameraID'), f('Zoom', 'percent', '0-100%'), f('Mode', 'cameraMode', 'DayLight|InfraRed|LightIntensifier')]),
      '37': v('Set orientation of camera', [id('CameraID'), az(), el()]),
      '40': v('Actuator check', [id('ActuatorID')]),
      '41': v('Set orientation of actuator', [id('ActuatorID'), az(), el()]),
      '42': v('Actuator pick up object', [id('ActuatorID')]),
      '43': v('Actuator release object', [id('ActuatorID')]),
      '50': v('Pre-arm check', [id('WeaponID')]),
      '51': v('Arm', [id('WeaponID')]),
      '52': v('Disarm', [id('WeaponID')]),
      '53': v('Set orientation of weapon', [id('WeaponID'), az(), el()]),
      '54': v('StartEngagement', [id('WeaponID'), target()]),
      '55': v('HoldEngagement', [id('WeaponID'), target()]),
      '56': v('StopEngagement', [id('WeaponID'), target()]),
      'EE': v('Sanitize system'),
      'EF': v('Self destruction'),
      'FF': v('Generic Action', [f('KindOfAction', 'text', 'String', '<KindOfAction>[String] — must be defined individually, incl. a custom UNIITY connector.')]),
    },
  },
  rules: [
    {
      kind: 'mandatoryUnless', name: 'cmdType', field: 'CmdType', unless: { field: 'CmdFlag', values: ['03'] },
      icdRef: R, icdHint: 'CmdType(M). CmdFlag 03=Cancel all (same as 02 if not a command sequence).',
    },
  ],
  samples: [
    'COMMAND;55;0195238E25AD;5BCD;S;TRUE;;ORKA;1111;01;;24;53.32;8.11;1000;5',
    'COMMAND;29;0195238E35AD;E4B3;C;TRUE;;Drone1;;00;;FF;OPEN_BAY',
    'COMMAND;29;0195238F55AD;E4B3;C;TRUE;;Drone2;0000;03',
    'COMMAND;29;0195238E25AD;E4B3;C;TRUE;;ORKA;0331;00;;24;53.5143;8.1574;50;5',
    'COMMAND;2C;0195238E25AD;E4B3;C;TRUE;;ORKA;0331;00;;24;53.4397;8.2262;50;5;019D25300FC0',
    'COMMAND;2C;0195238E25AD;E4B3;C;TRUE;;ORKA;0331;01;019D75300FFF;34;CAM1;ON;3600',
    'COMMAND;2E;0195238E25AD;E4B3;C;TRUE;;ORKA;0331;00;;30;53.4397;8.2262;1000;200',
  ],
};
