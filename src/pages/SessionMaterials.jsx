import React, { useState, useEffect } from 'react';
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
  FileText,
  Edit2,
  Check,
} from 'lucide-react';
import {
  getAllSessionMaterials,
  addSessionMaterial,
  updateSessionMaterial,
  deleteSessionMaterial,
  normaliseGroups,
} from '../student/services/sessionMaterialsService';
import { getAllStudents } from '../services/studentService';
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
};

const SessionMaterials = () => {
  const { t } = useLang();
  const [materials, setMaterials] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => { loadData(); }, []);

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

  const openAddModal = () => {
    setEditingMaterial(null);
    setFormData({ ...EMPTY_FORM, groups: [] });
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
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMaterial(null);
    setFormData(EMPTY_FORM);
  };

  const toggleGroup = (group) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.includes(group)
        ? prev.groups.filter(g => g !== group)
        : [...prev.groups, group],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.link.trim() || !formData.sessionDate) {
      toast.error(t('materials.titleRequired')); return;
    }
    if (formData.groups.length === 0) {
      toast.error(t('materials.selectOne')); return;
    }
    setSubmitting(true);
    try {
      if (editingMaterial) {
        await updateSessionMaterial(editingMaterial.id, formData);
        toast.success(t('materials.updated'));
      } else {
        await addSessionMaterial(formData);
        toast.success(t('materials.added'));
      }
      closeModal();
      loadData();
    } catch {
      toast.error(editingMaterial ? t('materials.failedUpdate') : t('materials.failedAdd'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (material) => {
    if (!window.confirm(t('materials.confirmDelete', { title: material.title }))) return;
    try {
      await deleteSessionMaterial(material.id);
      toast.success(t('materials.deleted'));
      loadData();
    } catch {
      toast.error(t('materials.failedDelete'));
    }
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
            return (
              <motion.div
                key={material.id}
                variants={cardVariants}
                whileHover={{ y: -3 }}
                className="glass-card p-5 transition-all flex flex-col"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(219, 39, 119,0.15)' }}>
                    <FileText size={20} style={{ color: '#DB2777' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    {material.visibleToAttendanceOnly
                      ? <span className="badge-red"><Lock size={10} /> {t('materials.restrictedBadge')}</span>
                      : <span className="badge-green"><Globe size={10} /> {t('materials.publicBadge')}</span>}
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

                <h3 className="font-bold mb-2 line-clamp-2 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                  {material.title}
                </h3>
                {material.description && (
                  <p className="text-sm mb-3 line-clamp-2 flex-1" style={{ color: 'var(--text-muted)' }}>
                    {material.description}
                  </p>
                )}

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
                {/* Modal Header */}
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
                              {/* Custom checkbox */}
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

                  {/* Attendance Restriction Toggle */}
                  <div
                    className="flex items-start gap-3 p-4 rounded-xl cursor-pointer"
                    style={{
                      background: formData.visibleToAttendanceOnly ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                      border: `1px solid ${formData.visibleToAttendanceOnly ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
                    }}
                    onClick={() => setFormData({ ...formData, visibleToAttendanceOnly: !formData.visibleToAttendanceOnly })}
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                      style={{
                        background: formData.visibleToAttendanceOnly ? '#ef4444' : 'transparent',
                        border: formData.visibleToAttendanceOnly ? '1px solid #ef4444' : '1px solid var(--border-hover)',
                      }}
                    >
                      {formData.visibleToAttendanceOnly && <Check size={11} style={{ color: '#fff' }} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {t('materials.restrictToAttendees')}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {t('materials.restrictHint')}
                      </p>
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
