import { AspectResult, AspectType } from './aspectEngine';

/**
 * Semantic layer for astrological aspects (aspectMeaning / interpretation data).
 * Bridges raw mathematical aspect calculations with structural interpretation requirements
 * for future use by interpretationEngine.
 */

export interface ObjectSemanticInfo {
  id: string;
  name: string;
  isAngle: boolean;
  angleType?: 'ASC' | 'MC' | 'DSC' | 'IC';
  functionRu: string;
  sign: string;
  degree: number;
  house: number;
}

export interface AspectSemanticModel {
  aspectId: string;
  baseObject: ObjectSemanticInfo;
  provokerObject: ObjectSemanticInfo;
  aspectType: AspectType;
  aspectNameRu: string;
  exactAngle: number;
  actualAngle: number;
  orb: number;
  isApplying: boolean | undefined;
  interactionCharacter: string;
  structuralMeaningRu: string;
  harmonicLevel: 'harmonious' | 'tense' | 'neutral' | 'concentrated';
}

/**
 * Dictionary of astrological functions for planets and chart angles in Russian.
 */
export const OBJECT_FUNCTIONS_RU: Record<string, { functionRu: string; isAngle: boolean; angleType?: 'ASC' | 'MC' | 'DSC' | 'IC' }> = {
  sun: { functionRu: 'самовыражение, воля, жизненная сила, творческое «Я»', isAngle: false },
  moon: { functionRu: 'эмоциональные потребности, подсознание, адаптация, интуиция', isAngle: false },
  mercury: { functionRu: 'интеллект, мышление, коммуникация, анализ, обучение', isAngle: false },
  venus: { functionRu: 'ценности, чувства, эстетика, партнерство, удовольствие, ресурсы', isAngle: false },
  mars: { functionRu: 'активность, воля, энергия, инициатива, борьба, импульс', isAngle: false },
  jupiter: { functionRu: 'расширение, оптимизм, возможности, социальный рост, авторитет', isAngle: false },
  saturn: { functionRu: 'структура, дисциплина, ответственность, ограничения, карьера, время', isAngle: false },
  uranus: { functionRu: 'свобода, озарение, оригинальность, революция, неожиданные перемены', isAngle: false },
  neptune: { functionRu: 'духовность, иллюзии, вдохновение, растворение границ, мистика', isAngle: false },
  pluto: { functionRu: 'трансформация, власть, глубокие кризисы, возрождение, бессознательная сила', isAngle: false },
  north_node: { functionRu: 'кармический вектор развития, эволюционная задача', isAngle: false },
  south_node: { functionRu: 'прошлый опыт, кармическая база, отжитые тенденции', isAngle: false },
  lilith: { functionRu: 'подсознательные искушения, теневая сторона, глубокие комплексы', isAngle: false },
  ceres: { functionRu: 'материнская забота, питание, воспитание, изобилие, отпускание', isAngle: false },
  pallas: { functionRu: 'мудрость, стратегия, ментальные паттерны, целеполагание, дизайн', isAngle: false },
  juno: { functionRu: 'партнерство, брак, преданность, контракты, равенство, обязательства', isAngle: false },
  vesta: { functionRu: 'фокус, преданность делу, святилище, целостность, концентрация', isAngle: false },
  ascendant: { functionRu: 'личность, самопрезентация, подход к жизни, внешний облик', isAngle: true, angleType: 'ASC' },
  mc: { functionRu: 'цель жизни, статус, профессиональная реализация, зенит', isAngle: true, angleType: 'MC' },
  descendant: { functionRu: 'партнерские отношения, открытые оппоненты, проекции', isAngle: true, angleType: 'DSC' },
  ic: { functionRu: 'корни, происхождение, внутренний фундамент, дом, истоки', isAngle: true, angleType: 'IC' },
};

/**
 * Characterizes the harmonic level of an aspect type.
 */
export function getHarmonicLevel(type: AspectType): 'harmonious' | 'tense' | 'neutral' | 'concentrated' {
  switch (type) {
    case 'trine':
    case 'sextile':
      return 'harmonious';
    case 'square':
    case 'opposition':
      return 'tense';
    case 'conjunction':
      return 'concentrated';
    default:
      return 'neutral';
  }
}

/**
 * Generates structured interpretation data (aspectMeaning) for a given AspectResult.
 */
export function buildAspectSemanticModel(aspect: AspectResult): AspectSemanticModel {
  const baseInfo = OBJECT_FUNCTIONS_RU[aspect.source.id] || {
    functionRu: 'функция объекта',
    isAngle: false
  };

  const provokerInfo = OBJECT_FUNCTIONS_RU[aspect.target.id] || {
    functionRu: 'функция объекта',
    isAngle: false
  };

  const baseObject: ObjectSemanticInfo = {
    id: aspect.source.id,
    name: aspect.source.name,
    isAngle: baseInfo.isAngle,
    angleType: baseInfo.angleType,
    functionRu: baseInfo.functionRu,
    sign: aspect.source.sign || '—',
    degree: aspect.source.degree || 0,
    house: aspect.source.house || 1,
  };

  const provokerObject: ObjectSemanticInfo = {
    id: aspect.target.id,
    name: aspect.target.name,
    isAngle: provokerInfo.isAngle,
    angleType: provokerInfo.angleType,
    functionRu: provokerInfo.functionRu,
    sign: aspect.target.sign || '—',
    degree: aspect.target.degree || 0,
    house: aspect.target.house || 1,
  };

  const harmonicLevel = getHarmonicLevel(aspect.aspectType);

  // Construct structural meaning without hardcoded horoscope texts
  let aspectActionRu = '';
  switch (aspect.aspectType) {
    case 'conjunction':
      aspectActionRu = `слияние и концентрация функций ${baseObject.name} и ${provokerObject.name}`;
      break;
    case 'sextile':
      aspectActionRu = `возможность гармоничного содействия между ${baseObject.name} и ${provokerObject.name}`;
      break;
    case 'square':
      aspectActionRu = `напряжение и вызов в взаимодействии ${baseObject.name} и ${provokerObject.name}`;
      break;
    case 'trine':
      aspectActionRu = `гармоничный поток энергии и талант взаимодействия ${baseObject.name} и ${provokerObject.name}`;
      break;
    case 'opposition':
      aspectActionRu = `полярность и баланс / противостояние между ${baseObject.name} и ${provokerObject.name}`;
      break;
  }

  const baseLocationStr = `${baseObject.sign} (${baseObject.degree.toFixed(1)}°), ${baseObject.house} дом`;
  const provokerLocationStr = `${provokerObject.sign} (${provokerObject.degree.toFixed(1)}°), ${provokerObject.house} дом`;

  const structuralMeaningRu = `Связь ${baseObject.name} [${baseObject.functionRu}] в ${baseLocationStr} с ${provokerObject.name} [${provokerObject.functionRu}] в ${provokerLocationStr} через ${aspect.aspectNameRu.toLowerCase()} (${aspectActionRu}). Орб: ${aspect.orb.toFixed(2)}°.`;

  return {
    aspectId: aspect.id,
    baseObject,
    provokerObject,
    aspectType: aspect.aspectType,
    aspectNameRu: aspect.aspectNameRu,
    exactAngle: aspect.exactAngle,
    actualAngle: aspect.actualAngle,
    orb: aspect.orb,
    isApplying: aspect.applying,
    interactionCharacter: aspect.interpretationRoles.interactionCharacter,
    structuralMeaningRu,
    harmonicLevel,
  };
}

/**
 * Batch builds semantic models for an array of AspectResults.
 */
export function buildAllAspectSemanticModels(aspects: AspectResult[]): AspectSemanticModel[] {
  return aspects.map(buildAspectSemanticModel);
}
