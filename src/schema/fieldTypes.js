// Reusable check rules. Every check is self-describing:
//   expected : short, concrete description shown to the user
//   test(v)  : v is a non-empty string; returns null when ok,
//              or { level: 'error' | 'warn', message } otherwise
//   options  : (enums only) [{ code, label }] – used by the generator to render a <select>
//
// Empty values never reach a check; mandatory handling lives in core/validate.js.

const err  = message => ({ level: 'error', message });
const warn = message => ({ level: 'warn',  message });

// ISO-8859-1 byte length; -1 when the string contains characters outside that table.
export function byteLength(v) {
  for (let i = 0; i < v.length; i++) if (v.charCodeAt(i) > 0xff) return -1;
  return v.length;
}

const isFloat = v => /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(v);
const num = v => parseFloat(v);

function textCheck(maxBytes, what = 'text') {
  return {
    expected: `${what}, ISO-8859-1, max ${maxBytes} bytes`,
    test: v => {
      const n = byteLength(v);
      if (n < 0) return err('contains characters outside ISO-8859-1 (ASCII) – encode as BASE64');
      if (n > maxBytes) return err(`${n} bytes, max ${maxBytes} bytes allowed`);
      return null;
    },
  };
}

const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
function base64Check(maxBytes, softLimit = false) {
  return {
    expected: `BASE64${maxBytes ? `, max ${maxBytes} bytes` : ''}`,
    test: v => {
      if (!B64_RE.test(v) || v.length % 4 !== 0)
        return err('not a valid BASE64 string (alphabet A-Z a-z 0-9 + /, padding =, length multiple of 4)');
      if (maxBytes && v.length > maxBytes)
        return softLimit ? warn(`${v.length} bytes, preferred length is ≤ ${maxBytes} bytes`)
                         : err(`${v.length} bytes, max ${maxBytes} bytes allowed`);
      return null;
    },
  };
}

function floatCheck(expected = 'floating point number', extra = null) {
  return {
    expected,
    test: v => {
      if (!isFloat(v)) return err(`"${v}" is not a number`);
      return extra ? extra(num(v), v) : null;
    },
  };
}

function rangeCheck(expected, min, max, maxInclusive = true) {
  return floatCheck(expected, n => {
    if (n < min || (maxInclusive ? n > max : n >= max))
      return err(`${n} is outside ${min} … ${max}${maxInclusive ? '' : ' (exclusive)'}`);
    return null;
  });
}

// Two-digit hex codes with a leading zero (project decision: codes are written exactly as in the ICD tables).
function hexEnum(options) {
  const codes = options.map(o => o.code);
  const byCode = new Map(options.map(o => [o.code, o]));
  return {
    options,
    expected: `one of ${codes.join(', ')}`,
    test: v => {
      if (byCode.has(v)) return null;
      const up = v.toUpperCase();
      if (byCode.has(up)) return err(`"${v}" – codes are written in uppercase: ${up}`);
      const padded = up.padStart(2, '0');
      if (v.length === 1 && byCode.has(padded))
        return err(`"${v}" – codes are two-digit hex with leading zero: ${padded}`);
      return err(`"${v}" is not a defined code (expected ${codes.join(', ')})`);
    },
  };
}

function wordEnum(options) {
  const codes = options.map(o => o.code);
  return {
    options,
    expected: `one of ${codes.join(', ')}`,
    test: v => codes.includes(v) ? null
      : codes.includes(v.toUpperCase()) ? err(`"${v}" – must be written as ${v.toUpperCase()}`)
      : err(`"${v}" is not allowed (expected ${codes.join(', ')})`),
  };
}

const opt = (code, label) => ({ code, label });

// Coordinates inside list elements: "<Lat>,<Lon>,<Alt>" – Alt may be omitted (ICD sample 6.7 has 2-part elements).
function coordTriple(el) {
  const p = el.split(',');
  if (p.length < 2 || p.length > 3) return `"${el}" must be Lat,Lon or Lat,Lon,Alt (comma-separated)`;
  const lat = fieldTypes.lat.test(p[0]); if (lat) return `Lat in "${el}": ${lat.message}`;
  const lon = fieldTypes.lon.test(p[1]); if (lon) return `Lon in "${el}": ${lon.message}`;
  if (p.length === 3 && p[2] !== '' && !isFloat(p[2])) return `Alt in "${el}" is not a number`;
  return null;
}

export const MESSAGE_NAMES = [
  'OWNUNIT', 'CONTACT', 'POINT', 'EMISSION', 'METEO', 'TEXT', 'GRAPHIC', 'COMMAND',
  'STATUS', 'ACKNOWLEDGE', 'RESEND', 'GENERIC', 'HEARTBEAT', 'TIMESYNC', 'KEYEXCHANGE',
];

export const fieldTypes = {
  // ── header ──────────────────────────────────────────────────────────────
  hexNumber: {
    expected: 'two-digit uppercase hex string 00–7F',
    test: v => {
      if (!/^[0-9A-Fa-f]{2}$/.test(v)) return err(`"${v}" must be exactly two hex digits (00–7F)`);
      if (parseInt(v, 16) > 0x7f)       return err(`"${v}" exceeds 7F (7-bit counter)`);
      if (v !== v.toUpperCase())        return warn(`"${v}" should be uppercase (${v.toUpperCase()})`);
      return null;
    },
  },
  hexTime: {
    expected: 'hex string of a 64-bit Unix timestamp in ms, no 0x prefix',
    test: v => /^[0-9A-Fa-f]{1,16}$/.test(v) ? null
      : err(`"${v}" is not a hex string of up to 16 digits (no 0x prefix, no decimal)`),
  },
  mac: {
    expected: '8, 32 or 64 hex digits (32/128/256-bit MAC)',
    test: v => /^[0-9A-Fa-f]+$/.test(v) && [8, 32, 64].includes(v.length) ? null
      : err(`"${v}" must be 8, 32 or 64 hex digits`),
  },
  classification: wordEnum([
    opt('P', 'public'), opt('U', 'unclassified'), opt('R', 'restricted'),
    opt('C', 'confidential'), opt('S', 'secret'), opt('T', 'top secret'),
  ]),
  bool: wordEnum([opt('TRUE', 'TRUE'), opt('FALSE', 'FALSE')]),

  // ── text ────────────────────────────────────────────────────────────────
  text:      textCheck(256),
  text32:    textCheck(32),
  text64:    textCheck(64),
  text8192:  textCheck(8192),
  text65000: textCheck(65000),
  messageName: {
    expected: `a SEDAP-Express message name (${MESSAGE_NAMES.join(', ')})`,
    test: v => MESSAGE_NAMES.includes(v) ? null
      : MESSAGE_NAMES.includes(v.toUpperCase()) ? err(`"${v}" – message names are uppercase`)
      : warn(`"${v}" is not a message name defined in the ICD`),
  },

  // ── BASE64 ──────────────────────────────────────────────────────────────
  base64:            base64Check(0),
  base64_64:         base64Check(64),
  base64_8192:       base64Check(8192),
  base64_65000:      base64Check(65000),
  base64_65000_soft: base64Check(65000, true),
  base64List4096: {
    expected: 'list of BASE64 values separated by #, max 4096 bytes in total',
    test: v => {
      if (v.length > 4096) return err(`${v.length} bytes, max 4096 bytes allowed`);
      for (const el of v.split('#')) {
        if (!B64_RE.test(el) || el.length % 4 !== 0) return err(`"${el}" is not a valid BASE64 string`);
      }
      return null;
    },
  },

  // ── numbers ─────────────────────────────────────────────────────────────
  float:   floatCheck(),
  lat:     rangeCheck('decimal degrees, -90 … 90 (positive = N)', -90, 90),
  lon:     rangeCheck('decimal degrees, -180 … 180 (positive = E)', -180, 180),
  angle:   rangeCheck('degrees 0 … 359.999, 0 = geographic north, clockwise', 0, 360, false),
  percent: rangeCheck('0 … 100 %', 0, 100),
  lineWidth: floatCheck('≥ 1', n => n >= 1 ? null : err(`${n} – width must be ≥ 1`)),
  floatList: {
    expected: 'list of numbers separated by #',
    test: v => {
      for (const el of v.split('#')) if (!isFloat(el)) return err(`"${el}" is not a number`);
      return null;
    },
  },

  // ── identifiers ─────────────────────────────────────────────────────────
  rgba: {
    expected: 'RGBA web notation, 8 hex digits (e.g. 800000FF)',
    test: v => /^[0-9A-Fa-f]{8}$/.test(v) ? null : err(`"${v}" must be 8 hex digits RRGGBBAA`),
  },
  hex16: {
    expected: '16-bit hex string (4 hex digits)',
    test: v => /^[0-9A-Fa-f]{4}$/.test(v) ? null : err(`"${v}" must be 4 hex digits`),
  },
  sidc: {
    expected: 'SIDC, 15 characters',
    test: v => v.length === 15 ? null : err(`"${v}" has ${v.length} characters, SIDC is 15 characters`),
  },
  sidcS: {
    expected: 'SIDC, 15 characters, starts with "s" or "S"',
    test: v => {
      if (v.length !== 15) return err(`"${v}" has ${v.length} characters, SIDC is 15 characters`);
      if (!/^[sS]/.test(v)) return err(`"${v}" must start with "s" (contact symbol)`);
      return null;
    },
  },
  sidcG: {
    expected: 'SIDC, 15 characters, starts with "g" or "G"',
    test: v => {
      if (v.length !== 15) return err(`"${v}" has ${v.length} characters, SIDC is 15 characters`);
      if (!/^[gG]/.test(v)) return err(`"${v}" must start with "g" (point/graphic symbol)`);
      return null;
    },
  },
  sourceChars: {
    expected: 'one or more of R A I S E O Y M',
    test: v => {
      const bad = [...v].filter(c => !'RAISEOYM'.includes(c));
      if (bad.length) return err(`"${bad.join('')}" not allowed (R=Radar, A=AIS, I=IFF/ADS-B, S=Sonar, E=EW, O=Optical, Y=Synthetic, M=Manual)`);
      return null;
    },
  },
  mmsi: {
    expected: '9 digits',
    test: v => /^\d{9}$/.test(v) ? null : err(`"${v}" must be exactly 9 digits`),
  },
  icao24: {
    expected: '24-bit ICAO address, 6 hex digits',
    test: v => /^[0-9A-Fa-f]{6}$/.test(v) ? null : err(`"${v}" must be 6 hex digits (24-bit address)`),
  },

  // ── lists ───────────────────────────────────────────────────────────────
  coordList: {
    expected: 'list "<Lat>,<Lon>,<Alt>#<Lat>,<Lon>,<Alt>#…" (elements separated by #, coordinates by ,)',
    test: v => {
      for (const el of v.split('#')) { const m = coordTriple(el); if (m) return err(m); }
      return null;
    },
  },
  coord: {
    expected: '"<Lat>,<Lon>,<Alt>" (comma-separated)',
    test: v => { const m = coordTriple(v); return m ? err(m) : null; },
  },
  levelList: {
    expected: '"<name>#<level>#<name>#<level>…" with level in %',
    test: v => {
      const p = v.split('#');
      if (p.length % 2 !== 0) return err(`"${v}" must alternate name#level (even number of elements)`);
      for (let i = 1; i < p.length; i += 2) {
        if (!isFloat(p[i])) return err(`level "${p[i]}" is not a number`);
        if (num(p[i]) < 0 || num(p[i]) > 100) return err(`level ${p[i]} is outside 0 … 100 %`);
      }
      return null;
    },
  },

  // ── enums ───────────────────────────────────────────────────────────────
  encoding:    wordEnum([opt('BASE64', 'BASE64'), opt('NONE', 'NONE')]),
  onOff:       wordEnum([opt('ON', 'ON'), opt('OFF', 'OFF')]),
  cameraMode:  wordEnum([opt('DayLight', 'DayLight'), opt('InfraRed', 'InfraRed'), opt('LightIntensifier', 'LightIntensifier')]),
  contentType: wordEnum([
    opt('SEDAP', 'original SEDAP message'), opt('ASCII', 'custom ASCII string'), opt('NMEA', 'NMEA0183 string'),
    opt('XML', 'XML structure'), opt('JSON', 'JSON formatted'), opt('BINARY', 'self-defined binary array'),
  ]),
  textType: hexEnum([
    opt('00', 'Undefined'), opt('01', 'Alert'), opt('02', 'Warning'), opt('03', 'Notice'), opt('04', 'Chat'),
  ]),
  freqAgility: hexEnum([
    opt('00', 'Stable Fixed'), opt('01', 'Agile'), opt('02', 'Periodic'), opt('03', 'Hopper'),
    opt('04', 'Batch Hopper'), opt('05', 'Unknown'),
  ]),
  prfAgility: hexEnum([
    opt('00', 'Fixed periodic'), opt('01', 'Staggered'), opt('02', 'Jittered'), opt('03', 'Wobbulated'),
    opt('04', 'Sliding'), opt('05', 'Dwell switch'), opt('06', 'Unknown PRF'), opt('07', 'CW'),
  ]),
  emissionFunction: hexEnum([
    opt('00', 'Unknown'), opt('01', 'ESM Beacon/Transponder'), opt('02', 'ESM Navigation'),
    opt('03', 'ESM Voice Communication'), opt('04', 'ESM Data Communication'), opt('05', 'ESM Radar'),
    opt('06', 'ESM IFF/ADS-B'), opt('07', 'ESM Guidance'), opt('08', 'ESM Weapon'), opt('09', 'ESM Jammer'),
    opt('0A', 'ESM Natural'), opt('0B', 'ACOUSTIC Object'), opt('0C', 'ACOUSTIC Submarine'),
    opt('0D', 'ACOUSTIC Variable Depth Sonar'), opt('0E', 'ACOUSTIC Array Sonar'), opt('0F', 'ACOUSTIC Active Sonar'),
    opt('10', 'ACOUSTIC Torpedo Sonar'), opt('11', 'ACOUSTIC Sono Buoy'), opt('12', 'ACOUSTIC Decoy Signal'),
    opt('13', 'ACOUSTIC Hit Noise'), opt('14', 'ACOUSTIC Propeller Noise'), opt('15', 'ACOUSTIC Underwater Telephone'),
    opt('16', 'ACOUSTIC Communication'), opt('17', 'ACOUSTIC Noise'), opt('18', 'LASER Range Finder'),
    opt('19', 'LASER Designator'), opt('1A', 'LASER Beam Rider'), opt('1B', 'LASER Dazzler'), opt('1C', 'LASER Lidar'),
    opt('1D', 'LASER Weapon'), opt('1E', 'VISUAL Object'),
  ]),
  graphicType: hexEnum([
    opt('00', 'Point'), opt('01', 'Path'), opt('02', 'Polygon'), opt('03', 'Rectangle'), opt('04', 'Square'),
    opt('05', 'Circle'), opt('06', 'Ellipse'), opt('07', 'Block'), opt('08', 'Sphere'), opt('09', 'Ellipsoid'),
    opt('0A', 'SensorFieldOfView'), opt('0B', 'WeaponFieldOfFire'),
  ]),
  cmdFlag: hexEnum([
    opt('00', 'Add'), opt('01', 'Replace (last)'), opt('02', 'Cancel (last)'),
    opt('03', 'Cancel all (same as 02 if not a command sequence)'),
  ]),
  cmdType: hexEnum([
    opt('00', 'Power off'), opt('01', 'Restart'), opt('02', 'Standby'), opt('03', 'Sync time'),
    opt('04', 'Calibrate gyro'), opt('05', 'Calibrate compass'), opt('06', 'Send status'),
    opt('07', 'Set manual mode'), opt('08', 'Set semi-autonomous mode'), opt('09', 'Set autonomous mode'),
    opt('0A', 'Set failsafe mode'), opt('10', 'Start engine'), opt('11', 'Test engine'),
    opt('12', 'Set engine power'), opt('13', 'Stop engine'), opt('14', 'Stop movement'),
    opt('15', 'Toggle lights'), opt('16', 'Deploy parachute'), opt('20', 'Set heading'),
    opt('21', 'Set altitude'), opt('22', 'Set speed'), opt('23', 'Rotate'), opt('24', 'Move to'),
    opt('25', 'Follow contact'), opt('26', 'Return home'), opt('27', 'Set home location'),
    opt('28', 'Take off'), opt('29', 'Land'), opt('2A', 'Submerge'), opt('2B', 'Surface'), opt('2C', 'Dock'),
    opt('30', 'Loiter/Orbiting'), opt('31', 'Scan'), opt('32', 'Scan area'), opt('33', 'Take photo'),
    opt('34', 'Record video'), opt('35', 'Stream video'), opt('36', 'Set camera parameters'),
    opt('37', 'Set orientation of camera'), opt('40', 'Actuator check'),
    opt('41', 'Set orientation of actuator'), opt('42', 'Actuator pick up object'),
    opt('43', 'Actuator release object'), opt('50', 'Pre-arm check'), opt('51', 'Arm'), opt('52', 'Disarm'),
    opt('53', 'Set orientation of weapon'), opt('54', 'StartEngagement'), opt('55', 'HoldEngagement'),
    opt('56', 'StopEngagement'), opt('EE', 'Sanitize system'), opt('EF', 'Self destruction'),
    opt('FF', 'Generic Action'),
  ]),
  tecStatus: wordEnum([
    opt('0', 'Off/Absent'), opt('1', 'Initializing'), opt('2', 'Degraded'), opt('3', 'Operational'), opt('4', 'Fault'),
  ]),
  opsStatus: wordEnum([
    opt('0', 'Not operational'), opt('1', 'Degraded'), opt('2', 'Operational'),
    opt('3', 'Operational (semi-autonomous)'), opt('4', 'Operational (autonomous)'),
  ]),
  cmdState: hexEnum([
    opt('00', 'Undefined'), opt('01', 'Executed successfully'), opt('02', 'Partially successfully executed'),
    opt('03', 'Not successfully executed'), opt('04', 'Execution not possible (yet)'),
    opt('05', 'Will be executed at ;<timestamp>'),
  ]),
};

export function getCheck(key) {
  const c = fieldTypes[key];
  if (!c) throw new Error(`Unknown field check "${key}" – add it to src/schema/fieldTypes.js`);
  return c;
}
