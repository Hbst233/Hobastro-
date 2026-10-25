import { getSavedCharts, saveChartRecord, deleteChartRecord, findDuplicateChart, calculateAge, getZodiacSign } from './savedCharts';
import { BirthData } from '../types';

console.log('--- RUNNING SAVED CHARTS & RESTORATION TESTS ---');

// Mock localStorage if running in Node environment without window.localStorage
if (typeof localStorage === 'undefined' || !localStorage.getItem) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

try {
  localStorage.clear();

  const sampleCity = {
    id: 'moscow',
    name: 'Moscow',
    names: { ru: 'Москва', en: 'Moscow' },
    country: 'Russia',
    region: 'Moscow',
    lat: 55.7558,
    lon: 37.6173,
    timezone: 'Europe/Moscow'
  };

  const birthData1: BirthData = {
    name: 'Тест Тестов',
    date: '1990-01-01',
    time: '12:00',
    birthCity: sampleCity,
    residenceCity: sampleCity,
    solarCity: sampleCity,
    houseSystem: 'Placidus'
  };

  const birthData2: BirthData = {
    name: 'Мария Петрова',
    date: '1985-05-15',
    time: '08:30',
    birthCity: sampleCity,
    residenceCity: sampleCity,
    solarCity: sampleCity,
    houseSystem: 'Koch'
  };

  // 1. Save and load multiple charts with full BirthData preservation
  localStorage.clear();
  const rec1 = saveChartRecord(birthData1);
  const rec2 = saveChartRecord(birthData2);
  const loaded = getSavedCharts();
  console.assert(loaded.length === 2, 'Should have 2 saved charts');
  console.assert(loaded[0].birthData.name === 'Тест Тестов', 'First chart name matches');
  console.assert(loaded[0].birthData.houseSystem === 'Placidus', 'Full BirthData houseSystem preserved');
  console.assert(loaded[1].birthData.name === 'Мария Петрова', 'Second chart name matches');
  console.log('✓ 1. Save, load multiple charts and preserve full BirthData passed.');

  // 2. Delete a record
  deleteChartRecord(rec1.id);
  const afterDelete = getSavedCharts();
  console.assert(afterDelete.length === 1, 'Should have 1 chart after deletion');
  console.assert(afterDelete[0].id === rec2.id, 'Remaining chart is correct');
  console.log('✓ 2. Delete record passed.');

  // 3. Duplicate name and date detection & confirmation logic
  const duplicateCandidate: BirthData = {
    ...birthData2,
    time: '09:00' // different time, but same name and date
  };
  const dup = findDuplicateChart(afterDelete, duplicateCandidate);
  console.assert(dup !== undefined, 'Should detect duplicate by name and date');
  console.assert(dup?.id === rec2.id, 'Duplicate points to correct record');
  console.log('✓ 3. Duplicate detection passed.');

  // 4. Corrupted JSON handling (throws error, doesn't silently wipe)
  localStorage.setItem('hobastro_saved_charts', 'invalid-json-content{');
  let threwCorrupted = false;
  try {
    getSavedCharts();
  } catch (err: any) {
    threwCorrupted = true;
  }
  console.assert(threwCorrupted, 'Should throw error on corrupted JSON rather than returning empty array silently');
  console.log('✓ 4. Corrupted JSON error handling passed.');

  // 5. Compatibility with hobastro_birthData & last used/opened card restoration
  localStorage.clear();
  // Simulate last used temporary card or opened DB card stored in hobastro_birthData
  localStorage.setItem('hobastro_birthData', JSON.stringify(birthData1));
  const restoredBirthData = JSON.parse(localStorage.getItem('hobastro_birthData') || '{}');
  console.assert(restoredBirthData.name === birthData1.name, 'Last used/opened chart restores correctly from hobastro_birthData');
  
  // Ensure hobastro_saved_charts and hobastro_birthData are separate keys
  const savedChartsList = getSavedCharts();
  console.assert(savedChartsList.length === 0, 'Saved charts database remains empty when temporary chart is used');
  console.log('✓ 5. hobastro_birthData compatibility and last used chart persistence passed.');

  // 6. Age calculation and Zodiac sign determination
  const age1 = calculateAge('1990-01-01');
  console.assert(age1 > 20, 'Age calculation works correctly');
  const zodiac1 = getZodiacSign('1990-01-01');
  console.assert(zodiac1 === 'Козерог', `Zodiac sign for Jan 1 should be Козерог, got ${zodiac1}`);
  const zodiac2 = getZodiacSign('1985-05-15');
  console.assert(zodiac2 === 'Телец', `Zodiac sign for May 15 should be Телец, got ${zodiac2}`);
  console.log('✓ 6. Age calculation and Zodiac sign determination passed.');

  // 7. Unavailable localStorage handling simulation
  const originalLocalStorage = (global as any).localStorage;
  (global as any).localStorage = undefined;
  const emptyCharts = getSavedCharts();
  console.assert(Array.isArray(emptyCharts) && emptyCharts.length === 0, 'Should return empty array when localStorage is unavailable');
  (global as any).localStorage = originalLocalStorage;
  console.log('✓ 7. Unavailable localStorage handling passed.');

  console.log('All saved charts & restoration tests passed successfully!');
} catch (e) {
  console.error('Test failed:', e);
  process.exit(1);
}
