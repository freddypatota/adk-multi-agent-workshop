import { createContext } from 'react';
import { User as FirebaseUser } from 'firebase/auth';

export type AuthUser = FirebaseUser;

export interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
