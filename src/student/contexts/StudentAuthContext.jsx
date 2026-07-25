import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

const StudentAuthContext = createContext();

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  return context;
};

export const StudentAuthProvider = ({ children }) => {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    const studentDoc = await getDoc(doc(db, 'students', uid));
    if (!studentDoc.exists()) {
      // Not a student account — could be an admin trying the student portal
      await signOut(auth);
      throw new Error('not_student');
    }

    const data = { id: studentDoc.id, ...studentDoc.data() };
    if (!data.studentId) data.studentId = studentDoc.id;

    setCurrentStudent(credential.user);
    setStudentData(data);
    return credential;
  };

  const logout = async () => {
    setCurrentStudent(null);
    setStudentData(null);
    return signOut(auth);
  };

  useEffect(() => {
    if (!auth) { setLoading(false); return; }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentStudent(null);
        setStudentData(null);
        setLoading(false);
        return;
      }

      try {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          const data = { id: studentDoc.id, ...studentDoc.data() };
          if (!data.studentId) data.studentId = studentDoc.id;
          setCurrentStudent(user);
          setStudentData(data);
        } else {
          // Admin logged in — not a student, don't set student state
          setCurrentStudent(null);
          setStudentData(null);
        }
      } catch {
        setCurrentStudent(null);
        setStudentData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <StudentAuthContext.Provider value={{ currentStudent, studentData, login, logout, loading }}>
      {!loading && children}
    </StudentAuthContext.Provider>
  );
};
