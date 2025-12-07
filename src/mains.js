// ============================================================================
// WEATHER APP - FINAL COMPLETE JAVASCRIPT CODE
// ============================================================================
// This app fetches weather data from OpenWeatherMap API and displays:
// - Current weather (temperature, humidity, wind, etc.)
// - 5-day daily forecast
// - Hourly forecast for each day
// - Settings for temperature units, wind speed units, and time format
// - City search with autocomplete suggestions
// - Loading spinner during data fetch
// - All settings saved to localStorage
// ============================================================================

import "./style.css";
import "../scss/main.scss";

// ============================================================================
// WEATHER ICON IMPORTS
// ============================================================================
// We import local images so Vite can process them correctly.
// Each icon corresponds to a weather condition code from the API.
// The API returns codes like "01d" (clear day), "10n" (rain night), etc.
// "d" = day, "n" = night
// ============================================================================

import iconSunny from "../assets/images/icon-sunny.webp";
import iconFullMoon from "../assets/images/full-moon.png";
import iconPartlyCloudy from "../assets/images/icon-partly-cloudy.webp";
import iconCloudy from "../assets/images/cloudy.png";
import iconOvercast from "../assets/images/icon-overcast.webp";
import iconDrizzle from "../assets/images/icon-drizzle.webp";
import iconRain from "../assets/images/icon-rain.webp";
import iconStorm from "../assets/images/icon-storm.webp";
import iconSnow from "../assets/images/icon-snow.webp";
import iconFog from "../assets/images/icon-fog.webp";

// ============================================================================
// WEATHER ICON MAP
// ============================================================================
// Maps API icon codes to our local images.
// 01 = clear, 02 = few clouds, 03 = scattered clouds, 04 = broken clouds
// 09 = drizzle, 10 = rain, 11 = thunderstorm, 13 = snow, 50 = fog
// ============================================================================

const weatherIconMap = {
  "01d": iconSunny,
  "01n": iconFullMoon,
  "02d": iconPartlyCloudy,
  "02n": iconPartlyCloudy,
  "03d": iconCloudy,
  "03n": iconCloudy,
  "04d": iconOvercast,
  "04n": iconOvercast,
  "09d": iconDrizzle,
  "09n": iconDrizzle,
  "10d": iconRain,
  "10n": iconRain,
  "11d": iconStorm,
  "11n": iconStorm,
  "13d": iconSnow,
  "13n": iconSnow,
  "50d": iconFog,
  "50n": iconFog,
};

// ============================================================================
// API CONFIGURATION
// ============================================================================
// API_KEY: Your OpenWeatherMap API key
// BASE_URL: The base URL for all weather API requests
// city: The current city to fetch weather for (loaded from localStorage or default)
// ============================================================================

const API_KEY = "491d823269a39efcdc476377ae1b028c";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
let city = localStorage.getItem("lastCity") || "Cardiff";

// ============================================================================
// GLOBAL STATE VARIABLES
// ============================================================================
// globalForecastData: Stores forecast data for day selection in hourly dropdown
// searchTimeout: Used for debouncing search input (prevents too many API calls)
// ============================================================================

let globalForecastData = null;
let searchTimeout = null;

// ============================================================================
// USER SETTINGS STATE (Loaded from localStorage)
// ============================================================================
// currentUnit: "celsius" or "fahrenheit"
// currentSpeedUnit: "mph" or "kmh"
// currentTimeFormat: "12" or "24"
// ============================================================================

let currentUnit = localStorage.getItem("tempUnit") || "celsius";
let currentSpeedUnit = localStorage.getItem("windUnit") || "mph";
let currentTimeFormat = localStorage.getItem("timeFormat") || "12";

// ============================================================================
// DOM ELEMENTS - LOADING SPINNER
// ============================================================================

const loadingOverlay = document.querySelector("[data-loading-overlay]");

// ============================================================================
// DOM ELEMENTS - SETTINGS
// ============================================================================

const settingBtn = document.querySelector("[data-unit-toggle]");
const settingDropdown = document.querySelector("[data-settings-dropdown]");
const dataUnitOption = document.querySelectorAll("[data-unit-option]");
const dataUnitDisplay = document.querySelector("[data-unit-display]");
const dataWindOption = document.querySelectorAll("[data-wind-option]");
const dataTimeOption = document.querySelectorAll("[data-time-option]");

// ============================================================================
// DOM ELEMENTS - CURRENT WEATHER
// ============================================================================

const mainTemp = document.querySelector("[data-main-temperature]");
const mainIcon = document.querySelector("[data-main-weather-icon]");
const locationName = document.querySelector("[data-location-name]");
const currentDate = document.querySelector("[data-current-date]");
const feelsLikeTemp = document.querySelector("[data-feels-like-temp]");
const humidityValue = document.querySelector("[data-humidity-value]");
const windSpeed = document.querySelector("[data-wind-speed]");
const precipitationValue = document.querySelector("[data-precipitation-value]");

// ============================================================================
// DOM ELEMENTS - HOURLY FORECAST DROPDOWN
// ============================================================================

const hourlyMenu = document.querySelector("[data-day-selector]");
const dayOptions = document.querySelectorAll("[data-day-option]");
const selectedDay = document.querySelector("[data-selected-day]");
const hourlyDropdown = document.querySelector("[data-day-dropdown]");

// ============================================================================
// DOM ELEMENTS - SEARCH
// ============================================================================

const locationInput = document.querySelector("[data-location-input]");
const searchBtn = document.querySelector("[data-search-btn]");
const searchDropdown = document.querySelector("[data-search-dropdown]");

// ============================================================================
// PRIORITY COUNTRIES FOR SEARCH
// ============================================================================
// English-speaking and European countries appear first in search results
// ============================================================================

const PRIORITY_COUNTRIES = [
  "United Kingdom",
  "UK",
  "England",
  "Scotland",
  "Wales",
  "Northern Ireland",
  "United States",
  "USA",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Belgium",
  "Sweden",
  "Norway",
  "Denmark",
  "Switzerland",
  "Poland",
  "Portugal",
  "Ireland",
];

// ============================================================================
// ============================================================================
//                         HELPER FUNCTIONS
// ============================================================================
// ============================================================================

// ============================================================================
// HELPER: Show/Hide Loading Spinner
// ============================================================================
// Shows a full-screen overlay with spinning animation during API calls.
// Parameters:
// - isLoading: true to show spinner, false to hide
// ============================================================================

function setLoading(isLoading) {
  if (loadingOverlay) {
    if (isLoading) {
      loadingOverlay.classList.add("loading-overlay--visible");
    } else {
      loadingOverlay.classList.remove("loading-overlay--visible");
    }
  }
}

// ============================================================================
// HELPER: Celsius to Fahrenheit
// ============================================================================
// Formula: (C × 9/5) + 32 = F
// Example: 20°C → 68°F
// ============================================================================

function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

// ============================================================================
// HELPER: Fahrenheit to Celsius
// ============================================================================
// Formula: (F - 32) × 5/9 = C
// Example: 68°F → 20°C
// ============================================================================

function fahrenheitToCelsius(fahrenheit) {
  return Math.round(((fahrenheit - 32) * 5) / 9);
}

// ============================================================================
// HELPER: Extract Temperature Number from Text
// ============================================================================
// Takes "25°" or "-5°" and returns the number (25 or -5)
// Returns null if no number found
// ============================================================================

function extractTemperature(text) {
  const match = text.match(/(-?\d+)/);
  return match ? parseInt(match[1]) : null;
}

// ============================================================================
// HELPER: Extract Wind Speed Number from Text
// ============================================================================
// Takes "15 mph" and returns 15
// Returns null if no number found
// ============================================================================

function extractWindSpeed(text) {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// ============================================================================
// HELPER: MPH to KM/H
// ============================================================================
// Formula: mph × 1.609 = km/h
// ============================================================================

function mphToKmh(speed) {
  return Math.round(speed * 1.609);
}

// ============================================================================
// HELPER: KM/H to MPH
// ============================================================================
// Formula: km/h ÷ 1.609 = mph
// ============================================================================

function kmhToMph(speed) {
  return Math.round(speed / 1.609);
}

// ============================================================================
// HELPER: Format Time from Timestamp
// ============================================================================
// Converts Unix timestamp to formatted time string.
// Respects user's time format preference (12-hour or 24-hour).
//
// Steps:
// 1. Create Date object from timestamp (× 1000 for milliseconds)
// 2. Get hour (0-23)
// 3. Format based on currentTimeFormat setting
// ============================================================================

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();

  if (currentTimeFormat === "24") {
    return `${hours.toString().padStart(2, "0")}:00`;
  }

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours} ${ampm}`;
}

// ============================================================================
// HELPER: Format Date for Display
// ============================================================================
// Returns formatted date like "Sunday, Dec 7, 2025"
// ============================================================================

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// HELPER: Group Forecast Items by Day
// ============================================================================
// The API returns 40 items (every 3 hours for 5 days).
// This groups them by day for daily forecast and hourly selection.
//
// Steps:
// 1. Create empty object for grouping
// 2. Loop through all 40 items
// 3. Get date string (ignoring time) as key
// 4. Create array for new dates, push items to existing arrays
// 5. Return array of arrays using Object.values()
//
// Result: [[day1Items], [day2Items], ...]
// ============================================================================

function groupForecastByDay(data) {
  const dailyData = {};

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toLocaleDateString();

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = [];
    }
    dailyData[dateKey].push(item);
  });

  return Object.values(dailyData);
}

// ============================================================================
// HELPER: Get Dynamic Weekday Names
// ============================================================================
// Returns array of weekday names starting from today.
// Example: If today is Sunday → ["Sunday", "Monday", "Tuesday", ...]
// ============================================================================

function getDynamicWeekdays() {
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const todayIndex = new Date().getDay();
  const rotated = [];

  for (let i = 0; i < 7; i++) {
    rotated.push(weekdays[(todayIndex + i) % 7]);
  }

  return rotated;
}

// ============================================================================
// HELPER: Prioritize Cities in Search Results
// ============================================================================
// Sorts results so priority countries appear first, then by population.
// ============================================================================

function prioritizeCities(cities) {
  return cities.sort((a, b) => {
    const aPriority = PRIORITY_COUNTRIES.includes(a.country);
    const bPriority = PRIORITY_COUNTRIES.includes(b.country);

    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    return (b.population || 0) - (a.population || 0);
  });
}

// ============================================================================
// ============================================================================
//                         UI UPDATE FUNCTIONS
// ============================================================================
// ============================================================================

// ============================================================================
// UI: Update Settings Checkmarks
// ============================================================================
// Shows ✓ next to the currently selected option in each settings group.
// ============================================================================

function updateCheckmarks() {
  // Temperature checkmarks
  dataUnitOption.forEach((option) => {
    const optionUnit = option.dataset.unitOption;
    const check = option.querySelector(".header__setting-check");
    if (check) {
      check.textContent = optionUnit === currentUnit ? "✓" : "";
    }
  });

  // Wind speed checkmarks
  dataWindOption.forEach((option) => {
    const optionUnit = option.dataset.windOption;
    const check = option.querySelector(".header__setting-check");
    if (check) {
      check.textContent = optionUnit === currentSpeedUnit ? "✓" : "";
    }
  });

  // Time format checkmarks
  dataTimeOption.forEach((option) => {
    const optionFormat = option.dataset.timeOption;
    const check = option.querySelector(".header__setting-check");
    if (check) {
      check.textContent = optionFormat === currentTimeFormat ? "✓" : "";
    }
  });
}

// ============================================================================
// UI: Update Temperature Badge
// ============================================================================
// Updates the header badge showing "Temperature in Celsius/Fahrenheit"
// ============================================================================

function updateBadge() {
  if (dataUnitDisplay) {
    dataUnitDisplay.textContent = currentUnit === "celsius" ? "Celsius" : "Fahrenheit";
  }
}

// ============================================================================
// UI: Update Day Selector Dropdown Text
// ============================================================================
// Sets dropdown options to "Today", "Tomorrow", and actual weekday names.
// ============================================================================

function updateDaySelectorText() {
  const dynamicDays = getDynamicWeekdays();
  const options = document.querySelectorAll("[data-day-option]");

  options.forEach((opt, index) => {
    const label = opt.querySelector(".forecast-h__day-text");
    if (label) {
      if (index === 0) {
        label.textContent = "Today";
      } else if (index === 1) {
        label.textContent = "Tomorrow";
      } else {
        label.textContent = dynamicDays[index];
      }
    }
  });
}

// ============================================================================
// UI: Initialize All UI Elements
// ============================================================================
// Called on page load to set up initial state from saved settings.
// ============================================================================

function initializeUI() {
  updateBadge();
  updateCheckmarks();
  updateDaySelectorText();
}

// ============================================================================
// ============================================================================
//                         CONVERSION FUNCTIONS
// ============================================================================
// ============================================================================

// ============================================================================
// CONVERT: All Temperatures on Page
// ============================================================================
// When user changes unit, converts ALL displayed temperatures.
//
// Steps:
// 1. Select all temperature elements
// 2. Extract current number from each
// 3. Convert to new unit
// 4. Update the text
// ============================================================================

function convertAllTemperatures(toUnit) {
  const allTemps = document.querySelectorAll(
    "[data-main-temperature], [data-feels-like-temp], [data-hourly-temp], [data-day-temp-max], [data-day-temp-min]"
  );

  allTemps.forEach((element) => {
    const tempStr = element.textContent;
    const tempValue = extractTemperature(tempStr);

    if (tempValue === null) return;

    let newTemp;
    if (toUnit === "fahrenheit") {
      newTemp = celsiusToFahrenheit(tempValue);
    } else {
      newTemp = fahrenheitToCelsius(tempValue);
    }

    element.textContent = `${newTemp}°`;
  });
}

// ============================================================================
// CONVERT: Wind Speed Display
// ============================================================================
// Converts the wind speed when user changes unit.
// ============================================================================

function convertSpeedUnit() {
  const windSpeedStr = windSpeed.textContent;
  const speedValue = extractWindSpeed(windSpeedStr);

  if (speedValue === null) return;

  let newSpeed;
  if (currentSpeedUnit === "kmh") {
    newSpeed = mphToKmh(speedValue);
    windSpeed.textContent = `${newSpeed} km/h`;
  } else {
    newSpeed = kmhToMph(speedValue);
    windSpeed.textContent = `${newSpeed} mph`;
  }
}

// ============================================================================
// CONVERT: All Time Displays
// ============================================================================
// Converts all hourly times when user changes format.
//
// 12→24: "3 PM" → "15:00"
// 24→12: "15:00" → "3 PM"
// ============================================================================

function convertAllTimes() {
  const dataHourlyTime = document.querySelectorAll("[data-hourly-time]");

  dataHourlyTime.forEach((hourlyTime) => {
    const timeStr = hourlyTime.textContent.trim();

    // 12-hour to 24-hour
    if (
      currentTimeFormat === "24" &&
      (timeStr.includes("AM") || timeStr.includes("PM"))
    ) {
      const match = timeStr.match(/(\d{1,2})\s*(AM|PM)/i);

      if (match) {
        let hours = parseInt(match[1]);
        const period = match[2].toUpperCase();

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const formatted = hours.toString().padStart(2, "0");
        hourlyTime.textContent = `${formatted}:00`;
      }
    }

    // 24-hour to 12-hour
    else if (currentTimeFormat === "12" && /^\d{2}:00$/.test(timeStr)) {
      let hours = parseInt(timeStr.split(":")[0]);
      let period = "AM";

      if (hours === 0) {
        hours = 12;
        period = "AM";
      } else if (hours === 12) {
        period = "PM";
      } else if (hours > 12) {
        hours -= 12;
        period = "PM";
      }

      hourlyTime.textContent = `${hours} ${period}`;
    }
  });
}

// ============================================================================
// ============================================================================
//                         WEATHER UPDATE FUNCTIONS
// ============================================================================
// ============================================================================

// ============================================================================
// UPDATE: Current Weather Display
// ============================================================================
// Takes API data and updates the main weather card.
//
// Steps:
// 1. Set location name (city, country)
// 2. Set current date
// 3. Convert and display temperature based on user's unit preference
// 4. Display feels-like temperature
// 5. Display humidity
// 6. Convert and display wind speed based on user's unit preference
// 7. Display precipitation (0 if not raining)
// 8. Set weather icon
// ============================================================================

function updateCurrentWeather(data) {
  // Location: "Cardiff, GB"
  locationName.textContent = `${data.name}, ${data.sys.country}`;

  // Date: "Sunday, Dec 7, 2025"
  currentDate.textContent = formatDate(new Date());

  // Temperature - convert if user prefers Fahrenheit
  let temp = data.main.temp;
  let feelsLike = data.main.feels_like;

  if (currentUnit === "fahrenheit") {
    temp = celsiusToFahrenheit(temp);
    feelsLike = celsiusToFahrenheit(feelsLike);
  }

  mainTemp.textContent = `${Math.round(temp)}°`;
  feelsLikeTemp.textContent = `${Math.round(feelsLike)}°`;

  // Humidity
  humidityValue.textContent = `${data.main.humidity}%`;

  // Wind speed - API returns m/s, convert to user's preferred unit
  let windSpeedValue = Math.round(data.wind.speed * 2.237); // m/s to mph

  if (currentSpeedUnit === "kmh") {
    windSpeedValue = mphToKmh(windSpeedValue);
    windSpeed.textContent = `${windSpeedValue} km/h`;
  } else {
    windSpeed.textContent = `${windSpeedValue} mph`;
  }

  // Precipitation - may not exist if not raining
  precipitationValue.textContent = data.rain?.["1h"] ? `${data.rain["1h"]} mm` : "0 mm";

  // Weather icon
  const iconCode = data.weather[0].icon;
  mainIcon.src = weatherIconMap[iconCode];
}

// ============================================================================
// UPDATE: Daily Forecast Cards
// ============================================================================
// Updates the 7-day forecast display.
//
// Steps:
// 1. Group forecast items by day
// 2. Loop through each daily card
// 3. Extract temperatures and find min/max
// 4. Get day name and icon
// 5. Update card elements
// ============================================================================

function updateDailyForecast(data) {
  const daysArray = groupForecastByDay(data);
  const dailyCards = document.querySelectorAll("[data-forecast-day]");

  dailyCards.forEach((card, index) => {
    const dayItems = daysArray[index];

    const dayNameEl = card.querySelector("[data-day-name]");
    const iconEl = card.querySelector("[data-day-icon]");
    const maxTempEl = card.querySelector("[data-day-temp-max]");
    const minTempEl = card.querySelector("[data-day-temp-min]");

    if (dayItems && dayItems.length > 0) {
      // Get all temperatures for this day
      const temps = dayItems.map((item) => item.main.temp);

      // Find max and min
      let maxTemp = Math.round(Math.max(...temps));
      let minTemp = Math.round(Math.min(...temps));

      // Convert if needed
      if (currentUnit === "fahrenheit") {
        maxTemp = celsiusToFahrenheit(maxTemp);
        minTemp = celsiusToFahrenheit(minTemp);
      }

      // Get day name
      const date = new Date(dayItems[0].dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      // Get icon
      const iconCode = dayItems[0].weather[0].icon;

      // Update card
      dayNameEl.textContent = dayName;
      iconEl.src = weatherIconMap[iconCode];
      maxTempEl.textContent = `${maxTemp}°`;
      minTempEl.textContent = `${minTemp}°`;
    } else {
      // No data for this day
      dayNameEl.textContent = "N/A";
      iconEl.src = iconSunny;
      maxTempEl.textContent = "N/A";
      minTempEl.textContent = "N/A";
    }
  });
}

// ============================================================================
// UPDATE: Hourly Forecast Cards
// ============================================================================
// Updates hourly cards for the selected day.
//
// Parameters:
// - data: Forecast API response
// - dayIndex: Which day (0 = today, 1 = tomorrow, etc.)
//
// Steps:
// 1. Group forecast by day
// 2. Get items for selected day
// 3. Loop through hourly cards
// 4. Update or hide each card
// ============================================================================

function updateHourlyForecast(data, dayIndex = 0) {
  const daysArray = groupForecastByDay(data);
  const selectedDayItems = daysArray[dayIndex];

  const hourlyCards = document.querySelectorAll("[data-hourly-item]");

  hourlyCards.forEach((card, index) => {
    const forecast = selectedDayItems ? selectedDayItems[index] : null;

    if (forecast) {
      card.style.display = "flex";

      const hourlyIcon = card.querySelector("[data-hourly-icon]");
      const hourlyTime = card.querySelector("[data-hourly-time]");
      const hourlyTemp = card.querySelector("[data-hourly-temp]");

      // Temperature - convert if needed
      let temp = Math.round(forecast.main.temp);
      if (currentUnit === "fahrenheit") {
        temp = celsiusToFahrenheit(temp);
      }

      hourlyIcon.src = weatherIconMap[forecast.weather[0].icon];
      hourlyTemp.textContent = `${temp}°`;
      hourlyTime.textContent = formatTime(forecast.dt);
    } else {
      card.style.display = "none";
    }
  });
}

// ============================================================================
// ============================================================================
//                         API FUNCTIONS
// ============================================================================
// ============================================================================

// ============================================================================
// API: Fetch Weather Data
// ============================================================================
// Main function that fetches current weather and forecast.
//
// Steps:
// 1. Show loading spinner
// 2. Fetch current weather from /weather endpoint
// 3. Check response, throw error if city not found
// 4. Fetch forecast from /forecast endpoint
// 5. Store forecast globally for day selection
// 6. Update all displays
// 7. Save city to localStorage
// 8. Reset day selector to "Today"
// 9. Hide loading spinner (in finally block - runs always)
// ============================================================================

async function fetchWeather() {
  setLoading(true);

  try {
    // Fetch current weather
    const currentResponse = await fetch(
      `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!currentResponse.ok) {
      throw new Error("City not found");
    }

    const currentData = await currentResponse.json();

    // Fetch forecast
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    const forecastData = await forecastResponse.json();

    // Store globally for day selection
    globalForecastData = forecastData;

    // Update all displays
    updateCurrentWeather(currentData);
    updateDailyForecast(forecastData);
    updateHourlyForecast(forecastData);

    // Save to localStorage
    localStorage.setItem("lastCity", city);

    // Reset day selector
    if (selectedDay) {
      selectedDay.textContent = "Today";
    }
  } catch (error) {
    console.error("Error fetching weather:", error);

    // Show error state
    locationName.textContent = `Could not find "${city}"`;
    currentDate.textContent = "Please try another city";
    mainTemp.textContent = "--°";
    feelsLikeTemp.textContent = "--°";
    humidityValue.textContent = "--%";
    windSpeed.textContent = "-- mph";
    precipitationValue.textContent = "-- mm";
  } finally {
    // Always hide spinner (success or error)
    setLoading(false);
  }
}

// ============================================================================
// API: Fetch City Suggestions (Autocomplete)
// ============================================================================
// Fetches city suggestions from GeoDB API as user types.
//
// Steps:
// 1. Check query length (min 2 characters)
// 2. Make API request
// 3. Sort results with priority countries first
// 4. Display dropdown
// ============================================================================

async function fetchCitySuggestions(query) {
  if (!query || query.length < 2) {
    searchDropdown.innerHTML = "";
    searchDropdown.style.display = "none";
    return;
  }

  try {
    const url = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${query}&limit=10&sort=-population&minPopulation=20000`;

    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": "d91a8c820bmsh5ddf3bc60ade0d7p164fcdjsn609b902b6d9a",
        "x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
      },
    };

    const response = await fetch(url, options);
    const result = await response.json();

    if (result.data && result.data.length > 0) {
      const sortedCities = prioritizeCities(result.data);
      displayCityDropdown(sortedCities);
    } else {
      searchDropdown.innerHTML = "";
      searchDropdown.style.display = "none";
    }
  } catch (error) {
    console.error("Error fetching city suggestions:", error);
    searchDropdown.innerHTML = "";
    searchDropdown.style.display = "none";
  }
}

// ============================================================================
// SEARCH: Display City Suggestions Dropdown
// ============================================================================
// Creates HTML for dropdown and adds click listeners.
// ============================================================================

function displayCityDropdown(cities) {
  if (!cities || cities.length === 0) {
    searchDropdown.innerHTML = "";
    searchDropdown.style.display = "none";
    return;
  }

  searchDropdown.innerHTML = cities
    .map((cityItem) => {
      return `
        <li class="search__dropdown-item" data-city="${cityItem.name}">
          ${cityItem.name}, ${cityItem.country}
        </li>
      `;
    })
    .join("");

  searchDropdown.style.display = "block";

  // Add click listeners
  document.querySelectorAll(".search__dropdown-item").forEach((item) => {
    item.addEventListener("click", () => {
      const selectedCity = item.dataset.city;

      locationInput.value = selectedCity;
      city = selectedCity;
      searchDropdown.style.display = "none";

      fetchWeather();
    });
  });
}

// ============================================================================
// ============================================================================
//                         EVENT LISTENERS
// ============================================================================
// ============================================================================

// ============================================================================
// EVENT: Settings Button Click
// ============================================================================
// Toggles the settings dropdown open/closed.
// e.stopPropagation() prevents the document click from closing it immediately.
// ============================================================================

settingBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  settingDropdown.classList.toggle("header__setting-menu--visible");
});

// ============================================================================
// EVENT: Temperature Unit Selection
// ============================================================================
// When user clicks Celsius or Fahrenheit:
// 1. Skip if already selected
// 2. Update state
// 3. Update UI
// 4. Convert all temperatures
// 5. Save to localStorage
// ============================================================================

dataUnitOption.forEach((option) => {
  option.addEventListener("click", () => {
    const unit = option.dataset.unitOption;

    if (unit === currentUnit) return;

    currentUnit = unit;
    updateBadge();
    updateCheckmarks();
    convertAllTemperatures(unit);
    localStorage.setItem("tempUnit", currentUnit);
  });
});

// ============================================================================
// EVENT: Wind Speed Unit Selection
// ============================================================================

dataWindOption.forEach((option) => {
  option.addEventListener("click", () => {
    const unit = option.dataset.windOption;

    if (unit === currentSpeedUnit) return;

    currentSpeedUnit = unit;
    updateCheckmarks();
    convertSpeedUnit();
    localStorage.setItem("windUnit", currentSpeedUnit);
  });
});

// ============================================================================
// EVENT: Time Format Selection
// ============================================================================

dataTimeOption.forEach((option) => {
  option.addEventListener("click", () => {
    const format = option.dataset.timeOption;

    if (format === currentTimeFormat) return;

    currentTimeFormat = format;
    updateCheckmarks();
    convertAllTimes();
    localStorage.setItem("timeFormat", currentTimeFormat);
  });
});

// ============================================================================
// EVENT: Hourly Dropdown Toggle
// ============================================================================

hourlyMenu.addEventListener("click", (e) => {
  e.stopPropagation();
  hourlyDropdown.classList.toggle("forecast-h__day-menu--visible");
});

// ============================================================================
// EVENT: Day Selection for Hourly Forecast
// ============================================================================
// When user selects a day:
// 1. Get day index (0, 1, 2, etc.)
// 2. Get day name text
// 3. Update button text
// 4. Update hourly forecast for that day
// 5. Close dropdown
// ============================================================================

dayOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const dayIndex = option.getAttribute("data-day-option");
    const dayName = option.querySelector(".forecast-h__day-text").textContent;

    selectedDay.textContent = dayName;
    updateHourlyForecast(globalForecastData, parseInt(dayIndex));
    hourlyDropdown.classList.remove("forecast-h__day-menu--visible");
  });
});

// ============================================================================
// EVENT: Search Input (with Debounce)
// ============================================================================
// Waits 300ms after user stops typing before making API call.
// Prevents excessive API requests on every keystroke.
// ============================================================================

locationInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    const text = locationInput.value.trim();
    fetchCitySuggestions(text);
  }, 300);
});

// ============================================================================
// EVENT: Search Button Click
// ============================================================================

searchBtn.addEventListener("click", () => {
  const cityName = locationInput.value.trim();

  if (cityName === "") {
    alert("Please enter a city name");
    return;
  }

  city = cityName;
  searchDropdown.style.display = "none";
  fetchWeather();
});

// ============================================================================
// EVENT: Enter Key in Search Input
// ============================================================================

locationInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const cityName = locationInput.value.trim();

    if (cityName === "") return;

    city = cityName;
    searchDropdown.style.display = "none";
    fetchWeather();
  }
});

// ============================================================================
// EVENT: Close Dropdowns on Outside Click
// ============================================================================
// Closes all dropdowns when user clicks anywhere else on the page.
// ============================================================================

document.addEventListener("click", (e) => {
  // Close settings dropdown
  if (!settingBtn.contains(e.target) && !settingDropdown.contains(e.target)) {
    settingDropdown.classList.remove("header__setting-menu--visible");
  }

  // Close hourly dropdown
  if (!hourlyMenu.contains(e.target) && !hourlyDropdown.contains(e.target)) {
    hourlyDropdown.classList.remove("forecast-h__day-menu--visible");
  }

  // Close search dropdown
  if (!locationInput.contains(e.target) && !searchDropdown.contains(e.target)) {
    searchDropdown.style.display = "none";
  }
});

// ============================================================================
// ============================================================================
//                         INITIALIZE APP
// ============================================================================
// ============================================================================
// When page loads:
// 1. Set up UI (checkmarks, badge, day selector)
// 2. Fetch weather for saved/default city
// ============================================================================

initializeUI();
fetchWeather();
