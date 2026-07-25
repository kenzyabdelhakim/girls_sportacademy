import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  QrCode,
  Users as UsersIcon,
  X,
  Loader2,
  Shield,
  Phone,
  Hash,
} from 'lucide-react';
import {
  getAllStudents,
  addStudent,
  updateStudent,
  deleteStudent,
} from '../services/studentService';
import QRCard from '../components/QRCard';
import toast from 'react-hot-toast';
import { useLang } from '../contexts/LanguageContext';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const GroupColors = ['#EC4899', '#F9A8D4', '#22C55E', '#F59E0B', '#ec4899', '#DB2777'];
const getGroupColor = (group) => GroupColors[Math.abs(group?.charCodeAt(0) || 0) % GroupColors.length];

const Students = () => {
  const { t } = useLang();
  const [students, setStudents] = useState([]);
  const groupOptions = useMemo(
    () => [...new Set(students.map((s) => s.group).filter(Boolean))].sort(),
    [students]
  );
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '', fullName: '', age: '', group: '', phone: '', email: '', password: '',
  });

  useEffect(() => { loadStudents(); }, []);

  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredStudents(students); return; }
    const lower = searchTerm.toLowerCase();
    setFilteredStudents(students.filter(s =>
      s.fullName.toLowerCase().includes(lower) ||
      s.studentId.toLowerCase().includes(lower) ||
      (s.group && s.group.toLowerCase().includes(lower))
    ));
  }, [searchTerm, students]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllStudents();
      setStudents(data);
      setFilteredStudents(data);
    } catch { toast.error(t('students.failedLoad')); }
    finally { setLoading(false); }
  };

  const openAddModal = () => {
    setFormData({ studentId: '', fullName: '', age: '', group: '', phone: '', email: '', password: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setFormData({
      studentId: student.studentId, fullName: student.fullName, age: student.age,
      group: student.group, phone: student.phone, email: student.email || '', password: '',
    });
    setSelectedStudent(student);
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setFormData({ studentId: '', fullName: '', age: '', group: '', phone: '', email: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.fullName || !formData.age || !formData.group) {
      toast.error(t('students.fillRequired'));
      return;
    }
    if (!isEditing && (!formData.email || !formData.password)) {
      toast.error(t('students.emailPwRequired'));
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateStudent(selectedStudent.id, {
          studentId: formData.studentId, fullName: formData.fullName,
          age: formData.age, group: formData.group, phone: formData.phone,
        });
        toast.success(t('students.updated'));
      } else {
        if (students.some(s => s.studentId === formData.studentId)) {
          toast.error(t('students.idExists')); setSubmitting(false); return;
        }
        await addStudent(formData);
        toast.success(t('students.created'));
      }
      closeModal();
      loadStudents();
    } catch (err) {
      toast.error(err.message || (isEditing ? t('students.failedUpdate') : t('students.failedAdd')));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(t('students.confirmDelete', { name: student.fullName }))) return;
    try {
      await deleteStudent(student.id);
      toast.success(t('students.deleted'));
      loadStudents();
    } catch { toast.error(t('students.failedDelete')); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t('students.title')}</h1>
          <p className="page-subtitle">{t('students.subtitle')}</p>
        </div>
        <motion.button
          onClick={openAddModal}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>{t('students.addAthlete')}</span>
        </motion.button>
      </motion.div>

      {/* Search + Count */}
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('students.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <UsersIcon size={16} style={{ color: '#EC4899' }} />
          <span className="text-sm font-semibold text-white">{filteredStudents.length}</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('students.countLabel')}</span>
        </div>
      </motion.div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <motion.div variants={cardVariants} className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-surface)' }}>
            <UsersIcon size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-white font-semibold mb-1">
            {searchTerm ? t('students.noneFound') : t('students.noneYet')}
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {searchTerm ? t('students.tryDifferent') : t('students.addFirstHint')}
          </p>
          {!searchTerm && (
            <button onClick={openAddModal} className="btn-primary">
              <Plus size={16} /> {t('students.addFirst')}
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredStudents.map((student) => {
            const groupColor = getGroupColor(student.group);
            return (
              <motion.div
                key={student.id}
                variants={cardVariants}
                whileHover={{ y: -3, borderColor: `${groupColor}30` }}
                className="glass-card p-5 cursor-default transition-all"
              >
                {/* Top: avatar + group badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black"
                      style={{ background: `linear-gradient(135deg, ${groupColor}cc, ${groupColor}66)`, color: '#fff' }}
                    >
                      {student.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{student.fullName}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {t('students.idLabel')} {student.studentId}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${groupColor}18`, color: groupColor, border: `1px solid ${groupColor}30` }}
                  >
                    {student.group}
                  </span>
                </div>

                {/* Info rows */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Hash size={12} />
                    <span>{t('students.ageLabel')} <span className="text-white font-medium">{student.age} {t('students.years')}</span></span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Phone size={12} />
                      <span className="text-white font-medium">{student.phone}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="divider my-3" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => { setSelectedStudent(student); setShowQRModal(true); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#22C55E', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <QrCode size={14} /> {t('students.qrCode')}
                  </motion.button>
                  <motion.button
                    onClick={() => openEditModal(student)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'rgba(219, 39, 119,0.1)', color: '#DB2777', border: '1px solid rgba(219, 39, 119,0.2)' }}
                  >
                    <Edit2 size={14} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(student)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add/Edit Modal */}
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
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="modal-bg relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {isEditing ? t('students.editAthlete') : t('students.addNewAthlete')}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {isEditing ? t('students.updateInfo') : t('students.createAccount')}
                    </p>
                  </div>
                  <button onClick={closeModal} className="btn-secondary w-9 h-9 p-0 rounded-xl">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">{t('students.studentId')}</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        placeholder={t('students.idPlaceholder')}
                        className="input-field"
                        disabled={isEditing}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">{t('students.fullName')}</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder={t('students.namePlaceholder')}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">{t('students.age')}</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder={t('students.agePlaceholder')}
                        className="input-field"
                        min="1" max="100"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">{t('students.groupTeam')}</label>
                      <input
                        type="text"
                        list="group-options"
                        value={formData.group}
                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                        placeholder={t('students.groupPlaceholder')}
                        className="input-field"
                        required
                      />
                      <datalist id="group-options">
                        {groupOptions.map((g) => <option key={g} value={g} />)}
                      </datalist>
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{t('students.groupHint')}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="label">{t('students.phoneNumber')}</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t('students.phonePlaceholder')}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {!isEditing && (
                    <>
                      <div className="divider" />
                      <div className="flex items-center gap-2 mb-3">
                        <Shield size={16} style={{ color: '#EC4899' }} />
                        <p className="text-sm font-bold text-white">{t('students.portalCreds')}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">{t('students.email')}</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={t('students.emailPlaceholder')}
                            className="input-field"
                            required={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="label">{t('students.password')}</label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={t('students.passwordPlaceholder')}
                            className="input-field"
                            minLength="6"
                            required={!isEditing}
                          />
                        </div>
                      </div>
                    </>
                  )}

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
                        <><Loader2 size={16} className="animate-spin" /> {isEditing ? t('students.updating') : t('students.creating')}</>
                      ) : (
                        <>{isEditing ? t('students.updateBtn') : t('students.createBtn')}</>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowQRModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-bg relative w-full max-w-sm rounded-2xl p-6"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-white">{t('students.qrModalTitle')}</h2>
                <button onClick={() => setShowQRModal(false)} className="btn-secondary w-8 h-8 p-0 rounded-xl">
                  <X size={14} />
                </button>
              </div>
              <QRCard student={selectedStudent} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Students;
