import type { AstroCalculationResult } from './astroEngine';
import { ZodiacSignName } from './rulerships';
import { getHouseForLongitude } from './planetLayer';
import { getSignFromLongitude } from './rulerships';

export interface ArabicPartResult {
  id: string;
  name: string;
  longitude: number;
  sign: ZodiacSignName;
  degree: number;
  house: number;
  formula: string;
  origin: string;
  isDayFormula: boolean;
}

export interface ArabicPartsCollection {
  isDayChart: boolean;
  parts: ArabicPartResult[];
}

function normalizeLongitude(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

export function calculateArabicParts(chart: AstroCalculationResult): ArabicPartsCollection {
  if (!chart || !chart.houses || !chart.houses.angles || !chart.houses.angles.ascendant) {
    throw new Error('Невозможно рассчитать арабские жребии: отсутствуют данные куспидов домов или ASC в карте.');
  }

  const ascLon = chart.houses.angles.ascendant.longitude;
  if (ascLon === undefined || isNaN(ascLon)) {
    throw new Error('Отсутствует долгота ASC для расчета арабских жребиев.');
  }

  const positions = chart.positions || [];
  const getPosLon = (id: string): number => {
    const p = positions.find(item => item.id === id);
    if (!p || p.longitude === undefined || isNaN(p.longitude)) {
      const namesRu: Record<string, string> = {
        sun: 'Солнце',
        moon: 'Луна',
        mercury: 'Меркурий',
        venus: 'Венера',
        mars: 'Марс',
        jupiter: 'Юпитер',
        saturn: 'Сатурн',
        fortune: 'Фортуна'
      };
      throw new Error(`Отсутствует необходимая планета или точка (${namesRu[id] || id}) для расчета арабских жребиев.`);
    }
    return p.longitude;
  };

  const sunLon = getPosLon('sun');
  const sunHouse = getHouseForLongitude(sunLon, chart.houses.cusps);
  const isDayChart = sunHouse >= 7 && sunHouse <= 12;

  const moonLon = getPosLon('moon');
  const venusLon = getPosLon('venus');
  const mercuryLon = getPosLon('mercury');
  const jupiterLon = getPosLon('jupiter');
  const marsLon = getPosLon('mars');
  const saturnLon = getPosLon('saturn');

  const cusps = chart.houses.cusps;

  const fortuneLon = isDayChart ? (ascLon + moonLon - sunLon) : (ascLon + sunLon - moonLon);

  const createPart = (
    id: string,
    name: string,
    lon: number,
    dayFormula: string,
    nightFormula: string,
    origin: string
  ): ArabicPartResult => {
    const normLon = normalizeLongitude(lon);
    const sign = getSignFromLongitude(normLon);
    const degree = normLon % 30;
    const house = getHouseForLongitude(normLon, cusps);
    return {
      id,
      name,
      longitude: normLon,
      sign,
      degree,
      house,
      formula: isDayChart ? dayFormula : nightFormula,
      origin,
      isDayFormula: isDayChart
    };
  };

  const parts: ArabicPartResult[] = [
    createPart(
      'fortune',
      'Жребий Фортуны',
      fortuneLon,
      'ASC + Луна − Солнце',
      'ASC + Солнце − Луна',
      'Традиционная арабская астрология (Аль-Бируни, Птолемей)'
    ),
    createPart(
      'spirit',
      'Жребий Духа',
      isDayChart ? (ascLon + sunLon - moonLon) : (ascLon + moonLon - sunLon),
      'ASC + Солнце − Луна',
      'ASC + Луна − Солнце',
      'Традиционная арабская астрология (Аль-Бируни, Птолемей)'
    ),
    createPart(
      'love',
      'Жребий Любви',
      isDayChart ? (ascLon + venusLon - sunLon) : (ascLon + sunLon - venusLon),
      'ASC + Венера − Солнце',
      'ASC + Солнце − Венера',
      'Традиционная арабская астрология (Аль-Бируни, Птолемей)'
    ),
    createPart(
      'commerce',
      'Жребий Коммерции',
      isDayChart ? (ascLon + mercuryLon - sunLon) : (ascLon + sunLon - mercuryLon),
      'ASC + Меркурий − Солнце',
      'ASC + Солнце − Меркурий',
      'Традиционная арабская астрология (Аль-Бируни, Птолемей)'
    ),
    createPart(
      'glory',
      'Жребий Славы',
      isDayChart ? (ascLon + jupiterLon - sunLon) : (ascLon + sunLon - jupiterLon),
      'ASC + Юпитер − Солнце',
      'ASC + Солнце − Юпитер',
      'Традиционная арабская астрология (Аль-Бируни, Птолемей)'
    ),
    createPart(
      'cross_of_fate',
      'Жребий Креста Судьбы',
      isDayChart ? (ascLon + marsLon - saturnLon) : (ascLon + saturnLon - marsLon),
      'ASC + Марс − Сатурн',
      'ASC + Сатурн − Марс',
      'Традиционная арабская астрология (Аль-Бируни, Птолемей)'
    )
  ];

  return {
    isDayChart,
    parts
  };
}
