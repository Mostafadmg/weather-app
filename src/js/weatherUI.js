/**
 * Weather Data Update Functions
 * Professional approach to updating the UI with weather data
 */

import { DOM, getCurrentUnit } from "./selectors.js";

/**
 * Update main weather display
 */
export function updateMainWeather(data) {
  const { location, date, temperature, icon, condition } = data;

  // Update location
  const locationEl = DOM.locationName();
  if (locationEl) locationEl.textContent = location;

  // Update date/time
  const dateEl = DOM.currentDate();
  if (dateEl) dateEl.textContent = date;

  // Update temperature
  const tempEl = DOM.mainTemperature();
  if (tempEl) {
    const unit = getCurrentUnit();
    const symbol = unit === "celsius" ? "°C" : "°F";
    tempEl.textContent = `${temperature}${symbol}`;
    tempEl.dataset.unit = unit;
  }

  // Update weather icon
  const iconEl = DOM.mainWeatherIcon();
  if (iconEl && icon) {
    iconEl.src = icon;
    iconEl.alt = condition || "Weather icon";
  }
}

/**
 * Update weather details (feels like, humidity, wind, precipitation)
 */
export function updateWeatherDetails(data) {
  const { feelsLike, humidity, windSpeed, precipitation } = data;
  const unit = getCurrentUnit();
  const tempSymbol = unit === "celsius" ? "°C" : "°F";
  const speedUnit = unit === "celsius" ? "km/h" : "mph";

  // Update feels like
  const feelsLikeEl = DOM.feelsLikeTemp();
  if (feelsLikeEl && feelsLike !== undefined) {
    feelsLikeEl.textContent = `${feelsLike}${tempSymbol}`;
  }

  // Update humidity
  const humidityEl = DOM.humidityValue();
  if (humidityEl && humidity !== undefined) {
    humidityEl.textContent = `${humidity}%`;
  }

  // Update wind speed
  const windEl = DOM.windSpeed();
  if (windEl && windSpeed !== undefined) {
    windEl.textContent = `${windSpeed} ${speedUnit}`;
  }

  // Update precipitation
  const precipEl = DOM.precipitationValue();
  if (precipEl && precipitation !== undefined) {
    precipEl.textContent = precipitation === 0 ? "0" : `${precipitation} mm`;
  }
}

/**
 * Update daily forecast
 */
export function updateDailyForecast(forecastData) {
  const listEl = DOM.dailyForecastList();
  if (!listEl || !Array.isArray(forecastData)) return;

  // Clear existing items
  listEl.innerHTML = "";

  // Create forecast items
  forecastData.forEach((day, index) => {
    const item = createDailyForecastItem(day, index);
    listEl.appendChild(item);
  });
}

/**
 * Create a daily forecast item element
 */
function createDailyForecastItem(data, index) {
  const { day, icon, tempMax, tempMin } = data;
  const unit = getCurrentUnit();
  const symbol = unit === "celsius" ? "°" : "°F";

  const item = document.createElement("div");
  item.className = "forecast__item";
  item.dataset.forecastDay = "";
  item.dataset.dayIndex = index;

  item.innerHTML = `
    <p class="forecast__day text-20m" data-day-name>${day}</p>
    <div class="forecast__icon">
      <img src="${icon}" alt="${day} weather" data-day-icon />
    </div>
    <div class="forecast__temp text-16">
      <p class="forecast__temp--min" data-day-temp-max>${tempMax}${symbol}</p>
      <p class="forecast__temp--max" data-day-temp-min>${tempMin}${symbol}</p>
    </div>
  `;

  return item;
}

/**
 * Update hourly forecast
 */
export function updateHourlyForecast(hourlyData) {
  const listEl = DOM.hourlyForecastList();
  if (!listEl || !Array.isArray(hourlyData)) return;

  // Clear existing items
  listEl.innerHTML = "";

  // Create hourly items
  hourlyData.forEach((hour, index) => {
    const item = createHourlyForecastItem(hour, index);
    listEl.appendChild(item);
  });
}

/**
 * Create an hourly forecast item element
 */
function createHourlyForecastItem(data, index) {
  const { time, icon, temperature } = data;
  const unit = getCurrentUnit();
  const symbol = unit === "celsius" ? "°" : "°F";

  const item = document.createElement("div");
  item.className = "forecast-h__card";
  item.dataset.hourlyItem = "";
  item.dataset.hourIndex = index;

  item.innerHTML = `
    <div class="forecast-h__info">
      <img src="${icon}" alt="${time} weather" data-hourly-icon />
      <p class="forecast-h__time text-20m" data-hourly-time>${time}</p>
    </div>
    <div class="forecast-h__temp text-16" data-hourly-temp>${temperature}${symbol}</div>
  `;

  return item;
}

/**
 * Show loading state
 */
export function showLoading() {
  const loadingEl = DOM.weatherLoading();
  const errorEl = DOM.weatherError();
  const mainEl = DOM.weatherMain();

  if (loadingEl) loadingEl.style.display = "block";
  if (errorEl) errorEl.style.display = "none";
  if (mainEl) mainEl.style.opacity = "0.5";
}

/**
 * Hide loading state
 */
export function hideLoading() {
  const loadingEl = DOM.weatherLoading();
  const mainEl = DOM.weatherMain();

  if (loadingEl) loadingEl.style.display = "none";
  if (mainEl) mainEl.style.opacity = "1";
}

/**
 * Show error message
 */
export function showError(message) {
  hideLoading();
  const errorEl = DOM.weatherError();
  const messageEl = DOM.errorMessage();

  if (errorEl) errorEl.style.display = "block";
  if (messageEl) messageEl.textContent = message;
}

/**
 * Hide error message
 */
export function hideError() {
  const errorEl = DOM.weatherError();
  if (errorEl) errorEl.style.display = "none";
}
