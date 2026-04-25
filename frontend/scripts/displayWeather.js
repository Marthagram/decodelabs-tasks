const section = document.querySelector('.section');
// Select the section where weather details will be displayed

// Function responsible for building and showing weather UI
function displayWeather(data) {

  section.innerHTML = '';
  // Clear previous weather content before showing new one

  const div = document.createElement('div');


  // Add styling and animation classes to the container(.section is the parent container, div is the child container for one state’s weather info)  
  div.style.animationDelay = "0.1s";

  // Create a container for one state’s weather info


  const stateName = document.createElement('h2');
  const description = document.createElement('p');
  const temp = document.createElement('p');
  const high = document.createElement('p');
  const low = document.createElement('p');
  const humidity = document.createElement('p');
  const sunrise = document.createElement('p');
  const sunset = document.createElement('p');
  const image = document.createElement('img');
  const cacheStatus = document.createElement('p');
  // Create all elements needed to display weather info


  // Fill elements with data from API
  stateName.textContent = data.state_name;

  description.textContent = `Description: ${data.description}`;
  temp.textContent = `Temperature: ${data.temperature}°C`;
  high.textContent = `High: ${data.temp_max}°C`;
  low.textContent = `Low: ${data.temp_min}°C`;
  humidity.textContent = `Humidity: ${data.humidity}%`;


  // Convert UNIX timestamps to readable time
  sunrise.textContent = data.sunrise
    ? `Sunrise: ${new Date(data.sunrise * 1000).toLocaleTimeString()}`
    : 'Sunrise: N/A';

  sunset.textContent = data.sunset
    ? `Sunset: ${new Date(data.sunset * 1000).toLocaleTimeString()}`
    : 'Sunset: N/A';


  // Set weather icon image
  image.src = data.icon_url;
  image.alt = data.description;
  image.loading = 'lazy';
  // Lazy loading improves performance


  // I will provide a fallback image in case the API icon fails to load, but I commented it out for now to avoid confusion during development. If the API icon URLs are correct, this should not be an issue.
  // // If image fails, show fallback image
  // image.onerror = () => {
  //   image.src = './images/default-weather.png';
  // };


  // Show where data came from (API or cache)
  cacheStatus.textContent =
    `Source: ${data.source} | Updated: ` +
    (data.fetched_at
      ? new Date(data.fetched_at * 1000).toLocaleTimeString()
      : 'N/A');

  cacheStatus.style.fontSize = '12px';
  cacheStatus.style.color = 'gray';


  // Add all elements into the container
  div.append(
    stateName,
    image,
    description,
    temp,
    high,
    low,
    humidity,
    sunrise,
    sunset,
    cacheStatus
  );

  // Add container to page
  section.appendChild(div);
}


// Function that finds selected state and displays it
export function selectState(data, selectedStateName) {

  const selected = data.find(item =>
    item.state_name.toLowerCase().trim() === selectedStateName.toLowerCase().trim()
  );
  // Find matching state (case-insensitive + trimmed)

  if (selected) {
    displayWeather(selected);
    // If found, display its weather
  } else {
    console.log('State not found:', selectedStateName);
    // Debug if no match is found
  }
}