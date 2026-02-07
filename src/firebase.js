import { initializeApp } from 'firebase/app';
import {
    getDatabase,
    ref,
    onValue,
    set,
    update,
    remove
} from 'firebase/database';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Možeš promijeniti kasnije kad budeš imala više uređaja
export const DEVICE_ID = 'dosecare-1';

// ---------- ALARMS ----------
export function subscribeToAlarms(deviceId, onData, onError) {
    const alarmsRef = ref(db, `devices/${deviceId}/alarms`);

    return onValue(
        alarmsRef,
        (snap) => {
            if (!snap.exists()) {
                onData([]);
                return;
            }

            const obj = snap.val();
            const list = Object.entries(obj).map(([id, a]) => ({
                id,
                time: String(a.time ?? ''),
                name: String(a.name ?? ''),
                enabled: Boolean(a.enabled ?? true),
                createdAt: Number(a.createdAt ?? 0),
            }));

            list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            onData(list);
        },
        onError
    );
}

export async function addAlarm(deviceId, alarm) {
    const id = crypto.randomUUID();
    const payload = {
        time: alarm.time,
        name: alarm.name,
        enabled: Boolean(alarm.enabled),
        createdAt: Date.now(),
    };

    await set(ref(db, `devices/${deviceId}/alarms/${id}`), payload);
    return id;
}

export async function setAlarmEnabled(deviceId, alarmId, enabled) {
    await update(ref(db, `devices/${deviceId}/alarms/${alarmId}`), {
        enabled: Boolean(enabled),
        updatedAt: Date.now(),
    });
}

export async function deleteAlarm(deviceId, alarmId) {
    await remove(ref(db, `devices/${deviceId}/alarms/${alarmId}`));
}

// ---------- MOTOR ----------
export function subscribeToMotor(deviceId, onData, onError) {
    const motorRef = ref(db, `devices/${deviceId}/motor`);

    return onValue(
        motorRef,
        (snap) => {
            const m = snap.exists() ? snap.val() : {};
            onData({
                active: Boolean(m.active ?? false),
                updatedAt: Number(m.updatedAt ?? 0),
            });
        },
        onError
    );
}

// Klik na dugme STOP -> ovo upiše u bazu, ESP32 će kasnije slušati
export async function stopMotor(deviceId) {
    await update(ref(db, `devices/${deviceId}/motor`), {
        active: false,
        updatedAt: Date.now(),
        lastCommand: 'STOP',
    });
}

// ---------- PILL / LOAD CELL ----------
export function subscribeToPill(deviceId, onData, onError) {
    const pillRef = ref(db, `devices/${deviceId}/pill`);

    return onValue(
        pillRef,
        (snap) => {
            const p = snap.exists() ? snap.val() : {};
            onData({
                detected: Boolean(p.detected ?? false),
                statusText: String(p.statusText ?? (p.detected ? 'Detektovano' : 'Čeka')),
                updatedAt: Number(p.updatedAt ?? 0),
            });
        },
        onError
    );
}
