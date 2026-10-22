import React, { useState } from 'react';
import { EnrichedChartResult } from '../calculations/planetLayer';
import { AspectResult, MAX_ORB } from '../calculations/aspectEngine';

interface AspectsWidgetProps {
  chart: EnrichedChartResult;
  aspects: AspectResult[];
}

type AspectCategoryLabel = 'Планеты к планетам' | 'Планеты к куспидам' | 'Куспиды к планетам' | 'Куспиды к куспидам' | 'Все';
type InternalCategory = 'planet → planet' | 'planet → cusp' | 'cusp → planet' | 'cusp → cusp';

const isCusp = (id: string): boolean => {
  return (
    ['ascendant', 'descendant', 'mc', 'ic'].includes(id) ||
    id.startsWith('cusp') ||
    id.startsWith('house') ||
    /^cusp_\d+$/.test(id)
  );
};

const getAspectCategory = (asp: AspectResult): InternalCategory => {
  const sourceIsCusp = isCusp(asp.source.id);
  const targetIsCusp = isCusp(asp.target.id);

  if (!sourceIsCusp && !targetIsCusp) return 'planet → planet';
  if (!sourceIsCusp && targetIsCusp) return 'planet → cusp';
  if (sourceIsCusp && !targetIsCusp) return 'cusp → planet';
  return 'cusp → cusp';
};

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  north_node: '☊',
  south_node: '☋',
  lilith: '⚸',
  ascendant: 'ASC',
  mc: 'MC',
  cusp_1: 'ASC',
  cusp_2: 'II',
  cusp_3: 'III',
  cusp_4: 'IC',
  cusp_5: 'V',
  cusp_6: 'VI',
  cusp_7: 'DSC',
  cusp_8: 'VIII',
  cusp_9: 'IX',
  cusp_10: 'MC',
  cusp_11: 'XI',
  cusp_12: 'XII',
};

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  sextile: '⚹',
  square: '□',
  trine: '△',
  opposition: '☍',
};

const formatDegree = (deg: number): string => {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'`;
};

const formatDegreePrime = (deg: number): string => {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}′`;
};

const GENITIVE_SIGNS: Record<string, string> = {
  'Овен': 'Овна',
  'Телец': 'Тельца',
  'Близнецы': 'Близнецов',
  'Рак': 'Рака',
  'Лев': 'Льва',
  'Дева': 'Девы',
  'Весы': 'Весов',
  'Скорпион': 'Скорпиона',
  'Стрелец': 'Стрельца',
  'Козерог': 'Козерога',
  'Водолей': 'Водолея',
  'Рыбы': 'Рыб',
};

const getGenitiveSign = (sign: string): string => {
  return GENITIVE_SIGNS[sign] || sign;
};

const getHousePreposition = (houseNum: number): string => {
  const prefix = (houseNum === 2 || houseNum === 8) ? 'во' : 'в';
  return `${prefix} ${houseNum} доме`;
};

const getAspectPhrase = (type: string, nameRu: string): string => {
  switch (type) {
    case 'conjunction': return 'в соединении с';
    case 'sextile': return 'в секстиле с';
    case 'square': return 'в квадрате к';
    case 'trine': return 'в трине к';
    case 'opposition': return 'в оппозиции к';
    default: return `в аспекте (${nameRu}) к`;
  }
};

export const AspectsWidget: React.FC<AspectsWidgetProps> = ({ chart, aspects }) => {
  // Default active category at first opening is "Планеты к планетам"
  const [selectedCategory, setSelectedCategory] = useState<AspectCategoryLabel>('Планеты к планетам');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!chart || !chart.positions) {
    return <div style={{ padding: 16 }}>Нет данных для отображения аспектов</div>;
  }

  // Helper to get fresh house and sign/degree for any object (planet or angle ASC/MC) from current enriched chart
  const getObjectDetails = (id: string, fallbackLon: number) => {
    // Check if planet
    const p = chart.positions.find(item => item.id === id);
    if (p) {
      return {
        sign: p.sign,
        degree: p.degree,
        house: p.house,
      };
    }
    // Check if cusp (cusp_1 through cusp_12)
    const cuspMatch = id.match(/^cusp_(\d+)$/);
    if (cuspMatch && chart.houses?.cusps) {
      const hNum = parseInt(cuspMatch[1], 10);
      const c = chart.houses.cusps.find(item => item.number === hNum);
      if (c) {
        return {
          sign: c.sign,
          degree: c.degree,
          house: hNum,
        };
      }
    }
    // Check if angle ASC or MC (legacy fallback)
    if (id === 'ascendant' && chart.houses?.angles?.ascendant) {
      const asc = chart.houses.angles.ascendant;
      return {
        sign: asc.sign,
        degree: asc.degree,
        house: 1,
      };
    }
    if (id === 'mc' && chart.houses?.angles?.mc) {
      const mc = chart.houses.angles.mc;
      const mcHouse = chart.houses.cusps?.find(c => c.number === 10)?.number || 10;
      return {
        sign: mc.sign,
        degree: mc.degree,
        house: mcHouse,
      };
    }
    return {
      sign: '—',
      degree: 0,
      house: 1,
    };
  };

  // Filter aspects by max orb <= 7°
  const filteredAspects = aspects.filter(a => a.orb <= MAX_ORB);

  const categoryConfigs: { label: AspectCategoryLabel; internal?: InternalCategory }[] = [
    { label: 'Планеты к планетам', internal: 'planet → planet' },
    { label: 'Планеты к куспидам', internal: 'planet → cusp' },
    { label: 'Куспиды к планетам', internal: 'cusp → planet' },
    { label: 'Куспиды к куспидам', internal: 'cusp → cusp' },
    { label: 'Все' },
  ];

  const counts = React.useMemo(() => {
    const c: Record<AspectCategoryLabel, number> = {
      'Планеты к планетам': 0,
      'Планеты к куспидам': 0,
      'Куспиды к планетам': 0,
      'Куспиды к куспидам': 0,
      'Все': filteredAspects.length,
    };
    for (const a of filteredAspects) {
      const internalCat = getAspectCategory(a);
      if (internalCat === 'planet → planet') c['Планеты к планетам']++;
      else if (internalCat === 'planet → cusp') c['Планеты к куспидам']++;
      else if (internalCat === 'cusp → planet') c['Куспиды к планетам']++;
      else if (internalCat === 'cusp → cusp') c['Куспиды к куспидам']++;
    }
    return c;
  }, [filteredAspects]);

  const displayedAspects = React.useMemo(() => {
    if (selectedCategory === 'Все') return filteredAspects;
    const targetInternal = categoryConfigs.find(c => c.label === selectedCategory)?.internal;
    return filteredAspects.filter(a => getAspectCategory(a) === targetInternal);
  }, [filteredAspects, selectedCategory]);

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '12px', borderBottom: '2px solid #ff9900', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
          Таблица аспектов
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#ff9900',
            fontSize: '13px',
            textDecoration: 'underline',
            fontWeight: '500',
          }}
        >
          {isExpanded ? 'Свернуть' : 'Развернуть'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: '13px' }}>
        {categoryConfigs.map(cat => {
          const isActive = selectedCategory === cat.label;
          const count = counts[cat.label];
          return (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 0',
                cursor: 'pointer',
                fontWeight: isActive ? 'bold' : 'normal',
                color: isActive ? '#003366' : '#555',
                display: 'inline-flex',
                alignItem: 'center',
                gap: '4px',
              }}
            >
              <span style={{ color: isActive ? '#ff9900' : 'transparent', fontSize: '10px' }}>●</span>
              <span>{cat.label} ({count})</span>
            </button>
          );
        })}
      </div>

      {isExpanded && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px', fontSize: '13px', color: '#333', lineHeight: '1.6' }}>
          {displayedAspects.length === 0 ? (
            <div style={{ fontStyle: 'italic', color: '#999' }}>Не найдено аспектов в данной категории.</div>
          ) : (
            displayedAspects.map(asp => {
              const detailsA = getObjectDetails(asp.source.id, asp.source.longitude);
              const detailsB = getObjectDetails(asp.target.id, asp.target.longitude);
              const degAStr = formatDegreePrime(detailsA.degree);
              const degBStr = formatDegreePrime(detailsB.degree);
              const houseAStr = getHousePreposition(detailsA.house);
              const houseBStr = getHousePreposition(detailsB.house);
              const signAStr = getGenitiveSign(detailsA.sign);
              const signBStr = getGenitiveSign(detailsB.sign);
              const aspectPhrase = getAspectPhrase(asp.aspectType, asp.aspectNameRu);
              const orbStr = formatDegreePrime(asp.orb);

              const desc = `${asp.source.name} ${degAStr} ${signAStr} ${houseAStr} ${aspectPhrase} ${asp.target.name} ${degBStr} ${signBStr} ${houseBStr}. Орбис ${orbStr}.`;

              return (
                <p key={asp.id} style={{ margin: '0 0 8px 0' }}>
                  {desc}
                </p>
              );
            })
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', background: '#fff' }}>
        <table className="astro-table" style={{ textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#003366', color: '#fff' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Объект А</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Знак / градус А</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Дом А</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Аспект</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Объект Б</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Знак / градус Б</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Дом Б</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Орбис</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Характер</th>
            </tr>
          </thead>
          <tbody>
            {displayedAspects.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '16px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                  Не найдено аспектов в данной категории (орбис ≤ {MAX_ORB}°)
                </td>
              </tr>
            ) : (
              displayedAspects.map((asp, index) => {
                const detailsA = getObjectDetails(asp.source.id, asp.source.longitude);
                const detailsB = getObjectDetails(asp.target.id, asp.target.longitude);

                const symA = PLANET_SYMBOLS[asp.source.id] || '';
                const symB = PLANET_SYMBOLS[asp.target.id] || '';
                const aspSym = ASPECT_SYMBOLS[asp.aspectType] || '';

                const applyingText = asp.applying === true 
                  ? 'Сходящийся' 
                  : asp.applying === false 
                    ? 'Расходящийся' 
                    : '—';

                return (
                  <tr key={asp.id} style={{ background: index % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                    <td className="astro-planet-cell" style={{ padding: '8px', fontWeight: '500', color: '#003366' }}>
                      <span className="astro-planet-cell__glyph astro-glyph">{symA}</span>
                      <span>{asp.source.name}</span>
                    </td>
                    <td className="astro-mono astro-degree-cell" style={{ padding: '8px' }}>
                      {detailsA.sign} {formatDegree(detailsA.degree)}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#003366' }}>
                      {detailsA.house} дом
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                      <span style={{ fontSize: '15px', color: '#ff9900', marginRight: '4px' }} title={asp.aspectNameRu}>{aspSym}</span>
                      <span style={{ fontSize: '11px', color: '#333' }}>{asp.aspectNameRu}</span>
                    </td>
                    <td className="astro-planet-cell" style={{ padding: '8px', fontWeight: '500', color: '#003366' }}>
                      <span className="astro-planet-cell__glyph astro-glyph">{symB}</span>
                      <span>{asp.target.name}</span>
                    </td>
                    <td className="astro-mono astro-degree-cell" style={{ padding: '8px' }}>
                      {detailsB.sign} {formatDegree(detailsB.degree)}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#003366' }}>
                      {detailsB.house} дом
                    </td>
                    <td className="astro-mono astro-degree-cell" style={{ padding: '8px', fontWeight: '500', color: '#d46b08' }}>
                      {formatDegree(asp.orb)}
                    </td>
                    <td style={{ padding: '8px', fontSize: '11px', color: '#666' }}>
                      {applyingText}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
