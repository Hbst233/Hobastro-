export interface City {
  id: string;
  name: string; // Primary name (usually English)
  names: { ru: string; en: string }; // For search and display
  country: string;
  region: string;
  lat: number;
  lon: number;
  timezone: string; // IANA timezone
}

export interface BirthData {
  name: string;
  date: string;
  time: string;
  birthCity: City;
  residenceCity: City;
  solarCity: City;
  gmtTime?: string;
  houseSystem?: string;
  manualOverride?: {
    enabled: boolean;
    lat?: number;
    latDir?: 'N' | 'S';
    lon?: number;
    lonDir?: 'E' | 'W';
    timezone?: string;
    dst?: 'auto' | 'observe' | 'ignore';
  };
}

export interface AstroResult {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  speedLongitude: number;
  isRetrograde: boolean;
}

export interface SavedChartRecord {
  id: string;
  birthData: BirthData;
  savedAt: string;
}
