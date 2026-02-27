import React, { useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { AuthContext, AuthUser } from './AuthContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                setUser(firebaseUser);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, []);

    const loginWithGoogle = async () => {
        setError(null);
        if (!auth) {
            setError("Firebase is not configured.");
            return;
        }
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Login failed:", err);
            setError("Login failed. Please try again.");
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        setError(null);
        if (!auth) {
            setError("Firebase is not configured.");
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error("Login failed:", err);
            setError("Invalid email or password.");
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            if (auth) {
                await firebaseSignOut(auth);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            loginWithGoogle,
            loginWithEmail,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}
