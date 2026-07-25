import React, { useState, useRef, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Users,
  QrCode,
  Download,
  Maximize2,
  X,
  Hash,
  Calendar,
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import toast from 'react-hot-toast';
import { useLang } from '../../contexts/LanguageContext';

const StudentProfile = () => {
  const { studentData } = useStudentAuth();
  const { t } = useLang();
  const [showQRModal, setShowQRModal] = useState(false);
  const canvasRef = useRef(null);
  const modalCanvasRef = useRef(null);

  useEffect(() => {
    if (studentData) generateQR(canvasRef, 200);
  }, [studentData]);

  useEffect(() => {
    if (showQRModal && studentData) generateQR(modalCanvasRef, 380);
  }, [showQRModal, studentData]);

  const generateQR = async (ref, size) => {
    if (!ref.current || !studentData) return;
    try {
      await QRCodeLib.toCanvas(ref.current, studentData.studentId, {
        width: size,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });
    } catch {}
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    try {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${studentData.studentId}_QR.png`;
      a.href = url; a.click();
      toast.success(t('student.qrDownloaded'));
    } catch { toast.error(t('student.downloadFailed')); }
  };

  if (!studentData) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  const infoRows = [
    { icon: User, label: t('student.fullName'), value: studentData.fullName },
    { icon: Hash, label: t('student.studentId'), value: studentData.studentId },
    { icon: Users, label: t('student.groupTeam'), value: studentData.group },
    { icon: Calendar, label: t('student.age'), value: `${studentData.age} ${t('student.years')}` },
    ...(studentData.phone ? [{ icon: Phone, label: t('student.phone'), value: studentData.phone }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Page header */}
      <div>
        <h1 className="page-title">{t('student.profileTitle')}</h1>
        <p className="page-subtitle">{t('student.profileSubtitle')}</p>
      </div>

      {/* Profile hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(244, 114, 182,0.25), rgba(236,72,153,0.15))',
          border: '1px solid rgba(249, 168, 212,0.25)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 50%, rgba(249, 168, 212,0.15) 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #F472B6, #ec4899)',
              boxShadow: '0 8px 30px rgba(244, 114, 182,0.4)',
              color: '#fff',
            }}
          >
            {studentData.fullName?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{studentData.fullName}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {studentData.group} · {t('student.idLabel')} {studentData.studentId}
            </p>
            <div className="mt-3">
              <span className="badge-purple">{t('student.athlete')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236, 72, 153,0.15)' }}>
              <User size={16} style={{ color: '#EC4899' }} />
            </div>
            <h2 className="font-bold text-white">{t('student.personalInfo')}</h2>
          </div>

          <div className="space-y-3">
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-surface)' }}>
                  <Icon size={15} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="font-semibold text-white text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(219, 39, 119,0.15)' }}>
              <QrCode size={16} style={{ color: '#DB2777' }} />
            </div>
            <h2 className="font-bold text-white">{t('student.qrTitle')}</h2>
          </div>

          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="inline-block p-4 rounded-2xl mb-5"
              style={{ background: '#ffffff', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
            >
              <canvas ref={canvasRef} />
            </motion.div>

            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              {t('student.idLabel')} <span className="font-mono font-bold text-white">{studentData.studentId}</span>
            </p>

            <div className="space-y-2">
              <motion.button
                onClick={downloadQR}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #DB2777, #EC4899)', color: '#fff', boxShadow: '0 4px 20px rgba(219, 39, 119,0.35)' }}
              >
                <Download size={16} /> {t('student.downloadQr')}
              </motion.button>

              <motion.button
                onClick={() => setShowQRModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-secondary"
              >
                <Maximize2 size={15} /> {t('student.viewFullscreen')}
              </motion.button>
            </div>

            <div className="mt-5 p-3 rounded-xl text-left" style={{ background: 'rgba(219, 39, 119,0.06)', border: '1px solid rgba(219, 39, 119,0.14)' }}>
              <p className="text-xs" style={{ color: '#DB2777' }}>
                {t('student.qrHint')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
              onClick={() => setShowQRModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="modal-bg relative w-full max-w-md rounded-2xl p-8"
              style={{ border: '1px solid var(--border)', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-surface)' }}
              >
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>

              <div className="text-center">
                <h2 className="text-xl font-black text-white mb-1">{studentData.fullName}</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  {studentData.group} · {t('student.idLabel')} {studentData.studentId}
                </p>

                <div
                  className="inline-block p-5 rounded-2xl mb-4"
                  style={{ background: '#ffffff', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
                >
                  <canvas ref={modalCanvasRef} />
                </div>

                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('student.scanToMark')}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentProfile;
