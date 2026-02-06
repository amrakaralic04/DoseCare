import {
    subscribeSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    pairDevice
} from "../api.js";
import { openModal, closeModal, createToast, formatTime } from "../ui.js";
import { getCurrentUser } from "../auth.js";

const renderSettings = () => `
  <section class="section">
    <div class="section__header">
      <h2 class="section__title">Uređaj &amp; raspored</h2>
      <button id="add-schedule" class="btn btn--primary" type="button">Dodaj termin</button>
    </div>
    <div class="card">
      <div class="form-row">
        <div class="notice">
          <strong>Pairing uređaja</strong>
          <p class="muted">Unesite device ID i pairing secret koji dolazi sa hardverom.</p>
        </div>
        <form id="pair-form">
          <div class="form-group">
            <label for="pair-device">Device ID</label>
            <input id="pair-device" class="input" type="text" required />
          </div>
          <div class="form-group">
            <label for="pair-secret">Pairing secret</label>
            <input id="pair-secret" class="input" type="password" required />
          </div>
          <button class="btn btn--ghost" type="submit">Poveži</button>
        </form>
      </div>
    </div>
  </section>
  <section class="section">
    <h3 class="section__title">Raspored terapije</h3>
    <div id="schedule-list" class="list"></div>
  </section>
`;

const scheduleModal = (schedule = {}) => `
  <h3 class="section__title">${schedule.id ? "Uredi" : "Novi"} termin</h3>
  <form id="schedule-form">
    <div class="form-row">
      <div class="form-group">
        <label>Vrijeme (HH:MM)</label>
        <input id="schedule-time" class="input" type="time" value="${schedule.time || ""}" required />
      </div>
      <div class="form-group">
        <label>Take window (min)</label>
        <input id="schedule-window" class="input" type="number" min="1" value="${schedule.takeWindowMinutes || 30}" required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Threshold (g)</label>
        <input id="schedule-threshold" class="input" type="number" min="1" value="${schedule.threshold || 10}" required />
      </div>
      <div class="form-group">
        <label>Timezone</label>
        <input id="schedule-timezone" class="input" type="text" value="${schedule.timezone || "Europe/Sarajevo"}" required />
      </div>
    </div>
    <div class="form-group">
      <label>
        <input id="schedule-enabled" type="checkbox" ${schedule.enabled !== false ? "checked" : ""} />
        Aktivno
      </label>
    </div>
    <div class="form-row">
      <button class="btn btn--primary" type="submit">Sačuvaj</button>
      <button id="modal-cancel" class="btn btn--ghost" type="button">Otkaži</button>
    </div>
  </form>
`;

const mountSettings = ({ root, deviceId }) => {
    root.innerHTML = renderSettings();

    const listEl = document.getElementById("schedule-list");
    const addBtn = document.getElementById("add-schedule");
    const pairForm = document.getElementById("pair-form");

    addBtn.addEventListener("click", () => {
        openModal(scheduleModal());
        bindScheduleForm(deviceId);
    });

    pairForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const user = getCurrentUser();
            if (!user) {
                createToast("Morate biti prijavljeni.", "error");
                return;
            }
            const idToken = await user.getIdToken();
            const deviceIdInput = document.getElementById("pair-device").value.trim();
            const secret = document.getElementById("pair-secret").value.trim();
            await pairDevice({ deviceId: deviceIdInput, secret, idToken });
            createToast("Uređaj povezan!", "success");
            pairForm.reset();
        } catch (error) {
            createToast(error.message, "error");
        }
    });

    if (!deviceId) {
        listEl.innerHTML = `<div class="notice">Nema povezanih uređaja.</div>`;
        return () => {};
    }

    const unsubscribe = subscribeSchedules(deviceId, (schedules) => {
        listEl.innerHTML = "";
        if (!schedules.length) {
            listEl.innerHTML = `<div class="notice">Nema definisanih termina.</div>`;
            return;
        }
        schedules.forEach((schedule) => {
            const item = document.createElement("div");
            item.className = "list-item";
            item.innerHTML = `
        <div class="list-item__meta">
          <strong>${formatTime(schedule.time)}</strong>
          <span class="muted">${schedule.timezone || "Europe/Sarajevo"} · ${schedule.takeWindowMinutes} min · ${schedule.threshold} g</span>
        </div>
        <div>
          <label class="chip">
            <input type="checkbox" data-id="${schedule.id}" ${schedule.enabled !== false ? "checked" : ""} />
            ${schedule.enabled !== false ? "Aktivno" : "Pauzirano"}
          </label>
          <button class="btn btn--ghost" data-edit="${schedule.id}">Uredi</button>
          <button class="btn btn--danger" data-delete="${schedule.id}">Obriši</button>
        </div>
      `;
            listEl.appendChild(item);
        });

        listEl.querySelectorAll("[data-id]").forEach((toggle) => {
            toggle.addEventListener("change", async (event) => {
                const target = event.target;
                await updateSchedule(deviceId, target.dataset.id, { enabled: target.checked });
            });
        });

        listEl.querySelectorAll("[data-edit]").forEach((button) => {
            button.addEventListener("click", () => {
                const schedule = schedules.find((item) => item.id === button.dataset.edit);
                openModal(scheduleModal(schedule));
                bindScheduleForm(deviceId, schedule.id);
            });
        });

        listEl.querySelectorAll("[data-delete]").forEach((button) => {
            button.addEventListener("click", async () => {
                await deleteSchedule(deviceId, button.dataset.delete);
                createToast("Termin obrisan.", "info");
            });
        });
    });

    return () => unsubscribe();
};

const bindScheduleForm = (deviceId, scheduleId = null) => {
    const form = document.getElementById("schedule-form");
    const cancel = document.getElementById("modal-cancel");

    cancel.addEventListener("click", closeModal);
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = {
            time: document.getElementById("schedule-time").value,
            takeWindowMinutes: Number(document.getElementById("schedule-window").value),
            threshold: Number(document.getElementById("schedule-threshold").value),
            timezone: document.getElementById("schedule-timezone").value,
            enabled: document.getElementById("schedule-enabled").checked
        };
        if (scheduleId) {
            await updateSchedule(deviceId, scheduleId, payload);
            createToast("Termin ažuriran.", "success");
        } else {
            await addSchedule(deviceId, payload);
            createToast("Termin dodan.", "success");
        }
        closeModal();
    });
};

export { mountSettings };