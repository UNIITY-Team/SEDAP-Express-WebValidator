// ICD §6.13 HEARTBEAT
// HEARTBEAT;<HDR>;<Recipient>
const R = '6.13';
export default {
  name: 'HEARTBEAT',
  icdRef: R,
  description: 'Connection check, primarily important for UDP/serial. Send ≤1 Hz (faster only if needed).',
  fields: [
    { name: 'Recipient', mandatory: false, check: 'text', icdRef: R, icdHint: 'Recipient optional: single recipient, list, or empty = all recipients in the network/serial net. ASCII, free textual identifier (§5).' },
  ],
  rules: [
    {
      kind: 'forbidden', field: 'Acknowledgement', values: ['TRUE'],
      icdRef: R, icdHint: 'Acknowledgement flag is always empty/FALSE (an acknowledgement cannot be requested for heartbeats).',
    },
  ],
  samples: [
    'HEARTBEAT;42;0195238E25AD;89AD;U;;;ORKA',
    'HEARTBEAT;43;;1022',
    'HEARTBEAT;43;',
    'HEARTBEAT',
  ],
};
