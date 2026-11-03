const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * Search box with live suggestions (ARIA combobox pattern).
 *  - onSelect(place): user picked a suggestion
 *  - onSubmit(query): user submitted the form without picking one
 */
function initSearch({ onSelect, onSubmit }) {
    const form = document.querySelector("#search-form");
    const field = form.querySelector(".search-field");
    const input = document.querySelector("#search-input");
    const dropdown = document.querySelector("#search-dropdown");
    const status = document.querySelector("#search-status");
    const list = document.querySelector("#search-suggestions");

    let places = [];
    let activeIndex = -1;
    let debounceTimer;
    let controller;

    function open() {
        dropdown.hidden = false;
        input.setAttribute("aria-expanded", "true");
    }

    function close() {
        clearTimeout(debounceTimer);
        controller?.abort();
        dropdown.hidden = true;
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
        activeIndex = -1;
    }

    function showProgress() {
        list.replaceChildren();
        status.hidden = false;
        open();
    }

    function setActive(index) {
        const options = list.querySelectorAll("[role='option']");
        activeIndex = index;
        options.forEach((option, i) => option.setAttribute("aria-selected", String(i === index)));

        if (index >= 0) {
            input.setAttribute("aria-activedescendant", options[index].id);
        } else {
            input.removeAttribute("aria-activedescendant");
        }
    }

    function renderSuggestions(results) {
        places = results;
        status.hidden = true;

        if (!results.length) {
            close();
            return;
        }

        const options = results.map((place, i) => {
            const li = document.createElement("li");
            li.id = `suggestion-${i}`;
            li.className = "menu-item suggestion";
            li.setAttribute("role", "option");
            li.setAttribute("aria-selected", "false");
            li.dataset.index = i;
            li.textContent = place.name;

            const region = [place.region, place.country].filter(Boolean).join(", ");
            if (region) {
                const span = document.createElement("span");
                span.className = "suggestion-region";
                span.textContent = region;
                li.append(span);
            }
            return li;
        });

        list.replaceChildren(...options);
        activeIndex = -1;
        open();
    }

    async function fetchSuggestions(query) {
        controller?.abort();
        controller = new AbortController();
        showProgress();

        try {
            renderSuggestions(await searchLocations(query, { signal: controller.signal }));
        } catch (err) {
            // A newer keystroke aborted this request; ignore it
            if (err.name !== "AbortError") close();
        }
    }

    function choose(index) {
        const place = places[index];
        if (!place) return;
        input.value = [place.name, place.country].filter(Boolean).join(", ");
        close();
        onSelect(place);
    }

    input.addEventListener("input", () => {
        const query = input.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < MIN_QUERY_LENGTH) {
            close();
            return;
        }
        debounceTimer = setTimeout(() => fetchSuggestions(query), DEBOUNCE_MS);
    });

    input.addEventListener("keydown", (e) => {
        const count = places.length;
        const isOpen = !dropdown.hidden && count > 0 && status.hidden;

        if (e.key === "ArrowDown" && isOpen) {
            e.preventDefault();
            setActive((activeIndex + 1) % count);
        } else if (e.key === "ArrowUp" && isOpen) {
            e.preventDefault();
            setActive((activeIndex - 1 + count) % count);
        } else if (e.key === "Escape" && !dropdown.hidden) {
            e.preventDefault();
            close();
        }
    });

    // Keep focus in the input while clicking a suggestion
    list.addEventListener("pointerdown", (e) => e.preventDefault());

    list.addEventListener("click", (e) => {
        const option = e.target.closest("[role='option']");
        if (option) choose(Number(option.dataset.index));
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        if (activeIndex >= 0) {
            choose(activeIndex);
            return;
        }

        const query = input.value.trim();
        if (!query) {
            input.focus();
            return;
        }

        close();
        onSubmit(query);
    });

    document.addEventListener("click", (e) => {
        if (!field.contains(e.target)) close();
    });

    field.addEventListener("focusout", (e) => {
        if (!field.contains(e.relatedTarget)) close();
    });

    return { showProgress, close };
}
