import crypto from "crypto";
import admin from "firebase-admin";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
    throw new Error("Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON.");
}

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const createDevice = async ({ deviceId, secret }) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(secret, salt, 64).toString("hex");

    await db.doc(`devices/${deviceId}`).set({
        secretHash: hash,
        secretSalt: salt,
        state: "IDLE",
        weight: 0,
        threshold: 10,
        timezone: "Europe/Sarajevo",
        lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Device ${deviceId} created.`);
};

const [deviceId, secret] = process.argv.slice(2);
if (!deviceId || !secret) {
    console.log("Usage: node seed.js <deviceId> <secret>");
    process.exit(1);
}

createDevice({ deviceId, secret })
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });