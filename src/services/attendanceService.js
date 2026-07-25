import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';

const ATTENDANCE_COLLECTION = 'attendance';

export const markAttendance = async (studentData) => {
  const alreadyMarked = await checkAttendanceToday(studentData.studentId);
  if (alreadyMarked) throw new Error('Attendance already marked for today');

  const attendanceData = {
    studentId: studentData.studentId,
    studentName: studentData.fullName,
    group: studentData.group || 'N/A',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm:ss'),
    status: 'present',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), attendanceData);
  return { id: docRef.id, ...attendanceData };
};

export const checkAttendanceToday = async (studentId) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('studentId', '==', studentId),
    where('date', '==', today)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

// Sort in JS to avoid composite index requirement
const sortByCreatedAt = (records) =>
  records.sort((a, b) => {
    const ta = a.createdAt?.toDate?.() || new Date(a.date + 'T' + (a.time || '00:00:00'));
    const tb = b.createdAt?.toDate?.() || new Date(b.date + 'T' + (b.time || '00:00:00'));
    return tb - ta;
  });

export const getAllAttendance = async () => {
  const snap = await getDocs(collection(db, ATTENDANCE_COLLECTION));
  const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return sortByCreatedAt(records);
};

export const getTodayAttendance = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  // Simple where-only query — no composite index needed
  const q = query(collection(db, ATTENDANCE_COLLECTION), where('date', '==', today));
  const snap = await getDocs(q);
  const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return sortByCreatedAt(records);
};

export const getAttendanceByDate = async (date) => {
  const formattedDate = format(new Date(date), 'yyyy-MM-dd');
  const q = query(collection(db, ATTENDANCE_COLLECTION), where('date', '==', formattedDate));
  const snap = await getDocs(q);
  const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return sortByCreatedAt(records);
};

export const getAttendanceByGroup = async (group) => {
  const q = query(collection(db, ATTENDANCE_COLLECTION), where('group', '==', group));
  const snap = await getDocs(q);
  const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return sortByCreatedAt(records);
};

export const getStudentAttendance = async (studentId) => {
  const q = query(collection(db, ATTENDANCE_COLLECTION), where('studentId', '==', studentId));
  const snap = await getDocs(q);
  const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return sortByCreatedAt(records);
};

export const getAttendanceStats = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [todaySnap, allSnap] = await Promise.all([
    getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('date', '==', today))),
    getDocs(collection(db, ATTENDANCE_COLLECTION)),
  ]);
  return { todayCount: todaySnap.size, totalCount: allSnap.size };
};
