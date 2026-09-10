// ICD §6.5 METEO
// METEO;<HDR>;
// <SpeedThroughWater>[m/s];<WaterSpeed>[m/s];<WaterDirection>[°];<WaterTemperature>[°C];<WaterDepth>[m];
// <AirTemperature>[°C];<DewPoint>[°C];<HumidityRel>[%];<Pressure>[hPa];<WindSpeed>[m/s];<WindDirection>[°];
// <Visibility>[km];<CloudHeight>[m];<CloudCover>[%];<Reference>
const R = '6.5';
const F = 'Numeric values are floating point unless defined otherwise.';
export default {
  name: 'METEO',
  icdRef: R,
  description: 'Meteorological data of the environment. If OWNUNIT is also sent, UNIITY links the data to the last OWNUNIT position; alternative: give a Reference to a contact, point or graphic.',
  fields: [
    { name: 'SpeedThroughWater', unit: 'm/s', mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'WaterSpeed',        unit: 'm/s', mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'WaterDirection',    unit: '°',   mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'WaterTemperature',  unit: '°C',  mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'WaterDepth',        unit: 'm',   mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'AirTemperature',    unit: '°C',  mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'DewPoint',          unit: '°C',  mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'HumidityRel',       unit: '%',   mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'Pressure',          unit: 'hPa', mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'WindSpeed',         unit: 'm/s', mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'WindDirection',     unit: '°',   mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'Visibility',        unit: 'km',  mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'CloudHeight',       unit: 'm',   mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'CloudCover',        unit: '%',   mandatory: false, check: 'float', icdRef: R, icdHint: F },
    { name: 'Reference',                      mandatory: false, check: 'text',  icdRef: R, icdHint: 'Alternative: give a Reference to a contact, point or graphic.' },
  ],
  rules: [],
  samples: [
    'METEO;1C;0195238E25AD;74BE;U;;;15.4;15.5;;;;;10.2;72;1005;25;111;50;2500;33;RefPoint1',
    'METEO;;0195238E25AD;;U;;;23.2;100;;;;10.2;72;80;998;20;;;500;100;1000',
    'METEO;2C;0191C643A8AF;74BE;U;;;15.4;15.5;;;;;10.2;72;1005;25;111;50;2500;33;RefPoint1',
  ],
};
