import { EnrichedChartResult, EnrichedPlanetPosition, getHouseForLongitude } from './planetLayer';
import { ZodiacSignName, PlanetId, getSignRuler } from './rulerships';
import { calculateChartAspects, AspectResult } from './aspectEngine';
import { ZODIAC_SIGNS } from './bindhuTypes';

export type HouseConnectionDataType = 'ruler_position' | 'planet_position' | 'planet_rulership' | 'planet_aspect' | 'cusp_aspect';

export interface HouseAnalysisConnection {
  sourceHouse: number;
  targetHouse: number;
  type: HouseConnectionDataType;
  planet: string;
  secondaryPlanet?: string;
  aspectName?: string;
  detailText: string;
}

export interface HouseAnalysisItem {
  houseNumber: number;
  name: string;
  cuspSign: ZodiacSignName;
  interceptedSigns: ZodiacSignName[];
  ruler: PlanetId;
  modernCoRuler?: PlanetId;
  rulerHouse: number;
  planetsInHouse: EnrichedPlanetPosition[];
  anglesInHouse: string[];
  connections: HouseAnalysisConnection[];
}

export interface HouseAnalysisResult {
  houses: HouseAnalysisItem[];
  connections: HouseAnalysisConnection[];
}

const PLANET_NAMES_RU_MAP: Record<string, string> = {
  sun: 'Солнце',
  moon: 'Луна',
  mercury: 'Меркурий',
  venus: 'Венера',
  mars: 'Марс',
  jupiter: 'Юпитер',
  saturn: 'Сатурн',
  uranus: 'Уран',
  neptune: 'Нептун',
  pluto: 'Плутон',
  north_node: 'Северный узел',
  south_node: 'Южный узел',
  lilith: 'Лилит',
  ascendant: 'ASC',
  descendant: 'DSC',
  mc: 'MC',
  ic: 'IC'
};

export function getPlanetRuName(id: string): string {
  return PLANET_NAMES_RU_MAP[id] || id;
}

/**
 * Включённые (intercepted) знаки дома по фактическим долготам куспидов.
 * Знак включён, если весь его 30° диапазон лежит между куспидом дома
 * и куспидом следующего дома, и ни один из куспидов не находится в знаке.
 */
export function getInterceptedSignsForHouse(
  houseStartLon: number,
  houseEndLon: number
): ZodiacSignName[] {
  const norm = (a: number) => ((a % 360) + 360) % 360;
  const forward = (a: number, b: number) => ((b - a) % 360 + 360) % 360;

  const hStart = norm(houseStartLon);
  const hEnd = norm(houseEndLon);
  const houseSpan = forward(hStart, hEnd) || 360;
  if (houseSpan >= 360) return [];

  const cuspInsideSign = (signStart: number, signEnd: number, lon: number) => {
    const delta = forward(signStart, norm(lon));
    return delta < forward(signStart, signEnd) && delta > 0;
  };

  const intercepted: ZodiacSignName[] = [];

  ZODIAC_SIGNS.forEach((sign, idx) => {
    const signStart = idx * 30;
    const signEnd = signStart + 30;

    // Check if the 30° sign sector is strictly inside the house span (from hStart to hEnd)
    // without containing either hStart or hEnd as a cusp.
    // Specifically, signStart must be >= hStart (or after hStart in forward direction),
    // and signEnd must be <= hEnd (or before hEnd in forward direction).
    const offsetStart = forward(hStart, signStart);
    const offsetEnd = forward(signStart, hEnd);

    const fitsFully = offsetStart + 30 <= houseSpan && offsetStart >= 0 && offsetEnd >= 0;
    if (!fitsFully) return;

    if (cuspInsideSign(signStart, signEnd, hStart)) return;
    if (cuspInsideSign(signStart, signEnd, hEnd)) return;

    intercepted.push(sign);
  });

  return intercepted;
}

export function calculateHouseAnalysis(chart: EnrichedChartResult): HouseAnalysisResult {
  const cusps = chart.houses.cusps;
  const positions = chart.positions;
  const angles = chart.houses.angles;

  // Calculate aspects using the existing engine (maxOrb 3.0 or standard)
  const aspects = calculateChartAspects(chart);

  // Helper to get house for any longitude or planet/angle
  const getHouseForPoint = (lon: number, pointId?: string): number => {
    if (pointId === 'ascendant') return 1;
    if (pointId === 'descendant') {
      const dsc = angles?.descendant;
      if (dsc) return getHouseForLongitude(dsc.longitude, cusps);
      return 7;
    }
    if (pointId === 'mc') {
      const mc = angles?.mc;
      if (mc) return cusps.find(c => c.number === 10)?.number || getHouseForLongitude(mc.longitude, cusps);
      return 10;
    }
    if (pointId === 'ic') {
      const ic = angles?.ic;
      if (ic) return cusps.find(c => c.number === 4)?.number || getHouseForLongitude(ic.longitude, cusps);
      return 4;
    }
    const pos = positions.find(p => p.id === pointId);
    if (pos && typeof pos.house === 'number') return pos.house;
    return getHouseForLongitude(lon, cusps);
  };

  const houses: HouseAnalysisItem[] = [];
  const allConnections: HouseAnalysisConnection[] = [];

  for (let i = 1; i <= 12; i++) {
    const cuspObj = cusps[i - 1];
    const nextCuspObj = cusps[i % 12];
    const cuspSign = (cuspObj?.sign || 'Овен') as ZodiacSignName;
    const ruler = getSignRuler(cuspSign);

    // Включённые (intercepted) знаки: полный 30° диапазон внутри дома, без куспидов в знаке
    const interceptedSigns = cuspObj && nextCuspObj
      ? getInterceptedSignsForHouse(cuspObj.longitude, nextCuspObj.longitude)
      : [];

    // Modern co-ruler check if applicable (Uranus for Aquarius, Neptune for Pisces, Pluto for Scorpio)
    let modernCoRuler: PlanetId | undefined = undefined;
    if (cuspSign === 'Водолей') modernCoRuler = 'uranus';
    else if (cuspSign === 'Рыбы') modernCoRuler = 'neptune';
    else if (cuspSign === 'Скорпион') modernCoRuler = 'pluto';

    // Find house where the ruler is located
    const rulerPlanetObj = positions.find(p => p.id === ruler);
    const rulerHouse = rulerPlanetObj ? rulerPlanetObj.house : getHouseForLongitude(rulerPlanetObj?.longitude ?? 0, cusps);

    // Find planets located in this house
    const planetsInHouse = positions.filter(p => p.house === i);

    // Check angles belonging to this house
    const anglesInHouse: string[] = [];
    if (i === 1 && angles?.ascendant) anglesInHouse.push('ASC');
    if (i === 7 && angles?.descendant) anglesInHouse.push('DSC');
    if (i === 10 && angles?.mc) anglesInHouse.push('MC');
    if (i === 4 && angles?.ic) anglesInHouse.push('IC');

    const connections: HouseAnalysisConnection[] = [];

    // 1. По положению (By position):
    // - ruler position connection: "У1 → 12 · Сат"
    if (rulerHouse) {
      const rulerRu = getPlanetRuName(ruler);
      const detailText = `управитель ${i} дома находится в ${rulerHouse} доме (${rulerRu})`;
      const conn: HouseAnalysisConnection = {
        sourceHouse: i,
        targetHouse: rulerHouse,
        type: 'ruler_position',
        planet: ruler,
        detailText
      };
      connections.push(conn);
      allConnections.push(conn);
    }

    // - modern co-ruler position connection if present
    if (modernCoRuler) {
      const coRulerObj = positions.find(p => p.id === modernCoRuler);
      const coRulerHouse = coRulerObj ? coRulerObj.house : getHouseForLongitude(coRulerObj?.longitude ?? 0, cusps);
      if (coRulerHouse) {
        const coRulerRu = getPlanetRuName(modernCoRuler);
        const detailText = `соправитель ${i} дома находится в ${coRulerHouse} доме (${coRulerRu})`;
        const conn: HouseAnalysisConnection = {
          sourceHouse: i,
          targetHouse: coRulerHouse,
          type: 'ruler_position',
          planet: modernCoRuler,
          detailText
        };
        const isDup = connections.some(c => c.sourceHouse === conn.sourceHouse && c.targetHouse === conn.targetHouse && c.planet === conn.planet);
        if (!isDup) {
          connections.push(conn);
          allConnections.push(conn);
        }
      }
    }

    // - planets in house: "планета находится в доме"
    for (const planet of planetsInHouse) {
      const planetRu = getPlanetRuName(planet.id);
      const detailText = `${planetRu} находится в ${i} доме`;
      const conn: HouseAnalysisConnection = {
        sourceHouse: i,
        targetHouse: i,
        type: 'planet_position',
        planet: planet.id,
        detailText
      };
      const isDup = connections.some(c => c.sourceHouse === conn.sourceHouse && c.targetHouse === conn.targetHouse && c.planet === conn.planet && c.type === 'planet_position');
      if (!isDup) {
        connections.push(conn);
        allConnections.push(conn);
      }
    }

    // Also include planet rulerships for planets in this house ruling other houses
    for (const planet of planetsInHouse) {
      if (planet.rulesHouses && Array.isArray(planet.rulesHouses)) {
        for (const ruledHouse of planet.rulesHouses) {
          if (ruledHouse !== i) {
            const planetRu = getPlanetRuName(planet.id);
            const detailText = `планета ${planetRu} в ${i} доме управляет ${ruledHouse} домом`;
            const conn: HouseAnalysisConnection = {
              sourceHouse: ruledHouse,
              targetHouse: i,
              type: 'planet_rulership',
              planet: planet.id,
              detailText
            };
            const isDup = connections.some(c => c.sourceHouse === conn.sourceHouse && c.targetHouse === conn.targetHouse && c.planet === conn.planet);
            if (!isDup) {
              connections.push(conn);
              allConnections.push(conn);
            }
          }
        }
      }
    }

    // 2. По аспектам между планетами (By aspects between planets)
    for (const asp of aspects) {
      const p1Id = asp.source.id;
      const p2Id = asp.target.id;

      const p1Obj = positions.find(p => p.id === p1Id);
      const p2Obj = positions.find(p => p.id === p2Id);

      if (!p1Obj || !p2Obj) continue; // Only planet-planet aspects here

      // Collect all houses for p1 (positionHouse + rulesHouses, unique)
      const p1Houses = new Set<number>();
      if (typeof p1Obj.house === 'number') p1Houses.add(p1Obj.house);
      if (p1Obj.rulesHouses && Array.isArray(p1Obj.rulesHouses)) {
        for (const rh of p1Obj.rulesHouses) {
          p1Houses.add(rh);
        }
      }

      // Collect all houses for p2 (positionHouse + rulesHouses, unique)
      const p2Houses = new Set<number>();
      if (typeof p2Obj.house === 'number') p2Houses.add(p2Obj.house);
      if (p2Obj.rulesHouses && Array.isArray(p2Obj.rulesHouses)) {
        for (const rh of p2Obj.rulesHouses) {
          p2Houses.add(rh);
        }
      }

      const aspName = asp.aspectNameRu;

      // If house i is among p1Houses, the direction is from p1's houses (source: i) to p2's houses (target: targetH)
      if (p1Houses.has(i)) {
        for (const targetH of p2Houses) {
          const detailText = `${aspName} между управителем/элементом ${i} дома и управителем/элементом ${targetH} дома (${getPlanetRuName(p1Id)} и ${getPlanetRuName(p2Id)})`;

          const conn: HouseAnalysisConnection = {
            sourceHouse: i,
            targetHouse: targetH,
            type: 'planet_aspect',
            planet: p1Id,
            secondaryPlanet: p2Id,
            aspectName: asp.aspectNameRu,
            detailText
          };

          const isDup = connections.some(c =>
            c.type === 'planet_aspect' &&
            c.sourceHouse === conn.sourceHouse &&
            c.targetHouse === conn.targetHouse &&
            c.aspectName === conn.aspectName
          );

          if (!isDup) {
            connections.push(conn);
          }

          const isGlobalDup = allConnections.some(c =>
            c.type === 'planet_aspect' &&
            c.sourceHouse === conn.sourceHouse &&
            c.targetHouse === conn.targetHouse &&
            c.aspectName === conn.aspectName
          );

          if (!isGlobalDup) {
            allConnections.push(conn);
          }
        }
      }

      // If house i is among p2Houses, the direction is from p2's houses (source: i) to p1's houses (target: targetH)
      if (p2Houses.has(i) && !p1Houses.has(i)) {
        for (const targetH of p1Houses) {
          const detailText = `${aspName} между управителем/элементом ${i} дома и управителем/элементом ${targetH} дома (${getPlanetRuName(p2Id)} и ${getPlanetRuName(p1Id)})`;

          const conn: HouseAnalysisConnection = {
            sourceHouse: i,
            targetHouse: targetH,
            type: 'planet_aspect',
            planet: p2Id,
            secondaryPlanet: p1Id,
            aspectName: asp.aspectNameRu,
            detailText
          };

          const isDup = connections.some(c =>
            c.type === 'planet_aspect' &&
            c.sourceHouse === conn.sourceHouse &&
            c.targetHouse === conn.targetHouse &&
            c.aspectName === conn.aspectName
          );

          if (!isDup) {
            connections.push(conn);
          }

          const isGlobalDup = allConnections.some(c =>
            c.type === 'planet_aspect' &&
            c.sourceHouse === conn.sourceHouse &&
            c.targetHouse === conn.targetHouse &&
            c.aspectName === conn.aspectName
          );

          if (!isGlobalDup) {
            allConnections.push(conn);
          }
        }
      }
    }

    // 3. По аспектам к куспидам / углам карты (By aspects to cusps / angles)
    for (const asp of aspects) {
      const p1Id = asp.source.id;
      const p2Id = asp.target.id;

      const isP1Angle = ['ascendant', 'descendant', 'mc', 'ic'].includes(p1Id) || p1Id.startsWith('cusp') || p1Id.startsWith('house');
      const isP2Angle = ['ascendant', 'descendant', 'mc', 'ic'].includes(p2Id) || p2Id.startsWith('cusp') || p2Id.startsWith('house');

      if (isP1Angle || isP2Angle) {
        let targetAngleHouse = i;
        let planetId = '';
        let angleName = '';

        if (isP1Angle && !isP2Angle) {
          planetId = p2Id;
          angleName = asp.source.name;
          targetAngleHouse = getHouseForPoint(asp.source.longitude, p1Id);
        } else if (!isP1Angle && isP2Angle) {
          planetId = p1Id;
          angleName = asp.target.name;
          targetAngleHouse = getHouseForPoint(asp.target.longitude, p2Id);
        }

        if (targetAngleHouse === i && planetId) {
          const planetRu = getPlanetRuName(planetId);
          const planetObj = positions.find(p => p.id === planetId);
          const planetHouse = planetObj ? planetObj.house : i;
          
          const orbDeg = Math.floor(asp.orb);
          const orbMin = Math.round((asp.orb - orbDeg) * 60);
          const orbStr = `${orbDeg}°${orbMin.toString().padStart(2, '0')}′`;
          const appSepStr = asp.applying ? 'сходящийся' : 'расходящийся';

          // Format Russian name for cusp/angle
          let pointDisplayName = angleName;
          if (angleName === 'ASC') pointDisplayName = 'ASC';
          else if (angleName === 'MC') pointDisplayName = 'MC';
          else if (angleName === 'DSC') pointDisplayName = 'DSC';
          else if (angleName === 'IC') pointDisplayName = 'IC';
          else if (angleName.startsWith('Куспид') || angleName.startsWith('House')) {
            pointDisplayName = `Куспид ${i} дома`;
          } else {
            pointDisplayName = i === 1 ? 'ASC' : i === 4 ? 'IC' : i === 7 ? 'DSC' : i === 10 ? 'MC' : `Куспид ${i} дома`;
          }

          const detailText = `${pointDisplayName} — ${asp.aspectNameRu} ${planetRu} (орб ${orbStr}, ${appSepStr})`;
          const conn: HouseAnalysisConnection = {
            sourceHouse: i,
            targetHouse: planetHouse,
            type: 'cusp_aspect',
            planet: planetId,
            secondaryPlanet: angleName,
            aspectName: asp.aspectNameRu,
            detailText
          };

          const isDup = connections.some(c =>
            c.type === 'cusp_aspect' &&
            c.sourceHouse === conn.sourceHouse &&
            c.targetHouse === conn.targetHouse &&
            c.planet === conn.planet &&
            c.aspectName === conn.aspectName
          );

          if (!isDup) {
            connections.push(conn);
            allConnections.push(conn);
          }
        }
      }
    }

    houses.push({
      houseNumber: i,
      name: `${i} дом`,
      cuspSign,
      interceptedSigns,
      ruler,
      modernCoRuler,
      rulerHouse,
      planetsInHouse,
      anglesInHouse,
      connections
    });
  }

  return {
    houses,
    connections: allConnections
  };
}
