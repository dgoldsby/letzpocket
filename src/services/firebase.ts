import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiANBFBL0K4v36ZSYD_wS7uGdRsQIbC-A",
  authDomain: "letzpocket-site.firebaseapp.com",
  projectId: "letzpocket-site",
  storageBucket: "letzpocket-site.firebasestorage.app",
  messagingSenderId: "557937099852",
  appId: "1:557937099852:web:b3dfab6dac35efb51ae0e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;
