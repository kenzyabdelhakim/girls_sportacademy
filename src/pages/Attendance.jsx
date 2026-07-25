import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Users,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getAllAttendance } from '../services/attendanceService';
import { getAllStudents } from '../services/studentService';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useLang } from '../contexts/LanguageContext';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useLang();
  if (active && payload?.length) {
    return (
      <div className="tooltip-bg px-4 py-3 rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-lg font-bold" style={{ color: '#DB2777' }}>
          {payload[0].value} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{t('attendance.checkIns')}</span>
        </p>
      </div>
    );
  }
  return null;
};

const Attendance = () => {
  const { t, lang } = useLang();
  const dateLocale = lang === 'ar' ? { locale: ar } : undefined;
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [groups, setGroups] = useState([]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { applyFilters(); }, [attendance, searchTerm, selectedDate, selectedGroup]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attData, stuData] = await Promise.all([getAllAttendance(), getAllStudents()]);
      setAttendance(attData);
      setStudents(stuData);
      setGroups([...new Set(stuData.map(s => s.group))].filter(Boolean));
    } catch {
      toast.error(t('attendance.failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Rebuilds (and re-localizes day labels) whenever data OR language changes
  const chartData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      return {
        day: format(subDays(new Date(), 6 - i), 'EEE', dateLocale),
        count: attendance.filter(r => r.date === date).length,
      };
    }), [attendance, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => {
    let filtered = [...attendance];
    if (selectedDate) filtered = filtered.filter(r => r.date === selectedDate);
    if (selectedGroup !== 'all') filtered = filtered.filter(r => r.group === selectedGroup);
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.studentName.toLowerCase().includes(lower) || r.studentId.toLowerCase().includes(lower)
      );
    }
    setFilteredAttendance(filtered);
  };

  const exportToCSV = () => {
    if (!filteredAttendance.length) { toast.error(t('attendance.noExport')); return; }
    try {
      const headers = ['Date', 'Time', 'Student ID', 'Student Name', 'Group', 'Status'];
      const rows = filteredAttendance.map(r => [r.date, r.time, r.studentId, r.studentName, r.group, r.status]);
      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `attendance_${selectedDate}.csv`; a.click();
      toast.success(t('attendance.exported'));
    } catch { toast.error(t('attendance.exportFailed')); }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedGroup('all');
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t('attendance.title')}</h1>
          <p className="page-subtitle">{t('attendance.subtitle')}</p>
        </div>
        <motion.button
          onClick={exportToCSV}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="btn-secondary"
          disabled={!filteredAttendance.length}
        >
          <Download size={16} />
          <span className="hidden sm:inline">{t('attendance.exportCSV')}</span>
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        {[
          { label: t('attendance.totalRecords'), value: attendance.length, icon: CheckCircle, color: '#EC4899' },
          { label: t('attendance.filtered'), value: filteredAttendance.length, icon: Filter, color: '#F472B6' },
          { label: t('attendance.totalAthletes'), value: students.length, icon: Users, color: '#22C55E' },
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

      {/* Chart */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-white">{t('attendance.weeklyOverview')}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('attendance.last7Attendance')}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="url(#barGrad)" maxBarSize={40} />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F9A8D4" />
                <stop offset="100%" stopColor="#F472B6" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <span className="font-bold text-white text-sm">{t('attendance.filters')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">{t('attendance.date')}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">{t('attendance.group')}</label>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="input-field">
              <option value="all">{t('attendance.allGroups')}</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('attendance.search')}</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('attendance.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={resetFilters} className="btn-secondary text-xs py-1.5">
            <RotateCcw size={12} /> {t('attendance.reset')}
          </button>
        </div>
      </motion.div>

      {/* Attendance Table */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-white">
            {t('attendance.records')}
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
              ({filteredAttendance.length})
            </span>
          </h2>
        </div>

        {filteredAttendance.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-surface)' }}>
              <XCircle size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-semibold text-white mb-1">{t('attendance.noRecords')}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('attendance.adjustFilters')}</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div
              className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
            >
              <span className="col-span-4">{t('attendance.colAthlete')}</span>
              <span className="col-span-2 hidden sm:block">{t('attendance.colId')}</span>
              <span className="col-span-2 hidden md:block">{t('attendance.colGroup')}</span>
              <span className="col-span-2">{t('attendance.colDate')}</span>
              <span className="col-span-2">{t('attendance.colTime')}</span>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {filteredAttendance.map((record, i) => (
                <motion.div
                  key={record.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center transition-all duration-300"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #DB2777, #F472B6)', color: '#fff' }}
                    >
                      {record.studentName?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-white text-sm truncate">{record.studentName}</span>
                  </div>
                  <span className="col-span-2 hidden sm:block text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {record.studentId}
                  </span>
                  <span className="col-span-2 hidden md:block">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(219, 39, 119,0.1)', color: '#DB2777' }}
                    >
                      {record.group}
                    </span>
                  </span>
                  <div className="col-span-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Calendar size={12} />
                    {record.date}
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    {record.time}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Attendance;
