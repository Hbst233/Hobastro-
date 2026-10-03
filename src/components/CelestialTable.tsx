import React, { useState, useMemo } from 'react';
import { EnrichedChartResult, EnrichedPlanetPosition } from '../calculations/planetLayer';
import { getEssentialDignity } from '../calculations/rulerships';

interface CelestialTableProps {
  chart: EnrichedChartResult;
}

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
};

const formatDegree = (deg: number): string => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.floor(((((deg - d) * 60) - m) * 60));
  return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"`;
};

const getObjectHouse = (longitude: number, cusps: EnrichedChartResult['houses']['cusps']): number => {
  const normLon = (longitude % 360 + 360) % 360;
  
  for (let i = 0; i < 12; i++) {
    const currentCusp = cusps[i];
    const nextCusp = cusps[(i + 1) % 12];
    
    let start = currentCusp.longitude;
    let end = nextCusp.longitude;
    
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
};

export const CelestialTable: React.FC<CelestialTableProps> = ({ chart }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const requiredIds = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto',
    'north_node',
    'south_node',
    'lilith'
  ];

  const objectMap = new Map<string, EnrichedPlanetPosition>(chart.positions.map(p => [p.id, p]));

  const rows = useMemo(() => {
    return requiredIds.map(id => {
      let pos = objectMap.get(id);
      if (!pos && id === 'south_node') {
        const nn = objectMap.get('north_node');
        if (nn) {
          const southLon = (nn.longitude + 180) % 360;
          const signs = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'] as const;
          const signIdx = Math.floor(southLon / 30) % 12;
          const deg = southLon % 30;
          const house = getObjectHouse(southLon, chart.houses.cusps);
          pos = {
            id: 'south_node',
            name: 'Южный узел',
            longitude: southLon,
            speed: -nn.speed,
            sign: signs[signIdx],
            degree: deg,
            retrograde: nn.retrograde,
            house,
            ruler: 'venus' as any,
            rulesSigns: [],
             rulesHouses: [],
             modernRulesHouses: [],
            dignities: { isDomicile: false, isDetriment: false, isExalted: false, isFallen: false }
          };
        }
      }

      if (!pos) return null;

      const house = getObjectHouse(pos.longitude, chart.houses.cusps);
      const glyph = PLANET_SYMBOLS[pos.id] || '•';

      const ed = getEssentialDignity(pos.id as any, pos.longitude, true);
      const isNotApp = ed.dignities.includes('not_applicable');
      const formatScore = (score: number) => {
        if (isNotApp) return '—';
        return score > 0 ? `+${score}` : `${score}`;
      };

      return {
        ...pos,
        glyph,
        house,
        ed: {
          domicile: ed.domicileRulerName,
          exaltation: ed.exaltationRulerName,
          triplicity: ed.triplicityRulerName,
          term: ed.termRulerName,
          face: ed.faceRulerName,
          detriment: ed.detrimentRulerName,
          fall: ed.fallRulerName,
          peregrine: ed.peregrineStatus,
          total: formatScore(ed.totalScore),
          isNotApp,
        }
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);
  }, [chart]);

  const clipboardText = useMemo(() => {
    const lines = ['Небесные тела и эссенциальные статусы:'];
    for (const row of rows) {
      const isModern = row.id === 'uranus' || row.id === 'neptune' || row.id === 'pluto';
      const houses = isModern ? ((row as any).modernRulesHouses ?? []) : (row.rulesHouses ?? []);
      const houseStr = houses.length > 0 ? ` Управляет домами: ${houses.join(', ')}` : '';
      const speedStr = `${row.speed > 0 ? `+${row.speed.toFixed(2)}` : row.speed.toFixed(2)}°/д`;
      const retroStr = row.retrograde ? 'R' : 'Прямой';
      
      lines.push(
        `- ${row.name} (${row.sign} ${formatDegree(row.degree)}): Дом ${row.house}, Скорость ${speedStr}, ${retroStr}.${houseStr} | ` +
        `Обитель: ${row.ed.domicile}, Экзальтация: ${row.ed.exaltation}, Триплицитет: ${row.ed.triplicity}, Терм: ${row.ed.term}, ` +
        `Фейс: ${row.ed.face}, Изгнание: ${row.ed.detriment}, Падение: ${row.ed.fall}, Перегрин: ${row.ed.peregrine}, Итог: ${row.ed.total}`
      );
    }
    return lines.join('\n');
  }, [rows]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clipboardText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div style={{ marginTop: '24px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', overflow: 'hidden' }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '10px 14px', 
          background: '#fafafa', 
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #d9d9d9' : 'none'
        }}
      >
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: 0, display: 'inline-block' }}>
            Планеты и управления
          </h2>
          <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
            (Небесные тела и расчётные точки)
          </span>
        </div>
        <button
          type="button"
          style={{
            fontSize: '12px',
            padding: '2px 8px',
            background: '#f0f0f0',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? 'Свернуть ▲' : 'Развернуть ▼'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ padding: '12px' }}>
          <div className="astro-table-responsive-wrapper" style={{ border: '1px solid #d9d9d9', background: '#fff' }}>
            <table className="astro-table astro-table--dense" style={{ textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9' }}>Объект</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9' }}>Знак</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9' }}>Градус</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9' }}>Дом</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9' }}>Управляет домами</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9' }}>Скорость</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9' }}>Ретро</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Обитель</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Экзальтация</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Триплицитет</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Терм</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Фейс</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Изгнание</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Падение</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Перегрин</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center' }}>Эссенциальная сила</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} style={{ background: index % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                    <td className="astro-planet-cell" style={{ padding: '6px 8px', fontWeight: '500' }}>
                      <span className="astro-planet-cell__glyph astro-glyph">{row.glyph}</span>
                      <span className="astro-object-name">{row.name}</span>
                    </td>
                    <td className="astro-sign-cell" style={{ padding: '6px 8px' }}>{row.sign}</td>
                    <td className="astro-degree astro-degree-cell astro-mono" style={{ padding: '6px 8px' }}>{formatDegree(row.degree)}</td>
                    <td className="astro-house-cell" style={{ padding: '6px 8px', color: '#003366' }}>{row.house} дом</td>
                    <td style={{ padding: '6px 8px' }}>
                      {(() => {
                        const isModern = row.id === 'uranus' || row.id === 'neptune' || row.id === 'pluto';
                        const houses = isModern 
                          ? ((row as any).modernRulesHouses ?? []) 
                          : (row.rulesHouses ?? []);
                        if (houses.length === 0) return '—';
                        return `${houses.join(', ')} ${houses.length === 1 ? 'дом' : 'дома'}`;
                      })()}
                    </td>
                    <td className="astro-mono" style={{ padding: '6px 8px', color: row.speed < 0 ? '#ff4d4f' : 'inherit' }}>
                      {row.speed > 0 ? `+${row.speed.toFixed(2)}` : row.speed.toFixed(2)}°/д
                    </td>
                    <td style={{ padding: '6px 8px', fontWeight: row.retrograde ? 'bold' : 'normal', color: row.retrograde ? '#ff4d4f' : '#52c41a' }}>
                      {row.retrograde ? 'R' : 'Прямой'}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.ed.domicile}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.ed.exaltation}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.ed.triplicity}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.ed.term}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.ed.face}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.ed.detriment}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.ed.fall}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.ed.peregrine}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace', color: row.ed.isNotApp ? '#8c8c8c' : '#003366' }}>{row.ed.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                background: copied ? '#e6f7ff' : '#f0f0f0',
                border: copied ? '1px solid #91d5ff' : '1px solid #d9d9d9',
                color: copied ? '#1890ff' : 'inherit',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={handleCopy}
            >
              {copied ? 'Скопировано в буфер' : 'Копировать'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
