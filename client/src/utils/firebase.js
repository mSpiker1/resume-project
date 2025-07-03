import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: FIRE_API_KEY,
    authDomain: "drawing-app-bf1a8.firebaseapp.com",
    databaseURL: "https://drawing-app-bf1a8-default-rtdb.firebaseio.com",
    projectId: "drawing-app-bf1a8",
    storageBucket: "drawing-app-bf1a8.firebasestorage.app",
    messagingSenderId: "752091274529",
    appId: FIRE_APP_ID,
    measurementId: "G-KWPYGHBLSV"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getDatabase(app);