import React, { useState } from 'react';
import { EnrichedChartResult, EnrichedPlanetPosition } from '../calculations/planetLayer';
import { AspectResult } from '../calculations/aspectEngine';

interface ChartWheelProps {
  chart?: EnrichedChartResult; // For natal mode
  natalChart?: EnrichedChartResult; // For biwheel mode
  transitChart?: EnrichedChartResult; // For biwheel mode
  aspects?: AspectResult[]; // Natal aspects
  transitAspects?: AspectResult[]; // Transit -> Natal aspects
  mode?: 'natal' | 'biwheel';
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
  theme?: 'dark' | 'light';
}

const ZODIAC_SIGNS = [
  { name: 'Овен', symbol: '♈\uFE0E', element: 'fire', color: '#ff5722' },
  { name: 'Телец', symbol: '♉\uFE0E', element: 'earth', color: '#66bb6a' },
  { name: 'Близнецы', symbol: '♊\uFE0E', element: 'air', color: '#29b6f6' },
  { name: 'Рак', symbol: '♋\uFE0E', element: 'water', color: '#42a5f5' },
  { name: 'Лев', symbol: '♌\uFE0E', element: 'fire', color: '#ffa726' },
  { name: 'Дева', symbol: '♍\uFE0E', element: 'earth', color: '#81c784' },
  { name: 'Весы', symbol: '♎\uFE0E', element: 'air', color: '#81d4fa' },
  { name: 'Скорпион', symbol: '♏\uFE0E', element: 'water', color: '#26c6da' },
  { name: 'Стрелец', symbol: '♐\uFE0E', element: 'fire', color: '#ff7043' },
  { name: 'Козерог', symbol: '♑\uFE0E', element: 'earth', color: '#a1887f' },
  { name: 'Водолей', symbol: '♒\uFE0E', element: 'air', color: '#4fc3f7' },
  { name: 'Рыбы', symbol: '♓\uFE0E', element: 'water', color: '#00bcd4' },
];

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

export const ChartWheel: React.FC<ChartWheelProps> = ({
  chart,
  natalChart,
  transitChart,
  aspects = [],
  transitAspects = [],
  mode = 'natal',
  selectedObjectId,
  onSelectObject,
  theme = 'light'
}) => {
  const isLight = theme === 'light';
  const colors = {
    bg: isLight ? '#ffffff' : '#141414',
    border: isLight ? '#d9d9d9' : '#333333',
    subtleBorder: isLight ? '#f0f0f0' : '#222222',
    outerRingBg: isLight ? '#fafafa' : '#1f1f1f',
    containerBg: isLight ? '#ffffff' : '#141414',
    textMain: isLight ? '#262626' : '#f0f0f0',
    textMuted: isLight ? '#595959' : '#a6a6a6',
    textSubtle: isLight ? '#8c8c8c' : '#737373',
    aspectDefault: isLight ? '#d9d9d9' : '#434343',
    aspectTrine: isLight ? '#1890ff' : '#38bdf8',
    aspectSextile: isLight ? '#52c41a' : '#4ade80',
    aspectSquare: isLight ? '#f5222d' : '#f87171',
    aspectOpposition: isLight ? '#cf1322' : '#ef4444',
    planetCircleFill: isLight ? '#ffffff' : '#1f1f1f',
    planetCircleStroke: isLight ? '#d9d9d9' : '#434343',
    transitPlanetFill: isLight ? '#fffbe6' : '#1f1e15',
    transitPlanetStroke: isLight ? '#faad14' : '#eab308',
  };

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const activeChart = mode === 'biwheel' ? natalChart : chart;
  if (!activeChart) return null;

  const ascLongitude = activeChart.houses.angles.ascendant.longitude;
  const mcLongitude = activeChart.houses.angles.mc.longitude;
  const dscLongitude = activeChart.houses.angles.descendant.longitude;
  const icLongitude = activeChart.houses.angles.ic.longitude;

  const rotationOffset = 180 - ascLongitude;
  const getRotatedAngle = (lon: number) => (lon + rotationOffset) % 360;

  const size = 600;
  const center = size / 2;
  const wheelRadius = center;

  // Radii layout strictly matching clone proportions (relative to wheelRadius):
  // Center -> Aspect Area (0 - 0.55R) -> Planet Track (0.55R - 0.68R) -> House Cusps & Numbers (0.73R - 0.78R) -> Degree Scale (0.78R - 0.83R) -> Zodiac Signs Ring (0.83R - 1.0R)
  const aspectRadius = wheelRadius * 0.275;
  const houseBoundaryRadius = mode === 'biwheel' ? wheelRadius * 0.73 : wheelRadius * 0.73;
  const houseNumberRadius = wheelRadius * 0.755;
  const natalPlanetOrbitRadius = mode === 'biwheel' ? wheelRadius * 0.61 : wheelRadius * 0.615;
  const transitPlanetOrbitRadius = mode === 'biwheel' ? wheelRadius * 0.70 : wheelRadius * 0.615;
  const degreeScaleInnerRadius = wheelRadius * 0.78;
  const degreeScaleOuterRadius = wheelRadius * 0.83;
  const zodiacInnerRadius = wheelRadius * 0.83;
  const outerRadius = wheelRadius;

  const signRadius = zodiacInnerRadius;

  const polarToCartesian = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180.0;
    return {
      x: center + radius * Math.cos(rad),
      y: center - radius * Math.sin(rad),
    };
  };

  const getAdjustedPlanetPositions = (positions: EnrichedPlanetPosition[], orbitRadius: number) => {
    const sorted = [...positions].sort((a, b) => a.longitude - b.longitude);
    const res: { planet: EnrichedPlanetPosition; x: number; y: number; originalX: number; originalY: number; angle: number; currentRadius: number }[] = [];
    const minAngleDiff = 5.5;

    sorted.forEach((planet, idx) => {
      let angle = getRotatedAngle(planet.longitude);
      let currentRadius = orbitRadius;

      if (idx > 0) {
        const prev = res[idx - 1];
        const diff = (angle - prev.angle + 360) % 360;
        if (diff < minAngleDiff && diff > -minAngleDiff) {
          angle = (prev.angle + minAngleDiff) % 360;
          currentRadius = prev.currentRadius === orbitRadius ? orbitRadius + 12 : orbitRadius;
        }
      }
      const pos = polarToCartesian(angle, currentRadius);
      const origPos = polarToCartesian(angle, orbitRadius);
      res.push({ planet, x: pos.x, y: pos.y, originalX: origPos.x, originalY: origPos.y, angle, currentRadius });
    });

    return res;
  };

  const natalAdjustedPlanets = getAdjustedPlanetPositions(activeChart.positions, natalPlanetOrbitRadius);
  const transitAdjustedPlanets = mode === 'biwheel' && transitChart 
    ? getAdjustedPlanetPositions(transitChart.positions, transitPlanetOrbitRadius) 
    : [];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '100%', margin: '16px auto', padding: '8px', display: 'flex', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: '100%', maxWidth: '780px', height: 'auto', background: colors.bg, border: 'none', borderRadius: '0', boxShadow: 'none' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

              {/* 1. Base Background */}
              <circle cx={center} cy={center} r={outerRadius} fill={colors.bg} stroke="none" />

              {/* 2. Degree Scale & Outer Markers */}
              <circle cx={center} cy={center} r={outerRadius} fill={colors.outerRingBg} stroke="none" />
              <circle cx={center} cy={center} r={zodiacInnerRadius} fill={colors.containerBg} stroke="none" />
              <circle cx={center} cy={center} r={degreeScaleInnerRadius} fill="none" stroke="none" />

        {Array.from({ length: 360 }).map((_, deg) => {
          const rotDeg = getRotatedAngle(deg);
          const isSignBoundary = deg % 30 === 0;
          const isTenDeg = deg % 10 === 0;
          const isFiveDeg = deg % 5 === 0;
          
          let tickLength = 3;
          let strokeWidth = 0.5;
          let strokeColor = colors.textSubtle;

          if (isSignBoundary) {
            tickLength = zodiacInnerRadius - degreeScaleInnerRadius;
            strokeWidth = 1.2;
            strokeColor = colors.textMain;
          } else if (isTenDeg) {
            tickLength = 6;
            strokeWidth = 0.9;
            strokeColor = colors.textMuted;
          } else if (isFiveDeg) {
            tickLength = 4.5;
            strokeWidth = 0.7;
            strokeColor = colors.textSubtle;
          }

          const pOuter = polarToCartesian(rotDeg, zodiacInnerRadius);
          const pInner = polarToCartesian(rotDeg, zodiacInnerRadius - tickLength);
          const showNumber = isTenDeg && !isSignBoundary;
          const numPos = showNumber ? polarToCartesian(rotDeg, degreeScaleInnerRadius + 3) : null;
          const localDeg = deg % 30;

          return (
            <g key={deg}>
              <line x1={pOuter.x} y1={pOuter.y} x2={pInner.x} y2={pInner.y} stroke={strokeColor} strokeWidth={strokeWidth} />
              {showNumber && numPos && (
                <text x={numPos.x} y={numPos.y} textAnchor="middle" dominantBaseline="central" fontSize="5.5" fill={colors.textMuted} fontFamily="sans-serif">
                  {localDeg}
                </text>
              )}
            </g>
          );
        })}

        {/* 3. Zodiac Sign Sectors & Glyphs */}
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="none" />
        <circle cx={center} cy={center} r={zodiacInnerRadius} fill="none" stroke="none" />
        {ZODIAC_SIGNS.map((sign, index) => {
          const startLon = index * 30;
          const midLon = startLon + 15;
          const rotStart = getRotatedAngle(startLon);
          const rotMid = getRotatedAngle(midLon);

          const p1 = polarToCartesian(rotStart, outerRadius);
          const p2 = polarToCartesian(rotStart, zodiacInnerRadius);
          const textPos = polarToCartesian(rotMid, (outerRadius + zodiacInnerRadius) / 2);

          return (
            <g key={sign.name}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={colors.border} strokeWidth="1" />
              <text x={textPos.x} y={textPos.y} textAnchor="middle" dominantBaseline="central" fontSize="21.25" fill={sign.color} fontWeight="600">
                {sign.symbol}
              </text>
            </g>
          );
        })}

        {/* 4. House Cusps, Angles & House Numbers */}
        <circle cx={center} cy={center} r={aspectRadius} fill={colors.containerBg} stroke={colors.border} strokeWidth="1" />
        <circle cx={center} cy={center} r={houseBoundaryRadius} fill="none" stroke={colors.textMuted} strokeWidth="1" />
        <circle cx={center} cy={center} r={degreeScaleInnerRadius} fill="none" stroke={colors.border} strokeWidth="0.8" />

        {activeChart.houses.cusps.map((cusp, index) => {
          const rotLon = getRotatedAngle(cusp.longitude);
          const pInner = polarToCartesian(rotLon, aspectRadius);
          const pOuter = polarToCartesian(rotLon, houseBoundaryRadius);
          const isAngleCusp = cusp.number === 1 || cusp.number === 4 || cusp.number === 7 || cusp.number === 10;

          // Calculate house number position between this cusp and the next cusp
          const nextCusp = activeChart.houses.cusps[(index + 1) % 12];
          const nextRotLon = getRotatedAngle(nextCusp.longitude);
          let midRot = (rotLon + nextRotLon) / 2;
          if (Math.abs(rotLon - nextRotLon) > 180) {
            midRot = (midRot + 180) % 360;
          }
          const houseNumPos = polarToCartesian(midRot, houseNumberRadius);

          // Convert house number to roman numeral
          const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
          const romanNum = romanNumerals[cusp.number - 1] || String(cusp.number);

          return (
            <g key={cusp.id}>
              <line
                x1={pInner.x} y1={pInner.y}
                x2={pOuter.x} y2={pOuter.y}
                stroke={colors.textSubtle}
                strokeWidth={isAngleCusp ? "2" : "0.8"}
                strokeDasharray={isAngleCusp ? undefined : "3,3"}
              />
              <text
                x={houseNumPos.x}
                y={houseNumPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="8"
                fontWeight="600"
                fill={colors.textMuted}
                fontFamily="sans-serif"
              >
                {romanNum}
              </text>
            </g>
          );
        })}

        {/* ASC / DSC / MC / IC */}
        {(() => {
          const ascRot = getRotatedAngle(ascLongitude);
          const dscRot = getRotatedAngle(dscLongitude);
          const mcRot = getRotatedAngle(mcLongitude);
          const icRot = getRotatedAngle(icLongitude);

          const ascPoint = polarToCartesian(ascRot, houseBoundaryRadius);
          const dscPoint = polarToCartesian(dscRot, houseBoundaryRadius);
          const ascInner = polarToCartesian(ascRot, aspectRadius);
          const dscInner = polarToCartesian(dscRot, aspectRadius);
          const mcPointOuter = polarToCartesian(mcRot, houseBoundaryRadius);
          const icPointOuter = polarToCartesian(icRot, houseBoundaryRadius);
          const mcInner = polarToCartesian(mcRot, aspectRadius);
          const icInner = polarToCartesian(icRot, aspectRadius);

          const ascColor = isLight ? '#ea580c' : '#ff5722';
          const mcColor = isLight ? '#0284c7' : '#38bdf8';

          return (
            <>
              <line x1={ascInner.x} y1={ascInner.y} x2={ascPoint.x} y2={ascPoint.y} stroke={ascColor} strokeWidth="2.5" />
              <line x1={dscInner.x} y1={dscInner.y} x2={dscPoint.x} y2={dscPoint.y} stroke={ascColor} strokeWidth="2.5" />
              <line x1={mcInner.x} y1={mcInner.y} x2={mcPointOuter.x} y2={mcPointOuter.y} stroke={mcColor} strokeWidth="2.5" />
              <line x1={icInner.x} y1={icInner.y} x2={icPointOuter.x} y2={icPointOuter.y} stroke={mcColor} strokeWidth="2.5" />
            </>
          );
        })()}

        {/* 5. Aspects Network */}
        {(() => {
          const activeAspects = mode === 'biwheel' ? transitAspects : aspects;
          return activeAspects.map((asp, index) => {
            const p1Rot = getRotatedAngle(asp.source.longitude);
            const p2Rot = getRotatedAngle(asp.target.longitude);

            const pt1 = mode === 'biwheel' 
              ? polarToCartesian(p1Rot, transitPlanetOrbitRadius) 
              : polarToCartesian(p1Rot, aspectRadius);
            const pt2 = mode === 'biwheel' 
              ? polarToCartesian(p2Rot, natalPlanetOrbitRadius) 
              : polarToCartesian(p2Rot, aspectRadius);

            let strokeColor = colors.aspectDefault;
            let strokeWidthVal = 0.85;
            if (asp.aspectType === 'conjunction' || asp.aspectType === 'trine') {
              strokeColor = colors.aspectTrine;
              strokeWidthVal = 1.0;
            } else if (asp.aspectType === 'sextile') {
              strokeColor = colors.aspectSextile;
              strokeWidthVal = 0.9;
            } else if (asp.aspectType === 'square') {
              strokeColor = colors.aspectSquare;
              strokeWidthVal = 1.1;
            } else if (asp.aspectType === 'opposition') {
              strokeColor = colors.aspectOpposition;
              strokeWidthVal = 1.2;
            }

            return (
              <line
                key={index}
                x1={pt1.x} y1={pt1.y}
                x2={pt2.x} y2={pt2.y}
                stroke={strokeColor}
                strokeWidth={strokeWidthVal}
                strokeOpacity={mode === 'biwheel' ? 0.7 : 0.6}
                pointerEvents="none"
              />
            );
          });
        })()}

        {/* 6. Natal Planets */}
        {natalAdjustedPlanets.map(({ planet, x, y, originalX, originalY, currentRadius }) => {
          const symbol = PLANET_SYMBOLS[planet.id] || '•';
          const isSelected = selectedObjectId === planet.id;
          const degInt = Math.floor(planet.degree);
          const minInt = Math.floor((planet.degree - degInt) * 60);
          const degString = `${degInt}°${minInt.toString().padStart(2, '0')}'`;

          return (
            <g
              key={`natal-${planet.id}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectObject && onSelectObject(isSelected ? null : planet.id)}
            >
              {currentRadius !== natalPlanetOrbitRadius && (
                <line x1={originalX} y1={originalY} x2={x} y2={y} stroke={colors.textSubtle} strokeWidth="0.6" strokeDasharray="2,2" />
              )}
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="30.45" fontFamily="Georgia, serif" fill={colors.textMain} fontWeight="bold">
                {symbol}
                {planet.retrograde && <tspan fontSize="15.75" fill="#dc2626" fontWeight="bold" dx="1" dy="-5">R</tspan>}
              </text>
              <text x={x} y={y + 19} textAnchor="middle" dominantBaseline="central" fontSize="8.5" fontFamily="monospace" fill={colors.textMuted} fontWeight="600">
                {degString}
              </text>
            </g>
          );
        })}

        {/* 7. Transit Planets (Biwheel Mode) */}
        {mode === 'biwheel' && transitAdjustedPlanets.map(({ planet, x, y, originalX, originalY, currentRadius }) => {
          const symbol = PLANET_SYMBOLS[planet.id] || '•';
          const degInt = Math.floor(planet.degree);
          const minInt = Math.floor((planet.degree - degInt) * 60);
          const degString = `${degInt}°${minInt.toString().padStart(2, '0')}'`;

          return (
            <g key={`transit-${planet.id}`}>
              {currentRadius !== transitPlanetOrbitRadius && (
                <line x1={originalX} y1={originalY} x2={x} y2={y} stroke={colors.textSubtle} strokeWidth="0.6" strokeDasharray="2,2" />
              )}
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="30.45" fontFamily="Georgia, serif" fill={colors.transitPlanetStroke} fontWeight="bold">
                {symbol}
                {planet.retrograde && <tspan fontSize="15.75" fill="#dc2626" fontWeight="bold" dx="1" dy="-5">R</tspan>}
              </text>
              <text x={x} y={y + 19} textAnchor="middle" dominantBaseline="central" fontSize="8.5" fontFamily="monospace" fill={colors.textMuted} fontWeight="600">
                {degString}
              </text>
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div style={{ position: 'absolute', left: tooltip.x + 12, top: tooltip.y + 12, background: '#000', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', pointerEvents: 'none', whiteSpace: 'pre-line', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
