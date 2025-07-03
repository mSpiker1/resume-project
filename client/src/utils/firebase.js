import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.FIRE_API_KEY,
    authDomain: process.env.FIRE_AUTH_DOMAIN,
    databaseURL: "https://drawing-app-bf1a8-default-rtdb.firebaseio.com",
    projectId: process.env.FIRE_PROJ_ID,
    storageBucket: process.env.FIRE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIRE_SENDER_ID,
    appId: process.env.FIRE_APP_ID,
    measurementId: process.env.FIRE_MEASURE_ID
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);