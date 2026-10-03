import React, { useState } from 'react';
import { EnrichedChartResult } from '../calculations/planetLayer';
import { BirthData } from '../types';
import { calculateHouseLength, formatDegreeSeconds } from '../calculations/houseSpan';
import { calculateHouseAnalysis, getPlanetRuName } from '../calculations/houseAnalysis';

interface HousesWidgetProps {
  chart: EnrichedChartResult;
  birthData: BirthData;
}

const formatDegree = (deg: number): string => {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'`;
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const INTERCEPTED_VERB_BY_SIGN: Record<string, string> = {
  'Дева': 'включена',
  'Рыбы': 'включены'
};

const interceptedLabel = (signs: string[]): string =>
  signs.map(s => `${s} ${INTERCEPTED_VERB_BY_SIGN[s] || 'включён'}`).join(', ');

const PLANET_NAMES_RU: Record<string, string> = {
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
  lilith: 'Лилит'
};

export const HousesWidget: React.FC<HousesWidgetProps> = ({ chart, birthData }) => {
  const [connectionsOpen, setConnectionsOpen] = useState(true);
  const [openHouses, setOpenHouses] = useState<Record<number, boolean>>({});

  const toggleHouse = (houseNum: number) => {
    setOpenHouses(prev => ({ ...prev, [houseNum]: !prev[houseNum] }));
  };

  if (!chart || !chart.houses) {
    return <div style={{ padding: 16 }}>Нет данных о домах</div>;
  }

  const houseAnalysisResult = calculateHouseAnalysis(chart);
  const { houses } = chart;
  const angles = houses.angles;

  const houseSystemLabels: Record<string, string> = {
    Placidus: 'Плацидус',
    Koch: 'Кох',
    KochShestopalov: 'Шестопалов',
    Equal: 'Равнодомная от ASC',
    Regiomontanus: 'Региомонтан',
    WholeSign: 'Цельнознаковая (Whole Sign)'
  };

  const systemName = houseSystemLabels[houses.system] || houses.system;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '12px', borderBottom: '2px solid #ff9900', paddingBottom: '6px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
          Дома
        </h2>
      </div>

      <div style={{ marginBottom: '16px', fontSize: '13px', color: '#333' }}>
        <strong>Система домов:</strong> {systemName}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#003366', margin: '0 0 6px 0' }}>
          Дома: ({systemName})
        </h3>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', background: '#fff' }}>
        <table className="astro-table" style={{ textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#003366', color: '#fff' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', width: '80px', textAlign: 'center' }}>Дом</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', width: '180px' }}>Знак и градус куспида</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', width: '130px' }}>Протяжённость</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Абсолютная долгота</th>
            </tr>
          </thead>
          <tbody>
            {houses.cusps.map((cusp, index) => {
              const isAngle = cusp.number === 1 || cusp.number === 10 || cusp.number === 4 || cusp.number === 7;
              let angleLabel = '';
              if (cusp.number === 1) angleLabel = ' (AC)';
              else if (cusp.number === 10) angleLabel = ' (MC)';
              else if (cusp.number === 4) angleLabel = ' (IC)';
              else if (cusp.number === 7) angleLabel = ' (DC)';

              const nextCusp = houses.cusps[(index + 1) % 12];
              const span = calculateHouseLength(cusp.longitude, nextCusp.longitude);

              return (
                <tr key={cusp.number} style={{ background: index % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', fontWeight: isAngle ? 'bold' : 'normal', textAlign: 'center', color: '#003366', background: index % 2 === 0 ? '#f0f4f8' : '#fff' }}>
                    {cusp.number} дом{angleLabel}
                  </td>
                  <td className="astro-sign-cell" style={{ padding: '8px', fontWeight: isAngle ? 'bold' : 'normal' }}>
                    {cusp.sign} <span className="astro-degree astro-mono astro-degree-cell">{formatDegree(cusp.degree)}</span>
                  </td>
                  <td className="astro-mono astro-degree-cell" style={{ padding: '8px', color: '#333' }}>
                    {formatDegreeSeconds(span)}
                  </td>
                  <td className="astro-mono" style={{ padding: '8px', color: '#666' }}>
                    {cusp.longitude.toFixed(2)}°
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '32px' }}>
        <div style={{ marginBottom: '12px', borderBottom: '2px solid #ff9900', paddingBottom: '6px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
            Анализ домов
          </h2>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', background: '#fff' }}>
          <table className="astro-table" style={{ textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#003366', color: '#fff' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', width: '70px', textAlign: 'center' }}>Дом</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', width: '140px' }}>Знак на куспиде</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', width: '120px' }}>Управитель</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', width: '140px' }}>Где стоит управитель</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Планеты в доме</th>
              </tr>
            </thead>
            <tbody>
              {houseAnalysisResult.houses.map((houseItem, index) => {
                const romanHouse = ROMAN_NUMERALS[houseItem.houseNumber - 1] || String(houseItem.houseNumber);
                const rulerNameRu = PLANET_NAMES_RU[houseItem.ruler] || houseItem.ruler;
                const rulerHouseRoman = ROMAN_NUMERALS[houseItem.rulerHouse - 1] || String(houseItem.rulerHouse);
                const planetsStr = houseItem.planetsInHouse.length > 0
                  ? houseItem.planetsInHouse.map(p => p.name).join(', ')
                  : '—';

                return (
                  <tr key={houseItem.houseNumber} style={{ background: index % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', textAlign: 'center', color: '#003366', background: index % 2 === 0 ? '#f0f4f8' : '#fff' }}>
                      {romanHouse}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {houseItem.cuspSign}
                      {houseItem.interceptedSigns.length > 0 && (
                        <span style={{ color: '#666' }}> ({interceptedLabel(houseItem.interceptedSigns)})</span>
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {rulerNameRu}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {rulerHouseRoman} дом
                    </td>
                    <td style={{ padding: '8px' }}>
                      {planetsStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <div 
          onClick={() => setConnectionsOpen(!connectionsOpen)}
          style={{ 
            marginBottom: '12px', 
            borderBottom: '2px solid #ff9900', 
            paddingBottom: '6px', 
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none'
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
            Связи домов
          </h2>
          <span style={{ fontSize: '14px', color: '#003366', fontWeight: 'bold' }}>
            {connectionsOpen ? '▲' : '▼'}
          </span>
        </div>

        {connectionsOpen && (
          <div style={{ border: '1px solid #d9d9d9', background: '#fff', padding: '16px' }}>
            {houseAnalysisResult.houses.map((houseItem) => {
              const isOpen = !!openHouses[houseItem.houseNumber];

              return (
                <div key={houseItem.houseNumber} style={{ marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                  <div 
                    onClick={() => toggleHouse(houseItem.houseNumber)}
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#003366', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      userSelect: 'none'
                    }}
                  >
                    <span>{isOpen ? '▾' : '▸'}</span>
                    <span>{houseItem.houseNumber} дом</span>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: '8px', marginLeft: '16px', fontSize: '13px', color: '#333' }}>
                      {houseItem.connections.length > 0 ? (
                        houseItem.connections.map((conn, idx) => (
                          <div key={idx} style={{ marginBottom: '4px', fontFamily: 'monospace', fontSize: '12px' }}>
                            • {conn.detailText}
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#888' }}>—</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
