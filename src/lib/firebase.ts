/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";

const configModules = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const localConfig: any = Object.values(configModules)[0] || {};

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.default?.projectId || localConfig.projectId;
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || localConfig.default?.apiKey || localConfig.apiKey;

if (!projectId || !apiKey) {
  throw new Error(
    "Missing Firebase configuration. Please set VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY in your environment variables."
  );
}

const appConfig = {
  projectId,
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.default?.authDomain || localConfig.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.default?.storageBucket || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.default?.messagingSenderId || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.default?.appId || localConfig.appId,
};

export const FIRESTORE_DATABASE_ID =
  import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
  localConfig.default?.firestoreDatabaseId || 
  localConfig.firestoreDatabaseId;

if (!FIRESTORE_DATABASE_ID) {
  throw new Error("Missing VITE_FIRESTORE_DATABASE_ID environment variable. Firestore cannot be initialized without a specific database ID.");
}

export const app = initializeApp(appConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  { localCache: memoryLocalCache() },
  FIRESTORE_DATABASE_ID
);
