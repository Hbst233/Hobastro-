import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BuildCitiesOptions {
  dbPath: string;
  citiesPath?: string;
  altPath?: string;
}

export function initDatabase(dbPath: string): DatabaseSync {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cities (
      geonameId INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      asciiname TEXT,
      countryCode TEXT NOT NULL,
      admin1Code TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      population INTEGER,
      timezone TEXT
    );

    CREATE TABLE IF NOT EXISTS alternate_names (
      alternateNameId INTEGER PRIMARY KEY,
      geonameId INTEGER NOT NULL,
      isoLanguage TEXT,
      alternateName TEXT NOT NULL,
      isPreferred INTEGER,
      isShort INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(countryCode);
    CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
    CREATE INDEX IF NOT EXISTS idx_cities_asciiname ON cities(asciiname);
    CREATE INDEX IF NOT EXISTS idx_alt_geoname ON alternate_names(geonameId);
    CREATE INDEX IF NOT EXISTS idx_alt_name ON alternate_names(alternateName);
    CREATE INDEX IF NOT EXISTS idx_alt_lang ON alternate_names(isoLanguage);
  `);
  return db;
}

export function importGeoNames(options: BuildCitiesOptions): { citiesCount: number; altCount: number } {
  const db = initDatabase(options.dbPath);

  let citiesCount = 0;
  let altCount = 0;

  const insertCity = db.prepare(`
    INSERT OR REPLACE INTO cities (geonameId, name, asciiname, countryCode, admin1Code, latitude, longitude, population, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAlt = db.prepare(`
    INSERT OR REPLACE INTO alternate_names (alternateNameId, geonameId, isoLanguage, alternateName, isPreferred, isShort)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    if (options.citiesPath && fs.existsSync(options.citiesPath)) {
      const content = fs.readFileSync(options.citiesPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = line.split('\t');
        if (cols.length >= 15) {
          const geonameId = parseInt(cols[0], 10);
          const name = cols[1];
          const asciiname = cols[2];
          const latitude = parseFloat(cols[4]);
          const longitude = parseFloat(cols[5]);
          const countryCode = cols[8];
          const admin1Code = cols[10];
          const population = cols[14] ? parseInt(cols[14], 10) : 0;
          const timezone = cols[17] || '';

          if (!isNaN(geonameId) && !isNaN(latitude) && !isNaN(longitude)) {
            insertCity.run(geonameId, name, asciiname, countryCode, admin1Code, latitude, longitude, population, timezone);
            citiesCount++;
          }
        }
      }
    }

    if (options.altPath && fs.existsSync(options.altPath)) {
      const content = fs.readFileSync(options.altPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = line.split('\t');
        if (cols.length >= 4) {
          const altIdStr = cols[0];
          const geonameId = parseInt(cols[1], 10);
          const isoLanguage = cols[2];
          const alternateName = cols[3];
          const isPreferred = cols[4] === '1' ? 1 : 0;
          const isShort = cols[5] === '1' ? 1 : 0;

          const alternateNameId = !isNaN(parseInt(altIdStr, 10)) ? parseInt(altIdStr, 10) : undefined;

          if (!isNaN(geonameId) && alternateName) {
            insertAlt.run(alternateNameId ?? null, geonameId, isoLanguage, alternateName, isPreferred, isShort);
            altCount++;
          }
        }
      }
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return { citiesCount, altCount };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const dbPath = process.argv[2] || './data/cities.db';
  const citiesPath = process.argv[3];
  const altPath = process.argv[4];
  console.log(`Building cities DB at ${dbPath}...`);
  const result = importGeoNames({ dbPath, citiesPath, altPath });
  console.log(`Imported ${result.citiesCount} cities and ${result.altCount} alternate names.`);
}
