import { BirthData, SavedChartRecord } from '../types';
import dayjs from 'dayjs';

const STORAGE_KEY = 'hobastro_saved_charts';

export function getSavedCharts(): SavedChartRecord[] {
  try {
    if (typeof localStorage === 'undefined' || !localStorage.getItem) return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Данные базы карт повреждены (не является массивом)');
    }
    return parsed;
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      throw new Error('Ошибка чтения базы карт: поврежденный JSON');
    }
    throw err;
  }
}

export function saveChartRecord(birthData: BirthData, existingId?: string): SavedChartRecord {
  const charts = getSavedCharts();
  const now = new Date().toISOString();
  
  if (existingId) {
    const index = charts.findIndex(c => c.id === existingId);
    if (index !== -1) {
      charts[index] = {
        ...charts[index],
        birthData,
        savedAt: now
      };
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
      }
      return charts[index];
    }
  }

  const newRecord: SavedChartRecord = {
    id: 'chart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    birthData,
    savedAt: now
  };

  charts.push(newRecord);
  if (typeof localStorage !== 'undefined' && localStorage.setItem) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
  }
  return newRecord;
}

export function deleteChartRecord(id: string): SavedChartRecord[] {
  const charts = getSavedCharts();
  const filtered = charts.filter(c => c.id !== id);
  if (typeof localStorage !== 'undefined' && localStorage.setItem) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  return filtered;
}

export function findDuplicateChart(charts: SavedChartRecord[], birthData: BirthData): SavedChartRecord | undefined {
  return charts.find(c => 
    c.birthData.name?.trim().toLowerCase() === birthData.name?.trim().toLowerCase() &&
    c.birthData.date === birthData.date
  );
}

export function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const birth = dayjs(birthDateStr, ['YYYY-MM-DD', 'DD.MM.YYYY']);
  if (!birth.isValid()) return 0;
  return dayjs().diff(birth, 'year');
}

export function getZodiacSign(dateStr: string): string {
  if (!dateStr) return '—';
  const d = dayjs(dateStr, ['YYYY-MM-DD', 'DD.MM.YYYY']);
  if (!d.isValid()) return '—';
  const m = d.month() + 1;
  const day = d.date();

  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Овен';
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Телец';
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Близнецы';
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Рак';
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Лев';
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Дева';
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Весы';
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Скорпион';
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Стрелец';
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Козерог';
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Водолей';
  return 'Рыбы';
}
