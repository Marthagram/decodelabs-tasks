import { selectState } from "./displayWeather.js";
// Import the function that handles selecting and displaying weather


const stateSelect = document.querySelector('#state');
// Get the dropdown (<select>) from the HTML using its ID

let allWeatherData = [];
// This will store ALL weather data for all states after fetching

let hasLoaded = false;
// Prevents multiple API calls (acts like a lock so fetch runs only once)

stateSelect.disabled = true;
// Disable dropdown until data is fully loaded


// Runs when user selects a state from dropdown
stateSelect.addEventListener('change', (e) => {

  const selectedValue = e.target.value;
  // Get the value of the selected option (e.g. "Abuja")

  console.log("SELECTED:", selectedValue);
  // Debug: shows what the user selected . "SELECTED:" This is just a label (text). The actual selected value will be shown after it in the console log.



  selectState(allWeatherData, selectedValue);
  // Send data + selected value to function that finds and displays weather
});


// Function to get list of states from local JSON file
async function getStateNames() {

  const response = await fetch('./data/project.json');
  // Fetch local JSON file containing all Nigerian states

  const data = await response.json();
  // Convert response into usable JavaScript object

  return data.states;
  // Return only the "states" array from JSON
}


// Function to fetch weather for ALL states
async function fetchAllCurrentWeather() {

  if (hasLoaded) return;
  // If already loaded once, stop function from running again

  hasLoaded = true;
  // Lock the function so it doesn’t run twice

  try {

    const states = await getStateNames();
    // Get list of all states from JSON file

    const weatherPromises = states.map(async (state) => {

      try {

        const url = `http://localhost:3000/api/weather/${encodeURIComponent(state.name)}`;
        // Build API URL for each state (send request to backend server)

        const response = await fetch(url);
        // Call backend API

        if (!response.ok) return null;
        // If request fails, skip this state

        const result = await response.json();
        // Convert API response to JavaScript object

        return {
          ...result.data,
          // Spread weather data (temperature, humidity, etc.)

          state_name: state.name.trim(),
          // Add state name to object

          source: result.source,
          // Add where data came from (api or cache)

          fetched_at: result.fetched_at
          // Add timestamp of when data was fetched
        };

      } catch (err) {
        console.log("Failed state:", state.name);
        // If one state fails, log it but continue

        return null;
        // Skip failed request
      }
    });


    const results = await Promise.all(weatherPromises);
    // Wait for ALL API requests to finish

    allWeatherData = results.filter(Boolean);
    // Remove any failed (null) results

    console.log("DATA:", allWeatherData);
    // Debug: show final data array

    console.log("Loaded:", allWeatherData.length);
    // Debug: show how many states loaded successfully

    stateSelect.disabled = false;
    // Enable dropdown now that data is ready

  } catch (err) {

    console.log('Error:', err);
    // Catch any global errors in fetching process

    hasLoaded = false;
    // Unlock so user can retry if needed
  }
}


// Start everything when page loads
fetchAllCurrentWeather();