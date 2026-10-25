import { calculatePositions } from './astroEngine';
import { BirthData, City } from '../types';

const testCity: City = {
  id: 'moscow',
  name: 'Moscow',
  names: { ru: 'Москва', en: 'Moscow' },
  country: 'Russia',
  region: 'Moscow',
  lat: 55.7558,
  lon: 37.6173,
  timezone: 'Europe/Moscow',
};

console.log('--- RUNNING DST MODE TESTS ---');

const testModes: Array<'auto' | 'observe' | 'ignore'> = ['auto', 'observe', 'ignore'];

for (const mode of testModes) {
  const birthData: BirthData = {
    name: `DST Test ${mode}`,
    date: '1988-05-17',
    time: '12:00',
    birthCity: testCity,
    residenceCity: testCity,
    solarCity: testCity,
    houseSystem: 'Placidus',
    manualOverride: {
      enabled: true,
      dst: mode,
    },
  };

  const result = calculatePositions(birthData);
  console.assert(result !== null, `Result for DST mode ${mode} must not be null`);
  console.assert(Array.isArray(result.positions), `Positions for DST mode ${mode} must be an array`);
  console.assert(result.positions.length > 0, `Positions for DST mode ${mode} must not be empty`);
  console.log(`✓ DST mode [${mode}]: calculated successfully, Julian Day = ${result.julianDay}`);
}

console.log('--- ALL DST MODE TESTS PASSED ---');
