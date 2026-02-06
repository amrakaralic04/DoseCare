const toastRoot = document.getElementById("toast-root");
const modalRoot = document.getElementById("modal-root");

const createToast = (message, variant = "info") => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<strong>${variant.toUpperCase()}</strong><div>${message}</div>`;
    toastRoot.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
};

const openModal = (content) => {
    closeModal();
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<div class="modal">${content}</div>`;
    backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) {
            closeModal();
        }
    });
    modalRoot.appendChild(backdrop);
};

const closeModal = () => {
    modalRoot.innerHTML = "";
};

const formatTimestamp = (timestamp) => {
    if (!timestamp) return "--";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("bs-BA");
};

const formatTime = (value) => {
    if (!value) return "--";
    return value;
};

const formatStateChip = (state) => {
    const normalized = state || "IDLE";
    const colorMap = {
        IDLE: "badge--soft",
        REMIND: "badge--warning",
        TAKE_WINDOW: "badge--warning",
        CONFIRMED: "badge--success",
        MISSED: "badge--danger"
    };
    const className = colorMap[normalized] || "badge--soft";
    return `<span class="badge ${className}">${normalized}</span>`;
};

const formatEventType = (type) => {
    const labels = {
        reminder_sent: "Podsjetnik",
        taken: "Uzeto",
        missed: "Propušteno"
    };
    return labels[type] || type;
};

const setActiveNav = () => {
    const hash = window.location.hash || "#/login";
    document.querySelectorAll("[data-route]").forEach((link) => {
        const href = link.getAttribute("href");
        link.classList.toggle("active", href === hash);
    });
};

export {
    createToast,
    openModal,
    closeModal,
    formatTimestamp,
    formatTime,
    formatStateChip,
    formatEventType,
    setActiveNav
};