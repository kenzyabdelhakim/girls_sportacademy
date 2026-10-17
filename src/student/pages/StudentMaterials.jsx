import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { getStudentSessionMaterials, driveThumbnailUrl } from '../services/sessionMaterialsService';
import MaterialCover from '../../components/MaterialCover';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ExternalLink,
  Calendar,
  Lock,
  CheckCircle,
  Search,
  Users,
  RefreshCw,
  Award,
  Sparkles,
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

const TYPE_ICONS = {
  lecture: BookOpen,
  skill: Award,
  other: Sparkles,
};

const StudentMaterials = () => {
  const { studentData } = useStudentAuth();
  const { t } = useLang();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState(() => new Set());

  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Derived — no separate state needed, avoids timing gap between materials and filteredMaterials
  const filteredMaterials = searchTerm.trim()
    ? materials.filter(m => {
        const s = searchTerm.toLowerCase();
        return (
          m.title?.toLowerCase().includes(s) ||
          m.description?.toLowerCase().includes(s) ||
          m.sessionDate?.toLowerCase().includes(s) ||
          m.materialType?.toLowerCase().includes(s)
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

  const typeLabel = (type) => {
    if (type === 'lecture') return t('materials.typeLecture');
    if (type === 'skill') return t('materials.typeSkill');
    return t('materials.typeOther');
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
          {filteredMaterials.map((material) => {
            const TypeIcon = TYPE_ICONS[material.materialType] || Sparkles;
            return (
              <motion.div
                key={material.id}
                variants={cardVariants}
                whileHover={material.hasAccess ? { y: -3 } : {}}
                className="glass-card overflow-hidden flex flex-col h-full transition-all"
                style={{ opacity: material.hasAccess ? 1 : 0.7 }}
              >
                <div className="p-3 pb-0 relative">
                  <MaterialCover
                    imageUrl={material.imageUrl || driveThumbnailUrl(material.link)}
                    materialType={material.materialType || 'other'}
                    alt={material.title}
                  />
                  {!material.hasAccess && (
                    <div
                      className="absolute inset-3 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(1px)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      >
                        <Lock size={18} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 pt-3 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: 'rgba(219, 39, 119,0.1)', color: '#DB2777' }}
                    >
                      <TypeIcon size={10} />
                      {typeLabel(material.materialType || 'other')}
                    </span>
                    {material.hasAccess
                      ? <span className="badge-green"><CheckCircle size={10} /> {t('student.unlocked')}</span>
                      : <span className="badge-red"><Lock size={10} /> {t('student.locked')}</span>}
                  </div>

                  <h3 className="font-bold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {material.title}
                  </h3>
                  {material.description ? (
                    <div className="mb-3 flex-1">
                      <p
                        className={`text-[13.5px] leading-relaxed font-medium mb-0.5 ${expandedDescriptions.has(material.id) ? '' : 'line-clamp-3'}`}
                        style={{ color: 'var(--text-primary)', opacity: 0.85 }}
                      >
                        {material.description}
                      </p>
                      {material.description.length > 110 && (
                        <button
                          type="button"
                          onClick={() => toggleDescription(material.id)}
                          className="text-xs font-bold transition-colors"
                          style={{ color: '#DB2777' }}
                        >
                          {expandedDescriptions.has(material.id)
                            ? t('materials.showLess')
                            : t('materials.showMore')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13.5px] mb-3 min-h-[2.5rem] flex-1" style={{ color: 'var(--text-muted)' }}>
                      {'\u00A0'}
                    </p>
                  )}

                  <div className="mb-4">
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all mt-auto"
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
                </div>
              </motion.div>
            );
          })}
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
