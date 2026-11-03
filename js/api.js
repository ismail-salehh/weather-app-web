// Open-Meteo APIs: free, no API key needed.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

async function getJson(url, signal) {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function searchLocations(query, { count = 4, signal } = {}) {
    const params = new URLSearchParams({ name: query, count, language: "en", format: "json" });
    const data = await getJson(`${GEOCODING_URL}?${params}`, signal);

    return (data.results ?? []).map((place) => ({
        name: place.name,
        region: place.admin1 ?? "",
        country: place.country ?? "",
        latitude: place.latitude,
        longitude: place.longitude,
    }));
}

async function fetchForecast({ latitude, longitude }) {
    const params = new URLSearchParams({
        latitude,
        longitude,
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
        hourly: "temperature_2m,weather_code",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "auto",
        forecast_days: 7,
    });

    return getJson(`${FORECAST_URL}?${params}`);
}
