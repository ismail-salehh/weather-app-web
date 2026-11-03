const PLACE_STORAGE_KEY = "weather-now:place";
const DEFAULT_PLACE = { name: "Berlin", country: "Germany", latitude: 52.52, longitude: 13.41 };

const state = {
    units: loadUnits(),
    place: null,
    forecast: null,
    dayIndex: 0,
    retry: null, // last action, re-run by the Retry button
};

// Ignore responses from requests that a newer one has replaced
let latestRequest = 0;

function loadSavedPlace() {
    try {
        return JSON.parse(localStorage.getItem(PLACE_STORAGE_KEY)) ?? DEFAULT_PLACE;
    } catch {
        return DEFAULT_PLACE;
    }
}

function showError(retryAction) {
    state.retry = retryAction;
    setView("error");
    announce("Something went wrong. Please try again.");
}

async function loadWeather(place) {
    const requestId = ++latestRequest;

    setView("weather");
    showLoading();
    announce(`Loading weather for ${place.name}`);

    try {
        const forecast = await fetchForecast(place);
        if (requestId !== latestRequest) return;

        Object.assign(state, { place, forecast, dayIndex: 0 });
        renderWeather(state);
        localStorage.setItem(PLACE_STORAGE_KEY, JSON.stringify(place));
        announce(`Showing weather for ${place.name}`);
    } catch (err) {
        if (requestId !== latestRequest) return;
        console.error(err);
        showError(() => loadWeather(place));
    }
}

async function searchAndLoad(query) {
    const requestId = ++latestRequest;
    search.showProgress();

    try {
        const [place] = await searchLocations(query, { count: 1 });
        if (requestId !== latestRequest) return;
        search.close();

        if (place) {
            loadWeather(place);
        } else {
            setView("no-results");
            announce("No search result found!");
        }
    } catch (err) {
        if (requestId !== latestRequest) return;
        console.error(err);
        search.close();
        showError(() => searchAndLoad(query));
    }
}

/* ---------- Search ----------------------------------------------------- */

const search = initSearch({ onSelect: loadWeather, onSubmit: searchAndLoad });

/* ---------- Units ------------------------------------------------------ */

function setUnits(units) {
    state.units = units;
    saveUnits(units);
    renderUnitsMenu(units);
    if (state.forecast) renderWeather(state);
}

createDropdown(document.querySelector("#units-toggle"), document.querySelector("#units-menu"));

document.querySelector("#units-system-toggle").addEventListener("click", () => {
    setUnits({ ...(isImperial(state.units) ? METRIC : IMPERIAL) });
});

document.querySelectorAll("[data-unit-type]").forEach((button) => {
    button.addEventListener("click", () => {
        setUnits({ ...state.units, [button.dataset.unitType]: button.dataset.unit });
    });
});

/* ---------- Day selector ----------------------------------------------- */

const dayMenu = document.querySelector("#day-menu");
const dayDropdown = createDropdown(document.querySelector("#day-toggle"), dayMenu);

dayMenu.addEventListener("click", (e) => {
    const button = e.target.closest("[data-day-index]");
    if (!button) return;

    state.dayIndex = Number(button.dataset.dayIndex);
    renderDay(state);
    dayDropdown.close({ returnFocus: true });
});

/* ---------- Retry ------------------------------------------------------ */

document.querySelector("#retry-btn").addEventListener("click", () => state.retry?.());

/* ---------- Start ------------------------------------------------------ */

renderUnitsMenu(state.units);
loadWeather(loadSavedPlace());
