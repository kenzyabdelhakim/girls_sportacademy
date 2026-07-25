import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle,
  Calendar,
  Clock,
  BookOpen,
  Award,
  ArrowRight,
  QrCode,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { getStudentAttendanceStats } from '../services/studentAttendanceService';
import { getStudentSessionMaterials } from '../services/sessionMaterialsService';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useLang } from '../../contexts/LanguageContext';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <motion.div variants={itemVariants} className="stat-card">
    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    </div>
    <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{title}</p>
    <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
    {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
  </motion.div>
);

const StudentDashboard = () => {
  const { studentData } = useStudentAuth();
  const { t, lang } = useLang();
  const dateLocale = lang === 'ar' ? { locale: ar } : undefined;
  const [stats, setStats] = useState(null);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadDashboardData(); }, [studentData]);

  const loadDashboardData = async (isRefresh = false) => {
    if (!studentData) { setLoading(false); return; }
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const studentId = studentData.studentId || studentData.id;
      const group = studentData.group || '';

      const [attStats, materials] = await Promise.allSettled([
        getStudentAttendanceStats(studentId),
        getStudentSessionMaterials(studentId, group),
      ]);

      setStats(attStats.status === 'fulfilled' ? attStats.value : { totalSessions: 0, presentCount: 0, attendancePercentage: 0, thisMonthCount: 0, recentAttendance: [] });
      setRecentMaterials(materials.status === 'fulfilled' ? materials.value.slice(0, 3) : []);
    } catch {
      setStats({ totalSessions: 0, presentCount: 0, attendancePercentage: 0, thisMonthCount: 0, recentAttendance: [] });
      setRecentMaterials([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('student.greetingMorning') : hour < 17 ? t('student.greetingAfternoon') : t('student.greetingEvening');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('student.loadingDash')}</p>
        </div>
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
      {/* Welcome header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#DB2777' }}>{greeting}</p>
          <h1 className="page-title">{t('student.dashboardTitle', { name: studentData?.fullName?.split(' ')[0] })}</h1>
          <p className="page-subtitle flex items-center gap-2 mt-1">
            <Calendar size={13} />
            {format(new Date(), 'EEEE, MMMM d, yyyy', dateLocale)}
          </p>
        </div>
        <motion.button
          onClick={() => loadDashboardData(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-secondary"
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </motion.button>
      </motion.div>

      {/* Welcome banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(244, 114, 182,0.3), rgba(249, 168, 212,0.15))', border: '1px solid rgba(249, 168, 212,0.25)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 50%, rgba(249, 168, 212,0.15) 0%, transparent 60%)' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white mb-1">{t('student.welcomeBanner', { name: studentData?.fullName })}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {studentData?.group} · {t('student.idLabel')} {studentData?.studentId}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="badge-purple flex items-center gap-1.5">
                <Activity size={11} /> {t('student.attendanceBadge', { pct: stats?.attendancePercentage || 0 })}
              </div>
              {stats?.presentCount > 0 && (
                <div className="badge-green">
                  {t('student.sessionsBadge', { n: stats.presentCount })}
                </div>
              )}
            </div>
          </div>
          <Link to="/student/profile">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F472B6, #ec4899)', boxShadow: '0 8px 30px rgba(244, 114, 182,0.4)' }}
            >
              <QrCode size={26} style={{ color: '#fff' }} />
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} title={t('student.attendanceRate')} value={`${stats?.attendancePercentage || 0}%`} subtitle={t('student.overallRate')} color="#22C55E" />
        <StatCard icon={CheckCircle} title={t('student.sessionsAttended')} value={stats?.presentCount || 0} subtitle={t('student.totalCheckins')} color="#EC4899" />
        <StatCard icon={Calendar} title={t('student.thisMonth')} value={stats?.thisMonthCount || 0} subtitle={t('student.monthlySessions')} color="#DB2777" />
        <StatCard icon={Award} title={t('student.totalSessions')} value={stats?.totalSessions || 0} subtitle={t('student.allTime')} color="#F59E0B" />
      </div>

      {/* Recent activity + Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white">{t('student.recentSessions')}</h2>
            <Link to="/student/attendance" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#22C55E' }}>
              {t('student.viewAll')} <ArrowRight size={12} />
            </Link>
          </div>

          {stats?.recentAttendance?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentAttendance.map((record, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <CheckCircle size={16} style={{ color: '#22C55E' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{record.date}</p>
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={10} />
                        {record.time}
                      </div>
                    </div>
                  </div>
                  <span className="badge-green">{t('student.present')}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--bg-surface)' }}>
                <CheckCircle size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('student.noSessions')}</p>
              <Link to="/student/profile" className="text-xs mt-2 font-semibold" style={{ color: '#DB2777' }}>
                {t('student.getQr')}
              </Link>
            </div>
          )}
        </motion.div>

        {/* Recent Materials */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white">{t('student.latestMaterials')}</h2>
            <Link to="/student/materials" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#F59E0B' }}>
              {t('student.viewAll')} <ArrowRight size={12} />
            </Link>
          </div>

          {recentMaterials.length > 0 ? (
            <div className="space-y-2">
              {recentMaterials.map((mat) => (
                <motion.div
                  key={mat.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.15)' }}>
                    <BookOpen size={15} style={{ color: '#F59E0B' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{mat.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{mat.sessionDate}</p>
                  </div>
                  <Link to="/student/materials" className="text-xs font-semibold" style={{ color: '#F59E0B' }}>â†’</Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--bg-surface)' }}>
                <BookOpen size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('student.noMaterialsYet')}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="font-bold text-white mb-5">{t('student.quickAccess')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/student/profile', icon: QrCode, label: t('student.qaMyQr'), sub: t('student.qaShowAttendance'), color: '#DB2777' },
            { to: '/student/attendance', icon: Calendar, label: t('student.qaMyAttendance'), sub: t('student.qaViewHistory'), color: '#22C55E' },
            { to: '/student/materials', icon: BookOpen, label: t('student.qaMaterials'), sub: t('student.qaSessionContent'), color: '#F59E0B' },
            { to: '/student/profile', icon: Award, label: t('student.qaMyProfile'), sub: t('student.qaViewDetails'), color: '#EC4899' },
          ].map(({ to, icon: Icon, label, sub, color }) => (
            <Link key={label} to={to}>
              <motion.div
                whileHover={{ y: -2, borderColor: `${color}30` }}
                className="p-4 rounded-xl cursor-pointer transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentDashboard;
