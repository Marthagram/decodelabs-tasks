const section = document.querySelector('.section');

function displayWeather(data) {
  section.innerHTML = '';

  const div = document.createElement('div');

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

  stateName.textContent = data.state_name;
  description.textContent = `Description: ${data.description}`;
  temp.textContent = `Temperature: ${data.temperature}°C`;
  high.textContent = `High: ${data.temp_max}°C`;
  low.textContent = `Low: ${data.temp_min}°C`;
  humidity.textContent = `Humidity: ${data.humidity}%`;

  sunrise.textContent = data.sunrise
    ? `Sunrise: ${new Date(data.sunrise * 1000).toLocaleTimeString()}`
    : 'Sunrise: N/A';

  sunset.textContent = data.sunset
    ? `Sunset: ${new Date(data.sunset * 1000).toLocaleTimeString()}`
    : 'Sunset: N/A';

  image.src = data.icon_url || './images/default-weather.png';
  image.alt = data.description || 'weather';
  image.loading = 'lazy';

  image.onerror = () => {
    image.src = './images/default-weather.png';
  };

  cacheStatus.textContent =
    `Source: ${data.source} | Updated: ` +
    (data.fetched_at
      ? new Date(data.fetched_at * 1000).toLocaleTimeString()
      : 'N/A');

  cacheStatus.style.fontSize = '12px';
  cacheStatus.style.color = 'gray';

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

  section.appendChild(div);
}

export function selectState(data, selectedStateName) {
  const selected = data.find(
    item => item.state_name.toLowerCase() === selectedStateName.toLowerCase()
  );

  if (selected) {
    displayWeather(selected);
  } else {
    console.log('State not found:', selectedStateName);
  }
}