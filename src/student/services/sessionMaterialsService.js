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
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../../firebase/config';

const MATERIALS_COLLECTION = 'session_materials';
const ATTENDANCE_COLLECTION = 'attendance';

export const MATERIAL_TYPES = ['lecture', 'skill', 'other'];
export const MAX_MATERIAL_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Normalise a material's group fields into a consistent array
const normaliseGroups = (material) => {
  if (Array.isArray(material.groups) && material.groups.length > 0) return material.groups;
  if (material.group) return [material.group];
  return [];
};

const sanitiseMaterialPayload = (materialData) => {
  const groups = Array.isArray(materialData.groups) ? materialData.groups : [];
  const materialType = MATERIAL_TYPES.includes(materialData.materialType)
    ? materialData.materialType
    : 'other';

  return {
    title: (materialData.title || '').trim(),
    description: (materialData.description || '').trim(),
    link: (materialData.link || '').trim(),
    groups,
    group: groups[0] || '',
    sessionDate: materialData.sessionDate || '',
    visibleToAttendanceOnly: Boolean(materialData.visibleToAttendanceOnly),
    materialType,
    imageUrl: materialData.imageUrl || '',
    imagePath: materialData.imagePath || '',
  };
};

export const validateMaterialImageFile = (file) => {
  if (!file) return { ok: false, error: 'noFile' };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { ok: false, error: 'invalidType' };
  if (file.size > MAX_MATERIAL_IMAGE_BYTES) return { ok: false, error: 'tooLarge' };
  return { ok: true };
};

/**
 * Upload a material cover image to Firebase Storage.
 * Returns a persistent download URL (not a local blob URL).
 */
export const uploadMaterialImage = (file, materialId, onProgress) =>
  new Promise((resolve, reject) => {
    const validation = validateMaterialImageFile(file);
    if (!validation.ok) {
      reject(new Error(validation.error));
      return;
    }
    if (!storage) {
      reject(new Error('storageUnavailable'));
      return;
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const safeId = materialId || `draft_${Date.now()}`;
    const path = `session_materials/${safeId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public,max-age=31536000',
    });

    task.on(
      'state_changed',
      (snapshot) => {
        if (typeof onProgress === 'function' && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (error) => reject(error),
      async () => {
        try {
          const imageUrl = await getDownloadURL(task.snapshot.ref);
          resolve({ imageUrl, imagePath: path });
        } catch (err) {
          reject(err);
        }
      }
    );
  });

export const deleteMaterialImageFile = async (imagePath) => {
  if (!imagePath) return;
  try {
    await deleteObject(ref(storage, imagePath));
  } catch (error) {
    // Ignore missing files so edits/deletes still succeed
    if (error?.code !== 'storage/object-not-found') {
      console.warn('[sessionMaterialsService] Failed to delete image:', error);
    }
  }
};

export const addSessionMaterial = async (materialData) => {
  const payload = sanitiseMaterialPayload(materialData);
  const docRef = await addDoc(collection(db, MATERIALS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...payload };
};

export const updateSessionMaterial = async (id, materialData) => {
  const payload = sanitiseMaterialPayload(materialData);
  const refDoc = doc(db, MATERIALS_COLLECTION, id);
  await updateDoc(refDoc, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
  return { id, ...payload };
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

export const deleteSessionMaterial = async (materialId, imagePath) => {
  if (imagePath) await deleteMaterialImageFile(imagePath);
  await deleteDoc(doc(db, MATERIALS_COLLECTION, materialId));
};

export { normaliseGroups };
