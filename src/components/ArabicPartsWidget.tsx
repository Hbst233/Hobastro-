import React, { useState } from 'react';
import { EnrichedChartResult } from '../calculations/planetLayer';
import { calculateArabicParts, ArabicPartsCollection, ArabicPartResult } from '../calculations/arabicParts';

interface ArabicPartsWidgetProps {
  chart: EnrichedChartResult;
  selectedParts: Record<string, boolean>;
  onTogglePart: (id: string) => void;
}

const formatDegree = (deg: number): string => {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'`;
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const ArabicPartsWidget: React.FC<ArabicPartsWidgetProps> = ({ chart, selectedParts, onTogglePart }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!chart) {
    return null;
  }

  let collection: ArabicPartsCollection | null = null;
  try {
    collection = calculateArabicParts(chart);
  } catch (e) {
    return (
      <div style={{ marginTop: '24px', padding: '12px', background: '#fff', border: '1px solid #d9d9d9', fontSize: '13px', color: '#ff4d4f' }}>
        Не удалось рассчитать арабские жребии: {String(e)}
      </div>
    );
  }

  const { isDayChart, parts } = collection;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '12px', borderBottom: '2px solid #ff9900', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#003366', margin: 0 }}>
          Арабские жребии ({isDayChart ? 'Дневная карта' : 'Ночная карта'})
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

      {isExpanded && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f9fbfd', border: '1px solid #b7dcff', borderRadius: '4px', fontSize: '13px', color: '#333', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Метод расчёта:</strong> Традиционные арабские жребии (Аль-Бируни, Птолемей). Формулы зависят от типа карты (дневная/ночная).
          </p>
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid #d9d9d9', background: '#fff' }}>
        <table className="astro-table" style={{ textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#003366', color: '#fff' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', textAlign: 'center', width: '60px' }}>На колесе</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Жребий</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Знак / градус</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Дом</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Формула</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>Долгота</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part, index) => {
              const romanHouse = ROMAN_NUMERALS[part.house - 1] || String(part.house);
              const isChecked = !!selectedParts[part.id];

              return (
                <tr key={part.id} style={{ background: index % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onTogglePart(part.id)}
                      title={`Показать ${part.name} на колесе`}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                  <td style={{ padding: '8px', fontWeight: '500', color: '#003366' }}>
                    {part.name}
                  </td>
                  <td className="astro-mono astro-degree-cell" style={{ padding: '8px' }}>
                    {part.sign} {formatDegree(part.degree)}
                  </td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: '#003366' }}>
                    {romanHouse} дом ({part.house})
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', color: '#555' }}>
                    <code>{part.formula}</code>
                  </td>
                  <td className="astro-mono" style={{ padding: '8px', color: '#666' }}>
                    {part.longitude.toFixed(2)}°
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
