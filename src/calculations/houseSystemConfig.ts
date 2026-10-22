export interface HouseSystemFeatureConfig {
  showHouseFormulas: boolean;
  showEventFormulas: boolean;
  showShestopalov: boolean;
  showBindhu: boolean;
}

export const HOUSE_SYSTEM_FEATURES: Record<string, HouseSystemFeatureConfig> = {
  Placidus: {
    showHouseFormulas: false,
    showEventFormulas: false,
    showShestopalov: false,
    showBindhu: false,
  },
  Equal: {
    showHouseFormulas: true,
    showEventFormulas: true,
    showShestopalov: false,
    showBindhu: true,
  },
  KochShestopalov: {
    showHouseFormulas: true,
    showEventFormulas: false,
    showShestopalov: true,
    showBindhu: true,
  },
  Regiomontanus: {
    showHouseFormulas: false,
    showEventFormulas: false,
    showShestopalov: false,
    showBindhu: false,
  },
  WholeSign: {
    showHouseFormulas: false,
    showEventFormulas: false,
    showShestopalov: false,
    showBindhu: false,
  },
};

export function getHouseSystemFeatures(houseSystem?: string): HouseSystemFeatureConfig {
  const system = (houseSystem || 'Placidus').trim();
  const normalized = system === 'Koch' ? 'KochShestopalov' : system;
  return HOUSE_SYSTEM_FEATURES[normalized] || HOUSE_SYSTEM_FEATURES['Placidus'];
}
