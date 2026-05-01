import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../utils/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword as updateFirebasePassword,
  onAuthStateChanged,
  User
} from 'firebase/auth';

interface AuthContextType {
  user: { id: string, email: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setNewPassword: (email: string, resetCode: string, newPassword: string) => Promise<void>;
  updatePassword: (currentPass: string, newPass: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  setNewPassword: async () => {},
  updatePassword: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string, email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({ id: firebaseUser.uid, email: firebaseUser.email || '' });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // cleanup on unmount
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) throw new Error('Email and password required');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    if (!email || !password) throw new Error('Email and password required');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!email) throw new Error('Email required');
    await sendPasswordResetEmail(auth, email);
  };

  const setNewPassword = async (email: string, resetCode: string, newPassword: string) => {
    // Firebase handles password resets via links in emails, so manual code verification isn't natively supported 
    // the same way. We throw an error if the UI calls this directly, as the link handles it.
    throw new Error('Please click the link in the reset email sent to you.');
  };

  const updatePassword = async (currentPass: string, newPass: string) => {
    if (!auth.currentUser) throw new Error('Not logged in');
    // Note: In real scenarios, you may need to re-authenticate the user first if their session is old.
    await updateFirebasePassword(auth.currentUser, newPass);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword, setNewPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
