// ICD §6.10 ACKNOWLEDGE
// ACKNOWLEDGE;<Number>;<Time>;<Sender>;<Classification>;;<MAC>;
// <Recipient>(M);<TypeOfMessage>(M);<NumberOfMessage>(M)
const R = '6.10';
export default {
  name: 'ACKNOWLEDGE',
  icdRef: R,
  description: 'Sent when a client or the SEC requested an acknowledgement of a packet. Its own Acknowledgement flag is fixed FALSE.',
  fields: [
    { name: 'Recipient',       mandatory: true, check: 'text',        icdRef: R, icdHint: 'ASCII, free textual identifier (§5).' },
    { name: 'TypeOfMessage',   mandatory: true, check: 'messageName', icdRef: R, icdHint: 'ASCII, type of the message to acknowledge (e.g. CONTACT, RESEND, …).' },
    { name: 'NumberOfMessage', mandatory: true, check: 'hexNumber',   icdRef: R, icdHint: 'HexString of the 7-bit number of the message to acknowledge.' },
  ],
  rules: [
    {
      kind: 'forbidden', field: 'Acknowledgement', values: ['TRUE'],
      icdRef: R, icdHint: 'Its own Acknowledgement flag is fixed FALSE.',
    },
  ],
  samples: [
    'ACKNOWLEDGE;18;0195238E25AD;129E;R;;;LASSY;COMMAND;2B',
  ],
};
