/**
 * ============================================
 * DOM Element Selections
 * ============================================
 */

import "./style.css";
import "../scss/main.scss";

const locationInput = document.querySelector("[data-location-input]");
const searchBtn = document.querySelector("[data-search-btn]");
const searchDropdown = document.querySelector("[data-search-dropdown]");

// Current Weather Elements
const locationName = document.querySelector("[data-location-name]");
const currentDate = document.querySelector("[data-current-date]");
const mainWeatherIcon = document.querySelector("[data-main-weather-icon]");
const mainTemperature = document.querySelector("[data-main-temperature]");

// Weather details
const feelsLikeTemp = document.querySelector("[data-feels-like-temp]");
const humidityValue = document.querySelector("[data-humidity-value]");
const windSpeed = document.querySelector("[data-wind-speed]");
const precipitationValue = document.querySelector("[data-precipitation-value]");

// Daily Forecast Elements
const dailyForecastList = document.querySelector("[data-daily-forecast-list]");

// Hourly Forecast Elements
const hourlyForecastList = document.querySelector("[data-hourly-forecast-list]");

const API_KEY = "491d823269a39efcdc476377ae1b028c";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Store forecast data globally for day selection
let globalForecastData = null;
let searchTimeout = null;
let userMadeSelection = false;

// Import images for Vite to process
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

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * ============================================
 * This function formats a Date object into a readable date string,
 * typically used for the main weather display.
 * Example output: "Tuesday, Dec 2, 2025"
 * @param {Date} date - The date object to format.
 * @returns {string} The formatted date string.
 * ============================================
 */
function formatDate(date) {
  const options = {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

/**
 * ============================================
 * This function formats a Date object into a time string for the
 * hourly forecast cards, supporting both 12-hour (with AM/PM) and
 * 24-hour formats based on the global `current24Hour` setting.
 * Example output: "11 PM" or "23:00"
 * @param {Date} date - The date object to format.
 * @returns {string} The formatted time string.
 * ============================================
 */
function formatTime(date) {
  const hours = date.getHours();

  if (current24Hour) {
    return `${hours.toString().padStart(2, "0")}:00`;
  } else {
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours} ${ampm}`;
  }
}

/**
 * ============================================
 * This function formats a Date object to get the short name of the weekday.
 * Example output: "Tue"
 * @param {Date} date - The date object to format.
 * @returns {string} The short weekday name.
 * ============================================
 */
function formatDayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * ============================================
 * This function takes an array of weather icon codes (from 8 hourly forecasts)
 * and determines the single most frequently occurring icon. This is used to
 * select a representative icon for a full day in the daily forecast view.
 * @param {Array<string>} icons - An array of OpenWeatherMap icon codes.
 * @returns {string} The most common icon code.
 * ============================================
 */
function getMostCommonIcon(icons) {
  const counts = {};

  icons.forEach((icon) => {
    counts[icon] = (counts[icon] || 0) + 1;
  });

  let mostCommon = icons[0];
  let highestCount = 0;

  for (let icon in counts) {
    if (counts[icon] > highestCount) {
      highestCount = counts[icon];
      mostCommon = icon;
    }
  }

  return mostCommon;
}

/**
 * ============================================
 * UPDATE FUNCTIONS
 * ============================================
 */

/**
 * ============================================
 * This function updates all the main elements on the page with the current
 * weather data fetched from the OpenWeatherMap `/weather` endpoint. It handles
 * the location name, current date, main temperature, weather icon,
 * "feels like" temperature, humidity, wind speed (converting from m/s to
 * mph or km/h based on `currentWindUnit`), and 1-hour precipitation.
 * @param {Object} data - The current weather data object.
 * ============================================
 */
function updateCurrentWeather(data) {
  console.log("🔄 Updating current weather...");

  locationName.textContent = `${data.name}, ${data.sys.country}`;
  currentDate.textContent = formatDate(new Date());
  mainTemperature.textContent = `${Math.round(data.main.temp)}°`;

  const iconCode = data.weather[0].icon;
  mainWeatherIcon.src = weatherIconMap[iconCode];

  feelsLikeTemp.textContent = `${Math.round(data.main.feels_like)}°`;
  humidityValue.textContent = `${data.main.humidity}%`;

  const windSpeedValue =
    currentWindUnit === "mph" ? mpsToMph(data.wind.speed) : mpsToKmh(data.wind.speed);
  windSpeed.textContent = `${windSpeedValue} ${currentWindUnit}`;

  if (data.rain && data.rain["1h"]) {
    precipitationValue.textContent = `${data.rain["1h"]} mm`;
  } else {
    precipitationValue.textContent = "0 mm";
  }

  console.log("✅ Current weather updated");
}

/**
 * ============================================
 * This function updates the hourly forecast section using the 5-day/3-hour
 * forecast data. It first groups the 40 available forecasts by day and then
 * displays the first 8 hourly forecasts for the specified `dayIndex` (0 for today).
 * It uses the global `current24Hour` setting to format the time display.
 * @param {Object} forecastData - The forecast data object from the OpenWeatherMap `/forecast` endpoint.
 * @param {number} dayIndex - The index of the day (0=Today, 1=Tomorrow, etc.) to display the hourly forecast for.
 * ============================================
 */
function updateHourlyForecast(forecastData, dayIndex = 0) {
  console.log(`🔄 Updating hourly forecast for day ${dayIndex}...`); // Group forecasts by day

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyForecasts = {};

  forecastData.list.forEach((forecast) => {
    const forecastDate = new Date(forecast.dt * 1000);
    const dateAtMidnight = new Date(forecastDate);
    dateAtMidnight.setHours(0, 0, 0, 0);
    const dateKey = dateAtMidnight.getTime();

    if (!dailyForecasts[dateKey]) {
      dailyForecasts[dateKey] = [];
    }
    dailyForecasts[dateKey].push(forecast);
  }); // Convert to sorted array

  const sortedDays = Object.keys(dailyForecasts)
    .map((key) => parseInt(key))
    .sort((a, b) => a - b); // Get forecasts for selected day

  const selectedDayKey = sortedDays[dayIndex];
  const selectedDayForecasts =
    dailyForecasts[selectedDayKey] || forecastData.list.slice(0, 8); // Take up to 8 hourly forecasts for the selected day

  const hourlyData = selectedDayForecasts.slice(0, 8);
  const hourlyCards = document.querySelectorAll("[data-hourly-item]");

  hourlyData.forEach((forecast, index) => {
    if (index >= hourlyCards.length) return;

    const card = hourlyCards[index];
    const timestamp = forecast.dt * 1000;
    const date = new Date(timestamp);
    const time = formatTime(date);
    const temp = Math.round(forecast.main.temp);
    const iconCode = forecast.weather[0].icon;
    const iconPath = weatherIconMap[iconCode];

    const timeElement = card.querySelector("[data-hourly-time]");
    const tempElement = card.querySelector("[data-hourly-temp]");
    const iconElement = card.querySelector("[data-hourly-icon]");

    timeElement.textContent = time;
    tempElement.textContent = `${temp}°`;
    iconElement.src = iconPath;

    console.log(`Hourly ${index + 1}: ${time}, ${temp}°`);
  });

  console.log("✅ Hourly forecast updated");
}

/**
 * ============================================
 * This function populates the day selection dropdown (for the hourly forecast).
 * It identifies the distinct days in the forecast data and labels them as
 * "Today", "Tomorrow", or the full weekday name. It also initializes the
 * dropdown to show "Today" as the selected and active day.
 * @param {Object} forecastData - The forecast data object.
 * ============================================
 */
function populateDayDropdown(forecastData) {
  console.log("🔄 Populating day dropdown...");

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Group by day

  const dailyData = {};

  forecastData.list.forEach((forecast) => {
    const forecastDate = new Date(forecast.dt * 1000);
    const dateAtMidnight = new Date(forecastDate);
    dateAtMidnight.setHours(0, 0, 0, 0);
    const dateKey = dateAtMidnight.getTime();

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = dateAtMidnight;
    }
  }); // Convert to sorted array - this ensures we start with today

  const daysArray = Object.values(dailyData).sort((a, b) => a.getTime() - b.getTime()); // Update dropdown items - always start with Today

  for (let index = 0; index < 7; index++) {
    const dayOption = document.querySelector(`[data-day-option="${index}"]`);
    const dayTextElement = dayOption?.querySelector(`[data-day-name-${index}]`);

    if (dayTextElement && daysArray[index]) {
      const date = daysArray[index];
      let dayLabel;
      const diffDays = Math.floor(
        (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        dayLabel = "Today";
      } else if (diffDays === 1) {
        dayLabel = "Tomorrow";
      } else {
        // Get the actual weekday name
        dayLabel = date.toLocaleDateString("en-US", { weekday: "long" });
      }

      dayTextElement.textContent = dayLabel;
      console.log(
        `Day ${index}: ${dayLabel} (${date.toLocaleDateString()}) - ${diffDays} days from today`
      );
    } else if (dayTextElement) {
      // Hide days that don't have data
      dayTextElement.textContent = "";
      if (dayOption) {
        dayOption.style.display = "none";
      }
    }
  } // Set initial selected day to "Today" and mark it active

  const selectedDayText = document.querySelector("[data-selected-day]");
  if (selectedDayText) {
    selectedDayText.textContent = "Today";
  } // Mark first item (Today) as active

  const firstDayOption = document.querySelector('[data-day-option="0"]');
  if (firstDayOption) {
    firstDayOption.classList.add("forecast-h__day-item--active");
  }

  console.log("✅ Day dropdown populated");
}

/**
 * ============================================
 * This function updates the 7-day daily forecast list. It processes the
 * 3-hour forecast data to group it by day, calculates the maximum and
 * minimum temperatures for each day, and determines the most common
 * weather icon to represent the day. It then updates the corresponding
 * daily forecast card elements with this summarized information.
 * @param {Object} forecastData - The forecast data object.
 * ============================================
 */
function updateDailyForecast(forecastData) {
  console.log("🔄 Updating daily forecast..."); // Get current date at midnight for comparison

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Group forecasts by day

  const dailyData = {};

  forecastData.list.forEach((forecast) => {
    const forecastDate = new Date(forecast.dt * 1000); // Create a date key at midnight (ignoring time)

    const dateAtMidnight = new Date(forecastDate);
    dateAtMidnight.setHours(0, 0, 0, 0);
    const dateKey = dateAtMidnight.getTime();

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        temps: [],
        icons: [],
        date: dateAtMidnight,
      };
    }

    dailyData[dateKey].temps.push(forecast.main.temp);
    dailyData[dateKey].icons.push(forecast.weather[0].icon);
  });

  console.log("Grouped by day:", dailyData); // Convert to array and sort by date

  const daysArray = Object.values(dailyData).sort((a, b) => {
    return a.date.getTime() - b.date.getTime();
  });

  console.log(
    "Sorted days array:",
    daysArray.map((d) => ({
      date: d.date.toLocaleDateString(),
      day: formatDayName(d.date),
    }))
  ); // Take exactly 7 days starting from today or tomorrow

  const next7Days = daysArray.slice(0, 7);

  const dailyCards = document.querySelectorAll("[data-forecast-day]");
  console.log("Found daily cards:", dailyCards.length); // Update each card

  next7Days.forEach((dayData, index) => {
    if (index >= dailyCards.length) return; // Safety check

    const card = dailyCards[index];

    const maxTemp = Math.round(Math.max(...dayData.temps));
    const minTemp = Math.round(Math.min(...dayData.temps));
    const mostCommonIcon = getMostCommonIcon(dayData.icons);
    const iconPath = weatherIconMap[mostCommonIcon];
    const dayName = formatDayName(dayData.date);

    const dayNameElement = card.querySelector("[data-day-name]");
    const maxTempElement = card.querySelector("[data-day-temp-max]");
    const minTempElement = card.querySelector("[data-day-temp-min]");
    const iconElement = card.querySelector("[data-day-icon]");

    dayNameElement.textContent = dayName;
    maxTempElement.textContent = `${maxTemp}°`;
    minTempElement.textContent = `${minTemp}°`;
    iconElement.src = iconPath;

    console.log(
      `Day ${
        index + 1
      }: ${dayName} (${dayData.date.toLocaleDateString()}), ${minTemp}° - ${maxTemp}°`
    );
  });

  console.log("✅ Daily forecast updated");
}

/**
 * ============================================
 * SEARCH FUNCTIONS
 * ============================================
 */

/**
 * ============================================
 * This asynchronous function searches for cities matching a given query.
 * It utilizes the GeoDB Cities API for location suggestions. It implements
 * a basic debounce mechanism by clearing `searchTimeout` and checks if
 * `userMadeSelection` is true to prevent searching immediately after a selection.
 * The results are fetched, formatted to extract necessary details (name, coordinates,
 * country/region), and then passed to `displayCitySuggestions`.
 * @param {string} query - The user's input string for the city search.
 * ============================================
 */
async function searchCities(query) {
  console.log("🔍 Searching for cities:", query); // Clear previous timeout

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (query.length < 2) {
    searchDropdown.innerHTML = "";
    searchDropdown.style.display = "none";
    return;
  } // Don't search if user just made a selection

  if (userMadeSelection) {
    return;
  }

  try {
    // Use GeoDB Cities API for better city search
    const url = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(
      query
    )}&limit=10&sort=-population`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": "d91a8c820bmsh5ddf3bc60ade0d7p164fcdjsn609b902b6d9a",
        "x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
      },
    });

    const data = await response.json();

    console.log(`Found ${data.data ? data.data.length : 0} cities total`);

    if (!data.data || data.data.length === 0) {
      searchDropdown.innerHTML = "";
      searchDropdown.style.display = "none";
      return;
    } // Format cities from GeoDB API

    const formattedCities = data.data.map((city) => {
      const countryCode = city.countryCode;
      const country = city.country || countryCode;
      const region = city.region || ""; // Create full location string

      let fullLocation = city.name;
      if (region) {
        fullLocation = `${city.name}, ${region}`;
      } else if (country) {
        fullLocation = `${city.name}, ${country}`;
      }

      return {
        name: city.name,
        country: countryCode,
        countryFull: country,
        state: region,
        lat: city.latitude,
        lon: city.longitude,
        population: city.population || 0,
        fullLocation: fullLocation,
      };
    });

    console.log(
      "📦 Cities found:",
      formattedCities.map(
        (c) => `${c.name}, ${c.state ? c.state + ", " : ""}${c.countryFull}`
      )
    );
    displayCitySuggestions(formattedCities);
  } catch (error) {
    console.error("❌ Error searching cities:", error);
  }
}

/**
 * ============================================
 * This function takes an array of formatted city objects and dynamically
 * generates the HTML list items for the search dropdown. It displays the
 * city name and a location context (state/country). It attaches a click
 * event listener to each suggestion item to auto-fill the input, hide the
 * dropdown, and trigger the weather data fetch for the selected city.
 * @param {Array<Object>} cities - An array of formatted city objects.
 * ============================================
 */
function displayCitySuggestions(cities) {
  console.log("📋 Displaying suggestions");

  if (cities.length === 0) {
    searchDropdown.innerHTML = "";
    searchDropdown.style.display = "none";
    return;
  }

  const html = cities
    .map((city) => {
      const cityName = city.name;
      const state = city.state ? `${city.state}, ` : "";
      const countryFull = city.countryFull || city.country; // Create full location string for input (e.g., "Cardiff, Wales" or "London, England")

      let fullLocation = cityName;
      if (city.state) {
        fullLocation = `${cityName}, ${city.state}`;
      } else if (city.country !== "GB") {
        // For non-UK, include country if no state
        fullLocation = `${cityName}, ${countryFull}`;
      }

      return `
      <li class="search__dropdown-item"
          data-city="${cityName}"
          data-full-location="${fullLocation}">
        <div class="search__dropdown-city">${cityName}</div>
        <div class="search__dropdown-location">${state}${countryFull}</div>
      </li>
    `;
    })
    .join("");

  searchDropdown.innerHTML = html;
  searchDropdown.style.display = "block";

  const items = searchDropdown.querySelectorAll(".search__dropdown-item");
  items.forEach((item) => {
    item.addEventListener("click", function () {
      const cityName = this.getAttribute("data-city");
      const fullLocation = this.getAttribute("data-full-location");
      console.log("✅ User selected:", fullLocation); // Mark that user made a selection

      userMadeSelection = true; // Update input with full location (e.g., "Cardiff, Wales" or "London, England")

      locationInput.value = fullLocation;
      searchDropdown.style.display = "none";

      fetchWeatherForCity(cityName);
    });
  });
}

/**
 * ============================================
 * FETCH WEATHER DATA
 * ============================================
 */

/**
 * ============================================
 * This asynchronous function is the core data fetching mechanism.
 * It takes a city name and makes two sequential API calls to OpenWeatherMap:
 * 1. Current weather (`/weather`)
 * 2. 5-day/3-hour forecast (`/forecast`)
 *
 * Upon successful fetch, it updates the UI by calling `updateCurrentWeather`,
 * `updateHourlyForecast`, `updateDailyForecast`, and `populateDayDropdown`.
 * It also stores the forecast data globally for later hourly updates and saves
 * the location to local storage. It handles network and API errors by
 * updating the UI with an error message.
 * @param {string} cityName - The name of the city to fetch weather for.
 * ============================================
 */
async function fetchWeatherForCity(cityName) {
  console.log("🌍 Fetching weather for:", cityName);

  try {
    console.log("📤 Fetching current weather...");
    const currentRes = await fetch(
      `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`
    );

    if (!currentRes.ok) {
      throw new Error(`HTTP error! status: ${currentRes.status}`);
    }

    const currentData = await currentRes.json();
    console.log("📦 Current weather data received");

    updateCurrentWeather(currentData);

    console.log("📤 Fetching forecast data...");
    const forecastRes = await fetch(
      `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
    );

    if (!forecastRes.ok) {
      throw new Error(`HTTP error! status: ${forecastRes.status}`);
    }

    const forecastData = await forecastRes.json();
    console.log("📦 Forecast data received"); // Store globally for day selection

    globalForecastData = forecastData;

    updateHourlyForecast(forecastData, 0);
    updateDailyForecast(forecastData);
    populateDayDropdown(forecastData); // Save last searched location

    saveLocation(cityName);

    console.log("✅ All weather data updated successfully");
  } catch (error) {
    console.error("❌ Something went wrong:", error); // Update location name with error message instead of alert

    locationName.textContent = `Could not find weather for "${cityName}"`;
    currentDate.textContent = "Please try another city"; // Optionally clear the temperature and other data

    mainTemperature.textContent = "--°";
    feelsLikeTemp.textContent = "--°";
    humidityValue.textContent = "--%";
    windSpeed.textContent = "-- mph";
    precipitationValue.textContent = "-- mm";
  }
}

/**
 * ============================================
 * EVENT LISTENERS
 * ============================================
 */

/**
 * This event listener handles user input in the location search field.
 * It resets the `userMadeSelection` flag and implements a **debounce**
 * mechanism using `setTimeout` to wait 300ms before calling `searchCities`.
 * This prevents excessive API calls while the user is actively typing.
 */
locationInput.addEventListener("input", function () {
  const query = this.value.trim();
  console.log("⌨️ User typed:", query); // Reset selection flag when user starts typing again

  userMadeSelection = false; // Clear previous timeout

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  } // Debounce search requests

  searchTimeout = setTimeout(() => {
    searchCities(query);
  }, 300);
});

/**
 * This event listener handles the click event on the main search button.
 * It validates that the input is not empty, marks `userMadeSelection` as true,
 * hides the suggestions dropdown, and initiates the weather data fetch for
 * the city currently in the input field.
 */
searchBtn.addEventListener("click", function () {
  console.log("🔘 Search button clicked");

  const cityName = locationInput.value.trim();

  if (cityName === "") {
    alert("Please enter a city name");
    return;
  }

  userMadeSelection = true; // Treat search button click as a selection
  searchDropdown.style.display = "none";
  fetchWeatherForCity(cityName);
});

/**
 * This event listener captures the 'Enter' key press in the location input field.
 * It simulates a search button click, treating it as a user selection.
 */
locationInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    console.log("↩️ Enter key pressed");
    userMadeSelection = true; // Treat enter as a selection
    searchBtn.click();
  }
});

/**
 * This event listener handles clicks anywhere on the document.
 * If the click is outside the location input and the search suggestions
 * dropdown, it closes (hides) the suggestions dropdown.
 */
document.addEventListener("click", function (event) {
  const isClickInside =
    locationInput.contains(event.target) || searchDropdown.contains(event.target);

  if (!isClickInside) {
    searchDropdown.style.display = "none";
  }
});

/**
 * ============================================
 * TEMPERATURE CONVERSION FUNCTIONS
 * ============================================
 */

let currentUnit = "celsius"; // Global unit tracker
let currentWindUnit = "mph"; // Wind speed unit tracker
let current24Hour = false; // Time format tracker (false = 12hr, true = 24hr)

/**
 * ============================================
 * LOCALSTORAGE FUNCTIONS
 * ============================================
 */

/**
 * ============================================
 * This function loads saved user preferences and the last searched location
 * from the browser's local storage. It updates the global unit trackers
 * (`currentUnit`, `currentWindUnit`, `current24Hour`) and returns the
 * saved location name, defaulting to "Cardiff" if no location is found.
 * @returns {string} The name of the last searched location.
 * ============================================
 */
function loadSettings() {
  const savedUnit = localStorage.getItem("temperatureUnit");
  const savedWindUnit = localStorage.getItem("windUnit");
  const saved24Hour = localStorage.getItem("24hourFormat");
  const savedLocation = localStorage.getItem("lastLocation");

  if (savedUnit) currentUnit = savedUnit;
  if (savedWindUnit) currentWindUnit = savedWindUnit;
  if (saved24Hour) current24Hour = saved24Hour === "true";

  return savedLocation || "Cardiff";
}

/**
 * ============================================
 * This function saves the current global unit preferences
 * (`currentUnit`, `currentWindUnit`, `current24Hour`) to the
 * browser's local storage.
 * ============================================
 */
function saveSettings() {
  localStorage.setItem("temperatureUnit", currentUnit);
  localStorage.setItem("windUnit", currentWindUnit);
  localStorage.setItem("24hourFormat", current24Hour);
}

/**
 * ============================================
 * This function saves the last successfully searched city name
 * to the browser's local storage.
 * @param {string} cityName - The name of the city to save.
 * ============================================
 */
function saveLocation(cityName) {
  localStorage.setItem("lastLocation", cityName);
}

/**
 * ============================================
 * Converts temperature from Celsius to Fahrenheit and rounds the result.
 * @param {number} celsius - Temperature in Celsius.
 * @returns {number} Temperature in Fahrenheit, rounded.
 * ============================================
 */
function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * ============================================
 * Converts temperature from Fahrenheit to Celsius and rounds the result.
 * @param {number} fahrenheit - Temperature in Fahrenheit.
 * @returns {number} Temperature in Celsius, rounded.
 * ============================================
 */
function fahrenheitToCelsius(fahrenheit) {
  return Math.round(((fahrenheit - 32) * 5) / 9);
}

/**
 * ============================================
 * Extracts the integer temperature value from a text string that
 * may contain a degree symbol (e.g., "63°", "-5°F").
 * @param {string} text - The text content of a temperature element.
 * @returns {number|null} The extracted temperature as an integer, or null if not found.
 * ============================================
 */
function extractTemperature(text) {
  // Extract number from text like "63°" or "63°C" or "63°F"
  const match = text.match(/(-?\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * ============================================
 * Converts wind speed from meters per second (m/s) to miles per hour (mph)
 * and rounds the result.
 * @param {number} mps - Wind speed in m/s.
 * @returns {number} Wind speed in mph, rounded.
 * ============================================
 */
function mpsToMph(mps) {
  return Math.round(mps * 2.237);
}

/**
 * ============================================
 * Converts wind speed from meters per second (m/s) to kilometers per hour (km/h)
 * and rounds the result.
 * @param {number} mps - Wind speed in m/s.
 * @returns {number} Wind speed in km/h, rounded.
 * ============================================
 */
function mpsToKmh(mps) {
  return Math.round(mps * 3.6);
}

/**
 * ============================================
 * Extracts the integer wind speed value from a text string that
 * typically includes a unit (e.g., "15 mph").
 * @param {string} text - The text content of a wind speed element.
 * @returns {number|null} The extracted speed as an integer, or null if not found.
 * ============================================
 */
function extractWindSpeed(text) {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * ============================================
 * Updates the text content of the temperature unit badge in the settings
 * dropdown display to show the currently selected unit ("Fahrenheit" or "Celsius").
 * @param {string} unit - The selected unit ("fahrenheit" or "celsius").
 * ============================================
 */
function updateUnitBadge(unit) {
  const unitDisplay = document.querySelector("[data-unit-display]");
  if (unitDisplay) {
    unitDisplay.textContent = unit === "fahrenheit" ? "Fahrenheit" : "Celsius";
  }
}

/**
 * ============================================
 * Iterates through all temperature display elements on the page (current,
 * feels like, daily high/low, hourly) and converts the displayed value
 * to the specified unit (`toUnit`). It uses the extraction and conversion
 * functions, assuming the *current* display is the inverse of `toUnit`
 * before conversion (e.g., if `toUnit` is 'fahrenheit', the current value
 * is assumed to be Celsius for conversion).
 * @param {string} toUnit - The target unit for conversion ("fahrenheit" or "celsius").
 * ============================================
 */
function convertAllTemperatures(toUnit) {
  console.log(`🔄 Converting all temperatures to ${toUnit}...`); // Find all temperature elements (those containing °)

  const tempElements = [
    mainTemperature,
    feelsLikeTemp,
    ...document.querySelectorAll("[data-day-temp-max]"),
    ...document.querySelectorAll("[data-day-temp-min]"),
    ...document.querySelectorAll("[data-hourly-temp]"),
  ].filter((el) => el && el.textContent.includes("°"));

  tempElements.forEach((element) => {
    const currentText = element.textContent;
    const temp = extractTemperature(currentText);

    if (temp !== null) {
      let newTemp;
      if (toUnit === "fahrenheit") {
        // Converting from Celsius to Fahrenheit
        newTemp = celsiusToFahrenheit(temp);
      } else {
        // Converting from Fahrenheit to Celsius
        newTemp = fahrenheitToCelsius(temp);
      } // Update the text with new temperature (no unit symbol)

      element.textContent = `${newTemp}°`;
    }
  }); // Update the unit badge

  updateUnitBadge(toUnit);

  console.log(`✅ All temperatures converted to ${toUnit}`);
}

/**
 * ============================================
 * SETTINGS DROPDOWN (Temperature Units)
 * ============================================
 */

const settingsBtn = document.querySelector("[data-unit-toggle]");
const settingsDropdown = document.querySelector("[data-settings-dropdown]");
const settingsIcon = document.querySelector(".header__setting--dropdown");
const celsiusCheck = document.querySelector("[data-celsius-check]");
const fahrenheitCheck = document.querySelector("[data-fahrenheit-check]");
const mphCheck = document.querySelector("[data-mph-check]");
const kmhCheck = document.querySelector("[data-kmh-check]");
const hr12Check = document.querySelector("[data-12hr-check]");
const hr24Check = document.querySelector("[data-24hr-check]");
// currentUnit is declared globally at the top of temperature conversion section

if (settingsBtn && settingsDropdown) {
  /**
   * This listener toggles the visibility of the settings dropdown menu
   * and rotates the icon to indicate its open/closed state.
   */
  settingsBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    const isVisible = settingsDropdown.classList.contains(
      "header__setting-menu--visible"
    );

    if (isVisible) {
      settingsDropdown.classList.remove("header__setting-menu--visible");
      if (settingsIcon) settingsIcon.style.transform = "rotate(0deg)";
    } else {
      settingsDropdown.classList.add("header__setting-menu--visible");
      if (settingsIcon) settingsIcon.style.transform = "rotate(180deg)";
    }
  });
  /**
   * This listener handles temperature unit selection (Celsius/Fahrenheit).
   * It updates the global `currentUnit`, toggles the checkmark icons,
   * calls `convertAllTemperatures` to refresh the UI, and saves the setting.
   */

  document.querySelectorAll("[data-unit-option]").forEach((option) => {
    option.addEventListener("click", function (event) {
      event.stopPropagation();
      const selectedUnit = this.getAttribute("data-unit-option");

      if (selectedUnit !== currentUnit) {
        const previousUnit = currentUnit;
        currentUnit = selectedUnit; // Update checkmarks

        if (selectedUnit === "celsius") {
          if (celsiusCheck) celsiusCheck.textContent = "✓";
          if (fahrenheitCheck) fahrenheitCheck.textContent = "";
        } else {
          if (celsiusCheck) celsiusCheck.textContent = "";
          if (fahrenheitCheck) fahrenheitCheck.textContent = "✓";
        } // Update current unit attribute

        settingsBtn.setAttribute("data-current-unit", selectedUnit); // Convert all temperatures on the page

        console.log(`🌡️ Unit changed from ${previousUnit} to ${selectedUnit}`);
        convertAllTemperatures(selectedUnit);
        saveSettings();
      }

      settingsDropdown.classList.remove("header__setting-menu--visible");
      if (settingsIcon) settingsIcon.style.transform = "rotate(0deg)";
    });
  });
  /**
   * This listener handles wind speed unit selection (mph/kmh).
   * It updates the global `currentWindUnit`, toggles the checkmark icons,
   * and updates the currently displayed wind speed by converting the value.
   * NOTE: The logic for conversion here is simplified and assumes a direct
   * conversion from the currently *displayed* value, which is usually in
   * the previous unit, back to the new unit based on the original data source.
   * A refetch of weather data is not performed.
   */

  document.querySelectorAll("[data-wind-option]").forEach((option) => {
    option.addEventListener("click", function (event) {
      event.stopPropagation();
      const selectedWindUnit = this.getAttribute("data-wind-option");

      if (selectedWindUnit !== currentWindUnit) {
        currentWindUnit = selectedWindUnit; // Update checkmarks

        if (mphCheck) mphCheck.textContent = selectedWindUnit === "mph" ? "✓" : "";
        if (kmhCheck) kmhCheck.textContent = selectedWindUnit === "kmh" ? "✓" : ""; // Update wind speed display

        if (windSpeed && windSpeed.textContent) {
          const currentSpeed = extractWindSpeed(windSpeed.textContent);
          if (currentSpeed !== null) {
            // Convert based on current unit (assumes current display is in mps from API)
            const newSpeed =
              selectedWindUnit === "mph"
                ? currentSpeed
                : Math.round(currentSpeed * 1.609);
            windSpeed.textContent = `${newSpeed} ${selectedWindUnit}`;
          }
        }

        console.log(`💨 Wind unit changed to ${selectedWindUnit}`);
        saveSettings();
      }

      settingsDropdown.classList.remove("header__setting-menu--visible");
      if (settingsIcon) settingsIcon.style.transform = "rotate(0deg)";
    });
  });
  /**
   * This listener handles time format selection (12-hour/24-hour).
   * It updates the global `current24Hour` flag, toggles the checkmark icons,
   * and calls `updateHourlyForecast` to re-render the times with the new format.
   */

  document.querySelectorAll("[data-time-option]").forEach((option) => {
    option.addEventListener("click", function (event) {
      event.stopPropagation();
      const selectedTimeFormat = this.getAttribute("data-time-option");
      const is24Hour = selectedTimeFormat === "24";

      if (is24Hour !== current24Hour) {
        current24Hour = is24Hour; // Update checkmarks

        if (hr12Check) hr12Check.textContent = !is24Hour ? "✓" : "";
        if (hr24Check) hr24Check.textContent = is24Hour ? "✓" : ""; // Refresh hourly forecast with new time format

        if (globalForecastData) {
          updateHourlyForecast(globalForecastData, currentDayIndex);
        }

        console.log(`🕐 Time format changed to ${is24Hour ? "24" : "12"}-hour`);
        saveSettings();
      }

      settingsDropdown.classList.remove("header__setting-menu--visible");
      if (settingsIcon) settingsIcon.style.transform = "rotate(0deg)";
    });
  });
}

/**
 * ============================================
 * DAY SELECTOR DROPDOWN (Hourly Forecast)
 * ============================================
 */

const daySelector = document.querySelector("[data-day-selector]");
const dayDropdown = document.querySelector("[data-day-dropdown]");
const dayIcon = document.querySelector(".forecast-h__icon");
const selectedDayText = document.querySelector("[data-selected-day]");
let currentDayIndex = 0;

if (daySelector && dayDropdown) {
  /**
   * This listener toggles the visibility of the hourly forecast day selection
   * dropdown and rotates the icon.
   */
  daySelector.addEventListener("click", function (event) {
    event.stopPropagation();
    const isVisible = dayDropdown.classList.contains("forecast-h__day-menu--visible");

    if (isVisible) {
      dayDropdown.classList.remove("forecast-h__day-menu--visible");
      if (dayIcon) dayIcon.style.transform = "rotate(0deg)";
    } else {
      dayDropdown.classList.add("forecast-h__day-menu--visible");
      if (dayIcon) dayIcon.style.transform = "rotate(180deg)";
    }
  });
  /**
   * This listener handles the selection of a forecast day from the dropdown.
   * It updates the displayed selected day text, updates the `currentDayIndex`,
   * manages the active class for the dropdown items, and calls
   * `updateHourlyForecast` to display the hourly data for the newly selected day.
   */

  document.querySelectorAll("[data-day-option]").forEach((option) => {
    option.addEventListener("click", function (event) {
      event.stopPropagation();
      const selectedDay = this.getAttribute("data-day-option");
      const dayText = this.querySelector(".forecast-h__day-text").textContent; // Update selected day display

      if (selectedDayText) selectedDayText.textContent = dayText;
      currentDayIndex = parseInt(selectedDay); // Remove active class from all items

      document.querySelectorAll(".forecast-h__day-item").forEach((item) => {
        item.classList.remove("forecast-h__day-item--active");
      }); // Add active class to selected item

      this.classList.add("forecast-h__day-item--active"); // Load hourly forecast for selected day

      if (globalForecastData) {
        updateHourlyForecast(globalForecastData, currentDayIndex);
        console.log(`📅 Day selected: ${dayText} (index ${selectedDay})`);
      }

      dayDropdown.classList.remove("forecast-h__day-menu--visible");
      if (dayIcon) dayIcon.style.transform = "rotate(0deg)";
    });
  });
}

/**
 * This event listener handles document-wide clicks to close both the
 * settings and day selector dropdowns if the click occurs outside of
 * the dropdowns or their respective toggles.
 */
document.addEventListener("click", function (event) {
  // Close settings dropdown
  if (
    settingsBtn &&
    settingsDropdown &&
    !settingsBtn.contains(event.target) &&
    !settingsDropdown.contains(event.target)
  ) {
    settingsDropdown.classList.remove("header__setting-menu--visible");
    if (settingsIcon) settingsIcon.style.transform = "rotate(0deg)";
  } // Close day selector dropdown

  if (
    daySelector &&
    dayDropdown &&
    !daySelector.contains(event.target) &&
    !dayDropdown.contains(event.target)
  ) {
    dayDropdown.classList.remove("forecast-h__day-menu--visible");
    if (dayIcon) dayIcon.style.transform = "rotate(0deg)";
  }
});

/**
 * ============================================
 * INITIALIZE APP
 * ============================================
 */

/**
 * This block executes when the script first runs. It calls `loadSettings`
 * to retrieve user preferences and the last location. It then updates all
 * relevant UI elements (checkboxes/badges) to reflect the loaded settings
 * before finally calling `fetchWeatherForCity` to load the initial weather data.
 */

// Load settings and last location
console.log("🚀 Initializing weather app...");
const lastLocation = loadSettings();

// Update UI to match saved settings
if (currentUnit === "fahrenheit") {
  if (celsiusCheck) celsiusCheck.textContent = "";
  if (fahrenheitCheck) fahrenheitCheck.textContent = "✓";
  updateUnitBadge("fahrenheit");
} else {
  if (celsiusCheck) celsiusCheck.textContent = "✓";
  if (fahrenheitCheck) fahrenheitCheck.textContent = "";
}

// Update wind unit checkmarks
if (currentWindUnit === "kmh") {
  if (mphCheck) mphCheck.textContent = "";
  if (kmhCheck) kmhCheck.textContent = "✓";
} else {
  if (mphCheck) mphCheck.textContent = "✓";
  if (kmhCheck) kmhCheck.textContent = "";
}

// Update time format checkmarks
if (current24Hour) {
  if (hr12Check) hr12Check.textContent = "";
  if (hr24Check) hr24Check.textContent = "✓";
} else {
  if (hr12Check) hr12Check.textContent = "✓";
  if (hr24Check) hr24Check.textContent = "";
}

fetchWeatherForCity(lastLocation);
