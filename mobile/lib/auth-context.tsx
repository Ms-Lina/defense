/**
 * Auth context: login/register with Firebase (phone + 6-digit PIN as email/password),
 * 30-day session expiry, and redirects.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/lib/firebase";
import { getBaseUrl } from "@/lib/api";

const SESSION_DAYS = 30;
const LAST_LOGIN_KEY = "menyai_lastLoginAt";

function phoneToEmail(phone: string): string {
  const normalized = phone.replace(/\s+/g, "").replace(/^0/, "250");
  const digits = normalized.replace(/\D/g, "");
  return `${digits}@menyai.local`;
}

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return "250" + digits;
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (phone: string, pin: string) => Promise<void>;
  register: (phone: string, name: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPinReset: (phone: string, newPin: string) => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const checkSessionExpiry = async (uid: string) => {
    try {
      const raw = await AsyncStorage.getItem(LAST_LOGIN_KEY);
      const lastLoginAt = raw ? parseInt(raw, 10) : 0;
      const now = Date.now();
      const maxAge = SESSION_DAYS * 24 * 60 * 60 * 1000;
      if (lastLoginAt && now - lastLoginAt > maxAge) {
        await AsyncStorage.removeItem(LAST_LOGIN_KEY);
        await firebaseSignOut(auth());
        setUser(null);
      }
    } catch {
      await firebaseSignOut(auth());
      setUser(null);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const authInstance = auth();
      unsubscribe = onAuthStateChanged(authInstance, async (fbUser) => {
        try {
          if (fbUser) {
            await checkSessionExpiry(fbUser.uid);
            const stillLoggedIn = (await auth().currentUser) !== null;
            setUser(stillLoggedIn ? fbUser : null);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        } finally {
          setLoading(false);
        }
      });
    } catch {
      setUser(null);
      setLoading(false);
    }
    const loadingTimeout = setTimeout(() => setLoading(false), 8000);
    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe?.();
    };
  }, []);

  const setLastLogin = async () => {
    await AsyncStorage.setItem(LAST_LOGIN_KEY, String(Date.now()));
  };

  const login = async (phone: string, pin: string) => {
    setError(null);
    const email = phoneToEmail(phone);
    const password = pin.trim();
    if (password.length < 6) {
      setError("PIN: imibare 6 (6 digits)");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth(), email, password);
      await setLastLogin();
    } catch (e: unknown) {
      const message = e && typeof e === "object" && "code" in e
        ? (e as { code: string }).code === "auth/invalid-credential" || (e as { code: string }).code === "auth/user-not-found"
          ? "Nimero cyangwa PIN nibiwe. Gerageza."
          : "Byabuze. Gerageza."
        : "Byabuze. Gerageza.";
      setError(message);
      throw e;
    }
  };

  const register = async (phone: string, name: string, pin: string) => {
    setError(null);
    const email = phoneToEmail(phone);
    const password = pin.trim();
    if (password.length < 6) {
      setError("PIN: imibare 6 (6 digits)");
      return;
    }
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth(), email, password);
      if (name.trim()) {
        await updateProfile(newUser, { displayName: name.trim() });
      }
      await firebaseSignOut(auth());
    } catch (e: unknown) {
      const message = e && typeof e === "object" && "code" in e
        ? (e as { code: string }).code === "auth/email-already-in-use"
          ? "Nimero ya telefoni yarangiye kiyandikisha."
          : "Byabuze. Gerageza."
        : "Byabuze. Gerageza.";
      setError(message);
      throw e;
    }
  };

  const logout = async () => {
    setError(null);
    await AsyncStorage.removeItem(LAST_LOGIN_KEY);
    await firebaseSignOut(auth());
    setUser(null);
  };

  const requestPinReset = async (phone: string, newPin: string) => {
    setError(null);
    const pin = newPin.trim();
    if (pin.length < 6) {
      setError("PIN nshya: imibare 6 (6 digits).");
      return;
    }
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/auth/reset-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), newPin: pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Byabuze. Wongere kugerageza.");
      throw new Error(data.message || "Reset failed");
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    error,
    clearError,
    login,
    register,
    logout,
    requestPinReset,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
