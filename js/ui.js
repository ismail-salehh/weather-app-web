const $ = (selector) => document.querySelector(selector);

const els = {
    app: $("#app"),
    error: $("#error"),
    noResults: $("#no-results"),
    weather: $("#weather"),
    current: $("#current"),
    location: $("#current-location"),
    date: $("#current-date"),
    icon: $("#current-icon"),
    temp: $("#current-temp"),
    feels: $("#metric-feels"),
    humidity: $("#metric-humidity"),
    wind: $("#metric-wind"),
    precipitation: $("#metric-precipitation"),
    dailyList: $("#daily-list"),
    hourlyList: $("#hourly-list"),
    dayToggle: $("#day-toggle"),
    dayToggleLabel: $("#day-toggle-label"),
    dayMenu: $("#day-menu"),
    systemToggle: $("#units-system-toggle"),
    unitButtons: document.querySelectorAll("[data-unit-type]"),
    status: $("#status"),
    dailyTemplate: $("#daily-template"),
    hourlyTemplate: $("#hourly-template"),
};

const SKELETON_DAYS = 7;
const SKELETON_HOURS = 8;

/* ---------- Date helpers ----------------------------------------------- */

// Open-Meteo returns local times without an offset ("2025-08-05T15:00").
// Parsing them as local keeps the place's wall-clock time intact.
const toDate = (isoDate) => new Date(isoDate.includes("T") ? isoDate : `${isoDate}T00:00`);

const formatFullDate = (iso) =>
    toDate(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
const formatWeekday = (iso, weekday = "long") => toDate(iso).toLocaleDateString("en-US", { weekday });
const formatHour = (iso) => toDate(iso).toLocaleTimeString("en-US", { hour: "numeric" });

/* ---------- Views ------------------------------------------------------ */

/** Show one of: "weather", "no-results", "error". */
function setView(view) {
    els.app.hidden = view === "error";
    els.error.hidden = view !== "error";
    els.weather.hidden = view !== "weather";
    els.noResults.hidden = view !== "no-results";
}

function announce(message) {
    els.status.textContent = message;
}

/* ---------- Loading state ---------------------------------------------- */

function fillWithSkeletons(list, className, count) {
    const items = Array.from({ length: count }, () => {
        const li = document.createElement("li");
        li.className = className;
        return li;
    });
    list.replaceChildren(...items);
}

function showLoading() {
    els.weather.classList.add("is-loading");
    els.current.setAttribute("aria-busy", "true");

    [els.feels, els.humidity, els.wind, els.precipitation].forEach((el) => (el.textContent = "—"));
    fillWithSkeletons(els.dailyList, "day-card", SKELETON_DAYS);
    fillWithSkeletons(els.hourlyList, "hour-item", SKELETON_HOURS);

    els.dayToggleLabel.textContent = "–";
    els.dayToggle.disabled = true;
}

/* ---------- Weather rendering ------------------------------------------ */

function renderCurrent(place, forecast, units) {
    const { current } = forecast;
    const condition = getCondition(current.weather_code);

    els.location.textContent = [place.name, place.country].filter(Boolean).join(", ");
    els.date.textContent = formatFullDate(current.time);
    els.date.dateTime = current.time;
    els.icon.src = condition.src;
    els.icon.alt = condition.label;
    els.temp.textContent = formatTemperature(current.temperature_2m, units);

    els.feels.textContent = formatTemperature(current.apparent_temperature, units);
    els.humidity.textContent = `${current.relative_humidity_2m}%`;
    els.wind.textContent = formatWind(current.wind_speed_10m, units);
    els.precipitation.textContent = formatPrecipitation(current.precipitation, units);
}

function renderDaily(forecast, units) {
    const { time, weather_code, temperature_2m_max, temperature_2m_min } = forecast.daily;

    const cards = time.map((day, i) => {
        const card = els.dailyTemplate.content.firstElementChild.cloneNode(true);
        const condition = getCondition(weather_code[i]);
        const icon = card.querySelector(".day-icon");

        card.querySelector(".day-name").textContent = formatWeekday(day, "short");
        icon.src = condition.src;
        icon.alt = condition.label;
        card.querySelector(".day-max").textContent = formatTemperature(temperature_2m_max[i], units);
        card.querySelector(".day-min").textContent = formatTemperature(temperature_2m_min[i], units);
        return card;
    });

    els.dailyList.replaceChildren(...cards);
}

function renderHourly(forecast, dayIndex, units) {
    const day = forecast.daily.time[dayIndex];
    // For today, start at the current hour; other days show all 24 hours.
    const fromHour = dayIndex === 0 ? forecast.current.time.slice(0, 13) : day;
    const { time, temperature_2m, weather_code } = forecast.hourly;

    const items = [];
    time.forEach((hour, i) => {
        if (!hour.startsWith(day) || hour.slice(0, 13) < fromHour) return;

        const item = els.hourlyTemplate.content.firstElementChild.cloneNode(true);
        const condition = getCondition(weather_code[i]);
        const icon = item.querySelector(".hour-icon");
        const timeEl = item.querySelector(".hour-time");

        icon.src = condition.src;
        icon.alt = condition.label;
        timeEl.textContent = formatHour(hour);
        timeEl.dateTime = hour;
        item.querySelector(".hour-temp").textContent = formatTemperature(temperature_2m[i], units);
        items.push(item);
    });

    els.hourlyList.replaceChildren(...items);
    els.hourlyList.scrollTop = 0;
}

function renderDayMenu(forecast, dayIndex) {
    const buttons = forecast.daily.time.map((day, i) => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "menu-item";
        button.dataset.dayIndex = i;
        button.textContent = formatWeekday(day);
        if (i === dayIndex) {
            button.classList.add("is-active");
            button.setAttribute("aria-current", "true");
        }
        li.append(button);
        return li;
    });

    els.dayMenu.replaceChildren(...buttons);
    els.dayToggleLabel.textContent = formatWeekday(forecast.daily.time[dayIndex]);
    els.dayToggle.disabled = false;
}

/** Render every weather section from the current app state. */
function renderWeather({ place, forecast, dayIndex, units }) {
    renderCurrent(place, forecast, units);
    renderDaily(forecast, units);
    renderHourly(forecast, dayIndex, units);
    renderDayMenu(forecast, dayIndex);

    els.weather.classList.remove("is-loading");
    els.current.setAttribute("aria-busy", "false");
}

/** Re-render only the hourly section (day change). */
function renderDay({ forecast, dayIndex, units }) {
    renderHourly(forecast, dayIndex, units);
    renderDayMenu(forecast, dayIndex);
}

/* ---------- Units menu ------------------------------------------------- */

function renderUnitsMenu(units) {
    els.systemToggle.textContent = isImperial(units) ? "Switch to Metric" : "Switch to Imperial";
    els.unitButtons.forEach((button) => {
        const selected = units[button.dataset.unitType] === button.dataset.unit;
        button.setAttribute("aria-pressed", String(selected));
    });
}
