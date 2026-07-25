import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { getStudentSessionMaterials } from '../services/sessionMaterialsService';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ExternalLink,
  Calendar,
  Lock,
  CheckCircle,
  Search,
  FileText,
  Users,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../../contexts/LanguageContext';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const StudentMaterials = () => {
  const { studentData } = useStudentAuth();
  const { t } = useLang();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Derived — no separate state needed, avoids timing gap between materials and filteredMaterials
  const filteredMaterials = searchTerm.trim()
    ? materials.filter(m => {
        const s = searchTerm.toLowerCase();
        return (
          m.title?.toLowerCase().includes(s) ||
          m.description?.toLowerCase().includes(s) ||
          m.sessionDate?.toLowerCase().includes(s)
        );
      })
    : materials;

  useEffect(() => {
    if (studentData) loadMaterials();
  }, [studentData]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await getStudentSessionMaterials(studentData.studentId, studentData.group);
      setMaterials(data);
    } catch {
      toast.error(t('student.failedLoadMat'));
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const openMaterial = (material) => {
    if (!material.hasAccess) {
      toast.error(t('student.attendToUnlockToast'));
      return;
    }
    window.open(material.link, '_blank', 'noopener,noreferrer');
  };

  const accessible = materials.filter(m => m.hasAccess).length;

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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('student.matTitle')}</h1>
          <p className="page-subtitle">{t('student.matSubtitle')}</p>
        </div>
        <motion.button
          onClick={loadMaterials}
          whileTap={{ scale: 0.95 }}
          className="btn-secondary flex-shrink-0"
          title={t('student.refreshMaterials')}
        >
          <RefreshCw size={15} />
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={cardVariants} className="grid grid-cols-3 gap-4">
        {[
          { label: t('student.totalMaterials'), value: materials.length, icon: BookOpen, color: '#DB2777' },
          { label: t('student.accessible'), value: accessible, icon: CheckCircle, color: '#22C55E' },
          { label: t('student.yourGroup'), value: studentData?.group || '—', icon: Users, color: '#EC4899' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <h3 className="text-2xl font-black truncate" style={{ color: 'var(--text-primary)' }}>{value}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div variants={cardVariants}>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('student.matSearchPh')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </motion.div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <motion.div variants={cardVariants} className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-surface)' }}>
            <BookOpen size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{t('student.noneAvailable')}</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {searchTerm
              ? t('student.tryAdjustSearch')
              : t('student.matWillAppear')}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <motion.div
              key={material.id}
              variants={cardVariants}
              whileHover={material.hasAccess ? { y: -3 } : {}}
              className="glass-card p-5 flex flex-col transition-all"
              style={{ opacity: material.hasAccess ? 1 : 0.6 }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: material.hasAccess
                      ? 'rgba(219, 39, 119,0.15)'
                      : 'var(--bg-surface)',
                  }}
                >
                  {material.hasAccess
                    ? <FileText size={20} style={{ color: '#DB2777' }} />
                    : <Lock size={20} style={{ color: 'var(--text-muted)' }} />}
                </div>
                {material.hasAccess
                  ? <span className="badge-green"><CheckCircle size={10} /> {t('student.unlocked')}</span>
                  : <span className="badge-red"><Lock size={10} /> {t('student.locked')}</span>}
              </div>

              <h3 className="font-bold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                {material.title}
              </h3>
              {material.description && (
                <p className="text-sm mb-3 line-clamp-2 flex-1" style={{ color: 'var(--text-muted)' }}>
                  {material.description}
                </p>
              )}

              <div className="mt-auto mb-4">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={12} />
                  <span>{material.sessionDate}</span>
                </div>
              </div>

              <motion.button
                onClick={() => openMaterial(material)}
                whileHover={{ scale: material.hasAccess ? 1.02 : 1 }}
                whileTap={{ scale: material.hasAccess ? 0.98 : 1 }}
                disabled={!material.hasAccess}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={material.hasAccess ? {
                  background: 'linear-gradient(135deg, rgba(236, 72, 153,0.15), rgba(244, 114, 182,0.15))',
                  color: '#DB2777',
                  border: '1px solid rgba(219, 39, 119,0.3)',
                } : {
                  background: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  cursor: 'not-allowed',
                }}
              >
                {material.hasAccess
                  ? <><ExternalLink size={15} /> {t('student.openMaterial')}</>
                  : <><Lock size={15} /> {t('student.attendToUnlock')}</>}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Info */}
      <motion.div
        variants={cardVariants}
        className="p-5 rounded-2xl"
        style={{ background: 'rgba(249, 168, 212,0.06)', border: '1px solid rgba(249, 168, 212,0.12)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} style={{ color: '#DB2777' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('student.aboutMaterials')}</span>
        </div>
        <ul className="text-xs space-y-1.5" style={{ color: 'var(--text-muted)' }}>
          <li>{t('student.matInfo1')}</li>
          <li>{t('student.matInfo2')}</li>
          <li>{t('student.matInfo3')}</li>
          <li>{t('student.matInfo4')}</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default StudentMaterials;
