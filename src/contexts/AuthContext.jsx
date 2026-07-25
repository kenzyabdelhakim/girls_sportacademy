import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
    return credential;
  };

  const logout = async () => {
    setCurrentUser(null);
    setIsAdmin(false);
    return signOut(auth);
  };

  useEffect(() => {
    if (!auth) { setLoading(false); return; }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsAdmin(false);
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
        } else {
          setCurrentUser(user);
          setIsAdmin(true);
        }
      } catch {
        // Firestore error — give benefit of doubt, treat as admin
        setCurrentUser(user);
        setIsAdmin(true);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
