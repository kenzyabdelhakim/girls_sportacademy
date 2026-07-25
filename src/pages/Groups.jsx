import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Users as UsersIcon,
  Search,
  Crown,
  CheckCircle,
  TrendingUp,
  X,
  Hash,
  Phone,
  ChevronRight,
  Plus,
  Pencil,
  Check,
  UserPlus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { getAllStudents, updateStudent } from '../services/studentService';
import { getTodayAttendance } from '../services/attendanceService';
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

const ACCENT = '#F43F5E';

const Avatar = ({ name, size = 36, accent }) => (
  <div
    className="rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
    style={{ width: size, height: size, background: accent || 'linear-gradient(135deg, #DB2777, #EC4899)', color: '#fff' }}
  >
    {name?.[0]?.toUpperCase() || '?'}
  </div>
);

const Groups = () => {
  const { t } = useLang();
  const [students, setStudents] = useState([]);
  const [todayAtt, setTodayAtt] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [busy, setBusy] = useState(false);

  // Manage modal
  const [selectedName, setSelectedName] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addSearch, setAddSearch] = useState('');

  // Create modal
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSearch, setNewSearch] = useState('');
  const [picked, setPicked] = useState(() => new Set());

  const presentIds = useMemo(() => new Set(todayAtt.map((r) => r.studentId)), [todayAtt]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stu, today] = await Promise.all([getAllStudents(), getTodayAttendance()]);
      setStudents(stu);
      setTodayAtt(today);
    } catch {
      toast.error(t('groups.failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      const key = s.group || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return Array.from(map.entries())
      .map(([name, members]) => {
        const present = todayAtt.filter((r) => r.group === name).length;
        const rate = members.length ? Math.round((present / members.length) * 100) : 0;
        return { name, members, present, rate };
      })
      .sort((a, b) => b.members.length - a.members.length);
  }, [students, todayAtt]);

  const filteredGroups = searchTerm.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : groups;

  const selected = useMemo(
    () => (selectedName ? groups.find((g) => g.name === selectedName) || { name: selectedName, members: [], present: 0, rate: 0 } : null),
    [selectedName, groups]
  );

  const largest = groups[0];
  const avgPerGroup = groups.length ? Math.round(students.length / groups.length) : 0;

  // ── Mutations ──
  const openManage = (group) => {
    setSelectedName(group.name);
    setDraftName(group.name);
    setRenaming(false);
    setAdding(false);
    setAddSearch('');
  };

  const saveRename = async () => {
    const name = draftName.trim();
    if (!name) { toast.error(t('groups.nameRequired')); return; }
    if (name === selectedName) { setRenaming(false); return; }
    setBusy(true);
    try {
      await Promise.all(selected.members.map((m) => updateStudent(m.id, { group: name })));
      toast.success(t('groups.renamed'));
      setSelectedName(name);
      setRenaming(false);
      await loadData();
    } catch { toast.error(t('groups.failedUpdate')); }
    finally { setBusy(false); }
  };

  const addMember = async (stu) => {
    setBusy(true);
    try {
      await updateStudent(stu.id, { group: selectedName });
      toast.success(t('groups.addedToast', { name: stu.fullName }));
      await loadData();
    } catch { toast.error(t('groups.failedUpdate')); }
    finally { setBusy(false); }
  };

  const removeMember = async (m) => {
    if (!window.confirm(t('groups.removeConfirm', { name: m.fullName }))) return;
    setBusy(true);
    try {
      await updateStudent(m.id, { group: '' });
      toast.success(t('groups.removedToast', { name: m.fullName }));
      await loadData();
    } catch { toast.error(t('groups.failedUpdate')); }
    finally { setBusy(false); }
  };

  const openCreate = () => {
    setNewName('');
    setNewSearch('');
    setPicked(new Set());
    setCreating(true);
  };

  const togglePick = (id) => {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const createGroup = async () => {
    const name = newName.trim();
    if (!name) { toast.error(t('groups.nameRequired')); return; }
    if (picked.size === 0) { toast.error(t('groups.pickAtLeastOne')); return; }
    setBusy(true);
    try {
      await Promise.all([...picked].map((id) => updateStudent(id, { group: name })));
      toast.success(t('groups.createdToast'));
      setCreating(false);
      await loadData();
    } catch { toast.error(t('groups.failedUpdate')); }
    finally { setBusy(false); }
  };

  // Students available to add to the currently-managed group
  const addableStudents = useMemo(() => {
    const s = addSearch.trim().toLowerCase();
    return students
      .filter((stu) => (stu.group || '—') !== selectedName)
      .filter((stu) => !s || stu.fullName.toLowerCase().includes(s) || stu.studentId.toLowerCase().includes(s));
  }, [students, selectedName, addSearch]);

  const newPickList = useMemo(() => {
    const s = newSearch.trim().toLowerCase();
    return students.filter((stu) => !s || stu.fullName.toLowerCase().includes(s) || stu.studentId.toLowerCase().includes(s));
  }, [students, newSearch]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  const stats = [
    { label: t('groups.totalGroups'), value: groups.length, icon: Layers, color: ACCENT },
    { label: t('groups.totalAthletes'), value: students.length, icon: UsersIcon, color: '#EC4899' },
    { label: t('groups.largestGroup'), value: largest ? largest.members.length : 0, sub: largest?.name, icon: Crown, color: '#f59e0b' },
    { label: t('groups.avgPerGroup'), value: avgPerGroup, icon: TrendingUp, color: '#22C55E' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={cardVariants} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t('groups.title')}</h1>
          <p className="page-subtitle">{t('groups.subtitle')}</p>
        </div>
        <motion.button onClick={openCreate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary">
          <Plus size={16} /> <span className="hidden sm:inline">{t('groups.newGroup')}</span>
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={cardVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <h3 className="text-2xl font-black truncate" style={{ color: 'var(--text-primary)' }}>{value}</h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{sub || label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div variants={cardVariants}>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('groups.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </motion.div>

      {/* Groups grid */}
      {filteredGroups.length === 0 ? (
        <motion.div variants={cardVariants} className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-surface)' }}>
            <Layers size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {searchTerm ? t('groups.noneFound') : t('groups.noGroups')}
          </p>
          {!searchTerm && (
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{t('groups.noGroupsHint')}</p>
          )}
          {!searchTerm && (
            <button onClick={openCreate} className="btn-primary"><Plus size={16} /> {t('groups.newGroup')}</button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <motion.div
              key={group.name}
              variants={cardVariants}
              whileHover={{ y: -3 }}
              onClick={() => openManage(group)}
              className="glass-card p-5 flex flex-col cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={group.name} size={44} accent={`linear-gradient(135deg, ${ACCENT}, #EC4899)`} />
                  <div className="min-w-0">
                    <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{group.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {group.members.length} {group.members.length === 1 ? t('groups.athlete') : t('groups.athletes')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="rtl:rotate-180 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('groups.todayAttendance')}</span>
                  <span className="text-xs font-bold" style={{ color: ACCENT }}>{group.rate}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${group.rate}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    style={{ background: `linear-gradient(90deg, ${ACCENT}, #EC4899)` }}
                  />
                </div>
              </div>

              <div className="divider my-0 mb-3" />

              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                {t('groups.members')}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                {group.members.slice(0, 6).map((m) => (
                  <Avatar key={m.id} name={m.fullName} size={32} />
                ))}
                {group.members.length > 6 && (
                  <div
                    className="h-8 px-2.5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    {t('groups.andMore', { n: group.members.length - 6 })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Manage group modal ── */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
              onClick={() => setSelectedName(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="modal-bg relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl scroll-area"
              style={{ border: '1px solid var(--border)' }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-5 modal-bg" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar name={selected.name} size={44} accent={`linear-gradient(135deg, ${ACCENT}, #EC4899)`} />
                  {renaming ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                        className="input-field !py-2"
                        placeholder={t('groups.renameLabel')}
                      />
                      <button onClick={saveRename} disabled={busy} className="btn-primary !px-3 !py-2 flex-shrink-0">
                        {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black truncate" style={{ color: 'var(--text-primary)' }}>{selected.name}</h2>
                        <button onClick={() => { setDraftName(selected.name); setRenaming(true); }} className="flex-shrink-0" title={t('common.edit')}>
                          <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                        </button>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {selected.members.length} {selected.members.length === 1 ? t('groups.athlete') : t('groups.athletes')}
                        {' · '}{selected.present}/{selected.members.length} · {t('groups.todayAttendance')}
                      </p>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelectedName(null)} className="btn-secondary w-9 h-9 p-0 rounded-xl flex-shrink-0">
                  <X size={16} />
                </button>
              </div>

              {/* Add toggle */}
              <div className="px-4 pt-4">
                <button
                  onClick={() => { setAdding((v) => !v); setAddSearch(''); }}
                  className={adding ? 'btn-secondary w-full' : 'btn-primary w-full'}
                >
                  {adding ? <><Check size={15} /> {t('groups.done')}</> : <><UserPlus size={15} /> {t('groups.addMembers')}</>}
                </button>
              </div>

              {/* Add panel */}
              {adding && (
                <div className="px-4 pt-3">
                  <div className="relative mb-2">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder={t('groups.searchToAdd')}
                      className="input-field pl-10"
                    />
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto scroll-area pr-1">
                    {addableStudents.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>{t('groups.noneToAdd')}</p>
                    ) : addableStudents.map((stu) => (
                      <div key={stu.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <Avatar name={stu.fullName} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{stu.fullName}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{stu.group || '—'} · {stu.studentId}</p>
                        </div>
                        <button onClick={() => addMember(stu)} disabled={busy} className="btn-primary !px-3 !py-1.5 text-xs flex-shrink-0">
                          <Plus size={13} /> {t('groups.add')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              <div className="p-4 space-y-2">
                {selected.members.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>{t('groups.noMembers')}</p>
                ) : selected.members.map((m) => {
                  const present = presentIds.has(m.studentId);
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <Avatar name={m.fullName} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.fullName}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-1"><Hash size={11} />{m.studentId}</span>
                          {m.age && <span>{m.age} {t('students.years')}</span>}
                          {m.phone && <span className="hidden sm:flex items-center gap-1"><Phone size={11} />{m.phone}</span>}
                        </div>
                      </div>
                      {present
                        ? <span className="badge-green flex-shrink-0"><CheckCircle size={11} /> {t('common.present')}</span>
                        : <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{t('common.absent')}</span>}
                      <button onClick={() => removeMember(m)} disabled={busy} title={t('groups.remove')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create group modal ── */}
      <AnimatePresence>
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
              onClick={() => setCreating(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="modal-bg relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl scroll-area"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{t('groups.createTitle')}</h2>
                <button onClick={() => setCreating(false)} className="btn-secondary w-9 h-9 p-0 rounded-xl">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="label">{t('groups.groupName')}</label>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('groups.groupNamePh')}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">{t('groups.pickMembers')} {picked.size > 0 && <span className="font-normal" style={{ color: ACCENT }}>({picked.size})</span>}</label>
                  <div className="relative mb-2">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      value={newSearch}
                      onChange={(e) => setNewSearch(e.target.value)}
                      placeholder={t('groups.searchToAdd')}
                      className="input-field pl-10"
                    />
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto scroll-area pr-1 rounded-xl">
                    {newPickList.map((stu) => {
                      const on = picked.has(stu.id);
                      return (
                        <button
                          type="button"
                          key={stu.id}
                          onClick={() => togglePick(stu.id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left"
                          style={{ background: on ? `${ACCENT}14` : 'var(--bg-surface)', border: `1px solid ${on ? ACCENT + '55' : 'var(--border)'}` }}
                        >
                          <Avatar name={stu.fullName} size={32} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{stu.fullName}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{stu.group || '—'} · {stu.studentId}</p>
                          </div>
                          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: on ? ACCENT : 'transparent', border: `1.5px solid ${on ? ACCENT : 'var(--border-hover)'}` }}>
                            {on && <Check size={12} style={{ color: '#fff' }} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setCreating(false)} className="flex-1 btn-secondary" disabled={busy}>{t('common.cancel')}</button>
                  <button onClick={createGroup} className="flex-1 btn-primary" disabled={busy}>
                    {busy ? <><Loader2 size={16} className="animate-spin" /> {t('groups.create')}</> : <><Plus size={16} /> {t('groups.create')}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Groups;
