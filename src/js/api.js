import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    startAfter,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, functionsBaseUrl, hasConfig } from "./firebase.js";

const ensureDb = () => {
    if (!hasConfig || !db) {
        throw new Error("Firestore nije konfigurisan. Provjerite env.js.");
    }
};

const subscribeUserDevices = (uid, callback) => {
    ensureDb();
    const ref = collection(db, `users/${uid}/devices`);
    return onSnapshot(ref, (snapshot) => {
        const devices = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(devices);
    });
};

const subscribeDevice = (deviceId, callback) => {
    ensureDb();
    const ref = doc(db, `devices/${deviceId}`);
    return onSnapshot(ref, (docSnap) => {
        callback({ id: docSnap.id, ...docSnap.data() });
    });
};

const subscribeEvents = (deviceId, limitCount, callback) => {
    ensureDb();
    const ref = collection(db, `devices/${deviceId}/events`);
    const q = query(ref, orderBy("timestamp", "desc"), limit(limitCount));
    return onSnapshot(q, callback);
};

const subscribeSchedules = (deviceId, callback) => {
    ensureDb();
    const ref = collection(db, `devices/${deviceId}/schedules`);
    const q = query(ref, orderBy("time", "asc"));
    return onSnapshot(q, (snapshot) => {
        const schedules = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(schedules);
    });
};

const addSchedule = async (deviceId, payload) => {
    ensureDb();
    const ref = collection(db, `devices/${deviceId}/schedules`);
    await addDoc(ref, {
        ...payload,
        createdAt: serverTimestamp()
    });
};

const updateSchedule = async (deviceId, scheduleId, payload) => {
    ensureDb();
    const ref = doc(db, `devices/${deviceId}/schedules/${scheduleId}`);
    await updateDoc(ref, payload);
};

const deleteSchedule = async (deviceId, scheduleId) => {
    ensureDb();
    const ref = doc(db, `devices/${deviceId}/schedules/${scheduleId}`);
    await deleteDoc(ref);
};

const fetchEventsPage = async ({ deviceId, days, limitCount, lastDoc }) => {
    ensureDb();
    const ref = collection(db, `devices/${deviceId}/events`);
    let q = query(ref, orderBy("timestamp", "desc"), limit(limitCount));
    if (days) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        q = query(ref, where("timestamp", ">=", since), orderBy("timestamp", "desc"), limit(limitCount));
    }
    if (lastDoc) {
        q = query(ref, orderBy("timestamp", "desc"), startAfter(lastDoc), limit(limitCount));
    }
    const snapshot = await getDocs(q);
    return {
        docs: snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
};

const getDevice = async (deviceId) => {
    ensureDb();
    const ref = doc(db, `devices/${deviceId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

const getFunctionsBaseUrl = () => {
    if (!functionsBaseUrl) {
        throw new Error("Functions base URL nije konfigurisan u env.js.");
    }
    return functionsBaseUrl.replace(/\/$/, "");
};

const pairDevice = async ({ deviceId, secret, idToken }) => {
    const baseUrl = getFunctionsBaseUrl();
    const response = await fetch(`${baseUrl}/api/device/pair`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ deviceId, secret })
    });

    if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || "Pairing nije uspio.");
    }

    return response.json();
};

export {
    subscribeUserDevices,
    subscribeDevice,
    subscribeEvents,
    subscribeSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    fetchEventsPage,
    getDevice,
    pairDevice
};