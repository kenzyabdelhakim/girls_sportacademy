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
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';

const MATERIALS_COLLECTION = 'session_materials';
const ATTENDANCE_COLLECTION = 'attendance';

export const MATERIAL_TYPES = ['lecture', 'skill', 'other'];
export const MAX_MATERIAL_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB input file
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Inline cover images are downscaled to fit comfortably inside a Firestore doc
// (1 MB limit) without needing Firebase Storage at all.
const MAX_IMAGE_DIMENSION = 960;
const INITIAL_JPEG_QUALITY = 0.8;
const MIN_JPEG_QUALITY = 0.3;
const MAX_DATAURL_CHARS = 900 * 1024;

/**
 * Public Google Drive thumbnail for a Drive file link, so video materials get
 * an automatic preview frame from the video itself. Returns '' for non-Drive links.
 */
export const driveThumbnailUrl = (link, width = 800) => {
  const m = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=)([\w-]{10,})/.exec(String(link || ''));
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${width}` : '';
};

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
 * Convert an image file into a downscaled JPEG data URL that is stored inline
 * on the material document. This keeps "add photo" working regardless of
 * Firebase Storage availability, and displays everywhere the material does.
 */
export const materialImageToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const validation = validateMaterialImageFile(file);
    if (!validation.ok) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('invalidType'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('invalidType'));
      img.onload = () => {
        try {
          const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);

          let quality = INITIAL_JPEG_QUALITY;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > MAX_DATAURL_CHARS && quality > MIN_JPEG_QUALITY) {
            quality -= 0.15;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          if (dataUrl.length > MAX_DATAURL_CHARS) {
            reject(new Error('tooLarge'));
            return;
          }
          resolve({ imageUrl: dataUrl, imagePath: '' });
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export const deleteMaterialImageFile = async (imagePath) => {
  // Covers are now stored inline on the document; only legacy Storage paths
  // (from older uploads) would need cleanup, so this is a safe no-op otherwise.
  if (!imagePath || imagePath.startsWith('data:')) return;
  try {
    await deleteObject(ref(storage, imagePath));
  } catch (error) {
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
