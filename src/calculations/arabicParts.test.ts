import assert from 'node:assert';
import { calculateArabicParts } from './arabicParts';
import type { AstroCalculationResult } from './astroEngine';

console.log('--- RUNNING ARABIC PARTS TESTS ---');

const mockCusps = Array.from({ length: 12 }, (_, i) => ({
  id: `house_${i + 1}`,
  name: `${i + 1} дом`,
  number: i + 1,
  longitude: i * 30,
  sign: ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'][i] as any,
  degree: 0
}));

const baseChart: AstroCalculationResult = {
  utc: '2026-06-01 12:00:00 UTC',
  julianDay: 2461000.5,
  houses: {
    system: 'Placidus',
    angles: {
      ascendant: { longitude: 0, sign: 'Овен', degree: 0 },
      mc: { longitude: 270, sign: 'Козерог', degree: 0 },
      ic: { longitude: 90, sign: 'Рак', degree: 0 },
      descendant: { longitude: 180, sign: 'Весы', degree: 0 }
    },
    cusps: mockCusps
  },
  positions: [
    { id: 'sun', name: 'Солнце', longitude: 200, speed: 1, sign: 'Весы', degree: 20, retrograde: false }, // House 7 (day)
    { id: 'moon', name: 'Луна', longitude: 50, speed: 13, sign: 'Телец', degree: 20, retrograde: false },
    { id: 'mercury', name: 'Меркурий', longitude: 210, speed: 1, sign: 'Скорпион', degree: 0, retrograde: false },
    { id: 'venus', name: 'Венера', longitude: 150, speed: 1, sign: 'Лев', degree: 0, retrograde: false },
    { id: 'mars', name: 'Марс', longitude: 300, speed: 0.5, sign: 'Водолей', degree: 0, retrograde: false },
    { id: 'jupiter', name: 'Юпитер', longitude: 60, speed: 0.1, sign: 'Близнецы', degree: 0, retrograde: false },
    { id: 'saturn', name: 'Сатурн', longitude: 330, speed: 0.1, sign: 'Рыбы', degree: 0, retrograde: false }
  ]
};

// Test 1: Day chart calculation & Fortune formula (ASC + Moon - Sun)
const resultDay = calculateArabicParts(baseChart);
assert.strictEqual(resultDay.isDayChart, true, 'Test 1.1: Expected day chart');
assert.strictEqual(resultDay.parts.length, 6, 'Test 1.2: Expected 6 Arabic parts');
const fortuneDay = resultDay.parts.find(p => p.id === 'fortune');
assert.strictEqual(fortuneDay?.longitude, 210, 'Test 1.3: Expected Fortune longitude 210 (0 + 50 - 200 = -150 -> 210)');
assert.strictEqual(fortuneDay?.formula, 'ASC + Луна − Солнце', 'Test 1.4: Expected day fortune formula');

// Test 2: Night chart calculation & Fortune formula (ASC + Sun - Moon)
const nightChart: AstroCalculationResult = {
  ...baseChart,
  positions: baseChart.positions.map(p => p.id === 'sun' ? { ...p, longitude: 20 } : p) // House 1 (night)
};
const resultNight = calculateArabicParts(nightChart);
assert.strictEqual(resultNight.isDayChart, false, 'Test 2.1: Expected night chart');
const fortuneNight = resultNight.parts.find(p => p.id === 'fortune');
assert.strictEqual(fortuneNight?.longitude, 330, 'Test 2.2: Expected Night Fortune longitude 330 (0 + 20 - 50 = -30 -> 330)');
assert.strictEqual(fortuneNight?.formula, 'ASC + Солнце − Луна', 'Test 2.3: Expected night fortune formula');

// Test 3: Exact cusps 6/7 and 12/1 boundaries
const chartCusp6 = {
  ...baseChart,
  positions: baseChart.positions.map(p => p.id === 'sun' ? { ...p, longitude: 179 } : p)
};
assert.strictEqual(calculateArabicParts(chartCusp6).isDayChart, false, 'Test 3.1: Sun at 179° should be night chart (House 6)');

const chartCusp7 = {
  ...baseChart,
  positions: baseChart.positions.map(p => p.id === 'sun' ? { ...p, longitude: 180 } : p)
};
assert.strictEqual(calculateArabicParts(chartCusp7).isDayChart, true, 'Test 3.2: Sun at 180° should be day chart (House 7)');

const chartCusp12 = {
  ...baseChart,
  positions: baseChart.positions.map(p => p.id === 'sun' ? { ...p, longitude: 359 } : p)
};
assert.strictEqual(calculateArabicParts(chartCusp12).isDayChart, true, 'Test 3.3: Sun at 359° should be day chart (House 12)');

const chartCusp1 = {
  ...baseChart,
  positions: baseChart.positions.map(p => p.id === 'sun' ? { ...p, longitude: 1 } : p)
};
assert.strictEqual(calculateArabicParts(chartCusp1).isDayChart, false, 'Test 3.4: Sun at 1° should be night chart (House 1)');

// Test 4: Invalid or missing longitude of fortune
const chartInvalidFortune: AstroCalculationResult = {
  ...baseChart,
  positions: [...baseChart.positions, { id: 'fortune', name: 'Фортуна', longitude: NaN, speed: 0, sign: 'Овен', degree: 0, retrograde: false }]
};
const resultInvalidFortune = calculateArabicParts(chartInvalidFortune);
const fortuneInvalid = resultInvalidFortune.parts.find(p => p.id === 'fortune');
assert.strictEqual(fortuneInvalid?.longitude, 210, 'Test 4.1: Expected fallback to formula longitude 210 when fortune longitude is NaN');

const chartMissingFortune: AstroCalculationResult = {
  ...baseChart,
  positions: baseChart.positions.filter(p => p.id !== 'fortune')
};
const resultMissingFortune = calculateArabicParts(chartMissingFortune);
const fortuneMissing = resultMissingFortune.parts.find(p => p.id === 'fortune');
assert.strictEqual(fortuneMissing?.longitude, 210, 'Test 4.2: Expected fallback to formula longitude 210 when fortune is missing');

// Test 5: Error handling for missing ASC or mandatory planets
assert.throws(() => {
  calculateArabicParts({
    ...baseChart,
    houses: {
      ...baseChart.houses,
      angles: {
        ...baseChart.houses.angles,
        ascendant: undefined as any
      }
    }
  });
}, /ASC/, 'Test 5.1: Expected error for missing ASC');

assert.throws(() => {
  calculateArabicParts({
    ...baseChart,
    positions: baseChart.positions.filter(p => p.id !== 'mars')
  });
}, /Марс/, 'Test 5.2: Expected error for missing Mars');

console.log('--- ALL ARABIC PARTS TESTS PASSED SUCCESSFULLY ---');
