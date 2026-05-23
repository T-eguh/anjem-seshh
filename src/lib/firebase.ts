import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import localFirebaseConfig from "../../firebase-applet-config.json";

// Environment variables configuration option for Vercel or production deployments
const metaEnv = (import.meta as any).env || {};
const envConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID,
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
};

// Select configuration based on availability of env variables
const isEnvConfigured = !!metaEnv.VITE_FIREBASE_API_KEY;
const finalConfig = isEnvConfigured ? envConfig : localFirebaseConfig;
const databaseId = isEnvConfigured ? envConfig.firestoreDatabaseId : localFirebaseConfig.firestoreDatabaseId;

// Initialize Firebase app
const app = initializeApp(finalConfig);

// Initialize services with databaseId configuration
export const db = getFirestore(app, databaseId || undefined); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Social Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Standardized operation types for error diagnostics
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Handles errors arising from real-time database procedures to provide structured diagnostic logs.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error Detailed Info: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Helper to perform Auth Google Login via Popup (best fit for previews)
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

/**
 * Log out
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}
