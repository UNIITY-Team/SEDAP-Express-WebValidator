// Common message header (ICD §5). Applies to every message type.
//   <Name>(M);<Number>;<Time>;<Sender>;<Classification>;<Acknowledgement>;<MAC>;<Content>

export const NAME_FIELD = {
  name: 'Name',
  role: 'messageName',
  mandatory: true,
  check: 'messageName',
  icdRef: '5',
  icdHint: 'Message purpose/topic. Mandatory fields marked (M) (message name always mandatory).',
};

export const HEADER_FIELDS = [
  {
    name: 'Number', mandatory: false, check: 'hexNumber', icdRef: '5',
    icdHint: 'A two-digit uppercase hexadecimal string (00-7F) represents a 7-bit sequential counter (wraps to 0 after 127/0x7F). Each message TYPE has its own counter; reconnect does NOT reset counters.',
  },
  {
    name: 'Time', mandatory: false, check: 'hexTime', icdRef: '5',
    icdHint: 'Hex string of 64-bit Unix timestamp in ms. All timestamps: 64-bit integer, UNIX epoch in milliseconds, written as hex string without 0x prefix.',
  },
  {
    name: 'Sender', mandatory: false, check: 'text', icdRef: '5',
    icdHint: 'Free textual identifier (e.g. "OKRA"). Never changed on forward/relay. Chosen by participants or assigned centrally. When forwarding sub-system info (e.g. drones in a swarm), Sender = original source (the sub-system).',
  },
  {
    name: 'Classification', mandatory: false, check: 'classification', icdRef: '5',
    icdHint: 'P=public, U=unclassified, R=restricted, C=confidential, S=secret, T=top secret',
  },
  {
    name: 'Acknowledgement', mandatory: false, check: 'bool', icdRef: '5',
    icdHint: 'TRUE=request acknowledgement; FALSE/empty=none. Acknowledgement requires a set message Number.',
  },
  {
    name: 'MAC', mandatory: false, check: 'mac', icdRef: '5',
    icdHint: '32/128/256-bit message authentication code (see §3.1). MAC may be truncated to first 4 bytes / 32 bits.',
  },
];

export const HEADER_RULES = [
  {
    kind: 'requires', field: 'Acknowledgement', whenValues: ['TRUE'], requires: 'Number',
    icdRef: '5', icdHint: 'Acknowledgement requires a set message Number.',
  },
];
