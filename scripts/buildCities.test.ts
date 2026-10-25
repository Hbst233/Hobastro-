import { importGeoNames } from './buildCities';
import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- RUNNING BUILD CITIES TESTS ---');

const testDbPath = path.resolve(__dirname, 'fixtures/test_cities.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

try {
  const citiesFixture = path.resolve(__dirname, 'fixtures/cities500_fixture.txt');
  const altFixture = path.resolve(__dirname, 'fixtures/alternateNamesV2_fixture.txt');

  const { citiesCount, altCount } = importGeoNames({
    dbPath: testDbPath,
    citiesPath: citiesFixture,
    altPath: altFixture,
  });

  if (citiesCount !== 2) {
    throw new Error(`Expected 2 cities, got ${citiesCount}`);
  }
  if (altCount !== 3) {
    throw new Error(`Expected 3 alternate names, got ${altCount}`);
  }
  console.log('✓ 1. Fixture import counts correct.');

  const db = new DatabaseSync(testDbPath);
  
  const cityStmt = db.prepare('SELECT * FROM cities WHERE geonameId = ?');
  const paris = cityStmt.get(2988507) as any;
  if (!paris || paris.name !== 'Paris' || paris.countryCode !== 'FR' || Math.abs(paris.latitude - 48.85341) > 0.0001) {
    throw new Error('Paris city data incorrect');
  }
  console.log('✓ 2. City data (Paris) verified.');

  const altStmt = db.prepare('SELECT * FROM alternate_names WHERE geonameId = ? ORDER BY alternateNameId');
  const alts = altStmt.all(2988507) as any[];
  if (alts.length !== 2 || alts[0].isoLanguage !== 'fr' || alts[1].alternateName !== 'Paris') {
    throw new Error('Alternate names data incorrect');
  }
  console.log('✓ 3. Alternate names verified.');

  const indexStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='index'");
  const indexes = indexStmt.all() as any[];
  const indexNames = indexes.map(i => i.name);
  if (!indexNames.includes('idx_cities_country') || !indexNames.includes('idx_cities_name') || !indexNames.includes('idx_alt_geoname')) {
    throw new Error('Required indexes missing');
  }
  console.log('✓ 4. Indexes verified.');

  db.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('--- ALL BUILD CITIES TESTS PASSED SUCCESSFULLY ---');
} catch (err) {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  console.error('Test failed:', err);
  process.exit(1);
}
