// ICD §6.6 TEXT
// TEXT;<HDR>;<Recipient>;<Type>;<Encoding>;<Text>(M);<Reference>
const R = '6.6';
export default {
  name: 'TEXT',
  icdRef: R,
  description: 'Human-readable text (alert or chat). If the recipient field is left empty, this means everyone (as with a broadcast).',
  fields: [
    { name: 'Recipient', mandatory: false, check: 'text',      icdRef: R, icdHint: 'ASCII, free textual identifier (like Sender, §5). If the recipient field is left empty, this means everyone (as with a broadcast).' },
    { name: 'Type',      mandatory: false, check: 'textType',  icdRef: R, icdHint: '00=Undefined, 01=Alert, 02=Warning, 03=Notice, 04=Chat' },
    { name: 'Encoding',  mandatory: false, check: 'encoding',  icdRef: R, icdHint: 'BASE64 / NONE. If text may contain special characters (UTF-x, 0x0A, 0x23, …) it must be BASE64-encoded with Encoding indicator set; if indicator not set, no encoding is assumed.' },
    { name: 'Text',      mandatory: true,  check: 'text65000', icdRef: R, icdHint: 'ASCII, max 65000 bytes.' },
    { name: 'Reference', mandatory: false, check: 'text',      icdRef: R, icdHint: 'ASCII, reference to a contact, point or emission. If linked to a contact, send the CONTACT message first.' },
  ],
  rules: [
    {
      kind: 'checkIf', field: 'Text', when: { field: 'Encoding', values: ['BASE64'] }, check: 'base64_65000',
      icdRef: R, icdHint: 'If text may contain special characters (UTF-x, 0x0A, 0x23, …) it must be BASE64-encoded with Encoding indicator set.',
    },
  ],
  samples: [
    'TEXT;78;0195238E25AD;324E;S;TRUE;;;1;NONE;"This is an alert!";1000',
    'TEXT;79;0195238E25CC;324E;C;TRUE;;;2;NONE;"This is a warning!"',
    'TEXT;7A;0195238E25EF;324E;R;;;;3;;"This is a notice!"',
    'TEXT;7B;0195238E285B;324E;U;;;ORKA;4;BASE64;IlRoaXMgaXMgYSBjaGF0IG1lc3NhZ2UhIg==',
    'TEXT;56;0191C643A8AF;324E;S;;;E4F1;4;NONE;This is a chat message!',
  ],
};
