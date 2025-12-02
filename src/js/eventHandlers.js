/**
 * Event Handlers - Professional event management
 */

import { DOM } from "./selectors.js";
import {
  updateMainWeather,
  updateWeatherDetails,
  updateDailyForecast,
  updateHourlyForecast,
  showLoading,
  hideLoading,
  showError,
} from "./weatherUI.js";

/**
 * Initialize all event listeners
 */
export function initEventListeners() {
  initSearchListeners();
  initUnitToggleListener();
  initDaySelectorListener();
}

/**
 * Search functionality
 */
function initSearchListeners() {
  const searchBtn = DOM.searchBtn();
  const searchInput = DOM.searchInput();

  // Search button click
  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  // Enter key in search input
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }
}

/**
 * Handle search action
 */
async function handleSearch() {
  const searchInput = DOM.searchInput();
  const location = searchInput?.value.trim();

  if (!location) {
    showError("Please enter a location");
    return;
  }

  try {
    showLoading();
    // TODO: Call your weather API here
    // const weatherData = await fetchWeatherData(location);
    // updateAllWeatherData(weatherData);

    // Example mock data for now
    console.log(`Searching for weather in: ${location}`);
    hideLoading();
  } catch (error) {
    showError("Unable to fetch weather data. Please try again.");
    console.error("Search error:", error);
  }
}

/**
 * Unit toggle (Celsius/Fahrenheit)
 */
function initUnitToggleListener() {
  const unitToggle = DOM.unitToggle();

  if (unitToggle) {
    unitToggle.addEventListener("click", handleUnitToggle);
  }
}

/**
 * Handle unit toggle
 */
function handleUnitToggle() {
  const toggle = DOM.unitToggle();
  const currentUnit = toggle?.dataset.currentUnit || "celsius";
  const newUnit = currentUnit === "celsius" ? "fahrenheit" : "celsius";

  // Update unit in toggle button
  if (toggle) {
    toggle.dataset.currentUnit = newUnit;
  }

  // TODO: Convert and update all temperature displays
  // You would call a function to convert all temps and update the UI
  console.log(`Switched to ${newUnit}`);
}

/**
 * Day selector for hourly forecast
 */
function initDaySelectorListener() {
  const daySelector = DOM.daySelector();

  if (daySelector) {
    daySelector.addEventListener("click", handleDaySelection);
  }
}

/**
 * Handle day selection for hourly forecast
 */
function handleDaySelection() {
  // TODO: Show dropdown with available days
  // Update hourly forecast based on selected day
  console.log("Day selector clicked");
}

/**
 * Update all weather data at once
 */
export function updateAllWeatherData(data) {
  const {
    location,
    date,
    temperature,
    icon,
    condition,
    feelsLike,
    humidity,
    windSpeed,
    precipitation,
    dailyForecast,
    hourlyForecast,
  } = data;

  // Update main weather
  updateMainWeather({
    location,
    date,
    temperature,
    icon,
    condition,
  });

  // Update details
  updateWeatherDetails({
    feelsLike,
    humidity,
    windSpeed,
    precipitation,
  });

  // Update forecasts
  if (dailyForecast) {
    updateDailyForecast(dailyForecast);
  }

  if (hourlyForecast) {
    updateHourlyForecast(hourlyForecast);
  }
}
