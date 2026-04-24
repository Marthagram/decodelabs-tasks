const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Database = require('better-sqlite3');

const db = new Database('weather.db');

const app = express();
const PORT = 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;
const CACHE_TTL_SECONDS = 3600;

app.use(cors());
app.use(express.json());

// DB setup
db.prepare(`
  CREATE TABLE IF NOT EXISTS weather (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT UNIQUE,
    data TEXT,
    fetched_at INTEGER
  )
`).run();

// Helpers
function getCache(city) {
  return db.prepare('SELECT * FROM weather WHERE city = ?').get(city);
}

function saveCache(city, data) {
  const fetchedAt = Math.floor(Date.now() / 1000);
  db.prepare(
    'INSERT OR REPLACE INTO weather (city, data, fetched_at) VALUES (?,?,?)'
  ).run(city, JSON.stringify(data), fetchedAt);
}

function isFresh(time) {
  return (Math.floor(Date.now() / 1000) - time) < CACHE_TTL_SECONDS;
}

// Route
app.get('/api/weather/:city', async (req, res) => {
  let { city } = req.params;

  if (!city || city.length < 2) {
    return res.status(400).json({ error: 'Invalid city' });
  }

  city = city.toLowerCase();
  const cityQuery = `${city},NG`;

  try {
    const cached = getCache(cityQuery);

    if (cached && isFresh(cached.fetched_at)) {
      return res.json({
        source: 'cache',
        data: JSON.parse(cached.data),
        fetched_at: cached.fetched_at
      });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityQuery)}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error();

    const raw = await response.json();

    const data = {
      temperature: raw.main.temp,
      temp_min: raw.main.temp_min,
      temp_max: raw.main.temp_max,
      humidity: raw.main.humidity,
      description: raw.weather[0].description,
      icon_url: `https://openweathermap.org/img/wn/${raw.weather[0].icon}@2x.png`,
      sunrise: raw.sys.sunrise,
      sunset: raw.sys.sunset
    };

    saveCache(cityQuery, data);

    res.json({
      source: 'api',
      data,
      fetched_at: Math.floor(Date.now() / 1000)
    });

  } catch {
    const cached = getCache(cityQuery);

    if (cached) {
      return res.json({
        source: 'stale_cache',
        data: JSON.parse(cached.data),
        fetched_at: cached.fetched_at
      });
    }

    res.status(500).json({ error: 'Weather unavailable' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});