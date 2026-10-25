import React, { useState } from 'react';
import { HouseMatrixResult, HouseMatrixConnection, buildHouseMatrixGrid } from '../calculations/houseMatrixEngine';

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
  ceres: '⚳',
  pallas: '⚴',
  juno: '⚵',
  vesta: '⚶'
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
  lilith: 'Лилит',
  ceres: 'Церера',
  pallas: 'Паллада',
  juno: 'Юнона',
  vesta: 'Веста'
};

interface CellItem {
  text: string;
  planetId: string;
  type: string;
  nature: 'harmonious' | 'tense' | 'neutral';
  connection: HouseMatrixConnection;
}

export const HouseMatrixWidget: React.FC<HouseMatrixWidgetProps> = ({ matrix, selectedObjectId, onSelectObject }) => {
  const [modalCell, setModalCell] = useState<{ row: number; col: number; items: CellItem[] } | null>(null);
  const [aiExportOpen, setAiExportOpen] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  if (!matrix || !matrix.houses) {
    return <div style={{ padding: 16 }}>Нет данных Матрицы связей домов</div>;
  }

  // Build 12 x 12 grid
  const grid: Record<number, Record<number, CellItem[]>> = {};
  for (let r = 1; r <= 12; r++) {
    grid[r] = {};
    for (let c = 1; c <= 12; c++) {
      grid[r][c] = [];
    }
  }

  // 1. Populate ruler_in_house and intercepted_ruler_in_house (neutral structural placement, not colored harmonious/tense by default)
  for (const house of matrix.houses) {
    const managedHouse = house.number; // column
    const rulerHouse = house.rulerHouseNumber; // row
    const rulerPlanet = house.cuspRuler;
    const planetSymbol = PLANET_SYMBOLS[rulerPlanet] || '';

    if (rulerHouse >= 1 && rulerHouse <= 12 && managedHouse >= 1 && managedHouse <= 12) {
      grid[rulerHouse][managedHouse].push({
        text: `${planetSymbol} У`,
        planetId: rulerPlanet,
        type: 'ruler_in_house',
        nature: 'neutral',
        connection: {
          id: `h${house.number}-ruler-${rulerPlanet}-h${rulerHouse}`,
          type: 'ruler_in_house',
          sourceHouse: managedHouse,
          targetHouse: rulerHouse,
          rulerPlanet,
          rulerNameRu: PLANET_NAMES_RU[rulerPlanet] || rulerPlanet
        }
      });
    }

    if (house.interceptedCoRulers) {
      for (const co of house.interceptedCoRulers) {
        const coRow = co.rulerHouseNumber;
        const coCol = house.number;
        const coSymbol = PLANET_SYMBOLS[co.ruler] || '';
        if (coRow >= 1 && coRow <= 12 && coCol >= 1 && coCol <= 12) {
          grid[coRow][coCol].push({
            text: `${coSymbol} У`,
            planetId: co.ruler,
            type: 'intercepted_ruler',
            nature: 'neutral',
            connection: {
              id: `h${house.number}-intercepted-${co.sign}-${co.ruler}-h${coRow}`,
              type: 'intercepted_ruler_in_house',
              sourceHouse: coCol,
              targetHouse: coRow,
              sign: co.sign,
              rulerPlanet: co.ruler,
              rulerNameRu: co.rulerNameRu
            }
          });
        }
      }
    }
  }

  // 2. Populate aspect between rulers connections
  if (matrix.aspectBetweenRulers) {
    for (const asp of matrix.aspectBetweenRulers) {
      const houseA = asp.sourceHouse;
      const houseB = asp.targetHouse;
      const rulerA = asp.sourceRuler;
      const rulerB = asp.targetRuler;
      
      const symbolA = PLANET_SYMBOLS[rulerA] || '';
      const symbolB = PLANET_SYMBOLS[rulerB] || '';

      const isHarmonious = asp.aspectType === 'trine' || asp.aspectType === 'sextile';
      const isTense = asp.aspectType === 'square' || asp.aspectType === 'opposition';
      const nature: 'harmonious' | 'tense' | 'neutral' = isHarmonious ? 'harmonious' : isTense ? 'tense' : 'neutral';
      const signChar = isHarmonious ? '+' : isTense ? '−' : '⚬';

      const houseOfRulerA = matrix.houses.find(h => h.cuspRuler === rulerA)?.rulerHouseNumber || houseA;
      const houseOfRulerB = matrix.houses.find(h => h.cuspRuler === rulerB)?.rulerHouseNumber || houseB;

      if (houseOfRulerA >= 1 && houseOfRulerA <= 12 && houseB >= 1 && houseB <= 12) {
        grid[houseOfRulerA][houseB].push({
          text: `${symbolA} ${signChar}`,
          planetId: rulerA,
          type: 'aspect',
          nature,
          connection: asp
        });
      }
      if (houseOfRulerB >= 1 && houseOfRulerB <= 12 && houseA >= 1 && houseA <= 12) {
        grid[houseOfRulerB][houseA].push({
          text: `${symbolB} ${signChar}`,
          planetId: rulerB,
          type: 'aspect',
          nature,
          connection: asp
        });
      }
    }
  }

  // Build AI Export structured data payload
  const aiExportPayload = {
    metadata: {
      ruleSet: 'Shestopalov',
      houseSystem: matrix.houseSystem,
      calculatedAt: new Date().toISOString(),
      description: 'Структурированный экспорт матрицы связей домов по методу С. В. Шестопалова'
    },
    legend: {
      rulerInHouse: 'Управитель дома в доме (нейтральное структурное положение, обозначается У)',
      interceptedRulerInHouse: 'Управитель включенного знака в доме',
      harmoniousAspect: 'Гармоничный аспект между управителями (трин, секстиль) — благоприятная связь (+)',
      tenseAspect: 'Напряженный аспект между управителями (квадратура, оппозиция) — напряженная связь (−)',
      neutralAspect: 'Соединение или иная связь (нейтральная / неклассифицированная)',
      missingDataNote: 'При отсутствии планет или аспектов ячейка матрицы остается пустой'
    },
    houses: matrix.houses.map(h => ({
      number: h.number,
      name: h.name,
      cuspSign: h.cuspSign,
      cuspDegree: h.cuspDegree,
      cuspRuler: h.cuspRuler,
      rulerNameRu: h.rulerNameRu,
      rulerHouseNumber: h.rulerHouseNumber,
      planetsInsideCount: h.planetsInside.length,
      planetsInside: h.planetsInside.map(p => ({ id: p.id, name: p.name, sign: p.sign, degree: p.degree })),
      interceptedSigns: h.interceptedSigns || [],
      interceptedCoRulers: h.interceptedCoRulers || []
    })),
    connections: matrix.connections.map(conn => ({
      id: conn.id,
      type: conn.type,
      sourceHouse: conn.sourceHouse,
      targetHouse: conn.targetHouse,
      classificationRule: conn.type === 'ruler_in_house'
        ? 'Традиционный управитель куспида дома располагается в указанном доме (структурная связь)'
        : conn.type === 'intercepted_ruler_in_house'
        ? 'Управитель включенного знака в доме располагается в указанном доме'
        : `Аспект (${(conn as any).aspectNameRu}) между управителями домов в пределах допустимого орбиса`,
      details: conn
    })),
    matrixGrid: (() => {
      const grid = buildHouseMatrixGrid(matrix.connections);
      const exportedGrid: Record<number, Record<number, any[]>> = {};
      for (let r = 1; r <= 12; r++) {
        exportedGrid[r] = {};
        for (let c = 1; c <= 12; c++) {
          exportedGrid[r][c] = (grid[r]?.[c] || []).map(conn => ({
            id: conn.id,
            type: conn.type,
            sourceHouse: conn.sourceHouse,
            targetHouse: conn.targetHouse
          }));
        }
      }
      return exportedGrid;
    })(),
  };

  const handleCopyAiExport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(aiExportPayload, null, 2));
      setCopyStatus('Успешно скопировано в буфер обмена!');
      setTimeout(() => setCopyStatus(null), 3000);
    } catch (err) {
      setCopyStatus('Ошибка копирования. Проверьте разрешения браузера.');
      setTimeout(() => setCopyStatus(null), 3000);
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '12px', borderBottom: '2px solid #ff9900', paddingBottom: '6px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
          Интерактивная матрица связей домов (по Шестопалову)
        </h2>
        <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>
          Классическая матрица 12 × 12 (Система домов: {matrix.houseSystem})
        </div>
      </div>

      <div style={{ marginBottom: '12px', padding: '8px 10px', background: '#f0f5ff', border: '1px solid #91caff', fontSize: '12px', color: '#003366' }}>
        <strong>Правило чтения:</strong> Строки (I–XII) — дом, в котором находится управитель. Столбцы (I–XII) — дом, которым управляет этот управитель. 
        <br />
        Обозначения: <strong>У</strong> — управитель в доме (нейтрально); <strong>+</strong> — гармоничный аспект (синий); <strong>−</strong> — напряженный аспект (красный). Нажмите на ячейку для просмотра детальной информации.
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '10px', fontSize: '11px', flexWrap: 'wrap', background: '#fafafa', padding: '6px 10px', border: '1px solid #d9d9d9' }}>
        <strong>Легенда:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e6f7ff', border: '1px solid #91caff' }}></span>
          <span>Благоприятные связи (+)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fff1f0', border: '1px solid #ffa39e' }}></span>
          <span>Напряженные связи (−)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#f6f8fa', border: '1px solid #d9d9d9' }}></span>
          <span>Нейтральные / Базовые (У)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'linear-gradient(135deg, #e6f7ff 50%, #fff1f0 50%)', border: '1px solid #d9d9d9' }}></span>
          <span>Смешанные (благоприятные + напряженные)</span>
        </div>
      </div>

      {/* Grid Table with horizontal scroll on mobile */}
      <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', background: '#fff' }}>
        <table className="astro-table astro-table--dense" style={{ textAlign: 'center', minWidth: '750px', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#003366', color: '#fff' }}>
              <th style={{ padding: '6px', border: '1px solid #406699', width: '65px', position: 'sticky', left: 0, zIndex: 2, background: '#003366' }}>
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
                    const uniqueMap = new Map<string, CellItem>();
                    items.forEach(it => uniqueMap.set(it.text + '-' + it.planetId + '-' + it.type, it));
                    const uniqueItems = Array.from(uniqueMap.values());

                    const hasHarmonious = uniqueItems.some(i => i.nature === 'harmonious');
                    const hasTense = uniqueItems.some(i => i.nature === 'tense');

                    let cellBg = 'inherit';
                    if (hasHarmonious && hasTense) {
                      cellBg = 'linear-gradient(135deg, #e6f7ff 50%, #fff1f0 50%)';
                    } else if (hasTense) {
                      cellBg = '#fff1f0';
                    } else if (hasHarmonious) {
                      cellBg = '#e6f7ff';
                    } else if (uniqueItems.length > 0) {
                      cellBg = '#f6f8fa';
                    } else if (rowHouse === colHouse) {
                      cellBg = '#fffbe6';
                    }

                    return (
                      <td 
                        key={colHouse} 
                        onClick={() => {
                          if (uniqueItems.length > 0) {
                            setModalCell({ row: rowHouse, col: colHouse, items: uniqueItems });
                          }
                        }}
                        style={{ 
                          padding: '6px 2px', 
                          border: '1px solid #e8e8e8',
                          verticalAlign: 'middle',
                          background: cellBg,
                          cursor: uniqueItems.length > 0 ? 'pointer' : 'default',
                          transition: 'background 0.2s'
                        }}
                        title={uniqueItems.length > 0 ? `Строка ${rowHouse} -> Столбец ${colHouse}: ${uniqueItems.length} связь(ей). Нажмите для деталей.` : `Пусто (Строка ${rowHouse}, Столбец ${colHouse})`}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '26px', gap: '2px' }}>
                          {uniqueItems.map((item, idx) => {
                            const isSelected = selectedObjectId === item.planetId;
                            const badgeBg = item.nature === 'tense'
                              ? '#ff4d4f'
                              : item.nature === 'harmonious'
                              ? '#1890ff'
                              : '#003366';
                            return (
                              <span
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectObject) {
                                    onSelectObject(isSelected ? null : item.planetId);
                                  } else {
                                    setModalCell({ row: rowHouse, col: colHouse, items: uniqueItems });
                                  }
                                }}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  color: '#fff',
                                  background: isSelected ? '#ff9900' : badgeBg,
                                  padding: '1px 4px',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                                }}
                                title={`Планета: ${PLANET_NAMES_RU[item.planetId] || item.planetId} | Тип: ${item.type} | Характер: ${item.nature}`}
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

      {modalCell && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '4px',
            maxWidth: '550px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '2px solid #003366',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{ background: '#003366', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                Связи между домами: Строка {modalCell.row} → Столбец {modalCell.col}
              </h3>
              <button
                onClick={() => setModalCell(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px', fontSize: '13px', color: '#333' }}>
              <p style={{ margin: '0 0 12px 0', color: '#666', fontStyle: 'italic' }}>
                В данной ячейке обнаружено связей: {modalCell.items.length}. Ниже приведены все подробности расчёта, участвующие планеты, орбисы и классификация по правилам Шестопалова:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {modalCell.items.map((it, i) => {
                  const conn = it.connection;
                  const natureLabel = it.nature === 'tense'
                    ? 'Напряженная (−) [Квадратура / Оппозиция]'
                    : it.nature === 'harmonious'
                    ? 'Благоприятная (+) [Трин / Секстиль]'
                    : 'Нейтральная / Базовая [Управитель в доме / Соединение]';
                  const natureColor = it.nature === 'tense' ? '#ff4d4f' : it.nature === 'harmonious' ? '#1890ff' : '#003366';

                  return (
                    <div key={i} style={{ border: '1px solid #d9d9d9', padding: '10px', background: '#fafafa', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', color: '#003366', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                        <span>Тип связи: {conn.type === 'ruler_in_house' ? 'Управитель в доме' : conn.type === 'intercepted_ruler_in_house' ? 'Управитель включенного знака' : 'Аспект между управителями'}</span>
                        <span style={{ color: natureColor, fontSize: '12px' }}>
                          {natureLabel}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', marginTop: '6px' }}>
                        <div><strong>Участвующая планета:</strong> {PLANET_NAMES_RU[it.planetId] || it.planetId} ({PLANET_SYMBOLS[it.planetId] || ''})</div>
                        <div><strong>Управляемый дом (Колонка):</strong> {modalCell.col}</div>
                        <div><strong>Дом размещения (Строка):</strong> {modalCell.row}</div>
                        {(conn as any).aspectType && (
                          <>
                            <div><strong>Тип аспекта:</strong> {(conn as any).aspectNameRu || (conn as any).aspectType}</div>
                            <div><strong>Орбис:</strong> {(conn as any).orb != null ? `${(conn as any).orb}°` : 'Н/Д'}</div>
                            <div><strong>Точное расстояние:</strong> {(conn as any).exactAngularDistance != null ? `${(conn as any).exactAngularDistance}°` : 'Н/Д'}</div>
                          </>
                        )}
                        {(conn as any).sign && (
                          <div><strong>Знак:</strong> {(conn as any).sign}</div>
                        )}
                        <div style={{ gridColumn: 'span 2', color: '#555', fontStyle: 'italic', marginTop: '4px' }}>
                          <strong>Источник / Правило:</strong> Рассчитано в расчётном движке Swiss Ephemeris / HouseMatrixEngine без дублирования.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button
                  onClick={() => setModalCell(null)}
                  style={{
                    background: '#003366',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Data Collapsible Block */}
      <div style={{ marginTop: '16px', border: '1px solid #91caff', background: '#f0f5ff', borderRadius: '4px' }}>
        <div
          onClick={() => setAiExportOpen(!aiExportOpen)}
          style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold', color: '#003366', fontSize: '13px' }}
        >
          <span>🤖 Данные для анализа ИИ (Структурированный экспорт матрицы и связей)</span>
          <span>{aiExportOpen ? '▲ Скрыть' : '▼ Показать'}</span>
        </div>
        {aiExportOpen && (
          <div style={{ padding: '12px 14px', background: '#fff', borderTop: '1px solid #91caff', fontSize: '12px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#555' }}>
              Ниже представлены полные расчетные данные матрицы связей домов (включая дома, куспиды, управителей, атомарные связи с уникальными ID, правила классификации и разреженную матрицу):
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <button
                onClick={handleCopyAiExport}
                style={{
                  background: '#ff9900',
                  color: '#000',
                  border: 'none',
                  padding: '5px 12px',
                  fontWeight: 'bold',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Копировать для ИИ
              </button>
              {copyStatus && (
                <span style={{ color: copyStatus.includes('Ошибка') ? '#ff4d4f' : '#389e0d', fontWeight: 'bold' }}>
                  {copyStatus}
                </span>
              )}
            </div>
            <pre style={{
              background: '#f6f8fa',
              padding: '10px',
              borderRadius: '4px',
              overflowX: 'auto',
              maxHeight: '250px',
              fontSize: '11px',
              color: '#333',
              margin: 0,
              border: '1px solid #d9d9d9'
            }}>
              {JSON.stringify(aiExportPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
