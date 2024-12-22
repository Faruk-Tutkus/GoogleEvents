// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDr93VAAgUn46t1jB0vU79D-JQFBkcUkOs",
  authDomain: "events-568f6.firebaseapp.com",
  projectId: "events-568f6",
  storageBucket: "events-568f6.firebasestorage.app",
  messagingSenderId: "222351414820",
  appId: "1:222351414820:web:66dbd4e1ff5a4cd08ceab1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
//const analytics = getAnalytics(app);