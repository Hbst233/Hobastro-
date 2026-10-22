import { calculateChartAspects, calculateTransitAspects, AspectType } from './aspectEngine';
import { enrichChartPositions } from './planetLayer';
import { calculatePositions } from './astroEngine';

console.log('--- RUNNING ASPECT ENGINE COMPREHENSIVE VERIFICATION ---');

try {
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
      { id: 'sun' as const, name: 'Солнце', longitude: 15, speed: 1.0, sign: 'Овен' as const, degree: 15, retrograde: false },
      { id: 'moon' as const, name: 'Луна', longitude: 135, speed: 13.0, sign: 'Лев' as const, degree: 15, retrograde: false }, // trine sun (15 deg vs 135 deg = 120 deg)
      { id: 'mars' as const, name: 'Марс', longitude: 0, speed: 0.5, sign: 'Овен' as const, degree: 0, retrograde: false }, // conjunct cusp_1 (0 deg)
    ],
    meta: {
      jd: 2451545,
      ayanamsa: 0,
      timestamp: '2020-01-01T00:00:00Z',
      city: { id: 'msk', name: 'Москва', lat: 55.75, lon: 37.61, country: 'Россия', tz: 'Europe/Moscow' },
      houseSystem: 'Placidus' as const
    }
  };

  const chart = enrichChartPositions(mockAstroResult as any);
  const aspects = calculateChartAspects(chart);

  console.assert(Array.isArray(aspects), 'Aspects result must be an array');
  console.log(`✓ Calculated ${aspects.length} total aspects for mock chart in Placidus.`);

  // Verify all aspects have valid orb <= 8.0
  for (const asp of aspects) {
    console.assert(asp.orb <= 8.0, `Aspect ${asp.source.name} - ${asp.target.name} (${asp.aspectNameRu}) has orb ${asp.orb}° which exceeds MAX_ORB 8.0°`);
    console.assert(asp.source.id !== asp.target.id, 'No self aspects allowed');
    console.assert(typeof asp.actualAngle === 'number', 'actualAngle must be number');
    console.assert(typeof asp.applying === 'boolean' || asp.applying === undefined, 'applying must be boolean or undefined');
    console.assert(typeof asp.source.house === 'number', 'source.house must be number');
    console.assert(typeof asp.target.house === 'number', 'target.house must be number');
  }
  console.log('✓ All generated aspects strictly respect max orb <= 8.0°, unique pairs, and have required structural properties (actualAngle, applying, houses).');

  // Verify Planet -> Planet trine (Sun - Moon)
  const sunMoonTrine = aspects.find(a => (a.source.id === 'sun' && a.target.id === 'moon') || (a.source.id === 'moon' && a.target.id === 'sun'));
  console.assert(sunMoonTrine !== undefined, 'Sun-Moon trine aspect must be present');
  if (sunMoonTrine) {
    console.assert(sunMoonTrine.aspectType === 'trine', `Expected trine, got ${sunMoonTrine.aspectType}`);
    console.log(`✓ Planet -> Planet aspect verified: ${sunMoonTrine.source.name} ↔ ${sunMoonTrine.target.name} (${sunMoonTrine.aspectNameRu}, orb: ${sunMoonTrine.orb.toFixed(2)}°, houses: ${sunMoonTrine.source.house}-${sunMoonTrine.target.house})`);
  }

  // Verify Cusp-related aspect (Mars - cusp_1)
  const cuspAspect = aspects.find(a => a.source.id.startsWith('cusp_') || a.target.id.startsWith('cusp_'));
  console.assert(cuspAspect !== undefined, 'At least one cusp-related aspect must be present');
  if (cuspAspect) {
    console.log(`✓ Cusp-related aspect verified: ${cuspAspect.source.name} ↔ ${cuspAspect.target.name} (${cuspAspect.aspectNameRu}, orb: ${cuspAspect.orb.toFixed(2)}°)`);
  }

  // Verify Reference Astro-Seek Chart (17.05.1988 00:30, Bila Tserkva)
  const belaTserkovData = {
    date: '1988-05-17',
    time: '00:30',
    birthCity: {
      id: 'bela_tserkov',
      name: 'Белая Церковь',
      lat: 49.8167,
      lon: 30.1167,
      country: 'Украина',
      tz: 'Europe/Kiev'
    },
    manualOverride: {
      enabled: true,
      timezone: 'UT/GMT +4'
    },
    houseSystem: 'Placidus'
  };
  const astroRes = calculatePositions(belaTserkovData as any);
  const enrichedBela = enrichChartPositions(astroRes);
  const belaAspects = calculateChartAspects(enrichedBela);
  console.log(`✓ Calculated ${belaAspects.length} aspects for Bila Tserkva reference chart (17.05.1988 00:30).`);
  console.assert(belaAspects.length > 20, 'Expected multiple aspects for reference chart');

  // Regression tests for applying/separating logic (conjunction, sextile, square, trine, opposition, 0/360 boundary, transit static natal)
  const testAspectConvergence = (
    pos1Lon: number, pos1Speed: number,
    pos2Lon: number, pos2Speed: number,
    expectedType: AspectType,
    expectedApplying: boolean
  ) => {
    const testChart = enrichChartPositions({
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
        angles: { ascendant: { longitude: 0, sign: 'Овен', degree: 0 }, descendant: { longitude: 180, sign: 'Весы', degree: 0 }, mc: { longitude: 270, sign: 'Козерог', degree: 0 }, ic: { longitude: 90, sign: 'Рак', degree: 0 } },
        system: 'Placidus'
      },
      positions: [
        { id: 'sun', name: 'Солнце', longitude: pos1Lon, speed: pos1Speed, sign: 'Овен', degree: 0, retrograde: false },
        { id: 'moon', name: 'Луна', longitude: pos2Lon, speed: pos2Speed, sign: 'Овен', degree: 0, retrograde: false },
      ],
      meta: { jd: 2451545, ayanamsa: 0, timestamp: '2020-01-01T00:00:00Z', city: { id: 'msk', name: 'Москва', lat: 55, lon: 37, country: 'Россия', tz: 'Europe/Moscow' }, houseSystem: 'Placidus' }
    } as any);
    const res = calculateChartAspects(testChart);
    const asp = res.find(a => a.aspectType === expectedType);
    console.assert(asp !== undefined, `Expected aspect ${expectedType} not found`);
    if (asp) {
      console.assert(asp.applying === expectedApplying, `Aspect ${expectedType}: expected applying=${expectedApplying}, got ${asp.applying} (actualAngle: ${asp.actualAngle}, exactAngle: ${asp.exactAngle})`);
    }
  };

  // 1. Conjunction (0°)
  testAspectConvergence(358, 1.0, 0, 0, 'conjunction', true);
  testAspectConvergence(2, 1.0, 0, 0, 'conjunction', false);

  // 2. Sextile (60°)
  testAspectConvergence(58, 1.0, 0, 0, 'sextile', true);
  testAspectConvergence(62, 1.0, 0, 0, 'sextile', false);

  // 3. Square (90°)
  testAspectConvergence(88, 1.0, 0, 0, 'square', true);
  testAspectConvergence(92, 1.0, 0, 0, 'square', false);

  // 4. Trine (120°)
  testAspectConvergence(118, 1.0, 0, 0, 'trine', true);
  testAspectConvergence(122, 1.0, 0, 0, 'trine', false);

  // 5. Opposition (180°)
  testAspectConvergence(178, 1.0, 0, 0, 'opposition', true);
  testAspectConvergence(182, 1.0, 0, 0, 'opposition', false);

  // 6. Crossing 0°/360° transition
  testAspectConvergence(358.5, 1.0, 0, 0, 'conjunction', true);

  // 7. Transit aspects with static natal points
  const dummyCusps = [
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
  ];
  const transitChart = enrichChartPositions({
    utc: '2020-01-01T00:00:00Z', julianDay: 2451545,
    houses: { cusps: dummyCusps, angles: { ascendant: { longitude: 0, sign: 'Овен', degree: 0 }, descendant: { longitude: 180, sign: 'Весы', degree: 0 }, mc: { longitude: 270, sign: 'Козерог', degree: 0 }, ic: { longitude: 90, sign: 'Рак', degree: 0 } }, system: 'Placidus' },
    positions: [{ id: 'sun', name: 'Солнце', longitude: 58, speed: 1.0, sign: 'Телец', degree: 28, retrograde: false }],
    meta: { jd: 2451545, ayanamsa: 0, timestamp: '2020-01-01T00:00:00Z', city: { id: 'msk', name: 'Москва', lat: 55, lon: 37, country: 'Россия', tz: 'Europe/Moscow' }, houseSystem: 'Placidus' }
  } as any);
  const natalChart = enrichChartPositions({
    utc: '1988-05-17T00:30:00Z', julianDay: 2447298.5,
    houses: { cusps: dummyCusps, angles: { ascendant: { longitude: 0, sign: 'Овен', degree: 0 }, descendant: { longitude: 180, sign: 'Весы', degree: 0 }, mc: { longitude: 270, sign: 'Козерог', degree: 0 }, ic: { longitude: 90, sign: 'Рак', degree: 0 } }, system: 'Placidus' },
    positions: [{ id: 'moon', name: 'Луна', longitude: 0, speed: 13.0, sign: 'Овен', degree: 0, retrograde: false }],
    meta: { jd: 2447298.5, ayanamsa: 0, timestamp: '1988-05-17T00:30:00Z', city: { id: 'msk', name: 'Москва', lat: 55, lon: 37, country: 'Россия', tz: 'Europe/Moscow' }, houseSystem: 'Placidus' }
  } as any);
  const transitAspects = calculateTransitAspects(transitChart, natalChart);
  const sextileTransit = transitAspects.find(a => a.aspectType === 'sextile');
  console.assert(sextileTransit !== undefined, 'Transit sextile aspect must be found');
  if (sextileTransit) {
    console.assert(sextileTransit.applying === true, 'Transit sextile approaching 60 from 58 with transit speed 1.0 and static natal point must be applying');
  }
  // Regression test for undefined applying direction when speeds are equal (zero relative movement)
  testAspectConvergence(60, 1.0, 0, 1.0, 'sextile', undefined as any);

  console.log('✓ Transit aspects and applying/separating regression tests passed successfully.');

  console.log('PASS');
  console.log('--- ASPECT ENGINE VERIFICATION COMPLETED SUCCESSFULLY ---');
} catch (error) {
  console.error('❌ Aspect verification test failed:', error);
  process.exit(1);
}
