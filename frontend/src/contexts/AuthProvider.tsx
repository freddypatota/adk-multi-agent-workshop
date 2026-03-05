import React from 'react';
import { AuthContext } from './AuthContext';

const anonymousUser = { uid: 'anonymous' };

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthContext.Provider value={{ user: anonymousUser, loading: false }}>
            {children}
        </AuthContext.Provider>
    );
}
