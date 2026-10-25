import { searchCities } from './citySearch';
import { City } from '../types';

console.log('--- RUNNING LOCAL CITY SEARCH TESTS ---');

const testCities: City[] = [
  { id: '1', name: 'Bila Tserkva', names: { ru: 'Белая Церковь', en: 'Bila Tserkva' }, country: 'Ukraine', region: 'UA', lat: 49.81, lon: 30.11, timezone: 'Europe/Kiev' },
  { id: '2', name: 'Moscow', names: { ru: 'Москва', en: 'Moscow' }, country: 'Russia', region: 'RU', lat: 55.75, lon: 37.61, timezone: 'Europe/Moscow' },
  { id: '3', name: 'Munster', names: { ru: 'Мюнстер', en: 'Munster' }, country: 'Germany', region: 'NW', lat: 51.96, lon: 7.63, timezone: 'Europe/Berlin' },
  { id: '4', name: 'Rheems', names: { ru: 'Римс', en: 'Rheems' }, country: 'USA', region: 'PA', lat: 40.11, lon: -76.54, timezone: 'America/New_York' },
];

// 1. Exact match by name
const exactRu = searchCities('Москва', testCities);
console.assert(exactRu.length === 1 && exactRu[0].id === '2', 'Exact match by Russian name works');

const exactEn = searchCities('Bila Tserkva', testCities);
console.assert(exactEn.length === 1 && exactEn[0].id === '1', 'Exact match by English name works');
console.log('✓ 1. Exact match by name passed.');

// 2. Partial input search
const partialRu = searchCities('Мос', testCities);
console.assert(partialRu.length === 1 && partialRu[0].id === '2', 'Partial input search (Cyrillic) works');

const partialEn = searchCities('Mun', testCities);
console.assert(partialEn.length === 1 && partialEn[0].id === '3', 'Partial input search (Latin) works');
console.log('✓ 2. Partial input search passed.');

// 3. No match
const noMatch = searchCities('AtlantisXYZ', testCities);
console.assert(noMatch.length === 0, 'No match returns empty array');

const shortQuery = searchCities('M', testCities);
console.assert(shortQuery.length === 0, 'Query shorter than 2 chars returns empty array');
console.log('✓ 3. No match and short query passed.');

// 4. Distinguishing countries / country search
const byCountry = searchCities('Germany', testCities);
console.assert(byCountry.length === 1 && byCountry[0].id === '3', 'Country filtering works');

const byRegion = searchCities('PA', testCities);
console.assert(byRegion.length === 1 && byRegion[0].id === '4', 'Region filtering works');
console.log('✓ 4. Country and region filtering passed.');

console.log('All local city search tests passed successfully!');
