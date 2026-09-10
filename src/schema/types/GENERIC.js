// ICD §6.12 GENERIC
// GENERIC;<HDR>;<ContentType>;<Encoding>;<Content>
const R = '6.12';
export default {
  name: 'GENERIC',
  icdRef: R,
  description: 'Empty container for any kind of data, defined per use case. If Encoding not set, no encoding assumed.',
  fields: [
    { name: 'ContentType', mandatory: false, check: 'contentType', icdRef: R, icdHint: 'SEDAP=original SEDAP message, ASCII=custom ASCII string, NMEA=NMEA0183 string, XML=XML structure, JSON=JSON formatted, BINARY=self-defined binary array' },
    { name: 'Encoding',    mandatory: false, check: 'encoding',    icdRef: R, icdHint: 'BASE64 / NONE. If Encoding not set, no encoding assumed.' },
    { name: 'Content',     mandatory: false, check: 'text8192',    icdRef: R, icdHint: 'Printable ASCII or BASE64 data, max 8192 bytes.' },
  ],
  rules: [
    {
      kind: 'checkIf', field: 'Content', when: { field: 'Encoding', values: ['BASE64'] }, check: 'base64_8192',
      icdRef: R, icdHint: 'Printable ASCII or BASE64 data, max 8192 bytes.',
    },
  ],
  samples: [
    'GENERIC;5E;0195238E25AD;66A3;R;;;JSON;;{"object": {"x": "1","y": "2"},"string": "Hello World"}',
    'GENERIC;5E;0195238E25AD;66A3;R;TRUE;;BINARY;BASE64;U2FtcGxlIGJpbmFyeSBkYXRhIEdyZWV0aW5ncyA6RA==',
    'GENERIC;5E;0195238E25AD;66A3;R;;;NMEA;NONE;$RATTM,11,11.4,13.6,T,7.0,20.0,T,0.0,0.0,N,,Q,,154125.82,A,*17',
  ],
};
