import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, hasConfig } from "./firebase.js";

const authErrorMap = {
    "auth/email-already-in-use": "Email je već registrovan.",
    "auth/invalid-email": "Email nije validan.",
    "auth/weak-password": "Lozinka je preslaba (min. 6 karaktera).",
    "auth/user-not-found": "Korisnik nije pronađen.",
    "auth/wrong-password": "Pogrešna lozinka.",
    "auth/too-many-requests": "Previše pokušaja. Pokušajte kasnije.",
    "auth/network-request-failed": "Provjerite internet konekciju."
};

const listeners = new Set();

const ensureAuth = () => {
    if (!hasConfig || !auth) {
        throw new Error("Firebase nije konfigurisan. Provjerite env.js.");
    }
};

const formatAuthError = (error) => {
    return authErrorMap[error.code] || "Dogodila se greška. Pokušajte ponovo.";
};

const registerUser = async (email, password) => {
    ensureAuth();
    await createUserWithEmailAndPassword(auth, email, password);
};

const loginUser = async (email, password) => {
    ensureAuth();
    await signInWithEmailAndPassword(auth, email, password);
};

const logoutUser = async () => {
    ensureAuth();
    await signOut(auth);
};

const subscribeAuth = (callback) => {
    ensureAuth();
    const unsubscribe = onAuthStateChanged(auth, callback);
    listeners.add(unsubscribe);
    return unsubscribe;
};

const clearAuthListeners = () => {
    listeners.forEach((unsubscribe) => unsubscribe());
    listeners.clear();
};

const getCurrentUser = () => (auth ? auth.currentUser : null);

export {
    registerUser,
    loginUser,
    logoutUser,
    subscribeAuth,
    formatAuthError,
    clearAuthListeners,
    getCurrentUser
};