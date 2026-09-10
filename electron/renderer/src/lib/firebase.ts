import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

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
export const auth = getAuth(app);

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
if (useEmulators) {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectStorageEmulator(storage, "localhost", 9199);
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  // eslint-disable-next-line no-console
  console.info("[wellness-lodge front desk] Using local Firebase emulators.");
}

export const callAcceptPayAtDesk = httpsCallable(functions, "acceptPayAtDesk");
export const callConfirmBooking = httpsCallable(functions, "confirmBooking");
export const callRejectReceipt = httpsCallable(functions, "rejectReceipt");
export const callCancelBooking = httpsCallable(functions, "cancelBooking");
export const callCheckInGuest = httpsCallable(functions, "checkInGuest");
export const callCheckOutGuest = httpsCallable(functions, "checkOutGuest");
export const callCreateStaffUser = httpsCallable(functions, "createStaffUser");
export const callDeactivateStaffUser = httpsCallable(functions, "deactivateStaffUser");
export const callSaveRatePeriod = httpsCallable(functions, "saveRatePeriod");
export const callOverrideBookingField = httpsCallable(functions, "overrideBookingField");
export const callBootstrapFirstAdmin = httpsCallable(functions, "bootstrapFirstAdmin");
