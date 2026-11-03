/**
 * Wire up a toggle button + menu: click to open/close, close on outside
 * click or Escape, and arrow-key navigation between the menu's buttons.
 */
function createDropdown(toggle, menu) {
    const items = () => [...menu.querySelectorAll("button:not(:disabled)")];

    function open() {
        menu.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
    }

    function close({ returnFocus = false } = {}) {
        if (menu.hidden) return;
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => (menu.hidden ? open() : close()));

    toggle.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            open();
            items()[0]?.focus();
        }
    });

    menu.addEventListener("keydown", (e) => {
        const list = items();
        const index = list.indexOf(document.activeElement);

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const step = e.key === "ArrowDown" ? 1 : -1;
            list[(index + step + list.length) % list.length]?.focus();
        } else if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            list[e.key === "Home" ? 0 : list.length - 1]?.focus();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !menu.hidden) close({ returnFocus: true });
    });

    document.addEventListener("click", (e) => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) close();
    });

    // Close when keyboard focus leaves the dropdown entirely
    toggle.parentElement.addEventListener("focusout", (e) => {
        if (e.relatedTarget && !toggle.parentElement.contains(e.relatedTarget)) close();
    });

    return { open, close };
}
