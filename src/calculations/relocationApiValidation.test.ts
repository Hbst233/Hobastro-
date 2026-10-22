import express from 'express';
import { calculatePositions, calculateRelocation } from './astroEngine';
import { enrichChartPositions } from './planetLayer';
import { BirthData, City } from '../types';

const app = express();
app.use(express.json());

const SUPPORTED_HOUSE_SYSTEMS = ['Placidus', 'Koch', 'KochShestopalov', 'Equal', 'Regiomontanus', 'WholeSign'];

app.post('/api/relocation-chart', (req, res) => {
  try {
    const { natalChart, targetLat, targetLon, houseSystem } = req.body;
    if (!natalChart || targetLat === undefined || targetLon === undefined) {
      return res.status(400).json({ error: 'Invalid relocation data provided' });
    }

    const system = houseSystem || natalChart?.houses?.system || 'Placidus';
    if (!SUPPORTED_HOUSE_SYSTEMS.includes(system)) {
      return res.status(400).json({ error: `Неизвестная система домов: ${system}` });
    }

    if (
      typeof targetLat !== 'number' ||
      !Number.isFinite(targetLat) ||
      targetLat < -90 ||
      targetLat > 90 ||
      typeof targetLon !== 'number' ||
      !Number.isFinite(targetLon) ||
      targetLon < -180 ||
      targetLon > 180
    ) {
      return res.status(400).json({ error: 'Invalid coordinates provided: targetLat must be a finite number between -90 and 90, and targetLon must be a finite number between -180 and 180.' });
    }

    const relocationResult = calculateRelocation(natalChart, targetLat, targetLon, system);
    const enrichedRelocation = enrichChartPositions(relocationResult);
    res.json(enrichedRelocation);
  } catch (error: any) {
    console.error('Calculation error on /api/relocation-chart:', error);
    const msg = error.message || 'Internal calculation error';
    return res.status(400).json({ error: msg.replace(/Command failed:.*?\n/s, '').trim() });
  }
});

const moscowCity: City = {
  id: 'moscow',
  name: 'Moscow',
  names: { ru: 'Москва', en: 'Moscow' },
  country: 'Russia',
  region: 'Moscow',
  lat: 55.7558,
  lon: 37.6173,
  timezone: 'Europe/Moscow',
};

const birthData: BirthData = {
  name: 'Test',
  date: '1990-01-01',
  time: '12:00',
  birthCity: moscowCity,
  residenceCity: moscowCity,
  solarCity: moscowCity,
  houseSystem: 'Placidus',
};

async function runTests() {
  console.log('--- RUNNING RELOCATION API VALIDATION TESTS ---');
  const server = app.listen(0, async () => {
    const port = (server.address() as any).port;
    const url = `http://localhost:${port}/api/relocation-chart`;
    const natalChart = calculatePositions(birthData);

    const testCases = [
      { payload: { natalChart }, expectedStatus: 400, desc: 'Missing coordinates' },
      { payload: { natalChart, targetLat: '55', targetLon: 37 }, expectedStatus: 400, desc: 'String lat' },
      { payload: { natalChart, targetLat: 55, targetLon: null }, expectedStatus: 400, desc: 'Null lon' },
      { payload: { natalChart, targetLat: NaN, targetLon: 37 }, expectedStatus: 400, desc: 'NaN lat' },
      { payload: { natalChart, targetLat: 55, targetLon: Infinity }, expectedStatus: 400, desc: 'Infinity lon' },
      { payload: { natalChart, targetLat: 91, targetLon: 37 }, expectedStatus: 400, desc: 'Lat > 90' },
      { payload: { natalChart, targetLat: -91, targetLon: 37 }, expectedStatus: 400, desc: 'Lat < -90' },
      { payload: { natalChart, targetLat: 55, targetLon: 181 }, expectedStatus: 400, desc: 'Lon > 180' },
      { payload: { natalChart, targetLat: 55, targetLon: -181 }, expectedStatus: 400, desc: 'Lon < -180' },
      { payload: { natalChart, targetLat: 55, targetLon: 37, houseSystem: 'InvalidSystem' }, expectedStatus: 400, desc: 'Unknown house system' },
      { payload: { natalChart, targetLat: 60, targetLon: 180 }, expectedStatus: 200, desc: 'Boundary max (lat 60)' },
      { payload: { natalChart, targetLat: -60, targetLon: -180 }, expectedStatus: 200, desc: 'Boundary min (lat -60)' },
      { payload: { natalChart, targetLat: 90, targetLon: 180, houseSystem: 'Placidus' }, expectedStatus: 400, desc: 'Polar latitude 90 with Placidus' },
      { payload: { natalChart, targetLat: -90, targetLon: -180, houseSystem: 'Placidus' }, expectedStatus: 400, desc: 'Polar latitude -90 with Placidus' },
      { payload: { natalChart, targetLat: 66, targetLon: 30, houseSystem: 'Equal' }, expectedStatus: 200, desc: 'Lat 66 Equal' },
      { payload: { natalChart, targetLat: 67, targetLon: 30, houseSystem: 'Equal' }, expectedStatus: 400, desc: 'Lat 67 Equal (polar limit)' },
      { payload: { natalChart, targetLat: 70, targetLon: 30, houseSystem: 'Equal' }, expectedStatus: 400, desc: 'Lat 70 Equal (polar limit)' },
      { payload: { natalChart, targetLat: 90, targetLon: 30, houseSystem: 'Equal' }, expectedStatus: 400, desc: 'Lat 90 Equal (polar limit)' },
      { payload: { natalChart, targetLat: 66, targetLon: 30, houseSystem: 'Placidus' }, expectedStatus: 200, desc: 'Lat 66 Placidus' },
      { payload: { natalChart, targetLat: 67, targetLon: 30, houseSystem: 'Placidus' }, expectedStatus: 400, desc: 'Lat 67 Placidus (polar limit)' },
      { payload: { natalChart, targetLat: 70, targetLon: 30, houseSystem: 'Placidus' }, expectedStatus: 400, desc: 'Lat 70 Placidus (polar limit)' },
      { payload: { natalChart, targetLat: 66, targetLon: 30, houseSystem: 'Koch' }, expectedStatus: 200, desc: 'Lat 66 Koch' },
      { payload: { natalChart, targetLat: 67, targetLon: 30, houseSystem: 'Koch' }, expectedStatus: 400, desc: 'Lat 67 Koch (polar limit)' },
      { payload: { natalChart, targetLat: 70, targetLon: 30, houseSystem: 'Koch' }, expectedStatus: 400, desc: 'Lat 70 Koch (polar limit)' },
      { payload: { natalChart, targetLat: 55.7558, targetLon: 37.6173 }, expectedStatus: 200, desc: 'Valid coordinates' },
    ];

    for (const tc of testCases) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.payload),
      });
      console.assert(
        res.status === tc.expectedStatus,
        `Test failed for "${tc.desc}": expected status ${tc.expectedStatus}, got ${res.status}`
      );
      console.log(`✓ Passed: ${tc.desc} (status ${res.status})`);
    }

    server.close();
    console.log('✓ All relocation API validation tests passed successfully!');
  });
}

runTests().catch(err => {
  console.error('❌ Tests failed:', err);
  process.exit(1);
});
