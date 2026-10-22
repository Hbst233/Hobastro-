import { getHouseSystemFeatures, HOUSE_SYSTEM_FEATURES } from './houseSystemConfig';

console.log('--- RUNNING HOUSE SYSTEM CONFIG TESTS ---');

const placidusFeatures = getHouseSystemFeatures('Placidus');
console.assert(placidusFeatures.showHouseFormulas === false, 'Placidus showHouseFormulas must be false');
console.assert(placidusFeatures.showEventFormulas === false, 'Placidus showEventFormulas must be false');

const equalFeatures = getHouseSystemFeatures('Equal');
console.assert(equalFeatures.showHouseFormulas === true, 'Equal showHouseFormulas must be true');
console.assert(equalFeatures.showEventFormulas === true, 'Equal showEventFormulas must be true');

const regiomontanusFeatures = getHouseSystemFeatures('Regiomontanus');
console.assert(regiomontanusFeatures.showHouseFormulas === false, 'Regiomontanus showHouseFormulas must be false');
console.assert(regiomontanusFeatures.showEventFormulas === false, 'Regiomontanus showEventFormulas must be false');

const wholeSignFeatures = getHouseSystemFeatures('WholeSign');
console.assert(wholeSignFeatures.showHouseFormulas === false, 'WholeSign showHouseFormulas must be false');
console.assert(wholeSignFeatures.showEventFormulas === false, 'WholeSign showEventFormulas must be false');

const shestopalovFeatures = getHouseSystemFeatures('KochShestopalov');
console.assert(shestopalovFeatures.showHouseFormulas === true, 'KochShestopalov showHouseFormulas must be true');
console.assert(shestopalovFeatures.showEventFormulas === false, 'KochShestopalov showEventFormulas must be false');

const kochFeatures = getHouseSystemFeatures('Koch');
console.assert(kochFeatures.showShestopalov === true, 'Koch showShestopalov must be true');

console.log('✓ All house system configuration feature tests passed successfully.');
