import React, { useState, useMemo } from 'react';
import { EnrichedChartResult } from '../calculations/planetLayer';
import { getEssentialDignity, formatEssentialDignitiesForClipboard } from '../calculations/rulerships';

interface EssentialDignitiesTableProps {
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

const formatDegreePos = (deg: number, sign: string): string => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${m.toString().padStart(2, '0')}′ ${sign}`;
};

export const EssentialDignitiesTable: React.FC<EssentialDignitiesTableProps> = ({ chart }) => {
  const [copied, setCopied] = useState(false);

  // Compute calculated table data ONCE per chart using calculation layer
  const tableData = useMemo(() => {
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

    const objectMap = new Map<string, any>(chart.positions.map(p => [p.id, p]));

    return requiredIds.map(id => {
      let pos = objectMap.get(id);
      if (!pos && id === 'south_node') {
        const nn = objectMap.get('north_node');
        if (nn) {
          const southLon = (nn.longitude + 180) % 360;
          const signs = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'] as const;
          const signIdx = Math.floor(southLon / 30) % 12;
          const deg = southLon % 30;
          pos = {
            id: 'south_node',
            name: 'Южный узел',
            longitude: southLon,
            sign: signs[signIdx],
            degree: deg,
          };
        }
      }

      if (!pos) return null;

      // Call calculation layer getEssentialDignity once per planet
      const ed = getEssentialDignity(id as any, pos.longitude, true);
      const glyph = PLANET_SYMBOLS[id] || '•';

      const formatScore = (score: number, isNotApp: boolean) => {
        if (isNotApp) return '—';
        return score > 0 ? `+${score}` : `${score}`;
      };

      const isNotApp = ed.dignities.includes('not_applicable');

      return {
        id,
        name: pos.name,
        glyph,
        degree: pos.degree,
        sign: pos.sign,
        positionStr: formatDegreePos(pos.degree, pos.sign),
        isNotApp,
        domicile: formatScore(ed.domicileScore, isNotApp),
        exaltation: formatScore(ed.exaltationScore, isNotApp),
        triplicity: formatScore(ed.triplicityScore, isNotApp),
        term: formatScore(ed.termScore, isNotApp),
        face: formatScore(ed.faceScore, isNotApp),
        detriment: formatScore(ed.detrimentScore, isNotApp),
        fall: formatScore(ed.fallScore, isNotApp),
        peregrine: formatScore(ed.peregrineScore, isNotApp),
        total: formatScore(ed.totalScore, isNotApp),
        ed,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);
  }, [chart]);

  // Pre-formatted clipboard string using the exact pre-calculated results (zero calculation in clipboard handler)
  const clipboardText = useMemo(() => {
    return formatEssentialDignitiesForClipboard(tableData);
  }, [tableData]);

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
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '2px solid #ff9900', paddingBottom: '4px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
          Эссенциальный статус планет
        </h2>
        <button
          type="button"
          style={{
            fontSize: '12px',
            padding: '2px 8px',
            background: copied ? '#e6f7ff' : '#f0f0f0',
            border: copied ? '1px solid #91d5ff' : '1px solid #d9d9d9',
            color: copied ? '#1890ff' : 'inherit',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={handleCopy}
        >
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #d9d9d9' }}>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0' }}>Планета</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0' }}>Положение</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>Обитель</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>Экзальтация</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>Триплицитет</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>Терм</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>Фейс</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>Изгнание</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>Падение</th>
              <th style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>Перегрин</th>
              <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Итог</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={row.id} style={{ background: index % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px', fontWeight: '500', borderRight: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                  <span style={{ marginRight: '6px' }}>{row.glyph}</span>
                  <span>{row.name}</span>
                </td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>{row.positionStr}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>{row.domicile}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>{row.exaltation}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>{row.triplicity}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>{row.term}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>{row.face}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>{row.detriment}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>{row.fall}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>{row.peregrine}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: row.isNotApp ? '#8c8c8c' : '#003366' }}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
