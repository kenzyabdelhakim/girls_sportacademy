import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  // Mirrors auth.currentUser.displayName. Kept in state because Firebase
  // mutates the user object in place, which never re-renders consumers.
  const [displayName, setDisplayName] = useState('');

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    // Block students from using the admin login form
    const studentDoc = await getDoc(doc(db, 'students', credential.user.uid));
    if (studentDoc.exists()) {
      await signOut(auth);
      throw new Error('student_account');
    }
    setCurrentUser(credential.user);
    setIsAdmin(true);
    setDisplayName(credential.user.displayName || '');
    return credential;
  };

  const logout = async () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setDisplayName('');
    return signOut(auth);
  };

  // Persists the admin's chosen name on their Firebase Auth profile, so it
  // follows them across devices without needing a Firestore collection.
  const updateDisplayName = async (name) => {
    const user = auth?.currentUser;
    if (!user) throw new Error('not_signed_in');
    const trimmed = name.trim();
    await updateProfile(user, { displayName: trimmed });
    setDisplayName(trimmed);
  };

  useEffect(() => {
    if (!auth) { setLoading(false); return; }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsAdmin(false);
        setDisplayName('');
        setLoading(false);
        return;
      }

      try {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          // This is a student — don't sign them out, just don't grant admin access.
          // The StudentAuthContext handles student sessions independently.
          setCurrentUser(null);
          setIsAdmin(false);
          setDisplayName('');
        } else {
          setCurrentUser(user);
          setIsAdmin(true);
          setDisplayName(user.displayName || '');
        }
      } catch {
        // Firestore error — give benefit of doubt, treat as admin
        setCurrentUser(user);
        setIsAdmin(true);
        setDisplayName(user.displayName || '');
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, login, logout, loading, displayName, updateDisplayName }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
