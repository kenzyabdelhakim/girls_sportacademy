import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, getSecondaryAuth } from '../firebase/config';

const STUDENTS_COLLECTION = 'students';

/**
 * Add a new student with automatic Firebase Authentication account creation
 */
export const addStudent = async (studentData) => {
  try {
    // Validate email and password
    if (!studentData.email || !studentData.password) {
      throw new Error('Email and password are required for student account');
    }

    // Create Firebase Authentication account on a secondary auth instance so
    // the admin's own session isn't replaced by the newly created student.
    const secondaryAuth = getSecondaryAuth();
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      studentData.email,
      studentData.password
    );

    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);

    // Create student document in Firestore with the Auth UID as document ID
    const studentDoc = {
      studentId: studentData.studentId,
      fullName: studentData.fullName,
      age: studentData.age,
      group: studentData.group,
      phone: studentData.phone || '',
      email: studentData.email,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, STUDENTS_COLLECTION, uid), studentDoc);

    return { id: uid, ...studentDoc };
  } catch (error) {
    console.error('Error adding student:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    }
    
    throw error;
  }
};

/**
 * Get all students from Firestore
 */
export const getAllStudents = async () => {
  try {
    const q = query(collection(db, STUDENTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
    return students;
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
};

/**
 * Get a single student by ID
 */
export const getStudentById = async (studentId) => {
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, studentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Student not found');
    }
  } catch (error) {
    console.error('Error getting student:', error);
    throw error;
  }
};

/**
 * Update student information
 */
export const updateStudent = async (studentId, studentData) => {
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, studentId);
    await updateDoc(docRef, studentData);
    return { id: studentId, ...studentData };
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

/**
 * Delete a student
 */
export const deleteStudent = async (studentId) => {
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, studentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

/**
 * Search students by name or student ID
 */
export const searchStudents = async (searchTerm) => {
  try {
    const allStudents = await getAllStudents();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allStudents.filter(student => 
      student.fullName.toLowerCase().includes(lowerSearchTerm) ||
      student.studentId.toLowerCase().includes(lowerSearchTerm) ||
      (student.group && student.group.toLowerCase().includes(lowerSearchTerm))
    );
  } catch (error) {
    console.error('Error searching students:', error);
    throw error;
  }
};
