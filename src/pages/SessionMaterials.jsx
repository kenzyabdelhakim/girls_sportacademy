import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  ExternalLink,
  Trash2,
  Calendar,
  Users,
  X,
  Loader2,
  Lock,
  Globe,
  Edit2,
  Check,
  Replace,
  Upload,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  getAllSessionMaterials,
  addSessionMaterial,
  updateSessionMaterial,
  deleteSessionMaterial,
  normaliseGroups,
  uploadMaterialImage,
  deleteMaterialImageFile,
  validateMaterialImageFile,
  MAX_MATERIAL_IMAGE_BYTES,
} from '../student/services/sessionMaterialsService';
import { getAllStudents } from '../services/studentService';
import MaterialCover from '../components/MaterialCover';
import toast from 'react-hot-toast';
import { useLang } from '../contexts/LanguageContext';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  link: '',
  groups: [],
  sessionDate: '',
  visibleToAttendanceOnly: true,
  materialType: 'lecture',
  imageUrl: '',
  imagePath: '',
};

const TYPE_ICONS = {
  lecture: BookOpen,
  skill: Award,
  other: Sparkles,
};

const SessionMaterials = () => {
  const { t } = useLang();
  const fileInputRef = useRef(null);
  const [materials, setMaterials] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState('');

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matData, stuData] = await Promise.all([getAllSessionMaterials(), getAllStudents()]);
      setMaterials(matData);
      setGroups([...new Set(stuData.map(s => s.group))].filter(Boolean).sort());
    } catch {
      toast.error(t('materials.failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  const resetImageState = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(false);
    setUploadProgress(0);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddModal = () => {
    setEditingMaterial(null);
    setFormData({ ...EMPTY_FORM, groups: [] });
    resetImageState();
    setShowModal(true);
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title || '',
      description: material.description || '',
      link: material.link || '',
      groups: normaliseGroups(material),
      sessionDate: material.sessionDate || '',
      visibleToAttendanceOnly: material.visibleToAttendanceOnly ?? true,
      materialType: material.materialType || 'other',
      imageUrl: material.imageUrl || '',
      imagePath: material.imagePath || '',
    });
    resetImageState();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMaterial(null);
    setFormData(EMPTY_FORM);
    resetImageState();
  };

  const toggleGroup = (group) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.includes(group)
        ? prev.groups.filter(g => g !== group)
        : [...prev.groups, group],
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMaterialImageFile(file);
    if (!validation.ok) {
      const msg =
        validation.error === 'tooLarge'
          ? t('materials.imageTooLarge', { mb: Math.round(MAX_MATERIAL_IMAGE_BYTES / (1024 * 1024)) })
          : t('materials.imageInvalidType');
      setImageError(msg);
      toast.error(msg);
      e.target.value = '';
      return;
    }

    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(previewUrl);
    setRemoveExistingImage(false);
    setImageError('');
    setUploadProgress(0);
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(true);
    setImageError('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const previewSrc = imagePreview || (!removeExistingImage ? formData.imageUrl : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.link.trim() || !formData.sessionDate) {
      toast.error(t('materials.titleRequired')); return;
    }
    if (formData.groups.length === 0) {
      toast.error(t('materials.selectOne')); return;
    }
    setSubmitting(true);
    setUploadProgress(0);

    let uploadedPath = null;
    try {
      let imageUrl = removeExistingImage ? '' : (formData.imageUrl || '');
      let imagePath = removeExistingImage ? '' : (formData.imagePath || '');
      const previousPath = editingMaterial?.imagePath || formData.imagePath || '';

      if (imageFile) {
        const uploaded = await uploadMaterialImage(
          imageFile,
          editingMaterial?.id,
          setUploadProgress
        );
        imageUrl = uploaded.imageUrl;
        imagePath = uploaded.imagePath;
        uploadedPath = uploaded.imagePath;
      }

      const payload = {
        ...formData,
        imageUrl,
        imagePath,
      };

      if (editingMaterial) {
        await updateSessionMaterial(editingMaterial.id, payload);
        if ((imageFile || removeExistingImage) && previousPath && previousPath !== imagePath) {
          await deleteMaterialImageFile(previousPath);
        }
        toast.success(t('materials.updated'));
      } else {
        await addSessionMaterial(payload);
        toast.success(t('materials.added'));
      }
      closeModal();
      loadData();
    } catch (err) {
      if (uploadedPath) await deleteMaterialImageFile(uploadedPath);
      const code = err?.code || err?.message;
      if (code === 'tooLarge') {
        toast.error(t('materials.imageTooLarge', { mb: 5 }));
      } else if (code === 'invalidType') {
        toast.error(t('materials.imageInvalidType'));
      } else if (
        code === 'storageUnavailable' ||
        code === 'storage/unauthorized' ||
        code === 'storage/retry-limit-exceeded' ||
        code === 'storage/unknown'
      ) {
        toast.error(t('materials.imageUploadFailed'));
      } else {
        toast.error(editingMaterial ? t('materials.failedUpdate') : t('materials.failedAdd'));
      }
      console.error('[SessionMaterials] save failed:', err);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (material) => {
    if (!window.confirm(t('materials.confirmDelete', { title: material.title }))) return;
    try {
      await deleteSessionMaterial(material.id, material.imagePath);
      toast.success(t('materials.deleted'));
      loadData();
    } catch {
      toast.error(t('materials.failedDelete'));
    }
  };

  const typeLabel = (type) => {
    if (type === 'lecture') return t('materials.typeLecture');
    if (type === 'skill') return t('materials.typeSkill');
    return t('materials.typeOther');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={cardVariants} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t('materials.title')}</h1>
          <p className="page-subtitle">{t('materials.subtitle')}</p>
        </div>
        <motion.button onClick={openAddModal} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary">
          <Plus size={16} /> {t('materials.addMaterial')}
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={cardVariants} className="grid grid-cols-3 gap-4">
        {[
          { label: t('materials.totalMaterials'), value: materials.length, color: '#DB2777', icon: BookOpen },
          { label: t('materials.groups'), value: groups.length, color: '#EC4899', icon: Users },
          { label: t('materials.restricted'), value: materials.filter(m => m.visibleToAttendanceOnly).length, color: '#F59E0B', icon: Lock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Materials Grid */}
      {materials.length === 0 ? (
        <motion.div variants={cardVariants} className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-surface)' }}>
            <BookOpen size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{t('materials.noneYet')}</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{t('materials.noneHint')}</p>
          <button onClick={openAddModal} className="btn-primary"><Plus size={16} /> {t('materials.addFirst')}</button>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => {
            const materialGroups = normaliseGroups(material);
            const TypeIcon = TYPE_ICONS[material.materialType] || Sparkles;
            return (
              <motion.div
                key={material.id}
                variants={cardVariants}
                whileHover={{ y: -3 }}
                className="glass-card overflow-hidden transition-all flex flex-col h-full"
              >
                <div className="p-3 pb-0">
                  <MaterialCover
                    imageUrl={material.imageUrl}
                    materialType={material.materialType || 'other'}
                    alt={material.title}
                    showUploadHint={!material.imageUrl}
                    uploadHintLabel={t('materials.addImage')}
                    onUploadClick={() => openEditModal(material)}
                  />
                </div>

                <div className="p-5 pt-3 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: 'rgba(219, 39, 119,0.1)', color: '#DB2777' }}
                      >
                        <TypeIcon size={10} />
                        {typeLabel(material.materialType || 'other')}
                      </span>
                      {material.visibleToAttendanceOnly
                        ? <span className="badge-red"><Lock size={10} /> {t('materials.restrictedBadge')}</span>
                        : <span className="badge-green"><Globe size={10} /> {t('materials.publicBadge')}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <motion.button
                        onClick={() => openEditModal(material)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(236, 72, 153,0.1)', color: '#EC4899' }}
                        title={t('common.edit')}
                      >
                        <Edit2 size={13} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(material)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                        title={t('common.delete')}
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </div>

                  <h3 className="font-bold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {material.title}
                  </h3>

                  <p className="text-sm mb-3 line-clamp-2 min-h-[2.5rem]" style={{ color: 'var(--text-muted)' }}>
                    {material.description || '\u00A0'}
                  </p>

                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      <span>{material.sessionDate}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <Users size={12} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                      <div className="flex flex-wrap gap-1">
                        {materialGroups.length > 0
                          ? materialGroups.map(g => (
                              <span
                                key={g}
                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{ background: 'rgba(236, 72, 153,0.1)', color: '#EC4899' }}
                              >
                                {g}
                              </span>
                            ))
                          : <span style={{ color: 'var(--text-muted)' }}>{t('materials.noGroup')}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="divider mt-4 mb-3" />

                  <a
                    href={material.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(219, 39, 119,0.12)', color: '#DB2777', border: '1px solid rgba(219, 39, 119,0.2)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(219, 39, 119,0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(219, 39, 119,0.12)'; }}
                  >
                    <ExternalLink size={14} /> {t('materials.openLink')}
                  </a>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="modal-bg relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                      {editingMaterial ? t('materials.editMaterial') : t('materials.addSession')}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {editingMaterial ? t('materials.updateDetails') : t('materials.uploadResource')}
                    </p>
                  </div>
                  <button onClick={closeModal} className="btn-secondary w-9 h-9 p-0 rounded-xl flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="label">{t('materials.formTitle')}</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={t('materials.titlePlaceholder')}
                      className="input-field"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">{t('materials.description')}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('materials.descPlaceholder')}
                      className="input-field"
                      rows="3"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Material Type */}
                  <div>
                    <label className="label">{t('materials.materialType')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'lecture', label: t('materials.typeLecture'), Icon: BookOpen },
                        { value: 'skill', label: t('materials.typeSkill'), Icon: Award },
                        { value: 'other', label: t('materials.typeOther'), Icon: Sparkles },
                      ].map(({ value, label, Icon }) => {
                        const selected = formData.materialType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFormData({ ...formData, materialType: value })}
                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all"
                            style={{
                              background: selected ? 'rgba(219, 39, 119,0.12)' : 'var(--bg-surface)',
                              color: selected ? '#DB2777' : 'var(--text-muted)',
                              border: `1.5px solid ${selected ? '#DB2777' : 'var(--border)'}`,
                            }}
                          >
                            <Icon size={16} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Material Image */}
                  <div>
                    <label className="label">{t('materials.materialImage')}</label>
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <div className="p-3">
                        {previewSrc ? (
                          <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16 / 9' }}>
                            <img
                              src={previewSrc}
                              alt={t('materials.imagePreview')}
                              className="absolute inset-0 w-full h-full"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <MaterialCover
                            materialType={formData.materialType}
                            showUploadHint
                            uploadHintLabel={t('materials.addImage')}
                            onUploadClick={() => fileInputRef.current?.click()}
                          />
                        )}
                      </div>

                      <div
                        className="flex flex-wrap items-center gap-2 px-3 py-3"
                        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-secondary text-xs py-2 px-3"
                          disabled={submitting}
                        >
                          {previewSrc
                            ? <><Replace size={13} /> {t('materials.replaceImage')}</>
                            : <><Upload size={13} /> {t('materials.uploadImage')}</>}
                        </button>
                        {previewSrc && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="text-xs font-semibold py-2 px-3 rounded-xl transition-all"
                            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
                            disabled={submitting}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Trash2 size={13} /> {t('materials.removeImage')}
                            </span>
                          </button>
                        )}
                        <p className="text-[11px] w-full" style={{ color: 'var(--text-muted)' }}>
                          {t('materials.imageHint')}
                        </p>
                        {imageError && (
                          <p className="text-xs w-full" style={{ color: '#ef4444' }}>{imageError}</p>
                        )}
                        {submitting && imageFile && uploadProgress > 0 && (
                          <div className="w-full space-y-1">
                            <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              <span className="inline-flex items-center gap-1">
                                <Loader2 size={11} className="animate-spin" />
                                {t('materials.uploadingImage')}
                              </span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(219,39,119,0.12)' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${uploadProgress}%`, background: '#DB2777' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Link */}
                  <div>
                    <label className="label">{t('materials.linkUrl')}</label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder={t('materials.linkPlaceholder')}
                      className="input-field"
                    />
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      {t('materials.linkHint')}
                    </p>
                  </div>

                  {/* Session Date */}
                  <div>
                    <label className="label">{t('materials.sessionDate')}</label>
                    <input
                      type="date"
                      value={formData.sessionDate}
                      onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  {/* Multi-Group Selection */}
                  <div>
                    <label className="label">
                      {t('materials.groupsTeams')}
                      {formData.groups.length > 0 && (
                        <span className="ml-2 font-normal" style={{ color: '#DB2777' }}>
                          {t('materials.selectedCount', { n: formData.groups.length })}
                        </span>
                      )}
                    </label>
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      {groups.length === 0 ? (
                        <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {t('materials.noGroupsFound')}
                        </p>
                      ) : (
                        groups.map(group => {
                          const selected = formData.groups.includes(group);
                          return (
                            <label
                              key={group}
                              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none"
                              style={{
                                background: selected ? 'rgba(219, 39, 119,0.08)' : 'var(--bg-surface)',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <div
                                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                  background: selected ? '#DB2777' : 'transparent',
                                  border: `1.5px solid ${selected ? '#DB2777' : 'var(--border-hover)'}`,
                                }}
                              >
                                {selected && <Check size={10} style={{ color: '#fff' }} />}
                              </div>
                              <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                                {group}
                              </span>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={selected}
                                onChange={() => toggleGroup(group)}
                              />
                            </label>
                          );
                        })
                      )}
                    </div>
                    {formData.groups.length === 0 && groups.length > 0 && (
                      <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>
                        {t('materials.selectOne')}
                      </p>
                    )}
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="label">{t('materials.visibility')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          restricted: false,
                          label: t('materials.publicBadge'),
                          hint: t('materials.publicHint'),
                          Icon: Globe,
                          color: '#10B981',
                        },
                        {
                          restricted: true,
                          label: t('materials.restrictedBadge'),
                          hint: t('materials.restrictHint'),
                          Icon: Lock,
                          color: '#ef4444',
                        },
                      ].map(({ restricted, label, hint, Icon, color }) => {
                        const selected = formData.visibleToAttendanceOnly === restricted;
                        return (
                          <button
                            key={String(restricted)}
                            type="button"
                            onClick={() => setFormData({ ...formData, visibleToAttendanceOnly: restricted })}
                            className="text-left p-3 rounded-xl transition-all"
                            style={{
                              background: selected ? `${color}10` : 'var(--bg-surface)',
                              border: `1.5px solid ${selected ? `${color}55` : 'var(--border)'}`,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon size={14} style={{ color }} />
                              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {label}
                              </span>
                            </div>
                            <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                              {hint}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="flex-1 btn-secondary" disabled={submitting}>
                      {t('common.cancel')}
                    </button>
                    <motion.button
                      type="submit"
                      className="flex-1 btn-primary"
                      disabled={submitting}
                      whileHover={{ scale: submitting ? 1 : 1.02 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                    >
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" /> {editingMaterial ? t('materials.saving') : t('materials.adding')}</>
                      ) : (
                        <>{editingMaterial ? <><Edit2 size={16} /> {t('materials.saveChanges')}</> : <><Plus size={16} /> {t('materials.addMaterial')}</>}</>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SessionMaterials;
