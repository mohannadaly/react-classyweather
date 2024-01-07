import "./index.css";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
function App() {
  const [query, setQuery] = useState("");
  const [weatherData, setWeatherData] = useState();

  useEffect(() => {
    const controller = new AbortController();

    async function getWeather(location) {
      try {
        // 1) Getting location (geocoding)
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
          { signal: controller.signal }
        );
        const geoData = await geoRes.json();

        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country_code } =
          geoData.results.at(0);

        // 2) Getting actual weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        setWeatherData({
          ...weatherData.daily,
          displayLocation: `${name} ${convertToFlag(country_code)}`,
        });
      } catch (err) {
        if (err.name !== "AbortError") console.log(err);
      }
      return null;
    }
    getWeather(query);
    return () => {
      controller.abort();
    };
  }, [query]);

  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a location"
        required
      />
      {weatherData?.time && (
        <>
          <h2>{`Weather in ${weatherData.displayLocation}`}</h2>
          <ul className="weather">
            {weatherData.time.map((val, idx) => (
              <Day
                key={val}
                weatherCode={weatherData.weathercode.at(idx)}
                time={val}
                min={weatherData.temperature_2m_min.at(idx)}
                max={weatherData.temperature_2m_max.at(idx)}
                isToday={idx === 0}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;

Day.propTypes = {
  weatherCode: PropTypes.number,
  time: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  isToday: PropTypes.bool,
};

function Day({ weatherCode, time, min, max, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(weatherCode)}</span>
      <p>{isToday ? "Today" : formatDay(time)}</p>
      <p>
        {min}° - <strong>{max}°</strong>
      </p>
    </li>
  );
}

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}
