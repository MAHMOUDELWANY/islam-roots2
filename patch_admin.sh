#!/bin/bash
cat << 'INNER_EOF' > src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const FIRESTORE_DATABASE_ID =
  (firebaseConfig as Record<string, string>).firestoreDatabaseId ||
  "ai-studio-islamroots-c17b3d5a-d730-4c1c-8b68-01d5dfb7b734";

if (!getApps().length) {
  let appConfig: any = { projectId: firebaseConfig.projectId };
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      appConfig.credential = cert(serviceAccount);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", e);
    }
  }

  initializeApp(appConfig);
}

export const adminAuth = getAuth();
export const adminDb = getFirestore(FIRESTORE_DATABASE_ID);
INNER_EOF
chmod +x patch_admin.sh
./patch_admin.sh