import { selectState } from "./displayWeather.js";

const stateSelect = document.querySelector('#state');

let allWeatherData = [];
let hasLoaded = false;

stateSelect.disabled = true;

stateSelect.addEventListener('change', (e) => {
  console.log('Selected:', e.target.value);

  if (allWeatherData.length > 0) {
    selectState(allWeatherData, e.target.value);
  }
});

async function getStateNames() {
  const response = await fetch('./data/project.json');
  const data = await response.json();
  return data.states;
}

async function fetchAllCurrentWeather() {
  if (hasLoaded) return;
  hasLoaded = true;

  try {
    const states = await getStateNames();

    const weatherPromises = states.map(async (state) => {
      try {
        const url = `/api/weather/${encodeURIComponent(state.name)}`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const result = await response.json();

        return {
          ...result.data,
          state_name: state.name,
          source: result.source,
          fetched_at: result.fetched_at
        };

      } catch {
        return null;
      }
    });

    const results = await Promise.all(weatherPromises);
    allWeatherData = results.filter(Boolean);

    console.log('Loaded:', allWeatherData.length);

    stateSelect.disabled = false;

    if (stateSelect.value) {
      selectState(allWeatherData, stateSelect.value);
    }

  } catch (err) {
    console.log('Error:', err);
    hasLoaded = false;
  }
}

fetchAllCurrentWeather();