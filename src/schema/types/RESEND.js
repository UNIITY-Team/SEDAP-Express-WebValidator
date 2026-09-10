// ICD §6.11 RESEND
// RESEND;<HDR>;<Recipient>(M);<NameOfMissingMessage>(M);<NumberOfMissingMessage>(M)
const R = '6.11';
export default {
  name: 'RESEND',
  icdRef: R,
  description: 'Request missing messages (recognized by header message number, sender ID and message name).',
  fields: [
    { name: 'Recipient',              mandatory: true, check: 'text',        icdRef: R, icdHint: 'ASCII, free textual identifier (§5).' },
    { name: 'NameOfMissingMessage',   mandatory: true, check: 'messageName', icdRef: R, icdHint: 'ASCII, name of the message to resend.' },
    { name: 'NumberOfMissingMessage', mandatory: true, check: 'hexNumber',   icdRef: R, icdHint: 'HexString of the 7-bit number of the message to resend.' },
  ],
  rules: [],
  samples: [
    'RESEND;20;0195238E25AD;129E;R;;;FE2A;TEXT;5D',
  ],
};
