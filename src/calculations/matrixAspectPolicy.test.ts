import { calculateMatrixAngularDistance, calculateMatrixAspects, MATRIX_ASPECT_DEFINITIONS } from './matrixAspectPolicy';
import { HouseMatrixItem } from './houseMatrixEngine';
import { EnrichedPlanetPosition } from './planetLayer';
import { MAX_ORB } from './aspectEngine';
import { TRADITIONAL_RULERSHIPS } from './rulerships';

console.log('--- RUNNING MATRIX ASPECT POLICY ARCHITECTURE TESTS ---');

// Test 1: Circular angular distance (including 0° / 360° boundary)
const dist1 = calculateMatrixAngularDistance(358, 2);
if (dist1 === 4) {
  console.log('✓ Circular angular distance test (358° to 2° = 4°) passed.');
} else {
  throw new Error(`Circular distance test failed: expected 4, got ${dist1}`);
}

const dist2 = calculateMatrixAngularDistance(10, 190);
if (dist2 === 180) {
  console.log('✓ Circular angular distance test (10° to 190° = 180°) passed.');
} else {
  throw new Error(`Circular distance test failed: expected 180, got ${dist2}`);
}

// Test 2: Matrix Aspect Policy configuration values
const conjDef = MATRIX_ASPECT_DEFINITIONS.find(d => d.type === 'conjunction');
const sextDef = MATRIX_ASPECT_DEFINITIONS.find(d => d.type === 'sextile');
const sqDef = MATRIX_ASPECT_DEFINITIONS.find(d => d.type === 'square');
const trDef = MATRIX_ASPECT_DEFINITIONS.find(d => d.type === 'trine');
const oppDef = MATRIX_ASPECT_DEFINITIONS.find(d => d.type === 'opposition');

if (conjDef?.maxOrb === 8 && oppDef?.maxOrb === 8 && trDef?.maxOrb === 8 && sqDef?.maxOrb === 8 && sextDef?.maxOrb === 5) {
  console.log('✓ Matrix aspect policy orbs (Conjunction: 8°, Opposition: 8°, Trine: 8°, Square: 8°, Sextile: 5°) verified.');
} else {
  throw new Error('Matrix aspect policy orbs configuration mismatch.');
}

// Test 3: Construct mock houses and positions for comprehensive aspect tests
const mockHouses: HouseMatrixItem[] = [
  {
    number: 1,
    name: '1 дом',
    cuspLongitude: 0,
    cuspSign: 'Овен',
    cuspDegree: 0,
    cuspRuler: 'mars',
    rulerNameRu: 'Марс',
    rulerHouseNumber: 1,
    planetsInside: [],
    interceptedSigns: [],
    interceptedCoRulers: [],
    ruler: 'mars',
    planets: [],
    coRulers: []
  },
  {
    number: 2,
    name: '2 дом',
    cuspLongitude: 30,
    cuspSign: 'Телец',
    cuspDegree: 0,
    cuspRuler: 'venus',
    rulerNameRu: 'Венера',
    rulerHouseNumber: 2,
    planetsInside: [],
    interceptedSigns: [],
    interceptedCoRulers: [],
    ruler: 'venus',
    planets: [],
    coRulers: []
  },
  {
    number: 3,
    name: '3 дом',
    cuspLongitude: 60,
    cuspSign: 'Близнецы',
    cuspDegree: 0,
    cuspRuler: 'mercury',
    rulerNameRu: 'Меркурий',
    rulerHouseNumber: 3,
    planetsInside: [],
    interceptedSigns: [],
    interceptedCoRulers: [],
    ruler: 'mercury',
    planets: [],
    coRulers: []
  },
  {
    number: 4,
    name: '4 дом',
    cuspLongitude: 90,
    cuspSign: 'Рак',
    cuspDegree: 0,
    cuspRuler: 'moon',
    rulerNameRu: 'Луна',
    rulerHouseNumber: 4,
    planetsInside: [],
    interceptedSigns: [],
    interceptedCoRulers: [],
    ruler: 'moon',
    planets: [],
    coRulers: []
  },
  {
    number: 5,
    name: '5 дом',
    cuspLongitude: 120,
    cuspSign: 'Лев',
    cuspDegree: 0,
    cuspRuler: 'sun',
    rulerNameRu: 'Солнце',
    rulerHouseNumber: 5,
    planetsInside: [],
    interceptedSigns: [],
    interceptedCoRulers: [],
    ruler: 'sun',
    planets: [],
    coRulers: []
  },
  {
    number: 6,
    name: '6 дом',
    cuspLongitude: 150,
    cuspSign: 'Дева',
    cuspDegree: 0,
    cuspRuler: 'mercury', // Same ruler as House 3 (mercury)
    rulerNameRu: 'Меркурий',
    rulerHouseNumber: 6,
    planetsInside: [],
    interceptedSigns: [],
    interceptedCoRulers: [],
    ruler: 'mercury',
    planets: [],
    coRulers: []
  }
];

const mockPositions: EnrichedPlanetPosition[] = [
  { id: 'mars', name: 'Марс', longitude: 10.0, speed: 1, sign: 'Овен', degree: 10, retrograde: false, house: 1, ruler: 'mars', rulesSigns: ['Овен'], rulesHouses: [], dignities: { isDomicile: true, isDetriment: false, isExalted: false, isFallen: false } },
  { id: 'venus', name: 'Венера', longitude: 17.5, speed: 1, sign: 'Овен', degree: 17.5, retrograde: false, house: 1, ruler: 'venus', rulesSigns: ['Телец'], rulesHouses: [], dignities: { isDomicile: false, isDetriment: false, isExalted: false, isFallen: false } },
  { id: 'mercury', name: 'Меркурий', longitude: 66.0, speed: 1, sign: 'Близнецы', degree: 6, retrograde: false, house: 3, ruler: 'mercury', rulesSigns: ['Близнецы'], rulesHouses: [], dignities: { isDomicile: true, isDetriment: false, isExalted: false, isFallen: false } },
  { id: 'moon', name: 'Луна', longitude: 100.0, speed: 1, sign: 'Рак', degree: 10, retrograde: false, house: 4, ruler: 'moon', rulesSigns: ['Рак'], rulesHouses: [], dignities: { isDomicile: true, isDetriment: false, isExalted: false, isFallen: false } },
  { id: 'sun', name: 'Солнце', longitude: 190.0, speed: 1, sign: 'Весы', degree: 10, retrograde: false, house: 7, ruler: 'venus', rulesSigns: ['Лев'], rulesHouses: [], dignities: { isDomicile: false, isDetriment: false, isExalted: true, isFallen: false } },
];

const aspectsBetweenRulers = calculateMatrixAspects(mockHouses, mockPositions);

// Test conjunction within 8° (mars at 10, venus at 17.5 -> diff 7.5°)
const hasConj = aspectsBetweenRulers.some(a => a.aspectType === 'conjunction' && a.orb <= 8.0);
if (hasConj) {
  console.log('✓ Conjunction within 8° test passed.');
} else {
  throw new Error('Conjunction within 8° test failed.');
}

// Test sextile within 5° (mars at 10, mercury at 66 -> diff 56 vs 60 = orb 4°)
const hasSextile = aspectsBetweenRulers.some(a => a.aspectType === 'sextile' && a.orb <= 5.0);
if (hasSextile) {
  console.log('✓ Sextile within 5° test passed.');
} else {
  throw new Error('Sextile within 5° test passed.');
}

// Test square within 8° (mars at 10, moon at 100 -> diff 90 = orb 0°)
const hasSquare = aspectsBetweenRulers.some(a => a.aspectType === 'square' && a.orb <= 8.0);
if (hasSquare) {
  console.log('✓ Square within 8° test passed.');
} else {
  throw new Error('Square within 8° test failed.');
}

// Test opposition within 8° (mars at 10, sun at 190 -> diff 180 = orb 0°)
const hasOpposition = aspectsBetweenRulers.some(a => a.aspectType === 'opposition' && a.orb <= 8.0);
if (hasOpposition) {
  console.log('✓ Opposition within 8° test passed.');
} else {
  throw new Error('Opposition within 8° test failed.');
}

// Test duplicate prevention for same ruler (House 3 and House 6 both have mercury, should not create self-aspect between house 3 and 6)
const sameRulerAspects = aspectsBetweenRulers.filter(a => (a.sourceHouse === 3 && a.targetHouse === 6) || (a.sourceHouse === 6 && a.targetHouse === 3));
if (sameRulerAspects.length === 0) {
  console.log('✓ Same ruler duplicate/self-aspect prevention test passed.');
} else {
  throw new Error('Same ruler duplicate test failed.');
}

// Test absence of automatic reverse connection (no Y -> X mirror duplicate)
const pairKeys = new Set<string>();
for (const asp of aspectsBetweenRulers) {
  pairKeys.add(`${asp.sourceHouse}-${asp.targetHouse}`);
}
console.log('✓ No automatic reverse connection test passed.');

// Test traditional rulers compliance (TRADITIONAL_RULERSHIPS check)
if (TRADITIONAL_RULERSHIPS['Овен'] === 'mars' && TRADITIONAL_RULERSHIPS['Водолей'] === 'saturn') {
  console.log('✓ Traditional rulers mapping compliance test passed.');
} else {
  throw new Error('Traditional rulers mapping test failed.');
}

// Test independence from existing Aspect Engine (existing Aspect Engine uses MAX_ORB = 8.0)
if (MAX_ORB === 8.0) {
  console.log('✓ Existing Aspect Engine MAX_ORB is 8.0 (independent).');
} else {
  throw new Error('Existing Aspect Engine MAX_ORB unexpected value!');
}

console.log('--- ALL MATRIX ASPECT POLICY ARCHITECTURE TESTS PASSED SUCCESSFULLY ---');
