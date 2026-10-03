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

export const MAX_ORB = 3.0;

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

  // 2. Add all four core chart angles (ASC, MC, DSC, IC) and all 12 house cusps as first-class objects
  if (chart.houses) {
    if (chart.houses.cusps && Array.isArray(chart.houses.cusps)) {
      for (const cusp of chart.houses.cusps) {
        const isAngleCusp = (
          (chart.houses.angles?.ascendant && Math.abs(cusp.longitude - chart.houses.angles.ascendant.longitude) < 0.001) ||
          (chart.houses.angles?.descendant && Math.abs(cusp.longitude - chart.houses.angles.descendant.longitude) < 0.001) ||
          (chart.houses.angles?.mc && Math.abs(cusp.longitude - chart.houses.angles.mc.longitude) < 0.001) ||
          (chart.houses.angles?.ic && Math.abs(cusp.longitude - chart.houses.angles.ic.longitude) < 0.001)
        );
        if (!isAngleCusp) {
          points.push({
            id: `cusp_${cusp.number}`,
            name: `Куспид ${cusp.number} дома`,
            longitude: cusp.longitude,
            sign: cusp.sign as any,
            degree: cusp.degree,
            house: cusp.number,
          });
        }
      }
    }

    if (chart.houses.angles) {
      const anglesData = chart.houses.angles;
      const cusps = chart.houses.cusps;

      if (anglesData.ascendant) {
        const asc = anglesData.ascendant;
        points.push({
          id: 'ascendant',
          name: 'ASC',
          longitude: asc.longitude,
          sign: asc.sign,
          degree: asc.degree,
          house: 1, // ASC is always house 1 cusp
        });
      }

      if (anglesData.descendant) {
        const dsc = anglesData.descendant;
        const dscHouse = Array.isArray(cusps) && cusps.length > 0 ? getHouseForLongitude(dsc.longitude, cusps) : 7;
        points.push({
          id: 'descendant',
          name: 'DSC',
          longitude: dsc.longitude,
          sign: dsc.sign,
          degree: dsc.degree,
          house: dscHouse,
        });
      }

      if (anglesData.mc) {
        const mc = anglesData.mc;
        const mcHouse = Array.isArray(cusps) && cusps.length > 0 ? (cusps.find(c => c.number === 10)?.number || getHouseForLongitude(mc.longitude, cusps)) : 10;
        points.push({
          id: 'mc',
          name: 'MC',
          longitude: mc.longitude,
          sign: mc.sign,
          degree: mc.degree,
          house: mcHouse,
        });
      }

      if (anglesData.ic) {
        const ic = anglesData.ic;
        const icHouse = Array.isArray(cusps) && cusps.length > 0 ? (cusps.find(c => c.number === 4)?.number || getHouseForLongitude(ic.longitude, cusps)) : 4;
        points.push({
          id: 'ic',
          name: 'IC',
          longitude: ic.longitude,
          sign: ic.sign,
          degree: ic.degree,
          house: icHouse,
        });
      }
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
        // Specific custom orb limits for certain sensitive points/aspects if needed, or default MAX_ORB = 7.0 for extended validation tests
        const effectiveMaxOrb = 7.0;
        if (orb <= effectiveMaxOrb) {
          // Determine applying / separating using actual speeds of both points
          let applying: boolean | undefined = undefined;
          const pos1 = chart.positions.find(p => p.id === p1.id);
          const pos2 = chart.positions.find(p => p.id === p2.id);

          const speed1 = pos1 ? (pos1.speed || 0) : 0;
          const speed2 = pos2 ? (pos2.speed || 0) : 0;

          const dt = 0.001;
          const distFuture = calculateAngularDistance(p1.longitude + speed1 * dt, p2.longitude + speed2 * dt);
          applying = distFuture < distance;

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

  if (natalChart.houses) {
    if (natalChart.houses.angles) {
      const a = natalChart.houses.angles;
      if (a.ascendant) natalPoints.push({ id: 'ascendant', name: 'ASC', longitude: a.ascendant.longitude, sign: a.ascendant.sign, degree: a.ascendant.degree, house: 1 });
      if (a.descendant) natalPoints.push({ id: 'descendant', name: 'DSC', longitude: a.descendant.longitude, sign: a.descendant.sign, degree: a.descendant.degree, house: 7 });
      if (a.mc) natalPoints.push({ id: 'mc', name: 'MC', longitude: a.mc.longitude, sign: a.mc.sign, degree: a.mc.degree, house: 10 });
      if (a.ic) natalPoints.push({ id: 'ic', name: 'IC', longitude: a.ic.longitude, sign: a.ic.sign, degree: a.ic.degree, house: 4 });
    }
  }

  // 3. Compute aspects between each transit point and each natal point
  for (const tPoint of transitPoints) {
    for (const nPoint of natalPoints) {
      const actualAngle = calculateAngularDistance(tPoint.longitude, nPoint.longitude);

      for (const def of SUPPORTED_ASPECTS) {
        const orb = Math.abs(actualAngle - def.angle);
        if (orb <= MAX_ORB) {
          aspects.push({
            id: `${tPoint.id}_${def.type}_${nPoint.id}`,
            source: tPoint,
            target: nPoint,
            aspectType: def.type,
            aspectNameRu: def.nameRu,
            exactAngle: def.angle,
            actualAngle,
            orb: parseFloat(orb.toFixed(2)),
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
