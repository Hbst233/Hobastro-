import { enrichChartPositions } from './planetLayer';
import { calculateHouseAnalysis } from './houseAnalysis';

export function testHouseAnalysis() {
  const mockAstroResult = {
    utc: '2020-01-01T00:00:00Z',
    julianDay: 2451545,
    houses: {
      cusps: [
        { id: '1', name: '1 дом', number: 1, longitude: 0, sign: 'Овен', degree: 0 },
        { id: '2', name: '2 дом', number: 2, longitude: 30, sign: 'Телец', degree: 0 },
        { id: '3', name: '3 дом', number: 3, longitude: 60, sign: 'Близнецы', degree: 0 },
        { id: '4', name: '4 дом', number: 4, longitude: 90, sign: 'Рак', degree: 0 },
        { id: '5', name: '5 дом', number: 5, longitude: 120, sign: 'Лев', degree: 0 },
        { id: '6', name: '6 дом', number: 6, longitude: 150, sign: 'Дева', degree: 0 },
        { id: '7', name: '7 дом', number: 7, longitude: 180, sign: 'Весы', degree: 0 },
        { id: '8', name: '8 дом', number: 8, longitude: 210, sign: 'Скорпион', degree: 0 },
        { id: '9', name: '9 дом', number: 9, longitude: 240, sign: 'Стрелец', degree: 0 },
        { id: '10', name: '10 дом', number: 10, longitude: 270, sign: 'Козерог', degree: 0 },
        { id: '11', name: '11 дом', number: 11, longitude: 300, sign: 'Водолей', degree: 0 },
        { id: '12', name: '12 дом', number: 12, longitude: 330, sign: 'Рыбы', degree: 0 },
      ],
      angles: {
        ascendant: { longitude: 0, sign: 'Овен', degree: 0 },
        descendant: { longitude: 180, sign: 'Весы', degree: 0 },
        mc: { longitude: 270, sign: 'Козерог', degree: 0 },
        ic: { longitude: 90, sign: 'Рак', degree: 0 }
      },
      system: 'Placidus' as const
    },
    positions: [
      { id: 'sun' as const, name: 'Солнце', longitude: 15, speed: 1, sign: 'Овен' as const, degree: 15, retrograde: false },
      { id: 'mars' as const, name: 'Марс', longitude: 125, speed: 0.5, sign: 'Лев' as const, degree: 5, retrograde: false },
      { id: 'saturn' as const, name: 'Сатурн', longitude: 75, speed: 0.1, sign: 'Близнецы' as const, degree: 15, retrograde: false }
    ],
    meta: {
      jd: 2451545,
      ayanamsa: 0,
      timestamp: '2020-01-01T00:00:00Z',
      city: { id: 'msk', name: 'Москва', lat: 55.75, lon: 37.61, country: 'Россия', tz: 'Europe/Moscow' },
      houseSystem: 'Placidus' as const
    }
  };

  const enriched = enrichChartPositions(mockAstroResult);
  const analysis = calculateHouseAnalysis(enriched);

  // 1. Check total 12 houses generated
  if (analysis.houses.length !== 12) {
    throw new Error(`Expected 12 houses, got ${analysis.houses.length}`);
  }
  console.log('✓ House analysis generated 12 houses successfully.');

  // 2. Check house ruler position connection (e.g., 1st house cusp is Aries, ruler is Mars, Mars is in 5th house)
  const house1 = analysis.houses.find(h => h.houseNumber === 1);
  const rulerConn = house1?.connections.find(c => c.type === 'ruler_position');
  if (!rulerConn || rulerConn.sourceHouse !== 1 || rulerConn.targetHouse !== 5 || rulerConn.planet !== 'mars') {
    throw new Error(`Expected ruler_position 1->5 for Mars, got ${JSON.stringify(rulerConn)}`);
  }
  console.log('✓ House ruler position connection verified (1->5, Mars).');

  // 3. Check planet rulership connection with rulesHouses (Saturn rules Capricorn=10 and Aquarius=11, and is in 3rd house)
  const house3 = analysis.houses.find(h => h.houseNumber === 3);
  const planetConns = house3?.connections.filter(c => c.type === 'planet_rulership' && c.planet === 'saturn');
  if (!planetConns || planetConns.length < 2) {
    throw new Error(`Expected multiple planet_rulership connections for Saturn in 3rd house, got ${JSON.stringify(planetConns)}`);
  }
  const hasHouse10 = planetConns.some(c => c.sourceHouse === 10 && c.targetHouse === 3);
  const hasHouse11 = planetConns.some(c => c.sourceHouse === 11 && c.targetHouse === 3);
  if (!hasHouse10 || !hasHouse11) {
    throw new Error(`Expected connections 10-3 and 11-3 for Saturn, got ${JSON.stringify(planetConns)}`);
  }
  console.log('✓ Planet rulership connections verified (10-3, 11-3 via Saturn rulesHouses).');

  // 4. Test specific model requirement for planet_aspect combining positionHouse + rulesHouses
  const testAstroResult = {
    utc: '2020-01-01T00:00:00Z',
    julianDay: 2451545,
    houses: {
      cusps: [
        { id: '1', name: '1 дом', number: 1, longitude: 0, sign: 'Овен', degree: 0 },
        { id: '2', name: '2 дом', number: 2, longitude: 30, sign: 'Телец', degree: 0 },
        { id: '3', name: '3 дом', number: 3, longitude: 60, sign: 'Близнецы', degree: 0 },
        { id: '4', name: '4 дом', number: 4, longitude: 90, sign: 'Рак', degree: 0 },
        { id: '5', name: '5 дом', number: 5, longitude: 120, sign: 'Лев', degree: 0 },
        { id: '6', name: '6 дом', number: 6, longitude: 150, sign: 'Дева', degree: 0 },
        { id: '7', name: '7 дом', number: 7, longitude: 180, sign: 'Весы', degree: 0 },
        { id: '8', name: '8 дом', number: 8, longitude: 210, sign: 'Скорпион', degree: 0 },
        { id: '9', name: '9 дом', number: 9, longitude: 240, sign: 'Стрелец', degree: 0 },
        { id: '10', name: '10 дом', number: 10, longitude: 270, sign: 'Козерог', degree: 0 },
        { id: '11', name: '11 дом', number: 11, longitude: 300, sign: 'Водолей', degree: 0 },
        { id: '12', name: '12 дом', number: 12, longitude: 330, sign: 'Рыбы', degree: 0 },
      ],
      angles: {
        ascendant: { longitude: 0, sign: 'Овен', degree: 0 },
        descendant: { longitude: 180, sign: 'Весы', degree: 0 },
        mc: { longitude: 270, sign: 'Козерог', degree: 0 },
        ic: { longitude: 90, sign: 'Рак', degree: 0 }
      },
      system: 'Placidus' as const
    },
    positions: [
      { id: 'saturn' as const, name: 'Сатурн', longitude: 345, speed: 0.1, sign: 'Рыбы' as const, degree: 15, retrograde: false },
      { id: 'venus' as const, name: 'Венера', longitude: 165, speed: 0.5, sign: 'Дева' as const, degree: 15, retrograde: false }
    ],
    meta: {
      jd: 2451545,
      ayanamsa: 0,
      timestamp: '2020-01-01T00:00:00Z',
      city: { id: 'msk', name: 'Москва', lat: 55.75, lon: 37.61, country: 'Россия', tz: 'Europe/Moscow' },
      houseSystem: 'Placidus' as const
    }
  };

  const enrichedTest = enrichChartPositions(testAstroResult);
  const analysisTest = calculateHouseAnalysis(enrichedTest);

  const expectedSaturnToVenus = [
    [12, 6], [12, 2], [12, 7],
    [10, 6], [10, 2], [10, 7],
    [11, 6], [11, 2], [11, 7]
  ];

  for (const pair of expectedSaturnToVenus) {
    const found = analysisTest.connections.some(c => c.type === 'planet_aspect' && c.sourceHouse === pair[0] && c.targetHouse === pair[1] && c.planet === 'saturn' && c.aspectName === 'Оппозиция');
    if (!found) {
      throw new Error(`Expected directed planet_aspect connection ${pair[0]} -> ${pair[1]} for Saturn -> Venus opposition.`);
    }
  }

  // Count total planet_aspect connections for Saturn and Venus specifically
  const saturnVenusAspectConns = analysisTest.connections.filter(c => c.type === 'planet_aspect' && ((c.planet === 'saturn' && c.secondaryPlanet === 'venus') || (c.planet === 'venus' && c.secondaryPlanet === 'saturn')));
  
  if (saturnVenusAspectConns.length !== 18) { // 9 for Saturn->Venus + 9 for Venus->Saturn
    throw new Error(`Expected exactly 18 directed planet_aspect connections for Saturn-Venus opposition (9 each way), got ${saturnVenusAspectConns.length}`);
  }

  // Check specific house source connections
  const house12Conns = analysisTest.houses.find(h => h.houseNumber === 12)?.connections.filter(c => c.type === 'planet_aspect' && c.planet === 'saturn') || [];
  if (house12Conns.length !== 3) {
    throw new Error(`Expected 3 planet_aspect connections originating from house 12 for Saturn, got ${house12Conns.length}`);
  }

  console.log('✓ Directed planet_aspect model verified successfully (9 directed pairs, 18 total directional edges).');

  // Regression test for cusp_1 / cusp_4 / cusp_7 / cusp_10 compatibility in house analysis
  const angleCompatResult = calculateHouseAnalysis(enriched);
  const house1Angles = angleCompatResult.houses.find(h => h.houseNumber === 1)?.anglesInHouse;
  if (!house1Angles || !house1Angles.includes('ASC')) {
    throw new Error('Expected ASC in house 1 angles');
  }
  console.log('✓ Cusp and angle ID compatibility verified in house analysis.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testHouseAnalysis();
}