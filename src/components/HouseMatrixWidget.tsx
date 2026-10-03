import React, { useState } from 'react';
import { HouseMatrixResult } from '../calculations/houseMatrixEngine';
import { EnrichedPlanetPosition } from '../calculations/planetLayer';

interface HouseMatrixWidgetProps {
  matrix: HouseMatrixResult;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
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

export const HouseMatrixWidget: React.FC<HouseMatrixWidgetProps> = ({ matrix, selectedObjectId, onSelectObject }) => {
  if (!matrix || !matrix.houses) {
    return <div style={{ padding: 16 }}>Нет данных Матрицы связей домов</div>;
  }

  // Build 12 x 12 grid where:
  // row = house where the ruler is located (or house associated with the connection source)
  // col = house ruled (target house)
  // As requested:
  // "Если управитель I дома находится в III доме: строка = III, столбец = I. В ячейке: Марс У"
  // "Если управитель II дома находится в I доме: строка = I, столбец = II. В ячейке: Венера У"
  // General rule for ruler in house:
  // house ruled = X (column), ruler of X is located in house Y (row). So row = Y, col = X.
  // For aspect between rulers (house A ruler and house B ruler have an aspect):
  // ruler of house A is in house Ha, ruler of house B is in house Hb.
  // Wait, let's map aspect connections as well or focus on the exact specification:
  // "строка = дом, в котором находится управитель; столбцы по вертикали = дом, которым управляет этот управитель; пересечение строки и столбца = связь между этими домами."
  
  const grid: Record<number, Record<number, { text: string; planetId: string; type: string }[]>> = {};
  for (let r = 1; r <= 12; r++) {
    grid[r] = {};
    for (let c = 1; c <= 12; c++) {
      grid[r][c] = [];
    }
  }

  // 1. Populate ruler in house connections
  // For each house X (1 to 12), its cusp ruler is house.cuspRuler, located in house.rulerHouseNumber (Y).
  // Column = X (house managed), Row = Y (house where ruler resides).
  for (const house of matrix.houses) {
    const managedHouse = house.number; // column
    const rulerHouse = house.rulerHouseNumber; // row
    const rulerPlanet = house.cuspRuler;
    const planetSymbol = PLANET_SYMBOLS[rulerPlanet] || '';

    if (rulerHouse >= 1 && rulerHouse <= 12 && managedHouse >= 1 && managedHouse <= 12) {
      grid[rulerHouse][managedHouse].push({
        text: `${planetSymbol} У`,
        planetId: rulerPlanet,
        type: 'ruler_in_house'
      });
    }

    // Also check intercepted signs / co-rulers if present
    if (house.interceptedCoRulers) {
      for (const co of house.interceptedCoRulers) {
        const coRow = co.rulerHouseNumber;
        const coCol = house.number;
        const coSymbol = PLANET_SYMBOLS[co.ruler] || '';
        if (coRow >= 1 && coRow <= 12 && coCol >= 1 && coCol <= 12) {
          grid[coRow][coCol].push({
            text: `${coSymbol} У`,
            planetId: co.ruler,
            type: 'intercepted_ruler'
          });
        }
      }
    }
  }

  // 2. Populate aspect between rulers connections (+ for trine/sextile, - for square/opposition, conjunction can be + or neutral or marked appropriately)
  // Let's check aspectBetweenRulers:
  // connection between houseA and houseB via their rulers
  if (matrix.aspectBetweenRulers) {
    for (const asp of matrix.aspectBetweenRulers) {
      const houseA = asp.sourceHouse;
      const houseB = asp.targetHouse;
      const rulerA = asp.sourceRuler;
      const rulerB = asp.targetRuler;
      
      const symbolA = PLANET_SYMBOLS[rulerA] || '';
      const symbolB = PLANET_SYMBOLS[rulerB] || '';

      const isHarmonious = asp.aspectType === 'trine' || asp.aspectType === 'sextile' || asp.aspectType === 'conjunction';
      const signChar = isHarmonious ? '+' : '−';

      // Ruler A manages houseA, is located in house where rulerA is... wait, aspect between ruler of houseA and ruler of houseB.
      // Let's find house location of rulerA and rulerB from matrix.houses
      const houseOfRulerA = matrix.houses.find(h => h.cuspRuler === rulerA)?.rulerHouseNumber || houseA;
      const houseOfRulerB = matrix.houses.find(h => h.cuspRuler === rulerB)?.rulerHouseNumber || houseB;

      // According to matrix policy: row = house of ruler A, col = house B (or symmetric)
      if (houseOfRulerA >= 1 && houseOfRulerA <= 12 && houseB >= 1 && houseB <= 12) {
        grid[houseOfRulerA][houseB].push({
          text: `${symbolA} ${signChar}`,
          planetId: rulerA,
          type: 'aspect'
        });
      }
      if (houseOfRulerB >= 1 && houseOfRulerB <= 12 && houseA >= 1 && houseA <= 12) {
        grid[houseOfRulerB][houseA].push({
          text: `${symbolB} ${signChar}`,
          planetId: rulerB,
          type: 'aspect'
        });
      }
    }
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '12px', borderBottom: '2px solid #ff9900', paddingBottom: '6px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
          Матрица (связи домов)
        </h2>
        <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>
          Классическая матрица связей 12 × 12 (Система домов: {matrix.houseSystem})
        </div>
      </div>

      <div style={{ marginBottom: '12px', padding: '8px 10px', background: '#f0f5ff', border: '1px solid #91caff', fontSize: '12px', color: '#003366' }}>
        <strong>Правило чтения:</strong> Строки (I–XII) — дом, в котором находится управитель. Столбцы (I–XII) — дом, которым управляет этот управитель. 
        <br />
        Обозначения: <strong>У</strong> — положение управителя; <strong>+</strong> — гармоничный аспект; <strong>−</strong> — напряженный аспект.
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', background: '#fff' }}>
        <table className="astro-table astro-table--dense" style={{ textAlign: 'center', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#003366', color: '#fff' }}>
              <th style={{ padding: '6px', border: '1px solid #406699', width: '60px', position: 'sticky', left: 0, zIndex: 2, background: '#003366' }}>
                Дом \ Дом
              </th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i + 1} style={{ padding: '6px 4px', border: '1px solid #406699', minWidth: '45px' }} title={`Управляемый дом ${i + 1}`}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, rIdx) => {
              const rowHouse = rIdx + 1;
              return (
                <tr key={rowHouse} style={{ background: rIdx % 2 === 0 ? '#fafafa' : '#fff' }}>
                  <td style={{ 
                    padding: '6px', 
                    border: '1px solid #d9d9d9', 
                    fontWeight: 'bold', 
                    textAlign: 'center',
                    position: 'sticky', 
                    left: 0, 
                    zIndex: 1, 
                    background: rIdx % 2 === 0 ? '#f0f4f8' : '#ffffff',
                    color: '#003366'
                  }}>
                    {rowHouse}
                  </td>
                  {Array.from({ length: 12 }, (_, cIdx) => {
                    const colHouse = cIdx + 1;
                    const items = grid[rowHouse][colHouse] || [];
                    // Deduplicate identical items in cell
                    const uniqueMap = new Map<string, { text: string; planetId: string; type: string }>();
                    items.forEach(it => uniqueMap.set(it.text, it));
                    const uniqueItems = Array.from(uniqueMap.values());

                    const hasItems = uniqueItems.length > 0;

                    return (
                      <td 
                        key={colHouse} 
                        style={{ 
                          padding: '6px 2px', 
                          border: '1px solid #e8e8e8',
                          verticalAlign: 'middle',
                          background: rowHouse === colHouse ? '#fffbe6' : hasItems ? '#e6f7ff' : 'inherit'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '26px', gap: '2px' }}>
                          {uniqueItems.map((item, idx) => {
                            const isSelected = selectedObjectId === item.planetId;
                            return (
                              <span
                                key={idx}
                                onClick={() => onSelectObject && onSelectObject(isSelected ? null : item.planetId)}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  color: isSelected ? '#000' : '#003366',
                                  background: isSelected ? '#ff9900' : 'transparent',
                                  padding: isSelected ? '1px 3px' : '0',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                title={`Планета: ${PLANET_NAMES_RU[item.planetId] || item.planetId} | Строка (дом управителя) = ${rowHouse}, Столбец (управляемый дом) = ${colHouse}`}
                              >
                                {item.text}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
