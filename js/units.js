const UNITS_STORAGE_KEY = "weather-now:units";

const METRIC = { temperature: "celsius", wind: "kmh", precipitation: "mm" };
const IMPERIAL = { temperature: "fahrenheit", wind: "mph", precipitation: "inch" };

function loadUnits() {
    try {
        const saved = JSON.parse(localStorage.getItem(UNITS_STORAGE_KEY));
        return { ...METRIC, ...saved };
    } catch {
        return { ...METRIC };
    }
}

function saveUnits(units) {
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));
}

function isImperial(units) {
    return Object.keys(IMPERIAL).every((type) => units[type] === IMPERIAL[type]);
}

// Trim trailing zeros: 1.50 -> "1.5", 0.00 -> "0"
function round(value, decimals = 0) {
    return String(Number(value.toFixed(decimals)));
}

/** Format a Celsius value in the chosen temperature unit, e.g. "20°". */
function formatTemperature(celsius, units) {
    const value = units.temperature === "fahrenheit" ? (celsius * 9) / 5 + 32 : celsius;
    return `${Math.round(value)}°`;
}

/** Format a km/h value in the chosen wind unit, e.g. "14 km/h". */
function formatWind(kmh, units) {
    return units.wind === "mph" ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;
}

/** Format a mm value in the chosen precipitation unit, e.g. "0 mm". */
function formatPrecipitation(mm, units) {
    return units.precipitation === "inch" ? `${round(mm / 25.4, 2)} in` : `${round(mm, 1)} mm`;
}
