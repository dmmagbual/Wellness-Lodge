import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
if (useEmulators) {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectStorageEmulator(storage, "localhost", 9199);
  // eslint-disable-next-line no-console
  console.info("[wellness-lodge] Using local Firebase emulators.");
}

export const callCheckAvailability = httpsCallable(functions, "checkAvailability");
export const callCreateBooking = httpsCallable(functions, "createBooking");
export const callLookupBooking = httpsCallable(functions, "lookupBooking");
export const callSubmitReceipt = httpsCallable(functions, "submitReceipt");
export const callSubmitEnquiry = httpsCallable(functions, "submitEnquiry");
