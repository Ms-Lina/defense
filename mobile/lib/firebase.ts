/**
 * Firebase configuration and helpers.
 * Config from google-services.json (Android) / GoogleService-Info.plist (iOS).
 * Auth: on native uses React Native persistence (AsyncStorage); on web uses getAuth().
 */

import { Platform } from "react-native";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCybgVvn-UjlYPItthJhbWlxZKU0znUpm4",
  authDomain: "menyai-27cfc.firebaseapp.com",
  projectId: "menyai-27cfc",
  storageBucket: "menyai-27cfc.firebasestorage.app",
  messagingSenderId: "973511634165",
  appId: "1:973511634165:android:1fce7b24de7995550569bc",
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? (getApps()[0] as FirebaseApp) : initializeApp(firebaseConfig);
  }
  return app;
}

export function getAuthInstance(): Auth {
  if (!authInstance) {
    const a = getFirebaseApp();
    const isWeb = Platform.OS === "web";
    const hasRNPersistence = typeof getReactNativePersistence === "function";
    if (isWeb || !hasRNPersistence) {
      authInstance = getAuth(a);
    } else {
      try {
        authInstance = initializeAuth(a, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (e: unknown) {
        const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "";
        if (msg.includes("already") || msg.includes("Auth instance")) {
          authInstance = getAuth(a);
        } else {
          try {
            authInstance = getAuth(a);
          } catch {
            throw e;
          }
        }
      }
    }
  }
  return authInstance;
}

export const auth = () => getAuthInstance();
export const db = () => getFirestore(getFirebaseApp());

export const firebaseReady = true;
