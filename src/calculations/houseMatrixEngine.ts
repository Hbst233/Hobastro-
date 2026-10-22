import { EnrichedChartResult, EnrichedPlanetPosition } from './planetLayer';
import { ZodiacSignName, PlanetId, TRADITIONAL_RULERSHIPS } from './rulerships';
import { AspectBetweenRulersConnection, calculateMatrixAspects } from './matrixAspectPolicy';

export interface InterceptedCoRulerItem {
  sign: ZodiacSignName;
  ruler: PlanetId;
  rulerNameRu: string;
  rulerHouseNumber: number;
}

export interface HouseMatrixItem {
  number: number; // 1 to 12
  name: string; // "1 дом", etc.
  cuspLongitude: number;
  cuspSign: ZodiacSignName;
  cuspDegree: number;
  cuspRuler: PlanetId; // Traditional ruler of the sign on the cusp
  rulerNameRu: string;
  rulerHouseNumber: number; // House where the cusp ruler is located
  planetsInside: EnrichedPlanetPosition[]; // Planets located inside this house
  interceptedSigns: ZodiacSignName[]; // Fully intercepted signs inside this house (if any)
  interceptedCoRulers: InterceptedCoRulerItem[]; // Co-rulers for intercepted signs with their house location

  // Backwards compatibility aliases
  ruler: PlanetId;
  planets: EnrichedPlanetPosition[];
  coRulers: { sign: ZodiacSignName; ruler: PlanetId; rulerNameRu: string; rulerHouseNumber?: number }[];
}

export type HouseMatrixHouse = HouseMatrixItem;

export type HouseMatrixConnectionType = 'ruler_in_house' | 'intercepted_ruler_in_house' | 'aspect_between_rulers';

export interface BaseHouseConnection {
  id: string;
  sourceHouse: number;
  targetHouse: number;
  type: HouseMatrixConnectionType;
}

export interface RulerInHouseConnection extends BaseHouseConnection {
  type: 'ruler_in_house';
  rulerPlanet: PlanetId;
  rulerNameRu: string;
}

export interface InterceptedRulerInHouseConnection extends BaseHouseConnection {
  type: 'intercepted_ruler_in_house';
  sign: ZodiacSignName;
  rulerPlanet: PlanetId;
  rulerNameRu: string;
}

export type HouseMatrixConnection = 
  | RulerInHouseConnection 
  | InterceptedRulerInHouseConnection 
  | AspectBetweenRulersConnection;

export interface HouseMatrixResult {
  houses: HouseMatrixItem[];
  houseSystem: string;
  connections: HouseMatrixConnection[];
  aspectBetweenRulers: AspectBetweenRulersConnection[];
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

const ZODIAC_SIGNS_ORDER: ZodiacSignName[] = [
  'Овен', 'Телец', 'Близнецы', 'Рак', 
  'Лев', 'Дева', 'Весы', 'Скорпион', 
  'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
];

/**
 * Determines which house a celestial longitude falls into.
 * Uses house cusps from the enriched natal chart.
 */
export function getHouseForLongitude(longitude: number, cusps: EnrichedChartResult['houses']['cusps']): number {
  const normLon = (longitude % 360 + 360) % 360;

  for (let i = 0; i < 12; i++) {
    const currentCusp = cusps[i];
    const nextCusp = cusps[(i + 1) % 12];

    const start = currentCusp.longitude;
    const end = nextCusp.longitude;

    if (end < start) {
      if (normLon >= start || normLon < end) {
        return i + 1;
      }
    } else {
      if (normLon >= start && normLon < end) {
        return i + 1;
      }
    }
  }
  return 1;
}

/**
 * Calculates intercepted signs within a house (signs that do not touch any cusp 
 * but are fully contained between house cusp i and house cusp i+1).
 */
export function getInterceptedSignsInHouse(
  startLon: number, 
  endLon: number
): ZodiacSignName[] {
  const intercepted: ZodiacSignName[] = [];
  
  ZODIAC_SIGNS_ORDER.forEach((sign, idx) => {
    const signStart = idx * 30;
    const signEnd = (signStart + 30) % 360;
    
    const isInside = isLongitudeSpanInsideHouse(signStart, signEnd, startLon, endLon);
    if (isInside) {
      intercepted.push(sign);
    }
  });

  return intercepted;
}

function isLongitudeSpanInsideHouse(
  signStart: number, 
  signEnd: number, 
  houseStart: number, 
  houseEnd: number
): boolean {
  const normalizeAngle = (a: number) => (a % 360 + 360) % 360;
  const sStart = normalizeAngle(signStart);
  
  let hStart = normalizeAngle(houseStart);
  let hEnd = houseEnd <= houseStart ? houseEnd + 360 : houseEnd;
  if (hEnd <= hStart) hEnd += 360;

  const checkPt = (pt: number) => {
    const p = normalizeAngle(pt);
    if (hEnd <= 360) {
      return p >= hStart && p < hEnd;
    } else {
      return (p >= hStart && p < 360) || (p >= 0 && p < (hEnd - 360));
    }
  };

  const houseSpan = (hEnd - hStart);
  if (houseSpan >= 360) return false;

  const midPoint = normalizeAngle(sStart + 15);
  return checkPt(midPoint) && checkPt(sStart);
}

/**
 * Builds the House Matrix based on existing natal data, adhering strictly to traditional rulers,
 * removing symbolic rulers, and assembling the full set of resolved house matrix connections.
 */
export function createHouseMatrix(chart: EnrichedChartResult): HouseMatrixResult {
  const cusps = chart.houses.cusps;
  const positions = chart.positions;

  const houses: HouseMatrixItem[] = [];

  for (let i = 0; i < 12; i++) {
    const currentCusp = cusps[i];
    const nextCusp = cusps[(i + 1) % 12];
    const houseNumber = i + 1;

    const cuspSign = currentCusp.sign as ZodiacSignName;
    const cuspRuler = TRADITIONAL_RULERSHIPS[cuspSign] || 'mars';
    const rulerNameRu = PLANET_NAMES_RU[cuspRuler] || cuspRuler;

    // Find house where the cusp ruler is located (House X -> House Y connection data)
    const rulerPlanet = positions.find(p => p.id === cuspRuler);
    const rulerHouseNumber = rulerPlanet ? getHouseForLongitude(rulerPlanet.longitude, cusps) : houseNumber;

    // Find planets actually located inside this house
    const planetsInside = positions.filter(p => {
      const hNum = getHouseForLongitude(p.longitude, cusps);
      return hNum === houseNumber;
    });

    // Check for intercepted signs in this house
    const interceptedSigns = getInterceptedSignsInHouse(currentCusp.longitude, nextCusp.longitude);
    const interceptedCoRulers: InterceptedCoRulerItem[] = interceptedSigns.map(sign => {
      const coRuler = TRADITIONAL_RULERSHIPS[sign] || 'mars';
      const coRulerPlanet = positions.find(p => p.id === coRuler);
      const coRulerHouseNum = coRulerPlanet ? getHouseForLongitude(coRulerPlanet.longitude, cusps) : houseNumber;
      return {
        sign,
        ruler: coRuler,
        rulerNameRu: PLANET_NAMES_RU[coRuler] || coRuler,
        rulerHouseNumber: coRulerHouseNum
      };
    });

    houses.push({
      number: houseNumber,
      name: currentCusp.name || `${houseNumber} дом`,
      cuspLongitude: currentCusp.longitude,
      cuspSign,
      cuspDegree: currentCusp.degree,
      cuspRuler,
      rulerNameRu,
      rulerHouseNumber,
      planetsInside,
      interceptedSigns,
      interceptedCoRulers,
      // Compatibility aliases
      ruler: cuspRuler,
      planets: planetsInside,
      coRulers: interceptedCoRulers
    });
  }

  const aspectBetweenRulers = calculateMatrixAspects(houses, positions);

  // Assemble full set of connections
  const rawConnections: HouseMatrixConnection[] = [];

  // 1. ruler_in_house connections for each house
  for (const house of houses) {
    rawConnections.push({
      id: `h${house.number}-ruler-${house.cuspRuler}-h${house.rulerHouseNumber}`,
      type: 'ruler_in_house',
      sourceHouse: house.number,
      targetHouse: house.rulerHouseNumber,
      rulerPlanet: house.cuspRuler,
      rulerNameRu: house.rulerNameRu
    });

    // 2. intercepted_ruler_in_house connections for intercepted signs
    for (const coRuler of house.interceptedCoRulers) {
      rawConnections.push({
        id: `h${house.number}-intercepted-${coRuler.sign}-${coRuler.ruler}-h${coRuler.rulerHouseNumber}`,
        type: 'intercepted_ruler_in_house',
        sourceHouse: house.number,
        targetHouse: coRuler.rulerHouseNumber,
        sign: coRuler.sign,
        rulerPlanet: coRuler.ruler,
        rulerNameRu: coRuler.rulerNameRu
      });
    }
  }

  // 3. aspect_between_rulers connections
  for (const asp of aspectBetweenRulers) {
    rawConnections.push(asp);
  }

  // Deduplicate connections to prevent identical duplicates
  const seenKeys = new Set<string>();
  const connections: HouseMatrixConnection[] = [];

  for (const conn of rawConnections) {
    let key = '';
    if (conn.type === 'ruler_in_house') {
      key = `ruler_in_house:${conn.sourceHouse}->${conn.targetHouse}:${conn.rulerPlanet}`;
    } else if (conn.type === 'intercepted_ruler_in_house') {
      key = `intercepted_ruler_in_house:${conn.sourceHouse}->${conn.targetHouse}:${conn.sign}:${conn.rulerPlanet}`;
    } else if (conn.type === 'aspect_between_rulers') {
      key = `aspect_between_rulers:${conn.sourceHouse}->${conn.targetHouse}:${conn.sourceRuler}:${conn.targetRuler}:${conn.aspectType}`;
    }

    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      connections.push(conn);
    }
  }

  return {
    houses,
    houseSystem: chart.houses.system || 'Placidus',
    connections,
    aspectBetweenRulers
  };
}

/**
 * Builds a 12x12 matrix representation grid from house matrix connections.
 * Empty cells remain empty (empty arrays).
 */
export function buildHouseMatrixGrid(connections: HouseMatrixConnection[]): Record<number, Record<number, HouseMatrixConnection[]>> {
  const grid: Record<number, Record<number, HouseMatrixConnection[]>> = {};
  for (let r = 1; r <= 12; r++) {
    grid[r] = {};
    for (let c = 1; c <= 12; c++) {
      grid[r][c] = [];
    }
  }
  for (const conn of connections) {
    if (conn.sourceHouse >= 1 && conn.sourceHouse <= 12 && conn.targetHouse >= 1 && conn.targetHouse <= 12) {
      grid[conn.sourceHouse][conn.targetHouse].push(conn);
    }
  }
  return grid;
}
