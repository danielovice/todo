// Firebase Modular SDK (v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAd-m4ivSitRoH2IHjZS8N9TO4N6o3f0-c",
    authDomain: "todo-c28f9.firebaseapp.com",
    projectId: "todo-c28f9",
    storageBucket: "todo-c28f9.firebasestorage.app",
    messagingSenderId: "877149325722",
    appId: "1:877149325722:web:aecf751686620fd2715223",
    measurementId: "G-WF68HR6TLN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth Funktionen
export function registerUser(username, password) {
    const email = `${username}@todo.at`;
    return createUserWithEmailAndPassword(auth, email, password);
}

export function loginUser(username, password, rememberMe) {
    const email = `${username}@todo.at`;
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    return setPersistence(auth, persistence).then(() => {
        return signInWithEmailAndPassword(auth, email, password);
    });
}

export function logoutUser() {
    return signOut(auth);
}

export function getCurrentUser() {
    return auth.currentUser;
}

export function onAuthChanged(callback) {
    return onAuthStateChanged(auth, callback);
}
