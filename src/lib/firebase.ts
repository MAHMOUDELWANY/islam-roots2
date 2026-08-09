import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

export const FIRESTORE_DATABASE_ID =
  (firebaseConfig as Record<string, string>).firestoreDatabaseId ||
  "ai-studio-islamroots-c17b3d5a-d730-4c1c-8b68-01d5dfb7b734";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(
  app,
  { localCache: memoryLocalCache() },
  FIRESTORE_DATABASE_ID
);

