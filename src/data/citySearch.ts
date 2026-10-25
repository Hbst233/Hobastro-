import { City } from '../types';
import { cities as defaultCities } from './cities';

export function searchCities(query: string, cityList: City[] = defaultCities): City[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const q = query.trim().toLowerCase();

  return cityList.filter(c => {
    const ru = c.names?.ru?.toLowerCase() || '';
    const en = c.names?.en?.toLowerCase() || '';
    const name = c.name?.toLowerCase() || '';
    const country = c.country?.toLowerCase() || '';
    const region = c.region?.toLowerCase() || '';

    return (
      ru.includes(q) ||
      en.includes(q) ||
      name.includes(q) ||
      country.includes(q) ||
      region.includes(q)
    );
  });
}
