import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { calculatePositions, calculateRelocation } from './src/calculations/astroEngine';
import { enrichChartPositions } from './src/calculations/planetLayer';
import { searchCities } from './src/data/citySearch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Endpoint for city search (Local first, then Nominatim fallback)
  app.get('/api/cities', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.json([]);
      }

      // 1. Local search first
      const localResults = searchCities(query);
      if (localResults.length > 0) {
        const formatted = localResults.map(c => ({
          place_id: c.id,
          name: c.names.ru,
          lat: String(c.lat),
          lon: String(c.lon),
          address: {
            city: c.names.ru,
            state: c.region,
            country: c.country
          }
        }));
        return res.json(formatted);
      }

      // 2. Fallback to Nominatim API
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&accept-language=ru&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Hobastro/1.0 (astro@hobastro.app)'
        }
      });

      if (!response.ok) {
        return res.status(502).json({ error: 'Failed to fetch from Nominatim API' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Error in /api/cities:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

const SUPPORTED_HOUSE_SYSTEMS = ['Placidus', 'Koch', 'KochShestopalov', 'Equal', 'Regiomontanus', 'WholeSign'];

  // API Endpoint for Natal Chart calculation using existing calculation layer
  app.post('/api/natal-chart', (req, res) => {
    try {
      const birthData = req.body;
      if (!birthData || !birthData.date || !birthData.time || !birthData.birthCity) {
        return res.status(400).json({ error: 'Invalid birth data provided' });
      }

      const houseSystem = birthData.houseSystem || 'Placidus';
      if (!SUPPORTED_HOUSE_SYSTEMS.includes(houseSystem)) {
        return res.status(400).json({ error: `Неизвестная система домов: ${houseSystem}` });
      }

      const astronomyResult = calculatePositions(birthData, houseSystem);
      const enrichedChart = enrichChartPositions(astronomyResult);
      res.json(enrichedChart);
    } catch (error: any) {
      console.error('Calculation error on /api/natal-chart:', error);
      const msg = error.message || 'Internal calculation error';
      return res.status(400).json({ error: msg.replace(/Command failed:.*?\n/s, '').trim() });
    }
  });

  // API Endpoint for Relocation Chart calculation using existing calculation layer
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

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hobastro server running at http://localhost:${PORT}`);
  });
}

startServer();
