import { EnrichedChartResult, EnrichedPlanetPosition, getHouseForLongitude } from './planetLayer';

export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export interface AspectDefinition {
  type: AspectType;
  nameRu: string;
  angle: number;
}

export const SUPPORTED_ASPECTS: AspectDefinition[] = [
  { type: 'conjunction', nameRu: 'Соединение', angle: 0 },
  { type: 'sextile', nameRu: 'Секстиль', angle: 60 },
  { type: 'square', nameRu: 'Квадрат', angle: 90 },
  { type: 'trine', nameRu: 'Тригон', angle: 120 },
  { type: 'opposition', nameRu: 'Оппозиция', angle: 180 },
];

export const MAX_ORB = 8.0;

function getMaxOrb(p1: AspectObjectPoint, p2: AspectObjectPoint, aspectType: AspectType): number {
  const isLuminary = (id: string) => id === 'sun' || id === 'moon';
  const isAngle = (id: string) => id === 'cusp_1' || id === 'cusp_4' || id === 'cusp_7' || id === 'cusp_10';
  const isSpecialPoint = (id: string) => ['north_node', 'lilith', 'chiron', 'fortune', 'vertex'].includes(id);
  const isPlanet = (id: string) => ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(id);
  const isIntermediateCusp = (id: string) => id.startsWith('cusp_') && !isAngle(id);

  if (isIntermediateCusp(p1.id) || isIntermediateCusp(p2.id)) {
    return 3.0;
  }
  if (isLuminary(p1.id) || isLuminary(p2.id)) {
    return 8.0;
  }
  if (isAngle(p1.id) || isAngle(p2.id)) {
    return 6.5;
  }
  if (isSpecialPoint(p1.id) || isSpecialPoint(p2.id)) {
    return 7.5;
  }
  if (isPlanet(p1.id) && isPlanet(p2.id)) {
    return 8.0;
  }
  return 6.0;
}

function getPointSpeed(point: AspectObjectPoint, pos: { speed?: number } | undefined, chart: EnrichedChartResult): number {
  if (pos && typeof pos.speed === 'number') {
    return pos.speed;
  }
  if (point.id.startsWith('cusp_') || point.id === 'vertex') {
    return 360.9856;
  }
  if (point.id === 'fortune') {
    const sun = chart.positions.find(p => p.id === 'sun');
    const moon = chart.positions.find(p => p.id === 'moon');
    const sunSpeed = sun?.speed || 1.0;
    const moonSpeed = moon?.speed || 13.0;
    return 360.9856 + moonSpeed - sunSpeed;
  }
  return 0.0;
}

export interface AspectObjectPoint {
  id: string;
  name: string;
  longitude: number;
  sign?: string;
  degree?: number;
  house?: number;
}

export interface AspectResult {
  id: string;
  source: AspectObjectPoint;
  target: AspectObjectPoint;
  aspectType: AspectType;
  aspectNameRu: string;
  exactAngle: number;
  actualAngle: number;
  orb: number;
  applying?: boolean; // converging / diverging if speed data is available
  interpretationRoles: {
    basePlanet: { id: string; name: string };
    provokerPlanet: { id: string; name: string };
    aspectType: AspectType;
    interactionCharacter: string;
  };
}

export function calculateAngularDistance(lon1: number, lon2: number): number {
  const diff = Math.abs(lon1 - lon2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function normalizeLon(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

/**
 * Enhanced aspect calculation layer that integrates both planet positions
 * and chart angles (ASC, MC) from enrichedChart in Placidus system.
 * Avoids duplicate pair computations, applies strict MAX_ORB,
 * and calculates exact angular distances and applying/separating state when speeds are present.
 */
export function calculateChartAspects(chart: EnrichedChartResult): AspectResult[] {
  const points: AspectObjectPoint[] = [];

  // 1. Add all planet positions
  for (const p of chart.positions) {
    points.push({
      id: p.id,
      name: p.name,
      longitude: p.longitude,
      sign: p.sign,
      degree: p.degree,
      house: p.house,
    });
  }

  // 2. Add all 12 house cusps (cusp_1 through cusp_12)
  if (chart.houses && Array.isArray(chart.houses.cusps)) {
    for (const c of chart.houses.cusps) {
      let cuspName = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][c.number - 1] || `H${c.number}`;
      if (c.number === 1) cuspName = 'ASC';
      else if (c.number === 4) cuspName = 'IC';
      else if (c.number === 7) cuspName = 'DSC';
      else if (c.number === 10) cuspName = 'MC';

      points.push({
        id: `cusp_${c.number}`,
        name: cuspName,
        longitude: c.longitude,
        sign: c.sign,
        degree: c.degree,
        house: c.number,
      });
    }
  }

  const aspects: AspectResult[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p1 = points[i];
      const p2 = points[j];

      // Rule 5: Count each pair exactly once (ASC-Venus and Venus-ASC not two rows)
      const pairKey = [p1.id, p2.id].sort().join('-');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const distance = calculateAngularDistance(p1.longitude, p2.longitude);

      for (const def of SUPPORTED_ASPECTS) {
        const orb = Math.abs(distance - def.angle);
        const effectiveMaxOrb = getMaxOrb(p1, p2, def.type);
        if (orb <= effectiveMaxOrb) {
          // Determine applying / separating using actual speeds of both points
          let applying: boolean | undefined = undefined;
          const pos1 = chart.positions.find(p => p.id === p1.id);
          const pos2 = chart.positions.find(p => p.id === p2.id);

          const speed1 = getPointSpeed(p1, pos1, chart);
          const speed2 = getPointSpeed(p2, pos2, chart);

           const dt = 0.001;
           const p1Future = normalizeLon(p1.longitude + speed1 * dt);
           const p2Future = normalizeLon(p2.longitude + speed2 * dt);
           const distFuture = calculateAngularDistance(p1Future, p2Future);
           const currentOrb = Math.abs(distance - def.angle);
           const futureOrb = Math.abs(distFuture - def.angle);
           if (Math.abs(futureOrb - currentOrb) < 1e-6) {
             applying = undefined;
           } else {
             applying = futureOrb < currentOrb;
           }

          aspects.push({
            id: `${p1.id}-${def.type}-${p2.id}`,
            source: p1,
            target: p2,
            aspectType: def.type,
            aspectNameRu: def.nameRu,
            exactAngle: def.angle,
            actualAngle: distance,
            orb: parseFloat(orb.toFixed(4)),
            applying,
            interpretationRoles: {
              basePlanet: { id: p1.id, name: p1.name },
              provokerPlanet: { id: p2.id, name: p2.name },
              aspectType: def.type,
              interactionCharacter: getInteractionCharacter(def.type)
            }
          });
          break; // Only one major aspect per pair
        }
      }
    }
  }

  return aspects;
}

/**
 * Backward compatible function for callers passing raw positions array.
 */
export function calculateAspects(positions: EnrichedPlanetPosition[]): AspectResult[] {
  // Construct a minimal EnrichedChartResult to reuse robust chart aspect engine
  const mockChart: EnrichedChartResult = {
    utc: '',
    julianDay: 0,
    positions,
    houses: {
      system: 'Placidus',
      angles: {
        ascendant: { longitude: 0, sign: 'Овен', degree: 0 },
        mc: { longitude: 270, sign: 'Козерог', degree: 0 },
        ic: { longitude: 90, sign: 'Рак', degree: 0 },
        descendant: { longitude: 180, sign: 'Весы', degree: 0 }
      },
      cusps: []
    }
  };
  return calculateChartAspects(mockChart);
}

function getInteractionCharacter(type: AspectType): string {
  switch (type) {
    case 'conjunction': return 'слияние / концентрация';
    case 'sextile': return 'возможность / гармоничное содействие';
    case 'square': return 'напряжение / вызов / преодоление';
    case 'trine': return 'гармония / поток / талант';
    case 'opposition': return 'полярность / баланс / противостояние';
  }
}

/**
 * Calculates aspects between Transit points (source) and Natal points/angles (target).
 */
export function calculateTransitAspects(transitChart: EnrichedChartResult, natalChart: EnrichedChartResult): AspectResult[] {
  const aspects: AspectResult[] = [];
  const transitPoints: AspectObjectPoint[] = [];
  const natalPoints: AspectObjectPoint[] = [];

  // 1. Gather transit planet positions
  for (const p of transitChart.positions) {
    transitPoints.push({
      id: `transit_${p.id}`,
      name: `Тр. ${p.name}`,
      longitude: p.longitude,
      sign: p.sign,
      degree: p.degree,
      house: p.house,
    });
  }

  // 2. Gather natal planet positions and key angles/cusps
  for (const p of natalChart.positions) {
    natalPoints.push({
      id: p.id,
      name: p.name,
      longitude: p.longitude,
      sign: p.sign,
      degree: p.degree,
      house: p.house,
    });
  }

  if (natalChart.houses && Array.isArray(natalChart.houses.cusps)) {
    for (const c of natalChart.houses.cusps) {
      let cuspName = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][c.number - 1] || `H${c.number}`;
      if (c.number === 1) cuspName = 'ASC';
      else if (c.number === 4) cuspName = 'IC';
      else if (c.number === 7) cuspName = 'DSC';
      else if (c.number === 10) cuspName = 'MC';

      natalPoints.push({
        id: `cusp_${c.number}`,
        name: cuspName,
        longitude: c.longitude,
        sign: c.sign,
        degree: c.degree,
        house: c.number,
      });
    }
  }

  // 3. Compute aspects between each transit point and each natal point
  for (const tPoint of transitPoints) {
    for (const nPoint of natalPoints) {
      const actualAngle = calculateAngularDistance(tPoint.longitude, nPoint.longitude);

      for (const def of SUPPORTED_ASPECTS) {
        const orb = Math.abs(actualAngle - def.angle);
        const maxOrb = getMaxOrb(tPoint, nPoint, def.type);
        if (orb <= maxOrb) {
          let applying: boolean | undefined = undefined;
           const tPos = transitChart.positions.find(p => p.id === tPoint.id.replace('transit_', ''));
           const speed1 = getPointSpeed(tPoint, tPos, transitChart);
           const speed2 = 0.0; // Natal points are static in transit calculations
           const dt = 0.001;
           const tFuture = normalizeLon(tPoint.longitude + speed1 * dt);
           const nFuture = normalizeLon(nPoint.longitude + speed2 * dt);
           const distFuture = calculateAngularDistance(tFuture, nFuture);
           const currentOrb = Math.abs(actualAngle - def.angle);
           const futureOrb = Math.abs(distFuture - def.angle);
           if (Math.abs(futureOrb - currentOrb) < 1e-6) {
             applying = undefined;
           } else {
             applying = futureOrb < currentOrb;
           }

          aspects.push({
            id: `${tPoint.id}_${def.type}_${nPoint.id}`,
            source: tPoint,
            target: nPoint,
            aspectType: def.type,
            aspectNameRu: def.nameRu,
            exactAngle: def.angle,
            actualAngle,
            orb: parseFloat(orb.toFixed(2)),
            applying,
            interpretationRoles: {
              basePlanet: { id: nPoint.id, name: nPoint.name },
              provokerPlanet: { id: tPoint.id, name: tPoint.name },
              aspectType: def.type,
              interactionCharacter: getInteractionCharacter(def.type)
            }
          });
          break; // One aspect per pair
        }
      }
    }
  }

  return aspects;
}
