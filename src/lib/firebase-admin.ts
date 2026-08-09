import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const FIRESTORE_DATABASE_ID =
  (firebaseConfig as Record<string, string>).firestoreDatabaseId ||
  "ai-studio-islamroots-c17b3d5a-d730-4c1c-8b68-01d5dfb7b734";

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore(FIRESTORE_DATABASE_ID);
