import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle,
  ScanLine,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  Activity,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getAllStudents } from '../services/studentService';
import { getTodayAttendance, getAllAttendance } from '../services/attendanceService';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useLang } from '../contexts/LanguageContext';

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
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}14`, border: `1px solid ${color}26` }}
      >
        <Icon size={19} style={{ color }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
    </div>
    <h3 className="text-3xl font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>{value}</h3>
    {subtitle && (
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        {subtitle}
      </p>
    )}
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useLang();
  if (active && payload?.length) {
    return (
      <div
        className="tooltip-bg px-4 py-3 rounded-xl"
        style={{ border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      >
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-lg font-bold" style={{ color: '#EC4899' }}>
          {payload[0].value} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{t('dashboard.present')}</span>
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { t, lang } = useLang();
  const dateLocale = lang === 'ar' ? { locale: ar } : undefined;
  const [stats, setStats] = useState({ totalStudents: 0, todayAttendance: 0, attendancePercentage: 0 });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Rebuilds (and re-localizes day labels) whenever data OR language changes
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const label = format(subDays(new Date(), 6 - i), 'EEE', dateLocale);
      const count = allAttendance.filter((r) => r.date === date).length;
      return { day: label, count, date };
    });
  }, [allAttendance, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const [students, todayAtt, allAtt] = await Promise.all([
        getAllStudents(),
        getTodayAttendance(),
        getAllAttendance(),
      ]);

      const pct = students.length > 0 ? Math.round((todayAtt.length / students.length) * 100) : 0;
      setStats({ totalStudents: students.length, todayAttendance: todayAtt.length, attendancePercentage: pct });
      setRecentAttendance(todayAtt.slice(0, 6));
      setAllAttendance(allAtt);
    } catch {
      toast.error(t('dashboard.failedLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const today = format(new Date(), 'EEEE, MMMM d', dateLocale);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.greetingMorning') : hour < 17 ? t('dashboard.greetingAfternoon') : t('dashboard.greetingEvening');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dashboard.loading')}</p>
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
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#EC4899' }}>{greeting}</p>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-subtitle flex items-center gap-2 mt-1">
            <Calendar size={13} />
            {today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => loadDashboardData(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary"
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{t('dashboard.refresh')}</span>
          </motion.button>
          <Link to="/scanner">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
            >
              <ScanLine size={16} />
              <span>{t('dashboard.scanQR')}</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          title={t('dashboard.totalAthletes')}
          value={stats.totalStudents}
          subtitle={t('dashboard.registeredMembers')}
          color="#EC4899"
          gradient="linear-gradient(135deg, #DB2777, #EC4899)"
        />
        <StatCard
          icon={CheckCircle}
          title={t('dashboard.todayCheckins')}
          value={stats.todayAttendance}
          subtitle={t('dashboard.attendanceRateSub', { pct: stats.attendancePercentage })}
          color="#22C55E"
          gradient="linear-gradient(135deg, #16A34A, #22C55E)"
        />
        <StatCard
          icon={TrendingUp}
          title={t('dashboard.attendanceRate')}
          value={`${stats.attendancePercentage}%`}
          subtitle={t('dashboard.todayPerformance')}
          color="#DB2777"
          gradient="linear-gradient(135deg, #DB2777, #F472B6)"
        />
      </div>

      {/* Chart + Recent Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Area Chart */}
        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-white text-lg">{t('dashboard.attendanceTrend')}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('dashboard.last7days')}</p>
            </div>
            <div className="badge-cyan flex items-center gap-1.5">
              <Activity size={12} />
              {t('dashboard.live')}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EC4899" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#EC4899"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ fill: '#EC4899', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#EC4899', boxShadow: '0 0 12px #EC4899' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Attendance */}
        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white">{t('dashboard.todayCheckins')}</h2>
            <Link to="/attendance" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#EC4899' }}>
              {t('dashboard.viewAll')} <ArrowRight size={12} />
            </Link>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--bg-surface)' }}>
                <CheckCircle size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dashboard.noCheckins')}</p>
              <Link to="/scanner" className="text-xs mt-2 font-semibold" style={{ color: '#EC4899' }}>
                {t('dashboard.startScanning')}
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #DB2777, #F9A8D4)', color: '#fff' }}
                    >
                      {record.studentName?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{record.studentName}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{record.group}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{record.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="font-bold text-white mb-5">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/scanner', icon: ScanLine, label: t('dashboard.qaStartScanner'), sub: t('dashboard.qaScanQrCodes'), color: '#22C55E' },
            { to: '/students', icon: Users, label: t('dashboard.qaManageAthletes'), sub: t('dashboard.qaAddOrEdit'), color: '#EC4899' },
            { to: '/attendance', icon: CheckCircle, label: t('dashboard.qaViewRecords'), sub: t('dashboard.qaAttendanceHistory'), color: '#DB2777' },
            { to: '/materials', icon: Zap, label: t('dashboard.qaMaterials'), sub: t('dashboard.qaSessionContent'), color: '#F59E0B' },
          ].map(({ to, icon: Icon, label, sub, color }) => (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ y: -2, borderColor: `${color}55` }}
                className="p-4 rounded-xl cursor-pointer transition-all h-full"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${color}14`, border: `1px solid ${color}26` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
