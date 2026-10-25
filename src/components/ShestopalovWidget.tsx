import React from 'react';
import { ShestopalovData } from '../calculations/shestopalovEngine';
import { HouseMatrixResult } from '../calculations/houseMatrixEngine';
import { HouseMatrixWidget } from './HouseMatrixWidget';

interface ShestopalovWidgetProps {
  data: ShestopalovData;
  onToggle: (enabled: boolean) => void;
  matrix?: HouseMatrixResult | null;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
}

export const ShestopalovWidget: React.FC<ShestopalovWidgetProps> = ({
  data,
  onToggle,
  matrix,
  selectedObjectId,
  onSelectObject
}) => {
  return (
    <div style={{ 
      marginTop: '16px', 
      padding: '12px 16px', 
      background: data.isKoch ? '#f0f5ff' : '#fffbe6', 
      border: `1px solid ${data.isKoch ? '#91caff' : '#ffe58f'}`, 
      fontSize: 13 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#003366' }}>
            Режим Шестопалова (Система домов Кох)
          </h3>
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 6px', 
            borderRadius: '2px', 
            background: data.isKoch ? '#d9f7be' : '#fff1f0', 
            color: data.isKoch ? '#389e0d' : '#cf1322',
            fontWeight: 'bold'
          }}>
            {data.isKoch ? 'Доступен' : 'Недоступен'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Текущая система домов: <strong>{data.houseSystem}</strong>
          </span>
          {data.isKoch ? (
            <button
              onClick={() => onToggle(!data.enabled)}
              style={{
                background: data.enabled ? '#003366' : '#fff',
                color: data.enabled ? '#fff' : '#003366',
                border: '1px solid #003366',
                padding: '3px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                borderRadius: '2px'
              }}
            >
              {data.enabled ? 'Шестопалов активен' : 'Включить Шестопалова'}
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: '#cf1322', fontStyle: 'italic' }}>
              Требуется Кох
            </span>
          )}
        </div>
      </div>

      {!data.isKoch && (
        <div style={{ marginTop: '8px', color: '#cf1322', fontSize: '12px', background: '#fff', padding: '8px', border: '1px solid #ffa39e' }}>
          Метод Шестопалова доступен только при выборе системы домов Кох. Измените систему домов.
        </div>
      )}

      {data.isKoch && data.enabled && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '12px', color: '#003366', background: '#fff', padding: '8px', border: '1px solid #adc6ff', marginBottom: '8px' }}>
            <p style={{ margin: '0 0 4px 0' }}><strong>Состояние:</strong> Интерактивная матрица связей домов по методу С. В. Шестопалова успешно встроена.</p>
            <p style={{ margin: 0, color: '#555' }}>Используются точные астрономические данные из общего кэша без повторного расчета.</p>
          </div>

          {matrix && (
            <HouseMatrixWidget
              matrix={matrix}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
            />
          )}
        </div>
      )}
    </div>
  );
};
