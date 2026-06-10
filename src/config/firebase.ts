import type { App } from "firebase-admin/app";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { env } from "./env.js";

let firebaseApp: App | null = null;

export function getFirebaseApp(): App {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (getApps().length > 0) {
    firebaseApp = getApp();
    return firebaseApp;
  }

  const projectId = requiredFirebaseEnv("FIREBASE_PROJECT_ID", env.FIREBASE_PROJECT_ID);
  const clientEmail = requiredFirebaseEnv("FIREBASE_CLIENT_EMAIL", env.FIREBASE_CLIENT_EMAIL);
  const privateKey = requiredFirebaseEnv("FIREBASE_PRIVATE_KEY", env.FIREBASE_PRIVATE_KEY).replace(
    /\\n/g,
    "\n"
  );
  const storageBucket = requiredFirebaseEnv(
    "FIREBASE_STORAGE_BUCKET",
    env.FIREBASE_STORAGE_BUCKET
  );

  firebaseApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    }),
    storageBucket
  });

  return firebaseApp;
}

export function getFirestore() {
  return getAdminFirestore(getFirebaseApp());
}

export function getStorageBucket() {
  return getStorage(getFirebaseApp()).bucket();
}

function requiredFirebaseEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is required when Firebase is enabled`);
  }

  return value;
}
