import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { BindhuMatrix, BindhuObjectItem } from '../calculations/bindhuTypes';
import { ZODIAC_SIGNS } from '../calculations/bindhuTypes';

interface BindhuTableProps {
  matrix: BindhuMatrix;
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

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  sextile: '⚹',
  square: '□',
  trine: '△',
  opposition: '☍',
};

type ObjectCategory = 'all' | 'planets' | 'nodes' | 'lilith';

const PLANETS_IDS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const NODES_IDS = ['north_node', 'south_node'];
const LILITH_IDS = ['lilith'];

export const BindhuTable: React.FC<BindhuTableProps> = ({ matrix, selectedObjectId, onSelectObject }) => {
  const [category, setCategory] = useState<ObjectCategory>('all');
  const [showAspects, setShowAspects] = useState<boolean>(true);

  if (!matrix || !matrix.signs) {
    return <div style={{ padding: 16 }}>Нет данных матрицы Биндху</div>;
  }

  const isObjectVisible = (obj: BindhuObjectItem): boolean => {
    if (category === 'all') return true;
    if (category === 'planets') return PLANETS_IDS.includes(obj.id);
    if (category === 'nodes') return NODES_IDS.includes(obj.id);
    if (category === 'lilith') return LILITH_IDS.includes(obj.id);
    return true;
  };

  useEffect(() => {
    if (selectedObjectId) {
      const foundObj = matrix.allObjects.find(o => o.id === selectedObjectId);
      if (foundObj && !isObjectVisible(foundObj)) {
        if (onSelectObject) {
          onSelectObject(null);
        }
      }
    }
  }, [category, selectedObjectId, matrix]);

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '2px solid #ff9900', paddingBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
          Слой Биндху (12 знаков × 30°)
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#666', marginRight: '2px' }}>Объекты:</span>
            {[
              { key: 'all', label: 'Все' },
              { key: 'planets', label: 'Планеты' },
              { key: 'nodes', label: 'Узлы' },
              { key: 'lilith', label: 'Лилит' },
            ].map(cat => (
              <Button
                key={cat.key}
                size="small"
                type={category === cat.key ? 'primary' : 'default'}
                onClick={() => setCategory(cat.key as ObjectCategory)}
                style={{ fontSize: '11px', height: '22px', padding: '0 6px' }}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#666', marginRight: '2px' }}>Аспекты:</span>
            <Button
              size="small"
              type={showAspects ? 'primary' : 'default'}
              onClick={() => setShowAspects(!showAspects)}
              style={{ fontSize: '11px', height: '22px', padding: '0 6px' }}
            >
              {showAspects ? 'Включено' : 'Выключено'}
            </Button>
          </div>

          {selectedObjectId && (
            <Button 
              size="small" 
              onClick={() => onSelectObject && onSelectObject(null)}
              style={{ fontSize: '11px', height: '22px', padding: '0 6px' }}
            >
              Сбросить выбор
            </Button>
          )}
        </div>
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
        Структурированная координатная матрица натальной карты (360 позиций). Нажмите на объект для выделения.
      </p>

      <div className="astro-table-responsive-wrapper" style={{ border: '1px solid #d9d9d9', background: '#fff' }}>
        <table className="astro-table astro-table--dense" style={{ textAlign: 'center', minWidth: '950px' }}>
          <thead>
            <tr style={{ background: '#003366', color: '#fff' }}>
              <th style={{ padding: '4px 6px', border: '1px solid #406699', width: '90px', position: 'sticky', left: 0, zIndex: 2, background: '#003366' }}>
                Знак \ Градус
              </th>
              {Array.from({ length: 30 }, (_, i) => (
                <th key={i} className="astro-mono" style={{ padding: '4px 2px', border: '1px solid #406699', minWidth: '26px' }}>
                  {i}°
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ZODIAC_SIGNS.map((signName, signIndex) => {
              const row = matrix.signs[signName];
              return (
                <tr key={signName} style={{ background: signIndex % 2 === 0 ? '#fafafa' : '#fff' }}>
                  <td style={{ 
                    padding: '4px 6px', 
                    border: '1px solid #d9d9d9', 
                    fontWeight: 'bold', 
                    textAlign: 'left',
                    position: 'sticky', 
                    left: 0, 
                    zIndex: 1, 
                    background: signIndex % 2 === 0 ? '#f0f4f8' : '#ffffff',
                    color: '#003366'
                  }}>
                    {signName}
                  </td>
                  {row.cells.map(cell => {
                    const visibleObjects = cell.objects.filter(isObjectVisible);
                    const hasObjects = visibleObjects.length > 0;
                    const hasAspects = showAspects && cell.aspects.length > 0;
                    
                    return (
                      <td 
                        key={cell.degree} 
                        style={{ 
                          padding: '4px 1px', 
                          border: '1px solid #e8e8e8',
                          verticalAlign: 'middle',
                          background: hasObjects ? '#e6f7ff' : 'inherit'
                        }}
                        title={`${cell.sign} ${cell.degree}°${hasObjects ? ` | Объекты: ${visibleObjects.map(o => o.name).join(', ')}` : ''}`}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '24px' }}>
                          {hasObjects && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', justifyContent: 'center' }}>
                              {visibleObjects.map(obj => {
                                const symbol = PLANET_SYMBOLS[obj.id] || '•';
                                const isSelected = selectedObjectId === obj.id;
                                return (
                                  <span 
                                    key={obj.id} 
                                    onClick={() => onSelectObject && onSelectObject(isSelected ? null : obj.id)}
                                    style={{ 
                                      fontSize: '13px', 
                                      fontWeight: 'bold', 
                                      color: isSelected ? '#000' : '#003366', 
                                      background: isSelected ? '#ff9900' : 'transparent',
                                      padding: isSelected ? '0 3px' : '0',
                                      borderRadius: '2px',
                                      cursor: 'pointer' 
                                    }}
                                    title={`${obj.name} (${obj.sign} ${obj.degree.toFixed(2)}°) - Нажмите для выбора`}
                                  >
                                    {symbol}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {hasAspects && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', justifyContent: 'center', marginTop: '1px' }}>
                              {cell.aspects.map((asp, idx) => {
                                const aspSymbol = ASPECT_SYMBOLS[asp.aspectType] || '•';
                                const isAspectSelected = selectedObjectId && (asp.source.id === selectedObjectId || asp.target.id === selectedObjectId);
                                return (
                                  <span 
                                    key={idx} 
                                    style={{ 
                                      fontSize: '9px', 
                                      color: isAspectSelected ? '#ff4d4f' : '#fa8c16', 
                                      fontWeight: isAspectSelected ? 'bold' : 'normal' 
                                    }}
                                    title={`${asp.source.name} ${asp.aspectType} ${asp.target.name} (орб: ${asp.orb}°)`}
                                  >
                                    {aspSymbol}
                                  </span>
                                );
                              })}
                            </div>
                          )}
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

      <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <span><strong>Условные обозначения:</strong></span>
        <span>☉ Солнце</span>
        <span>☽ Луна</span>
        <span>☿ Меркурий</span>
        <span>♀ Венера</span>
        <span>♂ Марс</span>
        <span>♃ Юпитер</span>
        <span>♄ Сатурн</span>
        <span>♅ Уран</span>
        <span>♆ Нептун</span>
        <span>♇ Плутон</span>
        <span>☊ С.Узел</span>
        <span>☋ Ю.Узел</span>
        <span>⚸ Лилит</span>
      </div>
    </div>
  );
};