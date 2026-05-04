import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAkCnzQCrD8OOa6Zs76JO-N9SoLzjNb77I",
  authDomain: "cs385-001-cloudapp.firebaseapp.com",
  projectId: "cs385-001-cloudapp",
  storageBucket: "cs385-001-cloudapp.firebasestorage.app",
  messagingSenderId: "26585138308",
  appId: "1:26585138308:web:778d28dbff869310a8eed1",
  measurementId: "G-8K45D8E2YH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
