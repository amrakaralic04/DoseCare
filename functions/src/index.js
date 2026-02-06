const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const hashSecret = (secret, salt) => {
    return crypto.scryptSync(secret, salt, 64).toString("hex");
};

const timingSafeEqual = (a, b) => {
    const bufferA = Buffer.from(a, "hex");
    const bufferB = Buffer.from(b, "hex");
    if (bufferA.length !== bufferB.length) return false;
    return crypto.timingSafeEqual(bufferA, bufferB);
};

const validateTimestamp = (timestamp) => {
    if (!timestamp) return false;
    const diff = Math.abs(Date.now() - timestamp);
    return diff < 10 * 60 * 1000;
};

const verifyDeviceSecret = async (deviceId, secret) => {
    const deviceRef = db.doc(`devices/${deviceId}`);
    const deviceSnap = await deviceRef.get();
    if (!deviceSnap.exists) {
        return { valid: false, error: "Device nije pronađen." };
    }
    const data = deviceSnap.data();
    if (!data.secretHash || !data.secretSalt) {
        return { valid: false, error: "Device nema konfigurisan secret." };
    }
    const incomingHash = hashSecret(secret, data.secretSalt);
    const valid = timingSafeEqual(incomingHash, data.secretHash);
    return { valid, device: { id: deviceSnap.id, ...data } };
};

app.post("/api/device/ping", async (req, res) => {
    try {
        const { deviceId, secret, weight, state, timestamp } = req.body;
        if (!deviceId || !secret) {
            return res.status(400).json({ error: "Nedostaje deviceId ili secret." });
        }
        if (!validateTimestamp(timestamp)) {
            return res.status(400).json({ error: "Timestamp nije validan." });
        }
        const result = await verifyDeviceSecret(deviceId, secret);
        if (!result.valid) {
            return res.status(401).json({ error: result.error });
        }

        await db.doc(`devices/${deviceId}`).update({
            lastSeen: admin.firestore.Timestamp.fromMillis(timestamp),
            weight: weight ?? null,
            state: state || "IDLE"
        });

        return res.json({ status: "ok" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post("/api/device/event", async (req, res) => {
    try {
        const { deviceId, secret, type, deltaWeight, timestamp } = req.body;
        const validTypes = ["reminder_sent", "taken", "missed"];

        if (!deviceId || !secret || !type) {
            return res.status(400).json({ error: "Nedostaju podaci." });
        }
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: "Nepoznat tip eventa." });
        }
        if (!validateTimestamp(timestamp)) {
            return res.status(400).json({ error: "Timestamp nije validan." });
        }
        const result = await verifyDeviceSecret(deviceId, secret);
        if (!result.valid) {
            return res.status(401).json({ error: result.error });
        }

        const stateMap = {
            reminder_sent: "REMIND",
            taken: "CONFIRMED",
            missed: "MISSED"
        };

        const eventRef = db.collection(`devices/${deviceId}/events`).doc();
        await eventRef.set({
            type,
            deltaWeight: deltaWeight ?? null,
            timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
            deviceId
        });

        await db.doc(`devices/${deviceId}`).update({
            lastSeen: admin.firestore.Timestamp.fromMillis(timestamp),
            state: stateMap[type]
        });

        return res.json({ status: "ok" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get("/api/device/config", async (req, res) => {
    try {
        const deviceId = req.query.deviceId;
        const secret = req.header("x-device-secret");

        if (!deviceId || !secret) {
            return res.status(400).json({ error: "Nedostaje deviceId ili secret." });
        }

        const result = await verifyDeviceSecret(deviceId, secret);
        if (!result.valid) {
            return res.status(401).json({ error: result.error });
        }

        const scheduleSnap = await db
            .collection(`devices/${deviceId}/schedules`)
            .where("enabled", "!=", false)
            .get();

        const schedules = scheduleSnap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        return res.json({
            deviceId,
            threshold: result.device.threshold ?? null,
            timezone: result.device.timezone ?? "Europe/Sarajevo",
            schedules
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post("/api/device/pair", async (req, res) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        const { deviceId, secret } = req.body;

        if (!token) {
            return res.status(401).json({ error: "Nedostaje auth token." });
        }

        const decoded = await admin.auth().verifyIdToken(token);
        if (!decoded?.uid) {
            return res.status(401).json({ error: "Token nije validan." });
        }

        const result = await verifyDeviceSecret(deviceId, secret);
        if (!result.valid) {
            return res.status(401).json({ error: result.error });
        }

        await db.doc(`users/${decoded.uid}/devices/${deviceId}`).set({
            linkedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.doc(`devices/${deviceId}`).set(
            {
                ownerId: decoded.uid,
                linkedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
        );

        return res.json({ status: "paired", deviceId });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

exports.api = functions.region("europe-west1").https.onRequest(app);