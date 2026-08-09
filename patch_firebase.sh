#!/bin/bash
cat << 'INNER_EOF' > src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const appConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

export const FIRESTORE_DATABASE_ID =
  import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
  (firebaseConfig as Record<string, string>).firestoreDatabaseId ||
  "ai-studio-islamroots-c17b3d5a-d730-4c1c-8b68-01d5dfb7b734";

export const app = initializeApp(appConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  { localCache: memoryLocalCache() },
  FIRESTORE_DATABASE_ID
);
INNER_EOF
chmod +x patch_firebase.sh
./patch_firebase.sh