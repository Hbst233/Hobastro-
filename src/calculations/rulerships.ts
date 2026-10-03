export type ZodiacSignName = 
  | 'Овен' 
  | 'Телец' 
  | 'Близнецы' 
  | 'Рак' 
  | 'Лев' 
  | 'Дева' 
  | 'Весы' 
  | 'Скорпион' 
  | 'Стрелец' 
  | 'Козерог' 
  | 'Водолей' 
  | 'Рыбы';

export type PlanetId = 
  | 'sun' 
  | 'moon' 
  | 'mercury' 
  | 'venus' 
  | 'mars' 
  | 'jupiter' 
  | 'saturn' 
  | 'uranus' 
  | 'neptune' 
  | 'pluto' 
  | 'north_node' 
  | 'south_node' 
  | 'lilith';

export interface SignRulership {
  sign: ZodiacSignName;
  ruler: PlanetId;
}

export const TRADITIONAL_RULERSHIPS: Record<ZodiacSignName, PlanetId> = {
  'Овен': 'mars',
  'Телец': 'venus',
  'Близнецы': 'mercury',
  'Рак': 'moon',
  'Лев': 'sun',
  'Дева': 'mercury',
  'Весы': 'venus',
  'Скорпион': 'mars',
  'Стрелец': 'jupiter',
  'Козерог': 'saturn',
  'Водолей': 'saturn',
  'Рыбы': 'jupiter',
};

export interface EssentialDignities {
  domicile: ZodiacSignName[];
  detriment: ZodiacSignName[];
  exaltation: { sign: ZodiacSignName; degree: number } | null;
  fall: { sign: ZodiacSignName; degree: number } | null;
  triplicity: {
    day: ZodiacSignName[];
    night: ZodiacSignName[];
  };
  terms: { start: number; end: number; ruler: PlanetId }[];
  faces: { decan: number; ruler: PlanetId }[];
}

export const TRADITIONAL_EXALTATIONS: Partial<Record<PlanetId, { sign: ZodiacSignName; degree: number }>> = {
  'sun': { sign: 'Овен', degree: 19 },
  'moon': { sign: 'Телец', degree: 3 },
  'mercury': { sign: 'Дева', degree: 15 },
  'venus': { sign: 'Рыбы', degree: 27 },
  'mars': { sign: 'Козерог', degree: 28 },
  'jupiter': { sign: 'Рак', degree: 15 },
  'saturn': { sign: 'Весы', degree: 21 },
};

export const ESSENTIAL_DIGNITIES_MAP: Record<PlanetId, EssentialDignities> = {
  'sun': {
    domicile: ['Лев'],
    detriment: ['Водолей'],
    exaltation: { sign: 'Овен', degree: 19 },
    fall: { sign: 'Весы', degree: 19 },
    triplicity: { day: ['Овен', 'Лев', 'Стрелец'], night: [] },
    terms: [],
    faces: [],
  },
  'moon': {
    domicile: ['Рак'],
    detriment: ['Козерог'],
    exaltation: { sign: 'Телец', degree: 3 },
    fall: { sign: 'Скорпион', degree: 3 },
    triplicity: { day: [], night: ['Телец', 'Дева', 'Козерог'] },
    terms: [],
    faces: [],
  },
  'mercury': {
    domicile: ['Близнецы', 'Дева'],
    detriment: ['Стрелец', 'Рыбы'],
    exaltation: { sign: 'Дева', degree: 15 },
    fall: { sign: 'Рыбы', degree: 15 },
    triplicity: { day: [], night: [] },
    terms: [],
    faces: [],
  },
  'venus': {
    domicile: ['Телец', 'Весы'],
    detriment: ['Скорпион', 'Овен'],
    exaltation: { sign: 'Рыбы', degree: 27 },
    fall: { sign: 'Дева', degree: 27 },
    triplicity: { day: [], night: [] },
    terms: [],
    faces: [],
  },
  'mars': {
    domicile: ['Овен', 'Скорпион'],
    detriment: ['Весы', 'Телец'],
    exaltation: { sign: 'Козерог', degree: 28 },
    fall: { sign: 'Рак', degree: 28 },
    triplicity: { day: [], night: [] },
    terms: [],
    faces: [],
  },
  'jupiter': {
    domicile: ['Стрелец', 'Рыбы'],
    detriment: ['Близнецы', 'Дева'],
    exaltation: { sign: 'Рак', degree: 15 },
    fall: { sign: 'Козерог', degree: 15 },
    triplicity: { day: [], night: [] },
    terms: [],
    faces: [],
  },
  'saturn': {
    domicile: ['Козерог', 'Водолей'],
    detriment: ['Рак', 'Лев'],
    exaltation: { sign: 'Весы', degree: 21 },
    fall: { sign: 'Овен', degree: 21 },
    triplicity: { day: [], night: [] },
    terms: [],
    faces: [],
  },
  'uranus': { domicile: [], detriment: [], exaltation: null, fall: null, triplicity: { day: [], night: [] }, terms: [], faces: [] },
  'neptune': { domicile: [], detriment: [], exaltation: null, fall: null, triplicity: { day: [], night: [] }, terms: [], faces: [] },
  'pluto': { domicile: [], detriment: [], exaltation: null, fall: null, triplicity: { day: [], night: [] }, terms: [], faces: [] },
  'north_node': { domicile: [], detriment: [], exaltation: null, fall: null, triplicity: { day: [], night: [] }, terms: [], faces: [] },
  'south_node': { domicile: [], detriment: [], exaltation: null, fall: null, triplicity: { day: [], night: [] }, terms: [], faces: [] },
  'lilith': { domicile: [], detriment: [], exaltation: null, fall: null, triplicity: { day: [], night: [] }, terms: [], faces: [] },
};

export function getSignRuler(sign: ZodiacSignName): PlanetId {
  const ruler = TRADITIONAL_RULERSHIPS[sign];
  if (!ruler) {
    throw new Error(`Unknown zodiac sign: ${sign}`);
  }
  return ruler;
}

export function getPlanetSignsRuled(planetId: PlanetId): ZodiacSignName[] {
  return (Object.keys(TRADITIONAL_RULERSHIPS) as ZodiacSignName[]).filter(
    sign => TRADITIONAL_RULERSHIPS[sign] === planetId
  );
}

export function getPlanetDignities(planetId: PlanetId): {
  domicile: ZodiacSignName[];
  detriment: ZodiacSignName[];
  exaltation: ZodiacSignName | null;
  fall: ZodiacSignName | null;
} {
  const map = ESSENTIAL_DIGNITIES_MAP[planetId];
  if (!map) {
    return { domicile: [], detriment: [], exaltation: null, fall: null };
  }
  return {
    domicile: map.domicile,
    detriment: map.detriment,
    exaltation: map.exaltation ? map.exaltation.sign : null,
    fall: map.fall ? map.fall.sign : null,
  };
}

export type EssentialDignityStatus = 
  | 'domicile'
  | 'exaltation'
  | 'triplicity_day'
  | 'triplicity_night'
  | 'term'
  | 'face'
  | 'detriment'
  | 'fall'
  | 'peregrine'
  | 'not_applicable';

export const PLANET_NAMES_RU: Record<PlanetId, string> = {
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
};

export interface PlanetEssentialDignityResult {
  sign: ZodiacSignName;
  planet: PlanetId;
  ruler: PlanetId;
  dignities: EssentialDignityStatus[];
  isDomicile: boolean;
  isExalted: boolean;
  isTriplicityDay: boolean;
  isTriplicityNight: boolean;
  isTerm: boolean;
  isFace: boolean;
  isDetriment: boolean;
  isFallen: boolean;
  isPeregrine: boolean;
  domicileScore: number;
  exaltationScore: number;
  triplicityScore: number;
  termScore: number;
  faceScore: number;
  detrimentScore: number;
  fallScore: number;
  peregrineScore: number;
  dignityScore: number;
  debilitationScore: number;
  totalScore: number;
  domicileRulerName: string;
  exaltationRulerName: string;
  triplicityRulerName: string;
  termRulerName: string;
  faceRulerName: string;
  detrimentRulerName: string;
  fallRulerName: string;
  peregrineStatus: string;
}

const TRADITIONAL_PLANETS: PlanetId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

const ZODIAC_SIGNS_ORDER: ZodiacSignName[] = [
  'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
  'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
];

export function getSignFromLongitude(longitude: number): ZodiacSignName {
  const normLon = (longitude % 360 + 360) % 360;
  const signIndex = Math.floor(normLon / 30);
  return ZODIAC_SIGNS_ORDER[signIndex];
}

export function getEssentialDignity(
  planetId: PlanetId,
  longitude: number,
  isDayChart: boolean = true
): PlanetEssentialDignityResult {
  const normLon = ((longitude % 360) + 360) % 360;
  const sign = getSignFromLongitude(normLon);
  const ruler = getSignRuler(sign);
  const localDeg = normLon % 30;

  if (!TRADITIONAL_PLANETS.includes(planetId)) {
    return {
      sign,
      planet: planetId,
      ruler,
      dignities: ['not_applicable'],
      isDomicile: false,
      isExalted: false,
      isTriplicityDay: false,
      isTriplicityNight: false,
      isTerm: false,
      isFace: false,
      isDetriment: false,
      isFallen: false,
      isPeregrine: false,
      domicileScore: 0,
      exaltationScore: 0,
      triplicityScore: 0,
      termScore: 0,
      faceScore: 0,
      detrimentScore: 0,
      fallScore: 0,
      peregrineScore: 0,
      dignityScore: 0,
      debilitationScore: 0,
      totalScore: 0,
      domicileRulerName: '—',
      exaltationRulerName: '—',
      triplicityRulerName: '—',
      termRulerName: '—',
      faceRulerName: '—',
      detrimentRulerName: '—',
      fallRulerName: '—',
      peregrineStatus: '—',
    };
  }

  const map = ESSENTIAL_DIGNITIES_MAP[planetId];
  const dignitiesList: EssentialDignityStatus[] = [];

  const isDomicile = map.domicile.includes(sign);
  const exaltationData = map.exaltation;
  const isExalted = exaltationData !== null && exaltationData.sign === sign;
  const detrimentData = map.detriment;
  const isDetriment = detrimentData.includes(sign);
  const fallData = map.fall;
  const isFallen = fallData !== null && fallData.sign === sign;

  // Triplicity check
  const tripRule = TRIPLICITY_RULES[sign];
  const activeTripRuler = isDayChart ? tripRule.day : tripRule.night;
  const isTriplicityActive = activeTripRuler === planetId;

  // Term check
  const signTerms = EGYPTIAN_TERMS[sign];
  let termRuler: PlanetId | null = null;
  for (const term of signTerms) {
    if (localDeg >= term.start && localDeg < term.end) {
      termRuler = term.ruler;
      break;
    }
  }
  const isTerm = termRuler === planetId;

  // Face check
  const faceRuler = getFaceRuler(sign, localDeg);
  const isFace = faceRuler === planetId;

  if (isDomicile) dignitiesList.push('domicile');
  if (isExalted) dignitiesList.push('exaltation');
  if (isTriplicityActive) {
    dignitiesList.push(isDayChart ? 'triplicity_day' : 'triplicity_night');
  }
  if (isTerm) dignitiesList.push('term');
  if (isFace) dignitiesList.push('face');
  if (isDetriment) dignitiesList.push('detriment');
  if (isFallen) dignitiesList.push('fall');

  // Traditional scores: Domicile +5, Exaltation +4, Triplicity +3, Term +2, Face +1, Detriment -5, Fall -4, Peregrine 0
  const domicileScore = isDomicile ? 5 : 0;
  const exaltationScore = isExalted ? 4 : 0;
  const triplicityScore = isTriplicityActive ? 3 : 0;
  const termScore = isTerm ? 2 : 0;
  const faceScore = isFace ? 1 : 0;
  const detrimentScore = isDetriment ? -5 : 0;
  const fallScore = isFallen ? -4 : 0;

  const hasPositiveDignity = isDomicile || isExalted || isTriplicityActive || isTerm || isFace;
  const isPeregrine = !hasPositiveDignity;

  const peregrineScore = 0;
  if (isPeregrine) {
    dignitiesList.push('peregrine');
  }

  const dignityScore = domicileScore + exaltationScore + triplicityScore + termScore + faceScore;
  const debilitationScore = detrimentScore + fallScore;
  const totalScore = dignityScore + debilitationScore;

  const domicileRulerName = isDomicile ? PLANET_NAMES_RU[planetId] : '—';
  const exaltationRulerName = isExalted ? PLANET_NAMES_RU[planetId] : '—';
  const triplicityRulerName = isTriplicityActive ? PLANET_NAMES_RU[planetId] : '—';
  const termRulerName = termRuler ? PLANET_NAMES_RU[termRuler] : '—';
  const faceRulerName = faceRuler ? PLANET_NAMES_RU[faceRuler] : '—';
  const detrimentRulerName = isDetriment ? PLANET_NAMES_RU[planetId] : '—';
  const fallRulerName = isFallen ? PLANET_NAMES_RU[planetId] : '—';
  const peregrineStatus = isPeregrine ? 'Перегрин' : '—';

  return {
    sign,
    planet: planetId,
    ruler,
    dignities: dignitiesList,
    isDomicile,
    isExalted,
    isTriplicityDay: isDayChart && isTriplicityActive,
    isTriplicityNight: !isDayChart && isTriplicityActive,
    isTerm,
    isFace,
    isDetriment,
    isFallen,
    isPeregrine,
    domicileScore,
    exaltationScore,
    triplicityScore,
    termScore,
    faceScore,
    detrimentScore,
    fallScore,
    peregrineScore,
    dignityScore,
    debilitationScore,
    totalScore,
    domicileRulerName,
    exaltationRulerName,
    triplicityRulerName,
    termRulerName,
    faceRulerName,
    detrimentRulerName,
    fallRulerName,
    peregrineStatus,
  };
}

export const TRIPLICITY_RULES: Record<ZodiacSignName, { element: 'fire' | 'earth' | 'air' | 'water'; day: PlanetId; night: PlanetId; participating: PlanetId }> = {
  'Овен': { element: 'fire', day: 'sun', night: 'jupiter', participating: 'saturn' },
  'Лев': { element: 'fire', day: 'sun', night: 'jupiter', participating: 'saturn' },
  'Стрелец': { element: 'fire', day: 'sun', night: 'jupiter', participating: 'saturn' },
  'Телец': { element: 'earth', day: 'venus', night: 'moon', participating: 'mars' },
  'Дева': { element: 'earth', day: 'venus', night: 'moon', participating: 'mars' },
  'Козерог': { element: 'earth', day: 'venus', night: 'moon', participating: 'mars' },
  'Близнецы': { element: 'air', day: 'saturn', night: 'mercury', participating: 'jupiter' },
  'Весы': { element: 'air', day: 'saturn', night: 'mercury', participating: 'jupiter' },
  'Водолей': { element: 'air', day: 'saturn', night: 'mercury', participating: 'jupiter' },
  'Рак': { element: 'water', day: 'venus', night: 'mars', participating: 'moon' },
  'Скорпион': { element: 'water', day: 'venus', night: 'mars', participating: 'moon' },
  'Рыбы': { element: 'water', day: 'venus', night: 'mars', participating: 'moon' },
};

// Egyptian Terms table (Lilly / traditional Egyptian degrees)
export const EGYPTIAN_TERMS: Record<ZodiacSignName, { start: number; end: number; ruler: PlanetId }[]> = {
  'Овен': [
    { start: 0, end: 6, ruler: 'jupiter' },
    { start: 6, end: 12, ruler: 'venus' },
    { start: 12, end: 20, ruler: 'mercury' },
    { start: 20, end: 25, ruler: 'mars' },
    { start: 25, end: 30, ruler: 'saturn' },
  ],
  'Телец': [
    { start: 0, end: 8, ruler: 'venus' },
    { start: 8, end: 15, ruler: 'mercury' },
    { start: 15, end: 22, ruler: 'jupiter' },
    { start: 22, end: 26, ruler: 'saturn' },
    { start: 26, end: 30, ruler: 'mars' },
  ],
  'Близнецы': [
    { start: 0, end: 6, ruler: 'mercury' },
    { start: 6, end: 12, ruler: 'jupiter' },
    { start: 12, end: 17, ruler: 'venus' },
    { start: 17, end: 24, ruler: 'mars' },
    { start: 24, end: 30, ruler: 'saturn' },
  ],
  'Рак': [
    { start: 0, end: 7, ruler: 'mars' },
    { start: 7, end: 13, ruler: 'venus' },
    { start: 13, end: 19, ruler: 'mercury' },
    { start: 19, end: 27, ruler: 'jupiter' },
    { start: 27, end: 30, ruler: 'saturn' },
  ],
  'Лев': [
    { start: 0, end: 6, ruler: 'jupiter' },
    { start: 6, end: 13, ruler: 'venus' },
    { start: 13, end: 19, ruler: 'saturn' },
    { start: 19, end: 25, ruler: 'mercury' },
    { start: 25, end: 30, ruler: 'mars' },
  ],
  'Дева': [
    { start: 0, end: 7, ruler: 'mercury' },
    { start: 7, end: 17, ruler: 'venus' },
    { start: 17, end: 21, ruler: 'jupiter' },
    { start: 21, end: 28, ruler: 'mars' },
    { start: 28, end: 30, ruler: 'saturn' },
  ],
  'Весы': [
    { start: 0, end: 6, ruler: 'saturn' },
    { start: 6, end: 14, ruler: 'mercury' },
    { start: 14, end: 21, ruler: 'jupiter' },
    { start: 21, end: 28, ruler: 'venus' },
    { start: 28, end: 30, ruler: 'mars' },
  ],
  'Скорпион': [
    { start: 0, end: 7, ruler: 'mars' },
    { start: 7, end: 11, ruler: 'venus' },
    { start: 11, end: 19, ruler: 'mercury' },
    { start: 19, end: 24, ruler: 'jupiter' },
    { start: 24, end: 30, ruler: 'saturn' },
  ],
  'Стрелец': [
    { start: 0, end: 12, ruler: 'jupiter' },
    { start: 12, end: 17, ruler: 'venus' },
    { start: 17, end: 21, ruler: 'mercury' },
    { start: 21, end: 26, ruler: 'saturn' },
    { start: 26, end: 30, ruler: 'mars' },
  ],
  'Козерог': [
    { start: 0, end: 7, ruler: 'mercury' },
    { start: 7, end: 14, ruler: 'jupiter' },
    { start: 14, end: 22, ruler: 'venus' },
    { start: 22, end: 26, ruler: 'saturn' },
    { start: 26, end: 30, ruler: 'mars' },
  ],
  'Водолей': [
    { start: 0, end: 7, ruler: 'mercury' },
    { start: 7, end: 13, ruler: 'venus' },
    { start: 13, end: 20, ruler: 'jupiter' },
    { start: 20, end: 25, ruler: 'mars' },
    { start: 25, end: 30, ruler: 'saturn' },
  ],
  'Рыбы': [
    { start: 0, end: 12, ruler: 'venus' },
    { start: 12, end: 20, ruler: 'jupiter' },
    { start: 20, end: 26, ruler: 'mercury' },
    { start: 26, end: 28, ruler: 'mars' },
    { start: 28, end: 30, ruler: 'saturn' },
  ],
};

const CHALDEAN_PLANET_ORDER: PlanetId[] = ['mars', 'sun', 'venus', 'mercury', 'moon', 'saturn', 'jupiter'];

export function getFaceRuler(sign: ZodiacSignName, localDeg: number): PlanetId {
  const signIndex = ZODIAC_SIGNS_ORDER.indexOf(sign);
  const decanIndex = Math.floor(localDeg / 10);
  const totalDecanNumber = signIndex * 3 + decanIndex;
  return CHALDEAN_PLANET_ORDER[totalDecanNumber % CHALDEAN_PLANET_ORDER.length];
}

export function formatEssentialDignitiesForClipboard(
  results: { name: string; degree: number; sign: ZodiacSignName; ed: PlanetEssentialDignityResult }[]
): string {
  const formatScoreStr = (score: number, isNotApp: boolean) => {
    if (isNotApp) return '—';
    return score > 0 ? `+${score}` : `${score}`;
  };

  const formatDegPos = (deg: number, sign: ZodiacSignName): string => {
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    return `${d}°${m.toString().padStart(2, '0')}′ ${sign}`;
  };

  const lines: string[] = ['Эссенциальный статус планет:'];

  for (const item of results) {
    const isNotApp = item.ed.dignities.includes('not_applicable');
    const posStr = formatDegPos(item.degree, item.sign);
    lines.push(`${item.name} ${posStr}:`);
    lines.push(`Обитель: ${formatScoreStr(item.ed.domicileScore, isNotApp)}`);
    lines.push(`Экзальтация: ${formatScoreStr(item.ed.exaltationScore, isNotApp)}`);
    lines.push(`Триплицитет: ${formatScoreStr(item.ed.triplicityScore, isNotApp)}`);
    lines.push(`Терм: ${formatScoreStr(item.ed.termScore, isNotApp)}`);
    lines.push(`Фейс: ${formatScoreStr(item.ed.faceScore, isNotApp)}`);
    lines.push(`Изгнание: ${formatScoreStr(item.ed.detrimentScore, isNotApp)}`);
    lines.push(`Падение: ${formatScoreStr(item.ed.fallScore, isNotApp)}`);
    lines.push(`Перегрин: ${formatScoreStr(item.ed.peregrineScore, isNotApp)}`);
    lines.push(`Итог: ${formatScoreStr(item.ed.totalScore, isNotApp)}`);
  }

  lines.push('');
  lines.push('Правило расчёта:');
  lines.push('Итоговый балл = сумма применимых эссенциальных достоинств и слабостей.');
  lines.push('Перегрин = планета не имеет ни одной из пяти essential dignities (обители, экзальтации, триплицитета, терма, фейса).');

  return lines.join('\n');
}
