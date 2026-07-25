import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ATTENDANCE_COLLECTION = 'attendance';

/**
 * Get student's attendance records
 */
export const getStudentAttendance = async (studentId) => {
  try {
    console.log('Getting attendance for studentId:', studentId);
    
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId)
    );
    
    const querySnapshot = await getDocs(q);
    const attendance = [];
    
    querySnapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort in JavaScript instead of Firestore
    attendance.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.date);
      const dateB = b.createdAt?.toDate?.() || new Date(b.date);
      return dateB - dateA; // Descending order
    });
    
    console.log('Found attendance records:', attendance.length);
    return attendance;
  } catch (error) {
    console.error('Error getting student attendance:', error);
    // Return empty array instead of throwing to prevent dashboard crash
    return [];
  }
};

/**
 * Get student's attendance statistics
 */
export const getStudentAttendanceStats = async (studentId) => {
  try {
    const attendance = await getStudentAttendance(studentId);
    
    const totalSessions = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendancePercentage = totalSessions > 0 
      ? Math.round((presentCount / totalSessions) * 100) 
      : 0;
    
    // Get current month attendance
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthAttendance = attendance.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    return {
      totalSessions,
      presentCount,
      attendancePercentage,
      thisMonthCount: thisMonthAttendance.length,
      recentAttendance: attendance.slice(0, 5)
    };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    throw error;
  }
};

/**
 * Check if student attended a specific session date
 */
export const checkSessionAttendance = async (studentId, sessionDate) => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId),
      where('date', '==', sessionDate)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking session attendance:', error);
    return false;
  }
};
