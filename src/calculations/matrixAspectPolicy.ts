import { PlanetId, TRADITIONAL_RULERSHIPS } from './rulerships';
import { EnrichedPlanetPosition } from './planetLayer';
import { HouseMatrixItem } from './houseMatrixEngine';

export type MatrixAspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export interface MatrixAspectDefinition {
  type: MatrixAspectType;
  nameRu: string;
  angle: number;
  maxOrb: number;
}

export const MATRIX_ASPECT_DEFINITIONS: MatrixAspectDefinition[] = [
  { type: 'conjunction', nameRu: 'Соединение', angle: 0, maxOrb: 8.0 },
  { type: 'sextile', nameRu: 'Секстиль', angle: 60, maxOrb: 5.0 },
  { type: 'square', nameRu: 'Квадратура', angle: 90, maxOrb: 8.0 },
  { type: 'trine', nameRu: 'Трин', angle: 120, maxOrb: 8.0 },
  { type: 'opposition', nameRu: 'Оппозиция', angle: 180, maxOrb: 8.0 },
];

export interface AspectBetweenRulersConnection {
  id: string;
  type: 'aspect_between_rulers';
  sourceHouse: number;
  targetHouse: number;
  sourceRuler: PlanetId;
  targetRuler: PlanetId;
  sourceRulerNameRu: string;
  targetRulerNameRu: string;
  aspectType: MatrixAspectType;
  aspectNameRu: string;
  exactAngularDistance: number;
  exactAngle: number;
  orb: number;
  planet: {
    source: { id: PlanetId; nameRu: string; longitude: number };
    target: { id: PlanetId; nameRu: string; longitude: number };
  };
}

const PLANET_NAMES_RU: Record<PlanetId, string> = {
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
  ceres: 'Церера',
  pallas: 'Паллада',
  juno: 'Юнона',
  vesta: 'Веста'
};

export function calculateMatrixAngularDistance(lon1: number, lon2: number): number {
  const diff = Math.abs(lon1 - lon2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function calculateMatrixAspects(
  houses: HouseMatrixItem[],
  positions: EnrichedPlanetPosition[]
): AspectBetweenRulersConnection[] {
  const connections: AspectBetweenRulersConnection[] = [];

  for (let i = 0; i < houses.length; i++) {
    for (let j = i + 1; j < houses.length; j++) {
      const houseA = houses[i];
      const houseB = houses[j];

      const rulerA = houseA.cuspRuler;
      const rulerB = houseB.cuspRuler;

      // If two houses have the same ruler, do not create meaningless duplicates/self-aspects
      if (rulerA === rulerB) {
        continue;
      }

      const planetA = positions.find(p => p.id === rulerA);
      const planetB = positions.find(p => p.id === rulerB);

      if (!planetA || !planetB) continue;

      const distance = calculateMatrixAngularDistance(planetA.longitude, planetB.longitude);

      for (const def of MATRIX_ASPECT_DEFINITIONS) {
        const orb = Math.abs(distance - def.angle);
        if (orb <= def.maxOrb) {
          connections.push({
            id: `h${houseA.number}-${def.type}-h${houseB.number}-${rulerA}-${rulerB}`,
            type: 'aspect_between_rulers',
            sourceHouse: houseA.number,
            targetHouse: houseB.number,
            sourceRuler: rulerA,
            targetRuler: rulerB,
            sourceRulerNameRu: PLANET_NAMES_RU[rulerA] || rulerA,
            targetRulerNameRu: PLANET_NAMES_RU[rulerB] || rulerB,
            aspectType: def.type,
            aspectNameRu: def.nameRu,
            exactAngularDistance: parseFloat(distance.toFixed(4)),
            exactAngle: def.angle,
            orb: parseFloat(orb.toFixed(4)),
            planet: {
              source: { id: rulerA, nameRu: PLANET_NAMES_RU[rulerA] || rulerA, longitude: planetA.longitude },
              target: { id: rulerB, nameRu: PLANET_NAMES_RU[rulerB] || rulerB, longitude: planetB.longitude }
            }
          });
          break; // Only one major aspect per house ruler pair
        }
      }
    }
  }

  return connections;
}
