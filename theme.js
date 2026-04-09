const THEME_KEY = "typing_game_hub_theme";
const DEFAULT_THEME = "dark";

function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

function getNextTheme(theme) {
    return theme === "light" ? "dark" : "light";
}

function updateThemeButton(theme) {
    const themeButton = document.getElementById("themeToggle");
    if (!themeButton) {
        return;
    }

    themeButton.innerText = theme === "light" ? "Dark Mode" : "Light Mode";
    themeButton.setAttribute("aria-label", `Switch to ${getNextTheme(theme)} mode`);
}

function toggleTheme() {
    const nextTheme = getNextTheme(getStoredTheme());
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
    updateThemeButton(nextTheme);
}

applyTheme(getStoredTheme());

document.addEventListener("DOMContentLoaded", () => {
    const currentTheme = getStoredTheme();
    updateThemeButton(currentTheme);

    const themeButton = document.getElementById("themeToggle");
    if (!themeButton) {
        return;
    }

    themeButton.addEventListener("click", toggleTheme);
});
