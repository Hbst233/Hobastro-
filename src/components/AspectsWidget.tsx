import React from 'react';
import { EnrichedChartResult } from '../calculations/planetLayer';
import { AspectResult, MAX_ORB } from '../calculations/aspectEngine';

interface AspectsWidgetProps {
  chart: EnrichedChartResult;
  aspects: AspectResult[];
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
  ascendant: 'ASC',
  mc: 'MC',
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

export const AspectsWidget: React.FC<AspectsWidgetProps> = ({ chart, aspects }) => {
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
    // Check if angle ASC or MC
    if (id === 'ascendant' && chart.houses?.angles?.ascendant) {
      const asc = chart.houses.angles.ascendant;
      // house 1
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

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '12px', borderBottom: '2px solid #ff9900', paddingBottom: '6px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
          Аспекты
        </h2>
      </div>

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
            {filteredAspects.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '16px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                  Не найдено аспектов в пределах орбиса {MAX_ORB}°
                </td>
              </tr>
            ) : (
              filteredAspects.map((asp, index) => {
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
