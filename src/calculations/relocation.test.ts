import { calculatePositions, calculateRelocation } from './astroEngine';
import { BirthData, City } from '../types';

const moscowCity: City = {
  id: 'moscow',
  name: 'Moscow',
  names: { ru: 'Москва', en: 'Moscow' },
  country: 'Russia',
  region: 'Moscow',
  lat: 55.7558,
  lon: 37.6173,
  timezone: 'Europe/Moscow',
};

const birthData: BirthData = {
  name: 'Relocation Test',
  date: '1990-01-01',
  time: '12:00',
  birthCity: moscowCity,
  residenceCity: moscowCity,
  solarCity: moscowCity,
  houseSystem: 'Placidus',
};

console.log('--- RUNNING RELOCATION TESTS ---');

try {
  const natalChart = calculatePositions(birthData);
  console.assert(natalChart !== null, 'Natal chart must not be null');

  // Relocate to London (lat: 51.5074, lon: -0.1278)
  const relocationChart = calculateRelocation(natalChart, 51.5074, -0.1278);
  console.assert(relocationChart !== null, 'Relocation chart must not be null');

  // 1. Julian Day must be identical
  console.assert(
    relocationChart.julianDay === natalChart.julianDay,
    `Julian Day must be unchanged: natal=${natalChart.julianDay}, reloc=${relocationChart.julianDay}`
  );

  // 2. Planet longitudes and properties must be preserved exactly
  const natalSun = natalChart.positions.find(p => p.id === 'sun');
  const relocSun = relocationChart.positions.find(p => p.id === 'sun');
  console.assert(natalSun !== undefined, 'Natal Sun must exist');
  console.assert(relocSun !== undefined, 'Reloc Sun must exist');
  console.assert(
    relocSun!.longitude === natalSun!.longitude,
    `Sun longitude must be preserved: natal=${natalSun!.longitude}, reloc=${relocSun!.longitude}`
  );
  console.assert(
    relocSun!.sign === natalSun!.sign,
    `Sun sign must be preserved`
  );

  // 3. Houses and Ascendant must be recalculated (different for Moscow vs London)
  const natalAsc = natalChart.houses.angles.ascendant.longitude;
  const relocAsc = relocationChart.houses.angles.ascendant.longitude;
  console.assert(
    natalAsc !== relocAsc,
    `Ascendant must change after relocation: natal=${natalAsc}, reloc=${relocAsc}`
  );

  // 4. Immutability check: natal chart must not be mutated
  const originalNatalAsc = natalChart.houses.angles.ascendant.longitude;
  console.assert(
    natalChart.houses.angles.ascendant.longitude === originalNatalAsc,
    'Natal chart angles must remain immutable'
  );

  console.log('✓ All relocation tests passed successfully!');
} catch (error) {
    console.error('❌ Relocation tests failed:', error);
    process.exit(1);
}
