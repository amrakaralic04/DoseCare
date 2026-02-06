import { registerRoute, resolveRoute, isProtectedRoute, navigate } from "./router.js";
import { subscribeAuth, logoutUser, getCurrentUser } from "./auth.js";
import { hasConfig } from "./firebase.js";
import { subscribeUserDevices } from "./api.js";
import { createToast, setActiveNav } from "./ui.js";
import { mountLogin } from "./pages/login.js";
import { mountRegister } from "./pages/register.js";
import { mountDashboard } from "./pages/dashboard.js";
import { mountHistory } from "./pages/history.js";
import { mountSettings } from "./pages/settings.js";

const root = document.getElementById("app");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const appStatus = document.getElementById("app-status");

let cleanupFn = null;
let activeDeviceId = null;
let devicesUnsub = null;

const setDeviceId = (deviceId) => {
    activeDeviceId = deviceId;
    if (deviceId) {
        localStorage.setItem("activeDeviceId", deviceId);
    }
};

const startDeviceSubscription = (uid) => {
    if (devicesUnsub) devicesUnsub();
    devicesUnsub = subscribeUserDevices(uid, (devices) => {
        const stored = localStorage.getItem("activeDeviceId");
        const available = devices.map((device) => device.id);
        const selected = available.includes(stored) ? stored : available[0] || null;
        setDeviceId(selected);
    });
};

const renderRoute = () => {
    if (cleanupFn) cleanupFn();
    setActiveNav();
    const hash = window.location.hash || "#/login";
    const user = getCurrentUser();

    if (isProtectedRoute(hash) && !user) {
        navigate("/login");
        return;
    }

    const render = resolveRoute(hash);
    if (render) {
        cleanupFn = render({ root, deviceId: activeDeviceId }) || null;
    }
};

registerRoute("/login", mountLogin);
registerRoute("/register", mountRegister);
registerRoute("/dashboard", mountDashboard, true);
registerRoute("/history", mountHistory, true);
registerRoute("/settings", mountSettings, true);

logoutBtn.addEventListener("click", async () => {
    try {
        await logoutUser();
        navigate("/login");
    } catch (error) {
        createToast(error.message, "error");
    }
});

if (!hasConfig) {
    appStatus.textContent = "Firebase konfiguracija nedostaje";
    createToast("Postavite Firebase config u public/env.js", "warning");
}

subscribeAuth((user) => {
    if (user) {
        userEmail.textContent = user.email;
        startDeviceSubscription(user.uid);
        if (window.location.hash === "#/login" || window.location.hash === "#/register") {
            navigate("/dashboard");
        }
    } else {
        userEmail.textContent = "Niste prijavljeni";
        if (devicesUnsub) devicesUnsub();
        devicesUnsub = null;
        setDeviceId(null);
    }
    renderRoute();
});

window.addEventListener("hashchange", renderRoute);
renderRoute();