import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID;

if (!PROJECT_ID) {
  throw new Error("Missing FIREBASE_PROJECT_ID environment variable for Firebase Admin initialization.");
}

if (!FIRESTORE_DATABASE_ID) {
  throw new Error("Missing FIRESTORE_DATABASE_ID environment variable. Firestore Admin cannot be initialized without a specific database ID.");
}

if (!getApps().length) {
  let appConfig: any = { projectId: PROJECT_ID };
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      appConfig.credential = cert(serviceAccount);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", e);
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT is missing. Admin SDK will attempt to use application default credentials.");
  }

  initializeApp(appConfig);
}

export const adminAuth = getAuth();
export const adminDb = getFirestore(FIRESTORE_DATABASE_ID);
