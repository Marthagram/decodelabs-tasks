const express = require('express');
// Import Express framework (for building server)

const cors = require('cors');
// Allows frontend to talk to backend (cross-origin requests)

require('dotenv').config();
// Load environment variables from .env file

const Database = require('better-sqlite3');
// Import SQLite database library

const db = new Database('weather.db');
// Create or open local SQLite database file


const app = express();
// Create Express application

const PORT = 3000;
// Server runs on port 3000

const API_KEY = process.env.OPENWEATHER_API_KEY;
// Get API key from .env file (important security practice)

const CACHE_TTL_SECONDS = 3600;
// Cache duration (1 hour)


// Middleware setup
app.use(cors());
// Allow frontend to access backend

app.use(express.json());
// Allow JSON data handling


// Create weather table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS weather (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT UNIQUE,
    data TEXT,
    fetched_at INTEGER
  )
`).run();


// Get cached weather from database
function getWeatherFromCache(city) {
  return db.prepare('SELECT * FROM weather WHERE city = ?').get(city);
}


// Save weather into cache
function saveWeatherToCache(city, data) {

  const fetchedAt = Math.floor(Date.now() / 1000);
  // Current time in seconds

  db.prepare(
    'INSERT OR REPLACE INTO weather (city, data, fetched_at) VALUES (?,?,?)'
  ).run(city, JSON.stringify(data), fetchedAt);
}


// Check if cached data is still fresh
function isCacheFresh(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  return (now - timestamp) < CACHE_TTL_SECONDS;
}


// Main API route
app.get('/api/weather/:city', async (req, res) => {

  let { city } = req.params;
  // Get city from URL

  if (!city || city.length < 2) {
    return res.status(400).json({ error: 'Invalid city name' });
    // Reject invalid input
  }

  city = city.toLowerCase();
  const cityQuery = `${city},NG`;
  // Add country code for accuracy (Nigeria)


  try {

    const cached = getWeatherFromCache(cityQuery);
    // Check if data exists in cache

    if (cached && isCacheFresh(cached.fetched_at)) {
      // If cache exists and is fresh

      return res.json({
        source: 'cache',
        data: JSON.parse(cached.data),
        fetched_at: cached.fetched_at
      });
    }


    // Fetch from OpenWeather API
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityQuery)}&units=metric&appid=${API_KEY}`;

    const apiResponse = await fetch(apiUrl);
    // Call external weather API

    if (!apiResponse.ok) throw new Error('API error');

    const raw = await apiResponse.json();
    // Convert response to JSON


    // Clean and structure data
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


    saveWeatherToCache(cityQuery, data);
    // Save fresh data to database cache


    res.json({
      source: 'api',
      data,
      fetched_at: Math.floor(Date.now() / 1000)
    });

  } catch (err) {

    const cached = getWeatherFromCache(cityQuery);
    // Try fallback cache if API fails

    if (cached) {
      return res.json({
        source: 'stale_cache',
        data: JSON.parse(cached.data),
        fetched_at: cached.fetched_at
      });
    }

    res.status(500).json({ error: 'Weather unavailable' });
    // Final fallback error
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});