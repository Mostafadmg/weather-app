/**
 * DOM Selectors - Professional approach using data attributes
 * This makes the code maintainable and separates concerns from styling
 */

export const DOM = {
  // Search elements
  searchInput: () => document.querySelector("[data-location-input]"),
  searchBtn: () => document.querySelector("[data-search-btn]"),
  searchContainer: () => document.querySelector("[data-search-container]"),

  // Unit toggle
  unitToggle: () => document.querySelector("[data-unit-toggle]"),
  unitLabel: () => document.querySelector("[data-unit-label]"),

  // Main weather info
  weatherMain: () => document.querySelector("[data-weather-main]"),
  weatherCard: () => document.querySelector("[data-weather-card]"),
  locationName: () => document.querySelector("[data-location-name]"),
  currentDate: () => document.querySelector("[data-current-date]"),
  mainWeatherIcon: () => document.querySelector("[data-main-weather-icon]"),
  mainTemperature: () => document.querySelector("[data-main-temperature]"),

  // Weather details
  weatherDetails: () => document.querySelector("[data-weather-details]"),
  feelsLikeTemp: () => document.querySelector("[data-feels-like-temp]"),
  humidityValue: () => document.querySelector("[data-humidity-value]"),
  windSpeed: () => document.querySelector("[data-wind-speed]"),
  precipitationValue: () => document.querySelector("[data-precipitation-value]"),

  // Get all detail cards
  detailCards: () => document.querySelectorAll("[data-detail-card]"),

  // Daily forecast
  dailyForecast: () => document.querySelector("[data-daily-forecast]"),
  dailyForecastList: () => document.querySelector("[data-daily-forecast-list]"),
  forecastDays: () => document.querySelectorAll("[data-forecast-day]"),

  // Hourly forecast
  hourlyForecast: () => document.querySelector("[data-hourly-forecast]"),
  hourlyForecastList: () => document.querySelector("[data-hourly-forecast-list]"),
  hourlyItems: () => document.querySelectorAll("[data-hourly-item]"),
  daySelector: () => document.querySelector("[data-day-selector]"),
  selectedDay: () => document.querySelector("[data-selected-day]"),

  // Loading and error states
  weatherLoading: () => document.getElementById("weather-loading"),
  weatherError: () => document.getElementById("weather-error"),
  errorMessage: () => document.getElementById("error-message"),
};

/**
 * Get current unit setting
 */
export function getCurrentUnit() {
  const toggle = DOM.unitToggle();
  return toggle?.dataset.currentUnit || "celsius";
}

/**
 * Set current unit
 */
export function setCurrentUnit(unit) {
  const toggle = DOM.unitToggle();
  if (toggle) {
    toggle.dataset.currentUnit = unit;
  }
}
