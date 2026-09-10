// ICD §6.9 STATUS
// STATUS;<HDR>;<TecStatus>;<OpsStatus>;<AmmunitionLevels>*;
// <FuelLevels>*;<BatteryLevels>*;<StorageLevels>*;<CmdID>;<CmdState>;<IP/Host>;<Media>*;<Text>
const R = '6.9';
export default {
  name: 'STATUS',
  icdRef: R,
  description: 'Status variables (e.g. remaining battery) and optionally execution status of the last or a specific COMMAND.',
  fields: [
    { name: 'TecStatus',                   mandatory: false, check: 'tecStatus', icdRef: R, icdHint: '0=Off/Absent, 1=Initializing, 2=Degraded, 3=Operational, 4=Fault' },
    { name: 'OpsStatus',                   mandatory: false, check: 'opsStatus', icdRef: R, icdHint: '0=Not operational, 1=Degraded, 2=Operational, 3=Operational (semi-autonomous), 4=Operational (autonomous)' },
    { name: 'AmmunitionLevels', list: true, mandatory: false, check: 'levelList', icdRef: R, icdHint: 'String#% list: <weaponName>#<level>#… (relative remaining ammunition)' },
    { name: 'FuelLevels',       list: true, mandatory: false, check: 'levelList', icdRef: R, icdHint: 'String#% list: <tankName>#<level>#…' },
    { name: 'BatteryLevels',    list: true, mandatory: false, check: 'levelList', icdRef: R, icdHint: 'String#% list: <batteryName>#<level>#…' },
    { name: 'StorageLevels',    list: true, mandatory: false, check: 'levelList', icdRef: R, icdHint: 'String#% list: <storageName>#<level>. StorageLevel can mean recording memory or physical storage room.' },
    { name: 'CmdID',                       mandatory: false, check: 'hex16',     icdRef: R, icdHint: 'HexString, id from the related COMMAND message.' },
    { name: 'CmdState',                    mandatory: false, check: 'cmdState',  icdRef: R, icdHint: '00=Undefined, 01=Executed successfully, 02=Partially successfully executed, 03=Not successfully executed, 04=Execution not possible (yet), 05=Will be executed at ;<timestamp>' },
    { name: 'IP/Host',                     mandatory: false, check: 'base64_64', icdRef: R, icdHint: 'BASE64, IP or hostname of the platform, max 64 bytes.' },
    { name: 'Media',            list: true, mandatory: false, check: 'base64List4096', icdRef: R, icdHint: 'BASE64, list of video stream/image URLs, max 4096 bytes.' },
    { name: 'Text',                        mandatory: false, check: 'base64',    icdRef: R, icdHint: 'BASE64, human-readable status description.' },
  ],
  rules: [],
  samples: [
    'STATUS;15;0195238E25AD;75DA;U;;;4;2;MLG#20;;Accu1#50;;443D;01;MTAuMC4wLjEzMg==;;RnVsbHkgb3BlcmF0aW9uYWw=',
    'STATUS;16;0195238E25AD;129E;R;;;2;2;BMG#10;;;;ED32;03;;aHR0cDovLzEwLjAuMC4xL2ltYWdlLnBuZw==;T3V0IG9mIGZ1ZWwh',
  ],
};
