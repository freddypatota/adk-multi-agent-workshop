import { createContext } from 'react';

export interface AuthContextType {
    user: { uid: string } | null;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
