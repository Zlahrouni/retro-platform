// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
//  Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBbvzvvPKB1X3f9dbWlIL0oGtosLQYHwOk",
    authDomain: "retro-platform-6096e.firebaseapp.com",
    projectId: "retro-platform-6096e",
    storageBucket: "retro-platform-6096e.firebasestorage.app",
    messagingSenderId: "657126505",
    appId: "1:657126505:web:c7f1f1e4d23603ad579ef8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);