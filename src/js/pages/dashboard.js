import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";
import { subscribeDevice, subscribeEvents } from "../api.js";
import { createToast, formatTimestamp, formatStateChip, formatEventType } from "../ui.js";

const renderDashboard = () => `
 <section class="section page">
    <div class="page-header">
      <div class="page-header__text">
        <p class="badge badge--soft">Dobrodošli nazad</p>
        <h2 class="page-header__title">Kontrolna tabla uređaja</h2>
        <p class="muted">Pratite stanje terapije, posljednje događaje i rad pametne kutije.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--primary" type="button">Dodaj podsjetnik</button>
        <button class="btn btn--ghost" type="button">Preuzmi izvještaj</button>
        <span id="device-status" class="chip">Device nije povezan</span>
      </div>
    </div>
     <div class="quick-stats">
      <div class="quick-stat">
        <span class="quick-stat__label">Status uređaja</span>
        <div class="quick-stat__value" id="device-online">--</div>
        <p class="muted">Last seen: <span id="device-last-seen">--</span></p>
      </div>
      <div class="quick-stat">
        <span class="quick-stat__label">Trenutna težina</span>
        <div class="quick-stat__value" id="device-weight">-- g</div>
        <p class="muted">Threshold: <span id="device-threshold">-- g</span></p>
      </div>
      <div class="quick-stat">
        <span class="quick-stat__label">Stanje terapije</span>
        <div class="quick-stat__value" id="device-state">--</div>
        <p class="muted">Današnja doza: <span id="dose-status">--</span></p>
      </div>
      <div class="quick-stat">
        <span class="quick-stat__label">Aktivnost</span>
        <div class="quick-stat__value" id="event-count">--</div>
        <p class="muted">Zadnjih 24h</p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="section__header">
      <h3 class="section__title">Zadnjih 5 događaja</h3>
      <span class="badge badge--soft" id="new-events">0 novih</span>
    </div>
    <div class="list" id="activity-list"></div>
  </section>
`;

const mountDashboard = ({ root, deviceId }) => {
    root.innerHTML = renderDashboard();
    if (!deviceId) {
        return () => {};
    }

    const statusEl = document.getElementById("device-status");
    const onlineEl = document.getElementById("device-online");
    const lastSeenEl = document.getElementById("device-last-seen");
    const weightEl = document.getElementById("device-weight");
    const thresholdEl = document.getElementById("device-threshold");
    const stateEl = document.getElementById("device-state");
    const doseEl = document.getElementById("dose-status");
    const eventCountEl = document.getElementById("event-count");
    const listEl = document.getElementById("activity-list");
    const newEventsEl = document.getElementById("new-events");

    let initialLoad = true;
    let newEvents = 0;

    const deviceUnsub = subscribeDevice(deviceId, (device) => {
        if (!device) return;
        statusEl.textContent = deviceId;
        const lastSeen = device.lastSeen?.toDate ? device.lastSeen.toDate() : null;
        const offline = !lastSeen || Date.now() - lastSeen.getTime() > 2 * 60 * 1000;
        onlineEl.textContent = offline ? "Offline" : "Online";
        onlineEl.className = offline ? "card__value" : "card__value";
        lastSeenEl.textContent = formatTimestamp(device.lastSeen);
        weightEl.textContent = device.weight ? `${device.weight} g` : "-- g";
        thresholdEl.textContent = device.threshold ? `${device.threshold} g` : "-- g";
        stateEl.innerHTML = formatStateChip(device.state);
    });

    const eventsUnsub = subscribeEvents(deviceId, 5, (snapshot) => {
        listEl.innerHTML = "";
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" && !initialLoad) {
                newEvents += 1;
                createToast("Novi događaj je zabilježen.", "info");
            }
        });
        snapshot.docs.forEach((docSnap) => {
            const event = docSnap.data();
            const item = document.createElement("div");
            item.className = "list-item";
            item.innerHTML = `
        <div class="list-item__meta">
          <strong>${formatEventType(event.type)}</strong>
          <span class="muted">${formatTimestamp(event.timestamp)}</span>
        </div>
        <span class="badge badge--soft">ΔW: ${event.deltaWeight ?? "--"} g</span>
      `;
            listEl.appendChild(item);
        });
        newEventsEl.textContent = `${newEvents} novih`;
        initialLoad = false;
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayQuery = query(
        collection(db, `devices/${deviceId}/events`),
        where("timestamp", ">=", startOfDay),
        orderBy("timestamp", "desc"),
        limit(50)
    );

    const todayUnsub = onSnapshot(todayQuery, (snapshot) => {
        let taken = false;
        let missed = false;
        snapshot.docs.forEach((docSnap) => {
            const event = docSnap.data();
            if (event.type === "taken") taken = true;
            if (event.type === "missed") missed = true;
        });
        if (taken) {
            doseEl.textContent = "Uzeta";
        } else if (missed) {
            doseEl.textContent = "Propuštena";
        } else {
            doseEl.textContent = "Na čekanju";
        }
        eventCountEl.textContent = snapshot.size.toString();
    });

    return () => {
        deviceUnsub();
        eventsUnsub();
        todayUnsub();
    };
};

export { mountDashboard };