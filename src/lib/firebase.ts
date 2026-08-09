import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";

// Using Vite's import.meta.glob for optional JSON import
const configModules = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const localConfig: any = Object.values(configModules)[0] || {};

const appConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.default?.projectId || localConfig.projectId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.default?.apiKey || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.default?.authDomain || localConfig.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.default?.storageBucket || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.default?.messagingSenderId || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.default?.appId || localConfig.appId,
};

export const FIRESTORE_DATABASE_ID =
  import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
  localConfig.default?.firestoreDatabaseId || localConfig.firestoreDatabaseId ||
  "ai-studio-islamroots-c17b3d5a-d730-4c1c-8b68-01d5dfb7b734";

export const app = initializeApp(appConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  { localCache: memoryLocalCache() },
  FIRESTORE_DATABASE_ID
);
