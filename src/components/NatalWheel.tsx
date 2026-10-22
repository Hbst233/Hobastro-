import React from 'react';
import { EnrichedChartResult } from '../calculations/planetLayer';
import { AspectResult } from '../calculations/aspectEngine';
import { ArabicPartResult } from '../calculations/arabicParts';
import { ChartWheel } from './ChartWheel';

interface NatalWheelProps {
  chart: EnrichedChartResult;
  aspects: AspectResult[];
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
  theme?: 'dark' | 'light';
  arabicParts?: ArabicPartResult[];
  selectedArabicParts?: Record<string, boolean>;
}

export const NatalWheel: React.FC<NatalWheelProps> = ({ chart, aspects, selectedObjectId, onSelectObject, theme = 'light', arabicParts, selectedArabicParts }) => {
  return (
    <ChartWheel
      chart={chart}
      aspects={aspects}
      mode="natal"
      selectedObjectId={selectedObjectId}
      onSelectObject={onSelectObject}
      theme={theme}
      arabicParts={arabicParts}
      selectedArabicParts={selectedArabicParts}
    />
  );
};
