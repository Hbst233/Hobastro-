import { BirthData } from '../types';
import { EnrichedChartResult } from '../calculations/planetLayer';

export async function fetchNatalChart(birthData: BirthData): Promise<EnrichedChartResult> {
  const response = await fetch('/api/natal-chart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(birthData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to calculate natal chart via server API');
  }

  return response.json();
}

export async function fetchRelocationChart(natalChart: EnrichedChartResult, targetLat: number, targetLon: number, houseSystem?: string): Promise<EnrichedChartResult> {
  const response = await fetch('/api/relocation-chart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ natalChart, targetLat, targetLon, houseSystem }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to calculate relocation chart via server API');
  }

  return response.json();
}
