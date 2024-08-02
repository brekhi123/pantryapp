// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore'
import { getStorage } from 'firebase/storage';


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDc0ZyRAnidv-r1HQoXVHbZ1nn66EZekQk",
  authDomain: "hspantryapp-b8ad1.firebaseapp.com",
  projectId: "hspantryapp-b8ad1",
  storageBucket: "hspantryapp-b8ad1.appspot.com",
  messagingSenderId: "713384280247",
  appId: "1:713384280247:web:ae3d50cb51b62413118d32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app)
const storage = getStorage(app);
export {
  app,
  firestore,
  storage
}