import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { getStudentAttendance } from '../services/studentAttendanceService';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  Clock,
  Search,
  TrendingUp,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../../contexts/LanguageContext';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const StudentAttendance = () => {
  const { studentData } = useStudentAuth();
  const { t } = useLang();
  const months = t('student.months');
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => { loadAttendance(); }, [studentData]);
  useEffect(() => { applyFilters(); }, [attendance, searchTerm, selectedMonth]);

  const loadAttendance = async () => {
    if (!studentData) return;
    try {
      setLoading(true);
      const data = await getStudentAttendance(studentData.studentId);
      setAttendance(data);
    } catch {
      toast.error(t('student.failedLoadAtt'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attendance];
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(r => new Date(r.date).getMonth() === parseInt(selectedMonth));
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(r => r.date.toLowerCase().includes(lower) || r.time.toLowerCase().includes(lower));
    }
    setFilteredAttendance(filtered);
  };

  const total = filteredAttendance.length;
  const present = filteredAttendance.filter(r => r.status === 'present').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="page-title">{t('student.attTitle')}</h1>
        <p className="page-subtitle">{t('student.attSubtitle')}</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        {[
          { label: t('student.totalSessions'), value: total, icon: Calendar, color: '#EC4899' },
          { label: t('student.present_stat'), value: present, icon: CheckCircle, color: '#22C55E' },
          { label: t('student.attendanceRate'), value: `${percentage}%`, icon: TrendingUp, color: '#DB2777' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white">{value}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Progress bar */}
      {total > 0 && (
        <motion.div variants={itemVariants} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">{t('student.attProgress')}</span>
            <span className="text-sm font-bold" style={{ color: percentage >= 80 ? '#22C55E' : percentage >= 60 ? '#F59E0B' : '#ef4444' }}>
              {percentage}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              style={{
                background: percentage >= 80
                  ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                  : percentage >= 60
                    ? 'linear-gradient(90deg, #d97706, #F59E0B)'
                    : 'linear-gradient(90deg, #dc2626, #ef4444)',
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('student.ofSessions', { present, total })}
          </p>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-bold text-white">{t('student.filters')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('student.month')}</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input-field">
              <option value="all">{t('student.allMonths')}</option>
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('student.search')}</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('student.attSearchPh')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Records */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-white">
            {t('student.attRecords')}
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
              ({filteredAttendance.length})
            </span>
          </h2>
        </div>

        {filteredAttendance.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-surface)' }}>
              <CheckCircle size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-semibold text-white mb-1">{t('student.noRecords')}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {searchTerm || selectedMonth !== 'all'
                ? t('student.adjustFilters')
                : t('student.attWillAppear')}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filteredAttendance.map((record, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="flex items-center justify-between px-6 py-4 transition-all duration-300"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.12)' }}
                  >
                    <CheckCircle size={20} style={{ color: '#22C55E' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <p className="font-semibold text-white text-sm">{record.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{record.time}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{record.group}</span>
                  <span className="badge-green">{t('student.present')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StudentAttendance;
