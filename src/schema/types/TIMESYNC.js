// ICD §6.14 TIMESYNC
// TIMESYNC;<HDR>;<Timestamp>
const R = '6.14';
export default {
  name: 'TIMESYNC',
  icdRef: R,
  description: 'Time synchronization when OS functions/NTP are unavailable. On receipt, the recipient answers with its current system time as timestamp.',
  fields: [
    { name: 'Timestamp', mandatory: false, check: 'hexTime', icdRef: R, icdHint: 'HexString, 64-bit Unix timestamp in ms.' },
  ],
  rules: [],
  samples: [
    'TIMESYNC;42;0191C643A8AF;89AD;U',
    'TIMESYNC;12;;FE2A;U;;;0191C643A8AF',
  ],
};
