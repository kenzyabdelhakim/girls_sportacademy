import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const MATERIALS_COLLECTION = 'session_materials';
const ATTENDANCE_COLLECTION = 'attendance';

// Normalise a material's group fields into a consistent array
const normaliseGroups = (material) => {
  if (Array.isArray(material.groups) && material.groups.length > 0) return material.groups;
  if (material.group) return [material.group];
  return [];
};

export const addSessionMaterial = async (materialData) => {
  const groups = Array.isArray(materialData.groups) ? materialData.groups : [];
  const docRef = await addDoc(collection(db, MATERIALS_COLLECTION), {
    ...materialData,
    groups,
    group: groups[0] || '', // keep for backward-compat with old student queries
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...materialData, groups };
};

export const updateSessionMaterial = async (id, materialData) => {
  const groups = Array.isArray(materialData.groups) ? materialData.groups : [];
  const ref = doc(db, MATERIALS_COLLECTION, id);
  await updateDoc(ref, {
    ...materialData,
    groups,
    group: groups[0] || '',
    updatedAt: serverTimestamp(),
  });
  return { id, ...materialData, groups };
};

export const getAllSessionMaterials = async () => {
  const snapshot = await getDocs(collection(db, MATERIALS_COLLECTION));
  const materials = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  materials.sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
  return materials;
};

/**
 * Get session materials for a student.
 * Handles both old format (group: string) and new format (groups: string[]).
 * Fetches all attendance dates in one query, resolves access in memory.
 */
export const getStudentSessionMaterials = async (studentId, studentGroup) => {
  if (!studentId || !studentGroup) return [];

  try {
    // Query both storage formats in parallel
    const [newSnap, oldSnap] = await Promise.all([
      getDocs(query(collection(db, MATERIALS_COLLECTION), where('groups', 'array-contains', studentGroup))),
      getDocs(query(collection(db, MATERIALS_COLLECTION), where('group', '==', studentGroup))),
    ]);

    // Merge and deduplicate by document ID
    const seen = new Set();
    const allMaterials = [];
    for (const snap of [newSnap, oldSnap]) {
      for (const d of snap.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          allMaterials.push({ id: d.id, ...d.data() });
        }
      }
    }
    allMaterials.sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));

    if (allMaterials.length === 0) return [];

    // Fetch all attendance for this student in one query
    const attSnap = await getDocs(
      query(collection(db, ATTENDANCE_COLLECTION), where('studentId', '==', studentId))
    );
    const attendedDates = new Set(
      attSnap.docs.map(d => {
        const data = d.data();
        if (data.date) return String(data.date).slice(0, 10);
        if (data.createdAt?.toDate) return data.createdAt.toDate().toISOString().slice(0, 10);
        return null;
      }).filter(Boolean)
    );

    return allMaterials.map(material => {
      if (!material.visibleToAttendanceOnly) return { ...material, hasAccess: true };
      const attended = attendedDates.has(String(material.sessionDate).slice(0, 10));
      return { ...material, hasAccess: attended };
    });
  } catch (error) {
    console.error('[sessionMaterialsService] getStudentSessionMaterials failed:', error);
    return [];
  }
};

export const deleteSessionMaterial = async (materialId) => {
  await deleteDoc(doc(db, MATERIALS_COLLECTION, materialId));
};

export { normaliseGroups };
