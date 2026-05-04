// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkCnzQCrD8OOa6Zs76JO-N9SoLzjNb77I",
  authDomain: "cs385-001-cloudapp.firebaseapp.com",
  projectId: "cs385-001-cloudapp",
  storageBucket: "cs385-001-cloudapp.firebasestorage.app",
  messagingSenderId: "26585138308",
  appId: "1:26585138308:web:778d28dbff869310a8eed1",
  measurementId: "G-8K45D8E2YH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
