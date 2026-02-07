import './styles.css';

import {
    DEVICE_ID,
    subscribeToAlarms,
    addAlarm as fbAddAlarm,
    setAlarmEnabled,
    deleteAlarm as fbDeleteAlarm,
    subscribeToMotor,
    stopMotor,
    subscribeToPill,
} from './firebase.js';

const els = {
    alarmTime: document.getElementById('alarmTime'),
    medicineName: document.getElementById('medicineName'),
    addAlarmBtn: document.getElementById('addAlarmBtn'),

    alarmsCount: document.getElementById('alarmsCount'),
    alarmsEmpty: document.getElementById('alarmsEmpty'),
    alarmsList: document.getElementById('alarmsList'),

    toastHost: document.getElementById('toastHost'),

    stopVibrationBtn: document.getElementById('stopVibrationBtn'),
    motorTitle: document.getElementById('motorTitle'),
    motorSub: document.getElementById('motorSub'),

    checkStatusBtn: document.getElementById('checkStatusBtn'),
    loadCellVal: document.getElementById('loadCellVal'),
    pillStatusVal: document.getElementById('pillStatusVal'),
    pillIcon: document.getElementById('pillIcon'),
    pillText: document.getElementById('pillText'),

    timeBtn: document.getElementById('timeBtn'),
};

let alarms = [];
let motorActive = false;

// da ne prikazuje toast na samom startu
let didInitMotor = false;
let didInitPill = false;

// -------- Toast --------
function toast(title, sub = '', ttlMs = 5000) {
    const t = document.createElement('div');
    t.className = 'toast';

    t.innerHTML = `
    <div class="toast__icon">i</div>
    <div class="toast__body">
      <div class="toast__title">${escapeHtml(title)}</div>
      <div class="toast__sub">${escapeHtml(sub)}</div>
    </div>
    <button class="toast__x" aria-label="Zatvori">✕</button>
  `;

    const close = () => t.remove();
    t.querySelector('.toast__x').addEventListener('click', close);

    els.toastHost.appendChild(t);
    setTimeout(close, ttlMs);
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }[m]));
}

// -------- Time picker button --------
els.timeBtn?.addEventListener('click', () => {
    els.alarmTime.showPicker?.();
    els.alarmTime.focus();
});

// -------- Alarms UI --------
function renderAlarms() {
    els.alarmsCount.textContent = String(alarms.length);
    els.alarmsEmpty.style.display = alarms.length ? 'none' : 'block';
    els.alarmsList.innerHTML = '';

    for (const a of alarms) {
        const row = document.createElement('div');
        row.className = 'alarm';

        row.innerHTML = `
      <div class="alarm__left">
        <div class="alarm__time">${escapeHtml(a.time)}</div>
        <div class="alarm__name">${escapeHtml(a.name)}</div>
      </div>

      <div class="alarm__right">
        <div class="toggle" role="switch" tabindex="0" aria-label="Aktiviraj alarm" data-on="${a.enabled ? 'true' : 'false'}"></div>
        <button class="icon-btn" title="Obriši alarm" aria-label="Obriši">🗑</button>
      </div>
    `;

        const toggle = row.querySelector('.toggle');
        const delBtn = row.querySelector('.icon-btn');

        const toggleAlarm = async () => {
            try {
                await setAlarmEnabled(DEVICE_ID, a.id, !a.enabled);
                toast(!a.enabled ? 'Alarm aktiviran' : 'Alarm deaktiviran', `${a.time} • ${a.name}`);
            } catch (e) {
                console.error(e);
                toast('Greška', 'Nije moguće promijeniti stanje alarma.');
            }
        };

        toggle.addEventListener('click', toggleAlarm);
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleAlarm();
            }
        });

        delBtn.addEventListener('click', async () => {
            try {
                await fbDeleteAlarm(DEVICE_ID, a.id);
                toast('Alarm je obrisan', `${a.time} • ${a.name}`);
            } catch (e) {
                console.error(e);
                toast('Greška', 'Nije moguće obrisati alarm.');
            }
        });

        els.alarmsList.appendChild(row);
    }
}

async function addAlarm() {
    const time = (els.alarmTime.value || '').trim();
    const name = (els.medicineName.value || '').trim();

    if (!time) {
        toast('Unesi vrijeme alarma', 'Polje "Vrijeme" je obavezno.');
        return;
    }
    if (!name) {
        toast('Unesi naziv lijeka', 'Polje "Naziv lijeka" je obavezno.');
        return;
    }

    try {
        await fbAddAlarm(DEVICE_ID, { time, name, enabled: true });
        els.medicineName.value = '';
        toast(`Alarm postavljen za ${time}`, name);
    } catch (e) {
        console.error(e);
        toast('Greška', 'Nije moguće dodati alarm u bazu.');
    }
}

els.addAlarmBtn.addEventListener('click', addAlarm);
els.medicineName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addAlarm();
});

// -------- Motor UI --------
function setMotorState(active, silent = false) {
    motorActive = active;

    if (motorActive) {
        els.motorTitle.textContent = 'Motor je aktivan';
        els.motorSub.textContent = 'Vibracija je uključena';
        els.stopVibrationBtn.disabled = false;
        els.stopVibrationBtn.classList.add('active');
        if (!silent) toast('Vibracija pokrenuta', 'Motor je aktivan');
    } else {
        els.motorTitle.textContent = 'Motor je neaktivan';
        els.motorSub.textContent = 'Nema aktivnih vibracija';
        els.stopVibrationBtn.disabled = true;
        els.stopVibrationBtn.classList.remove('active');
        if (!silent) toast('Vibracija zaustavljena', 'Motor je neaktivan');
    }
}

els.stopVibrationBtn.addEventListener('click', async () => {
    try {
        await stopMotor(DEVICE_ID);
        // toast će doći preko subscribe kad ESP32 / DB promijeni stanje
    } catch (e) {
        console.error(e);
        toast('Greška', 'Nije moguće poslati STOP komandu.');
    }
});

// -------- Pill / load cell UI --------
function setPillState({ detected, statusText }) {
    if (detected) {
        els.pillIcon.textContent = '✔';
        els.pillText.textContent = 'Tableta detektovana';
        els.pillStatusVal.textContent = statusText || 'Detektovano';
        els.loadCellVal.textContent = 'Detektovano';
    } else {
        els.pillIcon.textContent = '✖';
        els.pillText.textContent = 'Tableta u kutijici';
        els.pillStatusVal.textContent = statusText || 'Čeka';
        els.loadCellVal.textContent = 'Čeka';
    }
}

els.checkStatusBtn.addEventListener('click', () => {
    toast('Status osvježen', 'Podaci se prate u real-time.');
});

// -------- INIT (bez start toasta) --------
renderAlarms();
setMotorState(false, true);
setPillState({ detected: false, statusText: 'Čeka' });

// -------- Firebase subscriptions --------
subscribeToAlarms(
    DEVICE_ID,
    (list) => {
        alarms = list;
        renderAlarms();
    },
    (err) => {
        console.error(err);
        toast('Greška', 'Ne mogu učitati alarme iz baze.');
    }
);

subscribeToMotor(
    DEVICE_ID,
    (m) => {
        const first = !didInitMotor;
        didInitMotor = true;

        // na prvom učitavanju bez toasta
        setMotorState(m.active, first);
    },
    (err) => {
        console.error(err);
        toast('Greška', 'Ne mogu učitati stanje motora.');
    }
);

subscribeToPill(
    DEVICE_ID,
    (p) => {
        const first = !didInitPill;
        didInitPill = true;

        setPillState({ detected: p.detected, statusText: p.statusText });

        // bez toasta na startu
        if (!first) {
            toast('Status kutijice promijenjen', p.detected ? 'Detektovano' : 'Čeka', 3500);
        }
    },
    (err) => {
        console.error(err);
        toast('Greška', 'Ne mogu učitati status kutijice.');
    }
);
