const AUTH_KEY = "typing_game_hub_auth";
const LOGIN_PAGE = "login.html";
const DEFAULT_USERNAME = "alpiness";
const DEFAULT_PASSWORD = "alpipogi";

function getBasePrefix() {
    return window.location.pathname.includes("/members/") ? "../" : "";
}

function getCurrentPageName() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) === "true";
}

function requireAuth() {
    const currentPage = getCurrentPageName();
    const basePrefix = getBasePrefix();

    if (currentPage === LOGIN_PAGE) {
        if (isLoggedIn()) {
            window.location.replace("index.html");
        }
        return;
    }

    if (!isLoggedIn()) {
        window.location.replace(`${basePrefix}${LOGIN_PAGE}`);
    }
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.replace(`${getBasePrefix()}${LOGIN_PAGE}`);
}

function attachLogoutHandler() {
    const logoutButton = document.getElementById("logoutBtn");
    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", logout);
}

function attachLoginHandler() {
    const form = document.getElementById("loginForm");
    if (!form) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const status = document.getElementById("loginStatus");

        if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
            localStorage.setItem(AUTH_KEY, "true");
            status.innerText = "Login successful. Redirecting...";
            window.location.replace("index.html");
            return;
        }

        status.innerText = "Incorrect username or password.";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    attachLogoutHandler();
    attachLoginHandler();
});
